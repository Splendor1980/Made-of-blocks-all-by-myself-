import { describe, it, expect } from "vitest";
import {
  createBlockRegistry,
  validateBlockId,
  gridToMcfunction,
  sanitizeFunction,
  scanLine,
  writeStructureNbt,
  box,
  pyramid,
  wall,
  generateGrid,
  withState,
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

describe("block-state validation", () => {
  const reg = createBlockRegistry("1.20.1");

  it("accepts a valid state key/value", () => {
    expect(reg.isValid("minecraft:oak_log[axis=y]")).toBe(true);
    expect(reg.normalize("minecraft:oak_log[axis=y]")).toBe("oak_log[axis=y]");
  });

  it("accepts an empty state bracket (stateless block)", () => {
    expect(reg.isValid("minecraft:stone[]")).toBe(true);
    expect(reg.normalize("stone[]")).toBe("stone");
  });

  it("rejects an invalid state value for a known block", () => {
    expect(reg.isValid("minecraft:oak_log[axis=warp]")).toBe(false);
    expect(reg.normalize("oak_log[axis=warp]")).toBeNull();
  });

  it("rejects a state key the block does not declare", () => {
    expect(reg.isValid("minecraft:stone[bogus=1]")).toBe(false);
  });

  it("validateBlockId reports a readable error", () => {
    const v = validateBlockId("minecraft:oak_log[axis=warp]");
    expect(v.valid).toBe(false);
    expect(v.base).toBe("oak_log");
    expect(v.error).toMatch(/invalid block id or state/);
  });

  it("emits explicit state through gridToMcfunction", () => {
    const { commands, violations } = gridToMcfunction(box(1, "minecraft:oak_log[axis=y]", false));
    expect(violations).toHaveLength(0);
    expect(commands[0]).toContain("oak_log[axis=y]");
  });

  it("generateGrid appends explicit state and still validates", () => {
    const g = generateGrid("box", "oak_log", 2, "axis=y");
    const ok = g.blocks.every((b) => !b || reg.isValid(b));
    expect(ok).toBe(true);
  });

  it("withState builds id[state] strings", () => {
    expect(withState("oak_log", "axis=y")).toBe("oak_log[axis=y]");
    expect(withState("stone")).toBe("stone");
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

  it("adds a size note for very large builds instead of splitting commands", () => {
    const { note, commands } = gridToMcfunction(box(16, "stone")); // 16^3 = 4096
    expect(note).toMatch(/large/);
    expect(commands.length).toBeGreaterThan(0);
  });

  it("omits the note for small builds", () => {
    const { note } = gridToMcfunction(box(3, "stone"));
    expect(note).toBeUndefined();
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
  it("flags a malformed /fill in user-supplied functions", () => {
    const { violations } = sanitizeFunction([
      "setblock 0 0 0 stone",
      "/fill 0 0 0 5 5 5 not_a_real_block",
      "/fill 0 0 0 5 5 5 stone",
    ]);
    const bad = violations.filter((v) => /fill/.test(v.reason));
    expect(bad.length).toBe(1);
    expect(bad[0].reason).toMatch(/invalid block/i);
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

describe("generators", () => {
  it("box fills only the shell when hollow", () => {
    const g = box(3, "stone", true);
    expect(g.blocks.filter((b) => b === "stone").length).toBe(26);
    expect(g.blocks[13]).toBeNull(); // interior center is air
  });
  it("box fills everything when solid", () => {
    const g = box(2, "stone", false);
    expect(g.blocks.filter((b) => b === "stone").length).toBe(8);
  });
  it("pyramid shrinks each layer", () => {
    const g = pyramid(3, "oak_planks");
    const idx = (x: number, y: number, z: number) => (y * 3 + z) * 3 + x;
    expect(g.blocks[idx(1, 0, 1)]).toBe("oak_planks"); // base full (3x3)
    expect(g.blocks[idx(1, 1, 1)]).toBe("oak_planks"); // top single block (1x1)
    expect(g.blocks[idx(0, 1, 0)]).toBeNull(); // outside the top layer
  });
  it("wall is width x height x 1", () => {
    const g = wall(4, 2, "brick");
    expect(g.width).toBe(4);
    expect(g.height).toBe(2);
    expect(g.depth).toBe(1);
    expect(g.blocks.filter((b) => b === "brick").length).toBe(8);
  });
  it("generated grids convert to commands and nbt without violations", () => {
    const { violations } = gridToMcfunction(box(3, "stone"));
    expect(violations).toHaveLength(0);
    expect(Buffer.isBuffer(writeStructureNbt(pyramid(3, "stone")))).toBe(true);
  });
});
