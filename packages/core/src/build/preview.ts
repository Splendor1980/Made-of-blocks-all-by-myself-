import type { VoxelGrid } from "./mcfunction.js";
import type { RGBA } from "../skin/types.js";

const BLOCK_COLORS: Record<string, [number, number, number]> = {
  "minecraft:oak_planks": [165, 124, 77],
  "minecraft:spruce_planks": [116, 84, 56],
  "minecraft:birch_planks": [197, 175, 125],
  "minecraft:stone": [127, 127, 127],
  "minecraft:cobblestone": [122, 122, 122],
  "minecraft:brick": [150, 70, 54],
  "minecraft:glass": [200, 230, 235],
  "minecraft:quartz_block": [230, 225, 220],
  "minecraft:oak_log": [110, 84, 54],
  "minecraft:diamond_block": [80, 220, 210],
  "minecraft:gold_block": [240, 210, 60],
  "minecraft:iron_block": [215, 215, 220],
  "minecraft:red_concrete": [210, 70, 70],
  "minecraft:blue_concrete": [70, 110, 210],
  "minecraft:green_concrete": [110, 190, 90],
  "minecraft:white_concrete": [225, 225, 225],
  "minecraft:black_concrete": [40, 40, 40],
  "minecraft:netherite_block": [70, 70, 80],
  "minecraft:grass_block": [110, 170, 80],
  "minecraft:dirt": [134, 96, 67],
  "minecraft:sand": [219, 205, 152],
  "minecraft:water": [70, 120, 220],
  "minecraft:lava": [220, 110, 40],
  "minecraft:obsidian": [25, 20, 40],
  "minecraft:glowstone": [240, 230, 150],
  "minecraft:redstone_block": [200, 40, 40],
  "minecraft:emerald_block": [60, 200, 120],
  "minecraft:purpur_block": [165, 120, 190],
  "minecraft:terracotta": [160, 100, 70],
};

function blockColor(name: string): [number, number, number] {
  const n = name.includes(":") ? name : `minecraft:${name}`;
  const c = BLOCK_COLORS[n];
  if (c) return c;
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (Math.imul(h, 31) + n.charCodeAt(i)) >>> 0;
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

function shade([r, g, b]: [number, number, number], f: number): [number, number, number] {
  return [Math.min(255, r * f) | 0, Math.min(255, g * f) | 0, Math.min(255, b * f) | 0];
}

export interface PreviewOptions {
  /** Pixel size of one cube edge. Default 8. */
  tile?: number;
  /** Background fill; null = transparent. Default transparent. */
  background?: [number, number, number, number] | null;
}

function pointInPoly(px: number, py: number, pts: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function fillPoly(img: RGBA, pts: [number, number][], color: [number, number, number]): void {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(img.width - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(img.height - 1, Math.ceil(Math.max(...ys)));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!pointInPoly(x + 0.5, y + 0.5, pts)) continue;
      const o = (y * img.width + x) * 4;
      img.data[o] = color[0];
      img.data[o + 1] = color[1];
      img.data[o + 2] = color[2];
      img.data[o + 3] = 255;
    }
  }
}

/**
 * Renders a VoxelGrid as an isometric (2.5D) RGBA image, one shaded cube per
 * non-air voxel. Deterministic and headless — usable by the UI via a canvas.
 */
export function renderPreview(grid: VoxelGrid, opts: PreviewOptions = {}): RGBA {
  const tile = opts.tile ?? 8;
  const { width: W, height: H, depth: D } = grid;
  const pad = tile;

  const minX = (0 - (D - 1)) * (tile / 2);
  const maxX = (W - 1 - 0) * (tile / 2) + tile;
  const minY = 0 - (H - 1) * tile;
  const maxY = (W - 1 + (D - 1)) * (tile / 4) + tile;
  const offX = -minX + pad;
  const offY = -minY + pad;
  const iw = Math.ceil(maxX - minX + pad * 2);
  const ih = Math.ceil(maxY - minY + pad * 2);

  const data = Buffer.alloc(iw * ih * 4);
  if (opts.background) {
    for (let i = 0; i < iw * ih; i++) {
      data[i * 4] = opts.background[0];
      data[i * 4 + 1] = opts.background[1];
      data[i * 4 + 2] = opts.background[2];
      data[i * 4 + 3] = opts.background[3];
    }
  }
  const img: RGBA = { width: iw, height: ih, data };

  const hx = tile / 2;
  const hy = tile / 4;
  const q = tile;

  for (let y = 0; y < H; y++) {
    for (let z = D - 1; z >= 0; z--) {
      for (let x = 0; x < W; x++) {
        const b = grid.blocks[(y * D + z) * W + x];
        if (!b) continue;
        const sx = (x - z) * hx + offX;
        const sy = (x + z) * hy - y * tile + offY;
        const base = blockColor(b);
        const top = shade(base, 1);
        const left = shade(base, 0.72);
        const right = shade(base, 0.55);
        // top
        fillPoly(img, [
          [sx + hx, sy],
          [sx + tile, sy + hy],
          [sx + hx, sy + hy * 2],
          [sx, sy + hy],
        ], top);
        // left
        fillPoly(img, [
          [sx, sy + hy],
          [sx + hx, sy + hy * 2],
          [sx + hx, sy + hy * 2 + q],
          [sx, sy + hy + q],
        ], left);
        // right
        fillPoly(img, [
          [sx + tile, sy + hy],
          [sx + hx, sy + hy * 2],
          [sx + hx, sy + hy * 2 + q],
          [sx + tile, sy + hy + q],
        ], right);
      }
    }
  }

  return img;
}
