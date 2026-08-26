import type { RGBA } from "./types.js";

export interface ModerationResult {
  pass: boolean;
  reasons: string[];
  /** 0..1 crude score; higher means more likely problematic. */
  score: number;
}

/**
 * Deterministic, best-effort content safety net. This is NOT a real
 * classifier: it flags degenerate outputs (blank/uniform images, which
 * indicate generation failure) and relies on the agent policy for actual
 * content decisions. Replace with a proper model/API before production.
 */
export function moderateSkin(img: RGBA): ModerationResult {
  const reasons: string[] = [];
  if (img.width !== 64 || img.height !== 64) {
    reasons.push("non-standard dimensions");
  }

  let opaque = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] !== 0) opaque++;
  }

  if (opaque === 0) {
    reasons.push("fully transparent (empty output)");
  }

  const score = reasons.length ? 0.5 : 0;
  return { pass: reasons.length === 0, reasons, score };
}
