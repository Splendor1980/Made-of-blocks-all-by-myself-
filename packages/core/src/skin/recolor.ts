import type { RGBA, SkinTemplate, Slot } from "./types.js";
import { regionsForPart, transparentMask } from "./atlas.js";
import { colorHex } from "./validate.js";

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Builds a "to color" map from a filled slot set. Any slot left undefined
 * falls back to its defaultColor.
 */
function resolveColors(
  slots: Slot[],
  overrides: Record<string, string> | undefined,
): Map<string, [number, number, number]> {
  const map = new Map<string, [number, number, number]>();
  for (const s of slots) {
    const chosen = overrides?.[s.name] ?? s.defaultColor;
    map.set(s.keyColor.toLowerCase(), parseHex(chosen));
  }
  return map;
}

/**
 * Creates a skin PNG from a template + slot color overrides.
 * Pixels matching a slot key color are replaced with the chosen color.
 * Transparent template pixels are preserved (so empty overlay slots stay empty).
 */
export function recolorTemplate(
  template: SkinTemplate,
  overrides?: Record<string, string>,
): RGBA {
  const out: RGBA = {
    width: template.image.width,
    height: template.image.height,
    data: Buffer.from(template.image.data),
  };
  const colorMap = resolveColors(template.slots, overrides);
  const mask = transparentMask(template.image);

  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const key = `${x},${y}`;
      if (mask.has(key)) continue; // keep transparency
      const hex = colorHex(template.image, x, y).toLowerCase();
      const target = colorMap.get(hex);
      if (target) {
        const i = (y * out.width + x) * 4;
        out.data[i] = target[0];
        out.data[i + 1] = target[1];
        out.data[i + 2] = target[2];
        // keep original alpha
      }
    }
  }
  return out;
}

/**
 * Recolors a specific body part group (e.g. "head", "cloak") across all its
 * UV faces with a single color. Convenience wrapper used by simple UI controls.
 */
export function recolorPart(
  template: SkinTemplate,
  part: string,
  color: string,
  overrides?: Record<string, string>,
): RGBA {
  const next = { ...(overrides ?? {}) };
  // Map all slots whose name starts with `part` to the chosen color.
  for (const s of template.slots) {
    if (s.name.startsWith(part)) next[s.name] = color;
  }
  return recolorTemplate(template, next);
}

export { regionsForPart };
