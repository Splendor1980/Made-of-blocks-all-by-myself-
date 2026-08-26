import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import {
  gridToMcfunction,
  createBlockRegistry,
  type VoxelGrid,
} from "@mc-agent/core";

export default tool({
  description:
    "Generate a Minecraft .mcfunction from a voxel grid using fill/setblock " +
    "commands. Blocks are validated against minecraft-data and dangerous " +
    "commands are rejected (security scan).",
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
    origin: tool.schema
      .tuple([tool.schema.number(), tool.schema.number(), tool.schema.number()])
      .optional()
      .describe("[x,y,z] world offset (default 0,0,0)."),
    mcVersion: tool.schema.string().optional().describe("minecraft-data version, default 1.20.1."),
    output: tool.schema.string().describe("Output .mcfunction path, relative to project root."),
  },
  async execute({ size, voxels, origin, mcVersion, output }, ctx) {
    const [w, h, d] = size;
    const blocks: (string | null)[] = new Array(w * h * d).fill(null);
    for (const v of voxels) blocks[(v.y * d + v.z) * w + v.x] = v.id;
    const grid: VoxelGrid = { width: w, height: h, depth: d, blocks };
    const { commands, violations } = gridToMcfunction(grid, {
      origin,
      registry: createBlockRegistry(mcVersion ?? "1.20.1"),
    });
    const abs = join(ctx.worktree, output);
    await mkdir(join(abs, ".."), { recursive: true });
    await writeFile(abs, commands.join("\n") + "\n");
    return JSON.stringify({
      written: output,
      commandCount: commands.length,
      violations,
    });
  },
});
