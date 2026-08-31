import { join } from "node:path";
import { tool } from "@opencode-ai/plugin";
import { generateGrid, validateBlockId, type VoxelGrid } from "@mc-agent/core";
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

export default tool({
  description:
    "Generate a full Minecraft world fragment in ONE call: an embedded .nbt structure wrapped in a datapack with a load function. " +
    "Wraps the datapack_create and build_nbt tools. Drop the pack into saves/<world>/datapacks and run /function <namespace>:build_<type>.",
  args: {
    type: tool.schema.string().describe("house | box | tower | pyramid | fence | wall"),
    block: tool.schema.string().optional().describe("Block id, e.g. minecraft:oak_planks"),
    state: tool.schema.string().optional().describe("Optional block state, e.g. axis=y for logs"),
    size: tool.schema.number().optional().describe("Base size (cubes/pyramids) or width (wall)"),
    name: tool.schema.string().optional().describe("Datapack folder name"),
    namespace: tool.schema.string().optional().describe("Datapack namespace"),
    output: tool.schema.string().describe("Output directory for the datapack, relative to project root."),
  },
  async execute(input, ctx) {
    const type = input.type ?? "house";
    const block = input.block ?? "minecraft:oak_planks";
    const state = input.state;
    const size = input.size ?? 5;
    const name = input.name ?? "generated_pack";
    const namespace = input.namespace ?? "genmod";
    const fullId = state ? `${block}[${state}]` : block;
    const chk = validateBlockId(fullId);
    if (!chk.valid) return JSON.stringify({ error: chk.error, blockId: fullId });
    const grid = generateGrid(type, block, size, state);
    const structId = `${type}_${size}`;
    const nbtRel = join("out", `${structId}.nbt`);

    const nbtRes = JSON.parse(
      (await buildNbt.execute({ size: [grid.width, grid.height, grid.depth], voxels: gridToVoxels(grid), output: nbtRel }, ctx)) as string,
    );
    if (!nbtRes.bytes || nbtRes.bytes <= 0) throw new Error("build_nbt produced no bytes");

    const dpRes = JSON.parse(
      (await datapackCreate.execute(
        {
          name,
          namespace,
          embeddedStructures: [{ id: structId, nbtPath: nbtRel }],
          functions: [
            { id: `build_${type}`, commands: [`structure load ${namespace}:${structId} ~ ~ ~`, `say ${type} placed`] },
          ],
          output: input.output,
        },
        ctx,
      )) as string,
    );

    return JSON.stringify({
      type,
      block,
      size,
      structureId: structId,
      nbt: nbtRes,
      datapack: dpRes,
      loadInGame: `/function ${namespace}:build_${type}`,
    });
  },
});
