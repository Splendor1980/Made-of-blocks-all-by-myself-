import { describe, it, expect } from "vitest";
import { renderPreview, box } from "../src/build/index.js";

describe("renderPreview (isometric)", () => {
  it("produces a non-empty image for a solid box", () => {
    const g = box(4, "minecraft:oak_planks", false);
    const img = renderPreview(g, { tile: 8 });
    expect(img.width).toBeGreaterThan(0);
    expect(img.height).toBeGreaterThan(0);
    let painted = 0;
    for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 0) painted++;
    expect(painted).toBeGreaterThan(0);
  });

  it("respects transparent background (some pixels unpainted)", () => {
    const g = box(3, "minecraft:stone", false);
    const img = renderPreview(g, { tile: 6 });
    let alpha0 = 0;
    for (let i = 3; i < img.data.length; i += 4) if (img.data[i] === 0) alpha0++;
    expect(alpha0).toBeGreaterThan(0);
  });
});
