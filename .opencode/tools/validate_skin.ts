import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import { decodePng, validateSkin } from "@mc-agent/core";

export default tool({
  description:
    "Validate a Minecraft skin PNG (must be 64x64) and detect its model " +
    "(classic vs slim). Returns validation errors/warnings and the model.",
  args: {
    path: tool.schema.string().describe("Path to the skin PNG, relative to the project root."),
  },
  async execute({ path }, ctx) {
    const abs = join(ctx.worktree, path);
    const buf = await readFile(abs);
    const img = decodePng(buf);
    const result = validateSkin(img);
    return JSON.stringify(result, null, 2);
  },
});
