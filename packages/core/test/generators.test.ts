import { describe, it, expect } from "vitest";
import { sphere, dome, bridge, stairs, generateGrid } from "../src/build/index.js";

function count(g: { blocks: (string | null)[] }) {
  return g.blocks.filter(Boolean).length;
}

describe("build generators (extended)", () => {
  it("sphere is non-empty and bounded", () => {
    const s = sphere(7, "minecraft:stone");
    expect(s.width).toBe(7);
    expect(count(s)).toBeGreaterThan(0);
    expect(count(s)).toBeLessThan(7 * 7 * 7);
  });

  it("dome only fills the upper half", () => {
    const d = dome(9, "minecraft:stone");
    const c = (9 - 1) / 2;
    for (let y = 0; y < Math.floor(c); y++)
      for (let z = 0; z < d.depth; z++)
        for (let x = 0; x < d.width; x++)
          expect(d.blocks[(y * d.depth + z) * d.width + x]).toBeNull();
    expect(count(d)).toBeGreaterThan(0);
  });

  it("bridge is a flat slab width x length x 1", () => {
    const b = bridge(5, 3, "minecraft:oak_planks");
    expect(b.height).toBe(1);
    expect(b.width).toBe(5);
    expect(b.depth).toBe(3);
    expect(count(b)).toBe(15);
  });

  it("stairs ascend along Z", () => {
    const st = stairs(2, 4, "minecraft:stone");
    expect(st.height).toBe(4);
    expect(st.depth).toBe(4);
    for (let y = 0; y < 4; y++)
      for (let z = 0; z < 4; z++) {
        const filled = st.blocks[(y * 4 + z) * 2 + 0] !== null;
        expect(filled).toBe(z <= y);
      }
  });

  it("generateGrid maps all known types", () => {
    for (const t of ["house", "box", "tower", "pyramid", "fence", "wall", "sphere", "dome", "bridge", "stairs"]) {
      expect(count(generateGrid(t, "minecraft:stone", 5))).toBeGreaterThan(0);
    }
  });
});
