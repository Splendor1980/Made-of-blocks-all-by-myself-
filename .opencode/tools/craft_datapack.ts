import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import { generateGrid, type VoxelGrid } from "@mc-agent/core";
import buildNbt from "./build_nbt";
import datapackCreate from "./datapack_create";

function gridToVoxels(g: VoxelGrid) {
  const voxels: { x: number; y: number; z: number; id: string }[] = [];
  for (let y = 0; y < g.height; y++)
    for (let z = 0; z < g.depth; z++)
      for (let x = 0; x < g.width; x++) {
        const b = g.blocks[(y * g.depth + z) * g.width + x];
        if (b) voxels.push({ x, y, z, id: b });
      }
  return voxels;
}

type PrimitiveSpec = { type: string; block: string; size: number; id?: string };
type NbtSpec = { nbtPath: string; id: string };
type StructureSpec = PrimitiveSpec | NbtSpec;

function isNbtSpec(s: StructureSpec): s is NbtSpec {
  return (s as NbtSpec).nbtPath !== undefined;
}

export default tool({
  description:
    "Build a full Minecraft datapack in ONE call: optional embedded .nbt structures (from primitives OR a prebuilt .nbt path) plus " +
    "recipes, advancements, loot tables and functions. Wraps build_nbt + datapack_create. " +
    "Output is a NEW folder; copy it into saves/<world>/datapacks/.",
  args: {
    name: tool.schema.string().describe("Datapack folder name."),
    namespace: tool.schema.string().describe("Lowercase namespace, e.g. 'demo'."),
    description: tool.schema.string().optional(),
    output: tool.schema.string().describe("Output directory, relative to project root."),
    structure: tool.schema
      .object({ type: tool.schema.string(), block: tool.schema.string(), size: tool.schema.number(), id: tool.schema.string().optional() })
      .optional()
      .describe("Single embedded structure built from a primitive (house|box|tower|pyramid|fence|wall|sphere|dome|bridge|stairs)."),
    structures: tool.schema
      .array(
        tool.schema.object({
          id: tool.schema.string().optional(),
          type: tool.schema.string().optional(),
          block: tool.schema.string().optional(),
          size: tool.schema.number().optional(),
          nbtPath: tool.schema.string().optional(),
        }),
      )
      .optional()
      .describe("Multiple structures to embed (primitives and/or {nbtPath,id}) — builds a 'scene'."),
    recipes: tool.schema.array(tool.schema.any()).optional().describe("Recipe specs (shaped/shapeless/stonecutter)."),
    functions: tool.schema
      .array(tool.schema.object({ id: tool.schema.string(), commands: tool.schema.array(tool.schema.string()) }))
      .optional(),
    advancements: tool.schema.array(tool.schema.any()).optional(),
    loot: tool.schema.array(tool.schema.any()).optional(),
  },
  async execute(input, ctx) {
    let specs: StructureSpec[] = [];
    if (input.structures) specs = input.structures as StructureSpec[];
    else if (input.structure) specs = [input.structure as StructureSpec];

    const embeddedStructures: { id: string; nbtPath: string }[] = [];
    const functions: { id: string; commands: string[] }[] = [];

    for (const spec of specs) {
      let structId: string;
      if (isNbtSpec(spec)) {
        structId = spec.id;
        const rel = join("out", `${structId}.nbt`);
        await mkdir(join(ctx.worktree, "out"), { recursive: true });
        await writeFile(join(ctx.worktree, rel), await readFile(join(ctx.worktree, spec.nbtPath)));
        embeddedStructures.push({ id: structId, nbtPath: rel });
      } else {
        const { type, block, size, id } = spec as PrimitiveSpec;
        const grid = generateGrid(type, block ?? "minecraft:oak_planks", size ?? 5);
        structId = id ?? `${type}_${size ?? 5}`;
        const nbtRel = join("out", `${structId}.nbt`);
        const nbtRes = JSON.parse(
          (await buildNbt.execute(
            { size: [grid.width, grid.height, grid.depth], voxels: gridToVoxels(grid), output: nbtRel },
            ctx,
          )) as string,
        );
        if (!nbtRes.bytes || nbtRes.bytes <= 0) throw new Error("build_nbt produced no bytes");
        embeddedStructures.push({ id: structId, nbtPath: nbtRel });
      }
      functions.push({
        id: `build_${structId}`,
        commands: [`structure load ${input.namespace}:${structId} ~ ~ ~`, `say placed ${structId}`],
      });
    }

    const dpRes = JSON.parse(
      (await datapackCreate.execute(
        {
          name: input.name,
          namespace: input.namespace,
          description: input.description,
          embeddedStructures: embeddedStructures.length ? embeddedStructures : undefined,
          recipes: input.recipes,
          functions: [...functions, ...(input.functions ?? [])],
          advancements: input.advancements,
          loot: input.loot,
          output: input.output,
        },
        ctx,
      )) as string,
    );

    return JSON.stringify({
      structure: embeddedStructures[0],
      structures: embeddedStructures,
      datapack: dpRes,
    });
  },
});
