import { describe, it, expect } from "vitest";
import {
  sphere, dome, bridge, stairs,
  column, ramp, arch, ring,
  generateGrid,
} from "../src/build/index.js";

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
    for (const t of ["house", "box", "tower", "pyramid", "fence", "wall", "sphere", "dome", "bridge", "stairs", "column", "ramp", "arch", "ring"]) {
      expect(count(generateGrid(t, "minecraft:stone", 5))).toBeGreaterThan(0);
    }
  });

  it("column is a 1x1xheight pillar", () => {
    const c = column(5, "minecraft:stone");
    expect(c.width).toBe(1);
    expect(c.depth).toBe(1);
    expect(c.height).toBe(5);
    expect(count(c)).toBe(5);
  });

  it("ramp only fills x <= y", () => {
    const r = ramp(4, 4, "minecraft:stone");
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++)
        expect(r.blocks[y * 4 + x] !== null).toBe(x <= y);
  });

  it("arch leaves a hollow opening", () => {
    const a = arch(5, 5, "minecraft:stone");
    const idx = (x: number, y: number) => y * 5 + x;
    // bottom center should be air (the doorway)
    expect(a.blocks[idx(2, 0)]).toBeNull();
    // top lintel solid
    expect(a.blocks[idx(2, 4)]).toBe("minecraft:stone");
  });

  it("ring is an annulus with a hollow center and a rim", () => {
    const r = ring(6, 1, "minecraft:stone");
    const c = Math.floor((6 - 1) / 2);
    const center = (0 * 6 + c) * 6 + c;
    expect(r.blocks[center]).toBeNull();
    expect(count(r)).toBeGreaterThan(0);
  });
});
