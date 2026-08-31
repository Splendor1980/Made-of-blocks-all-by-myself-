import { describe, it, expect } from "vitest";
import { parseFillCommand, validateFillLine, sanitizeFunction } from "../src/build/index.js";

describe("parseFillCommand", () => {
  it("parses a valid 6-coordinate fill with block", () => {
    const res = parseFillCommand(["0", "10", "0", "4", "12", "5", "oak_log"]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.fill.x1).toBe(0);
    expect(res.fill.x2).toBe(4);
    expect(res.fill.block).toBe("oak_log");
    expect(res.fill.state).toBeNull();
  });

  it("parses block state and replace mode", () => {
    const res = parseFillCommand(["0", "0", "0", "3", "3", "3", "oak_log[axis=y]", "replace", "stone"]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.fill.state).toBe("axis=y");
    expect(res.fill.mode).toBe("replace");
    expect(res.fill.replaceWith).toBe("stone");
  });

  it("rejects too few coordinates", () => {
    const res = parseFillCommand(["0", "0", "4", "stone"]);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/coordinate/);
  });

  it("rejects an invalid block state", () => {
    const res = parseFillCommand(["0", "0", "0", "2", "2", "2", "oak_log[axis=warp]"]);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/invalid block id or state/i);
  });

  it("rejects a non-numeric coordinate", () => {
    const res = parseFillCommand(["0", "0", "banana", "2", "2", "2", "stone"]);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/invalid coordinate/i);
  });

  it("validateFillLine ignores non-fill commands", () => {
    expect(validateFillLine("setblock 0 0 0 stone")).toBeNull();
    expect(validateFillLine("say hi")).toBeNull();
  });

  it("validateFillLine flags a bad fill and passes a good one", () => {
    expect(validateFillLine("/fill 0 0 0 1 1 1 not_a_block")).toMatch(/invalid block/i);
    expect(validateFillLine("/fill 0 0 0 1 1 1 stone")).toBeNull();
  });

  it("sanitizeFunction reports a malformed /fill as a violation", () => {
    const { violations } = sanitizeFunction([
      "/fill 0 0 0 5 5 5 not_a_real_block",
      "/fill 0 0 0 5 5 5 stone",
    ]);
    const bad = violations.filter((v) => v.reason.startsWith("fill:"));
    expect(bad.length).toBe(1);
    expect(bad[0].reason).toMatch(/invalid block/i);
  });
});
