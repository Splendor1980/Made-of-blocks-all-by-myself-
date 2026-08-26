import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import {
  loadTemplate,
  recolorTemplate,
  recolorPart,
  encodePng,
  validateSkin,
} from "@mc-agent/core";

const TEMPLATES_DIR = "assets/templates";

export default tool({
  description:
    "Recolor a built-in skin template by slot colors (or a single body part) " +
    "and write the resulting 64x64 PNG. Deterministic: no AI pixels.",
  args: {
    templateId: tool.schema.string().describe("Built-in template id, e.g. 'knight'."),
    colors: tool.schema
      .record(tool.schema.string(), tool.schema.string())
      .optional()
      .describe("Map of slotName -> #rrggbb color override."),
    part: tool.schema.string().optional().describe("Body part group, e.g. 'head', 'torso'."),
    partColor: tool.schema.string().optional().describe("#rrggbb color for the whole part."),
    output: tool.schema.string().describe("Output PNG path, relative to project root."),
  },
  async execute({ templateId, colors, part, partColor, output }, ctx) {
    const dir = join(ctx.worktree, TEMPLATES_DIR);
    const tpl = loadTemplate(dir, templateId);
    const img = part && partColor ? recolorPart(tpl, part, partColor, colors) : recolorTemplate(tpl, colors);
    const v = validateSkin(img);
    if (!v.valid) return `Recolor produced an invalid skin: ${v.errors.join("; ")}`;
    const abs = join(ctx.worktree, output);
    await mkdir(join(abs, ".."), { recursive: true });
    await writeFile(abs, encodePng(img));
    return `Wrote ${output} (model=${v.model}, warnings=${v.warnings.length})`;
  },
});
