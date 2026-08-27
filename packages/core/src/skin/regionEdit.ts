import type { Region } from "./atlas.js";
import type { RGBA } from "./types.js";
import { transparentMask } from "./atlas.js";

/** True if (x,y) falls inside any of the given UV regions. */
export function insideRegions(regions: Region[], x: number, y: number): boolean {
  return regions.some(
    (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h,
  );
}

/** Paints a single pixel at (x,y). Alpha defaults to opaque. */
export function paintPixel(
  img: RGBA,
  x: number,
  y: number,
  rgb: [number, number, number],
  alpha = 255,
): RGBA {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return img;
  const out: RGBA = { width: img.width, height: img.height, data: Buffer.from(img.data) };
  const i = (y * out.width + x) * 4;
  out.data[i] = rgb[0];
  out.data[i + 1] = rgb[1];
  out.data[i + 2] = rgb[2];
  out.data[i + 3] = alpha;
  return out;
}

/**
 * Paints a solid color inside a UV region. Transparent template pixels inside
 * the region are preserved so overlay layers stay empty.
 */
export function paintRegion(
  RGBA: RGBA,
  region: Region,
  rgb: [number, number, number],
): RGBA {
  const out: RGBA = {
    width: RGBA.width,
    height: RGBA.height,
    data: Buffer.from(RGBA.data),
  };
  const mask = transparentMask(RGBA);
  for (let y = region.y; y < region.y + region.h; y++) {
    for (let x = region.x; x < region.x + region.w; x++) {
      if (x >= out.width || y >= out.height) continue;
      if (mask.has(`${x},${y}`)) continue;
      const i = (y * out.width + x) * 4;
      out.data[i] = rgb[0];
      out.data[i + 1] = rgb[1];
      out.data[i + 2] = rgb[2];
    }
  }
  return out;
}

/**
 * Pastes an overlay image (e.g. a logo) into a UV region, copying RGBA
 * including partial alpha. Source is scaled to the region size via nearest
 * neighbor.
 */
export function pasteRegion(
  RGBA: RGBA,
  region: Region,
  overlay: RGBA,
  opts?: { alpha?: number },
): RGBA {
  const out: RGBA = {
    width: RGBA.width,
    height: RGBA.height,
    data: Buffer.from(RGBA.data),
  };
  const aMul = opts?.alpha ?? 1;
  for (let y = 0; y < region.h; y++) {
    for (let x = 0; x < region.w; x++) {
      const sx = Math.floor((x / region.w) * overlay.width);
      const sy = Math.floor((y / region.h) * overlay.height);
      const si = (sy * overlay.width + sx) * 4;
      const oa = overlay.data[si + 3];
      if (oa === 0) continue;
      const dx = region.x + x;
      const dy = region.y + y;
      if (dx >= out.width || dy >= out.height) continue;
      const di = (dy * out.width + dx) * 4;
      const srcA = (oa / 255) * aMul;
      // alpha-composite over existing
      const dstA = out.data[di + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA === 0) {
        out.data[di + 3] = 0;
        continue;
      }
      for (let c = 0; c < 3; c++) {
        const s = overlay.data[si + c] * srcA;
        const d = out.data[di + c] * dstA * (1 - srcA);
        out.data[di + c] = Math.round((s + d) / outA);
      }
      out.data[di + 3] = Math.round(outA * 255);
    }
  }
  return out;
}
