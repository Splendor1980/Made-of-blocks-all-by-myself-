import { join } from "node:path";
import { tool } from "@opencode-ai/plugin";
import { box, pyramid, wall, type VoxelGrid } from "@mc-agent/core";
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

function generateGrid(type: string, block: string, size: number): VoxelGrid {
  switch (type) {
    case "house":
    case "box":
      return box(size, block, type !== "box");
    case "tower":
    case "pyramid":
      return pyramid(size, block);
    case "fence":
    case "wall":
      return wall(size, Math.max(2, Math.floor(size / 2)), block);
    default:
      throw new Error(`unknown type: ${type}`);
  }
}

export default tool({
  description:
    "Build a full Minecraft datapack in ONE call: an optional embedded .nbt structure (from a primitive type) plus " +
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
      .describe("Optional embedded structure built from a primitive (house|box|tower|pyramid|fence|wall)."),
    recipes: tool.schema.array(tool.schema.any()).optional().describe("Recipe specs (shaped/shapeless/stonecutter)."),
    functions: tool.schema
      .array(tool.schema.object({ id: tool.schema.string(), commands: tool.schema.array(tool.schema.string()) }))
      .optional(),
    advancements: tool.schema.array(tool.schema.any()).optional(),
    loot: tool.schema.array(tool.schema.any()).optional(),
  },
  async execute(input, ctx) {
    let embeddedStructures: { id: string; nbtPath: string }[] | undefined;
    if (input.structure) {
      const { type, block, size, id } = input.structure;
      const grid = generateGrid(type, block, size);
      const structId = id ?? `${type}_${size}`;
      const nbtRel = join("out", `${structId}.nbt`);
      const nbtRes = JSON.parse(
        (await buildNbt.execute(
          { size: [grid.width, grid.height, grid.depth], voxels: gridToVoxels(grid), output: nbtRel },
          ctx,
        )) as string,
      );
      if (!nbtRes.bytes || nbtRes.bytes <= 0) throw new Error("build_nbt produced no bytes");
      embeddedStructures = [{ id: structId, nbtPath: nbtRel }];
    }

    const dpRes = JSON.parse(
      (await datapackCreate.execute(
        {
          name: input.name,
          namespace: input.namespace,
          description: input.description,
          embeddedStructures,
          recipes: input.recipes,
          functions: input.functions,
          advancements: input.advancements,
          loot: input.loot,
          output: input.output,
        },
        ctx,
      )) as string,
    );

    return JSON.stringify({ structure: embeddedStructures?.[0], datapack: dpRes });
  },
});
