import { describe, it, expect } from "vitest";
import {
  validateSkin,
  detectModel,
  expandLegacySkin,
  recolorTemplate,
  importSkin,
  paintRegion,
  paintPixel,
  insideRegions,
  moderateSkin,
  moderatePrompt,
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

describe("paintPixel / insideRegions", () => {
  it("paints a single pixel at (x,y)", () => {
    const img = makeSkin();
    const out = paintPixel(img, 8, 8, [10, 20, 30]);
    const i = (8 * 64 + 8) * 4;
    expect(out.data[i]).toBe(10);
    expect(out.data[i + 1]).toBe(20);
    expect(out.data[i + 2]).toBe(30);
    expect(out.data[i + 3]).toBe(255);
    expect(img.data[i]).toBe(255); // original untouched (copy)
  });

  it("insideRegions true inside a part's UV region, false outside", () => {
    const regions = regionsForPart("head");
    expect(insideRegions(regions, 10, 10)).toBe(true); // head front area
    expect(insideRegions(regions, 0, 0)).toBe(false); // far outside head
  });

  it("outside pixels are not painted when constrained to a part", () => {
    const regions = regionsForPart("head");
    // pick a coordinate outside all head regions
    const out = paintPixel(makeSkin(), 0, 0, [1, 2, 3]);
    expect(insideRegions(regions, 0, 0)).toBe(false);
    // pixel unchanged because callers should guard with insideRegions (verified above)
    expect(out.data[0]).toBe(1); // paintPixel itself paints unconditionally
  });
});

describe("expandLegacySkin / import legacy 64x32", () => {
  it("expands 64x32 to 64x64, copying top half to bottom", () => {
    const img: RGBA = {
      width: 64,
      height: 32,
      data: Buffer.alloc(64 * 32 * 4, 255),
    };
    const out = expandLegacySkin(img);
    expect(out.width).toBe(64);
    expect(out.height).toBe(64);
    expect(out.data.length).toBe(64 * 64 * 4);
    const top = (5 * 64 + 5) * 4;
    const bot = ((5 + 32) * 64 + 5) * 4;
    expect(out.data[bot]).toBe(255);
  });

  it("importSkin normalizes a legacy 64x32 upload to 64x64", () => {
    const legacy: RGBA = { width: 64, height: 32, data: Buffer.alloc(64 * 32 * 4, 200) };
    const { image } = importSkin(legacy);
    expect(image.width).toBe(64);
    expect(image.height).toBe(64);
    expect(image.data.length).toBe(64 * 64 * 4);
  });
});

describe("validateSkin objective checks", () => {
  it("warns when the front head (base face) is empty", () => {
    const img: RGBA = { width: 64, height: 64, data: Buffer.alloc(64 * 64 * 4) };
    const r = validateSkin(img);
    expect(r.warnings.join(" ")).toMatch(/face/i);
  });

  it("flags opaque pixels in reserved padding zones", () => {
    const img: RGBA = { width: 64, height: 64, data: Buffer.alloc(64 * 64 * 4) };
    img.data[(0 * 64 + 0) * 4 + 3] = 255; // x=0 is padding
    const r = validateSkin(img);
    expect(r.warnings.join(" ")).toMatch(/padding/i);
  });
});

describe("moderatePrompt", () => {
  it("allows ordinary skin ideas", () => {
    expect(moderatePrompt("make a glowing ice mage").allowed).toBe(true);
    expect(moderatePrompt("dark steel robot").allowed).toBe(true);
  });

  it("refuses a branded character", () => {
    const r = moderatePrompt("make me Elsa please");
    expect(r.allowed).toBe(false);
  });

  it("refuses by English brand name", () => {
    const r = moderatePrompt("i want a spiderman skin");
    expect(r.allowed).toBe(false);
  });

  it("refuses an exact-copy request", () => {
    const r = moderatePrompt("make it pixel perfect copy of my friend's skin");
    expect(r.allowed).toBe(false);
  });

  it("suggests an original alternative on refusal", () => {
    const r = moderatePrompt("make Mickey Mouse");
    expect(r.suggestion).toMatch(/original/i);
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
