import type { VoxelGrid } from "./mcfunction.js";

export interface GenOptions {
  block: string;
  /** When true (default for box) only the shell is filled. */
  hollow?: boolean;
}

/** A solid or hollow axis-aligned cube of `block` with side `size`. */
export function box(size: number, block: string, hollow = true): VoxelGrid {
  const blocks: (string | null)[] = new Array(size * size * size).fill(null);
  const idx = (x: number, y: number, z: number) => (y * size + z) * size + x;
  for (let y = 0; y < size; y++)
    for (let z = 0; z < size; z++)
      for (let x = 0; x < size; x++) {
        const edge = x === 0 || y === 0 || z === 0 || x === size - 1 || y === size - 1 || z === size - 1;
        if (!hollow || edge) blocks[idx(x, y, z)] = block;
      }
  return { width: size, height: size, depth: size, blocks };
}

/** A stepped pyramid: layer y has an (base-y) x (base-y) footprint, centered in X/Z. */
export function pyramid(base: number, block: string): VoxelGrid {
  const size = base;
  const blocks: (string | null)[] = new Array(size * size * size).fill(null);
  const idx = (x: number, y: number, z: number) => (y * size + z) * size + x;
  for (let y = 0; y < base; y++) {
    const lo = y;
    const hi = base - 1 - y;
    for (let z = lo; z <= hi; z++)
      for (let x = lo; x <= hi; x++) blocks[idx(x, y, z)] = block;
  }
  return { width: size, height: size, depth: size, blocks };
}

/** A flat wall in the X (width) by Y (height) plane, single block deep in Z. */
export function wall(width: number, height: number, block: string): VoxelGrid {
  const depth = 1;
  const blocks: (string | null)[] = new Array(width * height * depth).fill(null);
  const idx = (x: number, y: number, z: number) => (y * depth + z) * width + x;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) blocks[idx(x, y, 0)] = block;
  return { width, height, depth, blocks };
}

/** A filled sphere of the given diameter (single block id). */
export function sphere(diameter: number, block: string): VoxelGrid {
  const d = Math.max(2, diameter);
  const c = (d - 1) / 2;
  const r = d / 2;
  const blocks: (string | null)[] = new Array(d * d * d).fill(null);
  const idx = (x: number, y: number, z: number) => (y * d + z) * d + x;
  for (let y = 0; y < d; y++)
    for (let z = 0; z < d; z++)
      for (let x = 0; x < d; x++) {
        const dx = x - c, dy = y - c, dz = z - c;
        if (dx * dx + dy * dy + dz * dz <= r * r) blocks[idx(x, y, z)] = block;
      }
  return { width: d, height: d, depth: d, blocks };
}

/** Upper hemisphere (dome) of a sphere of the given diameter. */
export function dome(diameter: number, block: string): VoxelGrid {
  const d = Math.max(2, diameter);
  const c = (d - 1) / 2;
  const r = d / 2;
  const blocks: (string | null)[] = new Array(d * d * d).fill(null);
  const idx = (x: number, y: number, z: number) => (y * d + z) * d + x;
  for (let y = 0; y < d; y++)
    for (let z = 0; z < d; z++)
      for (let x = 0; x < d; x++) {
        if (y < c) continue; // only the upper half
        const dx = x - c, dy = y - c, dz = z - c;
        if (dx * dx + dy * dy + dz * dz <= r * r) blocks[idx(x, y, z)] = block;
      }
  return { width: d, height: d, depth: d, blocks };
}

/** A flat walkway: `width` (X) by `length` (Z), one block tall. */
export function bridge(width: number, length: number, block: string): VoxelGrid {
  const w = Math.max(2, width);
  const l = Math.max(2, length);
  const blocks: (string | null)[] = new Array(w * l * 1).fill(null);
  const idx = (x: number, y: number, z: number) => (y * l + z) * w + x;
  for (let z = 0; z < l; z++) for (let x = 0; x < w; x++) blocks[idx(x, 0, z)] = block;
  return { width: w, height: 1, depth: l, blocks };
}

/** Ascending stairs: `width` (X) by `steps` (Y and Z). Step y spans Z 0..y. */
export function stairs(width: number, steps: number, block: string): VoxelGrid {
  const w = Math.max(1, width);
  const s = Math.max(1, steps);
  const blocks: (string | null)[] = new Array(w * s * s).fill(null);
  const idx = (x: number, y: number, z: number) => (y * s + z) * w + x;
  for (let y = 0; y < s; y++) for (let z = 0; z <= y; z++) for (let x = 0; x < w; x++) blocks[idx(x, y, z)] = block;
  return { width: w, height: s, depth: s, blocks };
}

/** Map a high-level `type` to a concrete voxel grid. */
export function generateGrid(type: string, block: string, size: number): VoxelGrid {
  switch (type) {
    case "house":
    case "box":
      return box(size, block, type !== "box");
    case "tower":
    case "pyramid":
      return pyramid(size, block);
    case "fence":
    case "wall":
      return wall(size, Math.max(2, Math.floor(size / 2)), block);
    case "sphere":
      return sphere(size, block);
    case "dome":
      return dome(size, block);
    case "bridge":
      return bridge(size, Math.max(3, Math.floor(size / 2)), block);
    case "stairs":
      return stairs(size, size, block);
    default:
      throw new Error(`unknown type: ${type} (house|box|tower|pyramid|fence|wall|sphere|dome|bridge|stairs)`);
  }
}
