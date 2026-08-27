import { describe, it, expect } from "vitest";
import { writeStructureNbt, readStructureNbt } from "../src/build/index.js";
import type { VoxelGrid } from "../src/build/index.js";

function gridFrom(blocks: string | null[][][]): VoxelGrid {
  const H = blocks.length;
  const D = blocks[0].length;
  const W = blocks[0][0].length;
  const flat: (string | null)[] = [];
  for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) flat.push(blocks[y][z][x]);
  return { width: W, height: H, depth: D, blocks: flat };
}

describe("structure NBT read/write round-trip", () => {
  it("preserves a small multi-block grid", () => {
    const g = gridFrom([
      [[null, "minecraft:stone"], [null, null]],
      [["minecraft:oak_planks", null], ["minecraft:glass", null]],
    ]);
    const buf = writeStructureNbt(g);
    const back = readStructureNbt(buf);
    expect(back.width).toBe(2);
    expect(back.height).toBe(2);
    expect(back.depth).toBe(2);
    const at = (x: number, y: number, z: number) => back.blocks[(y * 2 + z) * 2 + x];
    expect(at(1, 0, 0)).toBe("minecraft:stone");
    expect(at(0, 1, 0)).toBe("minecraft:oak_planks");
    expect(at(0, 1, 1)).toBe("minecraft:glass");
    expect(at(0, 0, 0)).toBeNull();
  });

  it("reads gzip-compressed buffers", () => {
    const g = gridFrom([[[ "minecraft:diamond_block" ]]]);
    const raw = writeStructureNbt(g);
    const zlib = require("node:zlib");
    const gz = zlib.gzipSync(raw);
    const back = readStructureNbt(gz);
    expect(back.blocks[0]).toBe("minecraft:diamond_block");
  });
});
