import type { RGBA, SkinModel, ValidationResult } from "./types.js";

export const CLASSIC_DIMS = { width: 64, height: 64 } as const;
export const SLIM_DIMS = { width: 64, height: 64 } as const;

function hex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

/**
 * Detects model by inspecting the under-arm seam pixels:
 * classic arms are 4px wide (x=44..47 and x=36..39), slim are 3px
 * (x=44..46 / x=36..38) with a transparent 4th column.
 */
export function detectModel(img: RGBA): SkinModel {
  if (img.width !== 64 || img.height !== 64) return "unknown";
  const rightArmCol = (x: number) => {
    const y = 20;
    return img.data[(y * 64 + x) * 4 + 3];
  };
  const leftArmCol = (x: number) => {
    const y = 52;
    return img.data[(y * 64 + x) * 4 + 3];
  };
  const rightSlim = rightArmCol(47) === 0 && rightArmCol(46) !== 0;
  const leftSlim = leftArmCol(39) === 0 && leftArmCol(38) !== 0;
  if (rightSlim && leftSlim) return "slim";
  if (!rightSlim && !leftSlim) return "classic";
  return "unknown";
}

export function validateSkin(img: RGBA): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const model = detectModel(img);

  if (img.width !== 64 || img.height !== 64) {
    errors.push(
      `Invalid dimensions ${img.width}x${img.height}; Minecraft skins must be 64x64.`,
    );
  }
  if (model === "unknown") {
    warnings.push(
      "Could not confidently detect model (classic vs slim); defaulting to classic.",
    );
  }

  // Scan for non-opaque alpha values (Minecraft expects 0 or 255).
  let semiTransparent = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const a = img.data[i + 3];
    if (a !== 0 && a !== 255) {
      semiTransparent++;
      if (semiTransparent > 32) break;
    }
  }
  if (semiTransparent > 32) {
    warnings.push("Image contains many semi-transparent pixels; may render oddly in game.");
  }

  // Basic sanity: ensure the buffer length matches. This guards against
  // callers passing a wrong-sized buffer.
  if (img.data.length !== img.width * img.height * 4) {
    errors.push("Image data length does not match width*height*4.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    model: model === "unknown" ? "classic" : model,
  };
}

export function colorHex(img: RGBA, x: number, y: number): string {
  const i = (y * img.width + x) * 4;
  return `#${hex(img.data[i])}${hex(img.data[i + 1])}${hex(img.data[i + 2])}`;
}
