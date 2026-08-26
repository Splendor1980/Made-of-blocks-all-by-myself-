import { join } from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import {
  decodePng,
  encodePng,
  validateSkin,
  paintRegion,
  pasteRegion,
  CLASSIC_REGIONS,
  regionsForPart,
  type RGBA,
} from "@mc-agent/core";

function parseColor(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function resolveRegions(partOrRegion: string) {
  if (partOrRegion in CLASSIC_REGIONS) return [CLASSIC_REGIONS[partOrRegion as keyof typeof CLASSIC_REGIONS]];
  const parts = regionsForPart(partOrRegion);
  if (parts.length === 0) throw new Error(`Unknown region/part: ${partOrRegion}`);
  return parts;
}

export default tool({
  description:
    "Edit a UV region (or whole body part group) of a skin: paint a solid " +
    "color, or paste an overlay image (logo) with alpha. Deterministic.",
  args: {
    path: tool.schema.string().describe("Input skin PNG path, relative to project root."),
    region: tool.schema
      .string()
      .describe("Region name (e.g. 'headFront') or body part group (e.g. 'head')."),
    color: tool.schema.string().optional().describe("#rrggbb solid color to paint."),
    overlay: tool.schema.string().optional().describe("Overlay PNG path to paste."),
    output: tool.schema.string().describe("Output PNG path, relative to project root."),
  },
  async execute({ path, region, color, overlay, output }, ctx) {
    const img: RGBA = decodePng(await readFile(join(ctx.worktree, path)));
    const regions = resolveRegions(region);
    let out = img;
    if (color) {
      const rgb = parseColor(color);
      for (const r of regions) out = paintRegion(out, r, rgb);
    } else if (overlay) {
      const ov = decodePng(await readFile(join(ctx.worktree, overlay)));
      for (const r of regions) out = pasteRegion(out, r, ov);
    } else {
      throw new Error("Provide either 'color' or 'overlay'.");
    }
    const v = validateSkin(out);
    const outAbs = join(ctx.worktree, output);
    await mkdir(join(outAbs, ".."), { recursive: true });
    await writeFile(outAbs, encodePng(out));
    return `Edited ${region} -> ${output} (model=${v.model})`;
  },
});
