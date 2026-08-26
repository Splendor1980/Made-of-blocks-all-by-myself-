import { join } from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import { decodePng, encodePng, importSkin } from "@mc-agent/core";

export default tool({
  description:
    "Import a user-uploaded skin PNG: validate it, coerce/normalize to the " +
    "requested model (classic/slim), and optionally write a normalized copy.",
  args: {
    path: tool.schema.string().describe("Input skin PNG path, relative to project root."),
    model: tool.schema
      .enum(["classic", "slim", "auto"])
      .default("auto")
      .describe("Target model; 'auto' keeps detected."),
    strict: tool.schema
      .boolean()
      .default(false)
      .describe("If true, reject invalid input instead of returning a result."),
    output: tool.schema
      .string()
      .optional()
      .describe("Optional output PNG path to write the normalized skin."),
  },
  async execute({ path, model, strict, output }, ctx) {
    const abs = join(ctx.worktree, path);
    const buf = await readFile(abs);
    const img = decodePng(buf);
    const { model: m, result } = importSkin(img, { model, strict });
    if (output) {
      const outAbs = join(ctx.worktree, output);
      await mkdir(join(outAbs, ".."), { recursive: true });
      await writeFile(outAbs, encodePng(img));
      return `Imported as ${m}; wrote ${output}. ${JSON.stringify(result)}`;
    }
    return `Imported as ${m}. ${JSON.stringify(result)}`;
  },
});
