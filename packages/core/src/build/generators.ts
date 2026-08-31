import type { VoxelGrid } from "./mcfunction.js";

export interface GenOptions {
  block: string;
  /** When true (default for box) only the shell is filled. */
  hollow?: boolean;
}

/** Appends an explicit `[state]` string to a block id if the caller provided one. */
export function withState(block: string, state?: string): string {
  return state ? `${block}[${state}]` : block;
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

/** A single-block pillar of height `height`. */
export function column(height: number, block: string): VoxelGrid {
  const h = Math.max(1, height);
  const blocks: (string | null)[] = new Array(h).fill(block);
  return { width: 1, height: h, depth: 1, blocks };
}

/** An ascending diagonal ramp in X/Y: at height y, spans X 0..y. */
export function ramp(width: number, height: number, block: string): VoxelGrid {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const depth = 1;
  const blocks: (string | null)[] = new Array(w * h * depth).fill(null);
  const idx = (x: number, y: number, z: number) => (y * depth + z) * w + x;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x <= y) blocks[idx(x, y, 0)] = block;
  return { width: w, height: h, depth, blocks };
}

/** A hollow arch / doorway in the XZ plane: two pillars + a lintel top. */
export function arch(width: number, height: number, block: string): VoxelGrid {
  const w = Math.max(3, width);
  const h = Math.max(3, height);
  const depth = 1;
  const blocks: (string | null)[] = new Array(w * h * depth).fill(null);
  const idx = (x: number, y: number, z: number) => (y * depth + z) * w + x;
  for (let x = 0; x < w; x++) {
    const edgeX = x === 0 || x === w - 1;
    for (let y = 0; y < h; y++) {
      // pillar columns at the edges; solid top lintel row.
      if (edgeX || y === h - 1) blocks[idx(x, y, 0)] = block;
    }
  }
  return { width: w, height: h, depth, blocks };
}

/** A torus/ring of `diameter` lying in the XZ plane, `thickness` blocks wide. */
export function ring(diameter: number, thickness: number, block: string): VoxelGrid {
  const d = Math.max(4, diameter);
  const t = Math.max(1, thickness);
  const blocks: (string | null)[] = new Array(d * d * t).fill(null);
  const c = (d - 1) / 2;
  const r = d / 2;
  const idx = (x: number, y: number, z: number) => (y * d + z) * d + x;
  for (let y = 0; y < t; y++)
    for (let z = 0; z < d; z++)
      for (let x = 0; x < d; x++) {
        const dx = x - c, dz = z - c;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist >= r - t && dist <= r) blocks[idx(x, y, z)] = block;
      }
  return { width: d, height: t, depth: d, blocks };
}

/** Map a high-level `type` to a concrete voxel grid. `state` (e.g. "axis=y")
 *  is appended to every block id so geometry can carry explicit block state. */
export function generateGrid(
  type: string,
  block: string,
  size: number,
  state?: string,
): VoxelGrid {
  const b = withState(block, state);
  switch (type) {
    case "house":
    case "box":
      return box(size, b, type !== "box");
    case "tower":
    case "pyramid":
      return pyramid(size, b);
    case "fence":
    case "wall":
      return wall(size, Math.max(2, Math.floor(size / 2)), b);
    case "sphere":
      return sphere(size, b);
    case "dome":
      return dome(size, b);
    case "bridge":
      return bridge(size, Math.max(3, Math.floor(size / 2)), b);
    case "stairs":
      return stairs(size, size, b);
    case "column":
      return column(Math.max(2, Math.floor(size)), b);
    case "ramp":
      return ramp(size, Math.max(2, Math.floor(size / 2)), b);
    case "arch":
      return arch(size, Math.max(3, Math.floor(size / 2)), b);
    case "ring":
      return ring(size, Math.max(1, Math.floor(size / 4)), b);
    default:
      throw new Error(`unknown type: ${type} (house|box|tower|pyramid|fence|wall|sphere|dome|bridge|stairs|column|ramp|arch|ring)`);
  }
}
