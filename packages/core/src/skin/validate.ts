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

/** Expands a legacy 64x32 skin to the modern 64x64 layout by duplicating the
 *  top (body) half into the bottom (limbs/overlay) half. */
export function expandLegacySkin(img: RGBA): RGBA {
  if (img.width !== 64 || img.height !== 32) return img;
  const data = Buffer.alloc(64 * 64 * 4);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      const src = (y * 64 + x) * 4;
      const dstTop = (y * 64 + x) * 4;
      const dstBot = ((y + 32) * 64 + x) * 4;
      data[dstTop] = img.data[src];
      data[dstTop + 1] = img.data[src + 1];
      data[dstTop + 2] = img.data[src + 2];
      data[dstTop + 3] = img.data[src + 3];
      // bottom half mirrors the body parts for a valid 64x64 file
      data[dstBot] = img.data[src];
      data[dstBot + 1] = img.data[src + 1];
      data[dstBot + 2] = img.data[src + 2];
      data[dstBot + 3] = img.data[src + 3];
    }
  }
  return { width: 64, height: 64, data };
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

  // Objective sanity checks (warnings, not hard failures) for legacy imports.
  if (img.width === 64 && img.height === 64) {
    let faceOpaque = 0;
    for (let y = 8; y < 16; y++) {
      for (let x = 8; x < 16; x++) {
        if (img.data[(y * 64 + x) * 4 + 3] !== 0) faceOpaque++;
      }
    }
    if (faceOpaque === 0) warnings.push("Base face (front head) appears empty.");

    let padding = 0;
    for (let y = 0; y < 64; y++) {
      for (const x of [0, 1, 2, 3, 4, 5, 6, 7, 56, 57, 58, 59, 60, 61, 62, 63]) {
        if (img.data[(y * 64 + x) * 4 + 3] !== 0) padding++;
      }
    }
    if (padding > 0) warnings.push("Opaque pixels in reserved padding zones (x 0-7 / 56-63).");
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
