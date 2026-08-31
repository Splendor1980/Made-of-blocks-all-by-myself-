import zlib from "node:zlib";
import type { VoxelGrid } from "./mcfunction.js";
import { splitBlockId } from "./blocks.js";

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
 * format): size, palette (Name + block-state Properties), and blocks.
 * Blocks given as `base[state]` (e.g. `oak_log[axis=y]`) get their state split
 * into the `Properties` compound; stateless blocks emit `Name` only.
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
        const parsed = splitBlockId(b) ?? { base: b, state: null };
        const base = parsed.base.includes(":") ? parsed.base : `minecraft:${parsed.base}`;
        const key = parsed.state ? `${base}[${parsed.state}]` : base;
        let i = paletteIndex.get(key);
        if (i === undefined) {
          i = paletteNames.length;
          paletteNames.push(key);
          paletteIndex.set(key, i);
        }
        blocks.push([x, y, z, i]);
      }
    }
  }

  const palette: Nbt[] = paletteNames.map((key) => {
    const parsed = splitBlockId(key) ?? { base: key, state: null };
    const base = parsed.base.includes(":") ? parsed.base : `minecraft:${parsed.base}`;
    if (!parsed.state) return { t: "c" as const, v: [["Name", { t: "s", v: base }]] };
    const props: [string, Nbt][] = parsed.state.split(",").map((pair) => {
      const eq = pair.indexOf("=");
      const k = pair.slice(0, eq).trim();
      const val = pair.slice(eq + 1).trim();
      return [k, { t: "s", v: val }] as [string, Nbt];
    });
    return {
      t: "c",
      v: [
        ["Name", { t: "s", v: base }],
        ["Properties", { t: "c", v: props }],
      ],
    };
  });

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

// ---- Reader (Java structure-block NBT, big-endian, gzip-aware) ----

type RNode =
  | { t: "compound"; v: [string, RNode][] }
  | { t: "list"; it: string; v: RNode[] }
  | { t: "string"; v: string }
  | { t: "int"; v: number }
  | { t: "byte"; v: number }
  | { t: "short"; v: number }
  | { t: "long"; v: number }
  | { t: "float"; v: number }
  | { t: "double"; v: number }
  | { t: "intArray"; v: number[] }
  | { t: "byteArray"; v: number[] }
  | { t: "longArray"; v: number[] };

class Reader {
  pos = 0;
  constructor(public buf: Buffer) {}
  u8() {
    return this.buf[this.pos++];
  }
  u16() {
    const v = (this.buf[this.pos] << 8) | this.buf[this.pos + 1];
    this.pos += 2;
    return v;
  }
  i32() {
    const v = this.buf.readInt32BE(this.pos);
    this.pos += 4;
    return v;
  }
  i64() {
    let v = 0;
    for (let i = 0; i < 8; i++) v = v * 256 + this.buf[this.pos + i];
    this.pos += 8;
    return v;
  }
  f32() {
    const v = this.buf.readFloatBE(this.pos);
    this.pos += 4;
    return v;
  }
  f64() {
    const v = this.buf.readDoubleBE(this.pos);
    this.pos += 8;
    return v;
  }
  str() {
    const len = this.u16();
    const s = this.buf.toString("utf8", this.pos, this.pos + len);
    this.pos += len;
    return s;
  }
  readValue(type: number): RNode {
    switch (type) {
      case 1:
        return { t: "byte", v: this.u8() };
      case 2:
        return { t: "short", v: this.u16() };
      case 3:
        return { t: "int", v: this.i32() };
      case 4:
        return { t: "long", v: this.i64() };
      case 5:
        return { t: "float", v: this.f32() };
      case 6:
        return { t: "double", v: this.f64() };
      case 7: {
        const len = this.i32();
        const arr: number[] = [];
        for (let i = 0; i < len; i++) arr.push(this.u8());
        return { t: "byteArray", v: arr };
      }
      case 8:
        return { t: "string", v: this.str() };
      case 9: {
        const it = this.u8();
        const len = this.i32();
        const v: RNode[] = [];
        for (let i = 0; i < len; i++) v.push(this.readValue(it));
        return { t: "list", it: String(it), v };
      }
      case 10: {
        const v: [string, RNode][] = [];
        for (;;) {
          const t = this.u8();
          if (t === 0) break;
          const name = this.str();
          v.push([name, this.readValue(t)]);
        }
        return { t: "compound", v };
      }
      case 11: {
        const len = this.i32();
        const arr: number[] = [];
        for (let i = 0; i < len; i++) arr.push(this.i32());
        return { t: "intArray", v: arr };
      }
      case 12: {
        const len = this.i32();
        const arr: number[] = [];
        for (let i = 0; i < len; i++) arr.push(this.i64());
        return { t: "longArray", v: arr };
      }
      default:
        throw new Error(`Unknown NBT tag type ${type} at ${this.pos}`);
    }
  }
}

function find(node: RNode | undefined, key: string): RNode | undefined {
  if (!node || node.t !== "compound") return undefined;
  return node.v.find(([k]) => k === key)?.[1];
}
function asList(node: RNode | undefined): RNode[] {
  return node && node.t === "list" ? node.v : [];
}

/**
 * Reads a Minecraft structure `.nbt` (Java structure-block format, big-endian,
 * gzip-aware) into a VoxelGrid. Block-state properties are ignored; only the
 * palette `Name` is kept (namespaced as `minecraft:` when missing).
 */
export function readStructureNbt(buffer: Buffer): VoxelGrid {
  let buf = buffer;
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf);
  const reader = new Reader(buf);
  const rootType = reader.u8();
  const rootNode = reader.readValue(rootType) as RNode;

  const sizeNode = find(rootNode, "size");
  const size = asList(sizeNode).map((n) => (n.t === "int" ? n.v : 0));
  const [W = 0, H = 0, D = 0] = [size[0] ?? 0, size[1] ?? 0, size[2] ?? 0];

  const paletteNodes = asList(find(rootNode, "palette"));
  const palette: string[] = paletteNodes.map((p) => {
    const nameNode = find(p, "Name");
    let name = nameNode && nameNode.t === "string" ? nameNode.v : "minecraft:air";
    if (!name.includes(":")) name = `minecraft:${name}`;
    return name;
  });

  const blocks = new Array<string | null>(W * H * D).fill(null);
  for (const b of asList(find(rootNode, "blocks"))) {
    const pos = asList(find(b, "pos")).map((n) => (n.t === "int" ? n.v : 0));
    const [x, y, z] = [pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0];
    const stateNode = find(b, "state");
    const state = stateNode && stateNode.t === "int" ? stateNode.v : 0;
    const name = palette[state] ?? "minecraft:air";
    if (name === "minecraft:air") continue;
    blocks[(y * D + z) * W + x] = name;
  }

  return { width: W, height: H, depth: D, blocks };
}
