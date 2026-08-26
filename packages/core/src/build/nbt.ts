import type { VoxelGrid } from "./mcfunction.js";

type Nbt =
  | { t: "c"; v: [string, Nbt][] }
  | { t: "l"; it: "c" | "i" | "s"; v: Nbt[] }
  | { t: "s"; v: string }
  | { t: "i"; v: number };

const TYPE_BYTE: Record<string, number> = { c: 10, l: 9, s: 8, i: 3 };

class W {
  b: number[] = [];
  u8(n: number) { this.b.push(n & 0xff); }
  u16(n: number) { this.b.push((n >>> 8) & 0xff, n & 0xff); }
  i32(n: number) {
    this.b.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
  }
  str(s: string) {
    const buf = Buffer.from(s, "utf8");
    this.u16(buf.length);
    for (const c of buf) this.u8(c);
  }
  payload(t: Nbt) {
    switch (t.t) {
      case "c":
        for (const [name, val] of t.v) {
          this.u8(TYPE_BYTE[val.t]);
          this.str(name);
          this.payload(val);
        }
        this.u8(0);
        break;
      case "l":
        this.u8(TYPE_BYTE[t.it]);
        this.i32(t.v.length);
        for (const item of t.v) this.payload(item);
        break;
      case "s":
        this.str(t.v);
        break;
      case "i":
        this.i32(t.v);
        break;
    }
  }
  root(compound: Nbt & { t: "c" }) {
    this.u8(10);
    this.payload(compound);
  }
}

export interface StructureOptions {
  dataVersion?: number;
}

/**
 * Encodes a voxel grid as a Minecraft structure `.nbt` (Java structure-block
 * format): size, palette (Name only, no block-state properties), and blocks.
 */
export function writeStructureNbt(
  grid: VoxelGrid,
  opts: StructureOptions = {},
): Buffer {
  const dataVersion = opts.dataVersion ?? 3466;
  const paletteNames: string[] = [];
  const paletteIndex = new Map<string, number>();

  const blocks: [number, number, number, number][] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let z = 0; z < grid.depth; z++) {
      for (let x = 0; x < grid.width; x++) {
        const b = grid.blocks[(y * grid.depth + z) * grid.width + x];
        if (!b || b === "air" || b === "") continue;
        const name = b.includes(":") ? b : `minecraft:${b}`;
        let i = paletteIndex.get(name);
        if (i === undefined) {
          i = paletteNames.length;
          paletteNames.push(name);
          paletteIndex.set(name, i);
        }
        blocks.push([x, y, z, i]);
      }
    }
  }

  const palette: Nbt[] = paletteNames.map((n) => ({
    t: "c",
    v: [["Name", { t: "s", v: n }]],
  }));

  const blockTags: Nbt[] = blocks.map(([x, y, z, state]) => ({
    t: "c",
    v: [
      ["pos", { t: "l", it: "i", v: [x, y, z].map((n) => ({ t: "i" as const, v: n })) }],
      ["state", { t: "i", v: state }],
    ],
  }));

  const root: Nbt & { t: "c" } = {
    t: "c",
    v: [
      ["DataVersion", { t: "i", v: dataVersion }],
      ["size", { t: "l", it: "i", v: [grid.width, grid.height, grid.depth].map((n) => ({ t: "i" as const, v: n })) }],
      ["palette", { t: "l", it: "c", v: palette }],
      ["blocks", { t: "l", it: "c", v: blockTags }],
    ],
  };

  const w = new W();
  w.root(root);
  return Buffer.from(w.b);
}
