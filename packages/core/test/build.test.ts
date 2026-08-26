import { describe, it, expect } from "vitest";
import {
  createBlockRegistry,
  gridToMcfunction,
  sanitizeFunction,
  scanLine,
  writeStructureNbt,
  type VoxelGrid,
} from "../src/build/index.js";

describe("block registry", () => {
  const reg = createBlockRegistry("1.20.1");
  it("knows valid blocks", () => {
    expect(reg.isValid("stone")).toBe(true);
    expect(reg.isValid("minecraft:stone")).toBe(true);
  });
  it("rejects unknown blocks", () => {
    expect(reg.isValid("not_a_real_block")).toBe(false);
    expect(reg.normalize("not_a_real_block")).toBeNull();
  });
});

describe("gridToMcfunction", () => {
  it("emits a fill for a 3-wide run of stone", () => {
    const grid: VoxelGrid = {
      width: 3,
      height: 1,
      depth: 1,
      blocks: ["stone", "stone", "stone"],
    };
    const { commands, violations } = gridToMcfunction(grid, { origin: [0, 0, 0] });
    expect(violations).toHaveLength(0);
    expect(commands).toEqual(["fill 0 0 0 2 0 0 stone"]);
  });

  it("emits setblock for a single block", () => {
    const grid: VoxelGrid = { width: 1, height: 1, depth: 1, blocks: ["dirt"] };
    const { commands } = gridToMcfunction(grid);
    expect(commands).toEqual(["setblock 0 0 0 dirt"]);
  });

  it("flags command blocks via security scan", () => {
    const grid: VoxelGrid = { width: 1, height: 1, depth: 1, blocks: ["command_block"] };
    const { violations } = gridToMcfunction(grid);
    expect(violations.some((v) => /command blocks/.test(v.reason))).toBe(true);
  });
});

describe("sanitizeFunction", () => {
  it("denies op / execute / command-block gives", () => {
    const bad = ["op @a", "execute as @a run say hi", "give @s minecraft:command_block"];
    const { violations } = sanitizeFunction(bad);
    expect(violations).toHaveLength(3);
  });
  it("keeps safe build commands and comments", () => {
    const { commands, violations } = sanitizeFunction(["setblock 0 0 0 stone", "# comment"]);
    expect(violations).toHaveLength(0);
    expect(commands).toEqual(["setblock 0 0 0 stone", "# comment"]);
  });
  it("scanLine ignores comments and empty lines", () => {
    expect(scanLine("# hi", 1)).toBeNull();
    expect(scanLine("", 1)).toBeNull();
  });
});

describe("writeStructureNbt", () => {
  it("produces a compound-rooted NBT buffer", () => {
    const grid: VoxelGrid = { width: 2, height: 1, depth: 1, blocks: ["stone", "dirt"] };
    const buf = writeStructureNbt(grid);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf[0]).toBe(0x0a); // TAG_Compound
  });
});
