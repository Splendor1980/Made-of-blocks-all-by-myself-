import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import { writeStructureNbt, type VoxelGrid } from "@mc-agent/core";

export default tool({
  description:
    "Generate a Minecraft structure .nbt from a voxel grid (Java structure-block format).",
  args: {
    size: tool.schema
      .tuple([tool.schema.number(), tool.schema.number(), tool.schema.number()])
      .describe("[width, height, depth]"),
    voxels: tool.schema
      .array(
        tool.schema.object({
          x: tool.schema.number(),
          y: tool.schema.number(),
          z: tool.schema.number(),
          id: tool.schema.string(),
        }),
      )
      .describe("Non-air blocks as {x,y,z,id}."),
    output: tool.schema.string().describe("Output .nbt path, relative to project root."),
  },
  async execute({ size, voxels, output }, ctx) {
    const [w, h, d] = size;
    const blocks: (string | null)[] = new Array(w * h * d).fill(null);
    for (const v of voxels) blocks[(v.y * d + v.z) * w + v.x] = v.id;
    const grid: VoxelGrid = { width: w, height: h, depth: d, blocks };
    const buf = writeStructureNbt(grid);
    const abs = join(ctx.worktree, output);
    await mkdir(join(abs, ".."), { recursive: true });
    await writeFile(abs, buf);
    return JSON.stringify({ written: output, bytes: buf.length });
  },
});
