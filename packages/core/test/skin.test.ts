import { describe, it, expect } from "vitest";
import {
  validateSkin,
  detectModel,
  recolorTemplate,
  importSkin,
  paintRegion,
  moderateSkin,
  createBlankTemplate,
  regionsForPart,
  type RGBA,
  type SkinTemplate,
} from "../src/skin/index.js";

function makeSkin(opts?: { slim?: boolean }): RGBA {
  const w = 64;
  const h = 64;
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4 + 0] = 255;
    data[i * 4 + 1] = 255;
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = 255;
  }
  const img: RGBA = { width: w, height: h, data };
  if (!opts?.slim) {
    // Classic: arms are 4px wide -> ensure the 4th column is opaque.
    for (let y = 20; y < 32; y++) data[(y * w + 47) * 4 + 3] = 255;
    for (let y = 52; y < 64; y++) data[(y * w + 39) * 4 + 3] = 255;
  } else {
    // Slim: the 4th arm column must be transparent.
    for (let y = 20; y < 32; y++) data[(y * w + 47) * 4 + 3] = 0;
    for (let y = 52; y < 64; y++) data[(y * w + 39) * 4 + 3] = 0;
  }
  return img;
}

describe("validateSkin", () => {
  it("accepts a 64x64 classic skin", () => {
    const r = validateSkin(makeSkin());
    expect(r.valid).toBe(true);
    expect(r.model).toBe("classic");
  });

  it("detects slim model", () => {
    const r = validateSkin(makeSkin({ slim: true }));
    expect(r.model).toBe("slim");
  });

  it("rejects wrong dimensions", () => {
    const bad: RGBA = {
      width: 32,
      height: 32,
      data: Buffer.alloc(32 * 32 * 4),
    };
    const r = validateSkin(bad);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("detectModel matches validation", () => {
    expect(detectModel(makeSkin())).toBe("classic");
    expect(detectModel(makeSkin({ slim: true }))).toBe("slim");
  });
});

describe("importSkin", () => {
  it("clones and returns the requested model without throwing", () => {
    const { image, model, result } = importSkin(makeSkin(), { model: "classic" });
    expect(model).toBe("classic");
    expect(result.valid).toBe(true);
    expect(image.data.length).toBe(64 * 64 * 4);
  });

  it("throws in strict mode on invalid input", () => {
    const bad: RGBA = { width: 32, height: 32, data: Buffer.alloc(32 * 32 * 4) };
    expect(() => importSkin(bad, { strict: true })).toThrow();
  });
});

describe("recolorTemplate", () => {
  it("produces a valid 64x64 skin from a blank template", () => {
    const tpl: SkinTemplate = createBlankTemplate("test", "classic", [
      { name: "body", defaultColor: "#ff0000" },
    ]);
    const out = recolorTemplate(tpl, { body: "#00ff00" });
    expect(out.width).toBe(64);
    expect(out.height).toBe(64);
    expect(validateSkin(out).valid).toBe(true);
  });
});

describe("paintRegion", () => {
  it("paints a body part region and keeps dimensions", () => {
    const regions = regionsForPart("head");
    expect(regions.length).toBeGreaterThan(0);
    const out = paintRegion(makeSkin(), regions[0], [255, 0, 0]);
    expect(out.width).toBe(64);
  });
});

describe("moderateSkin", () => {
  it("passes a normal skin", () => {
    expect(moderateSkin(makeSkin()).pass).toBe(true);
  });

  it("flags a fully transparent image", () => {
    const blank: RGBA = { width: 64, height: 64, data: Buffer.alloc(64 * 64 * 4) };
    const r = moderateSkin(blank);
    expect(r.pass).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/empty/);
  });
});
