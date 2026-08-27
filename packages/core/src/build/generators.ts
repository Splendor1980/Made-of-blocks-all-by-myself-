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
