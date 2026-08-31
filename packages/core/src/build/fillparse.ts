import { createBlockRegistry, validateBlockId, type BlockRegistry } from "./blocks.js";

export interface FillCommand {
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
  /** Base block id without state, bare (e.g. "oak_log"). */
  block: string;
  /** Optional explicit state string (e.g. "axis=y") or null. */
  state: string | null;
  mode?: "replace" | "destroy" | "keep" | "outline" | "hollow";
  replaceWith?: string | null;
}

const INT_RE = /^-?\d+(?:[~^]\d*)?$/;
const COORD = /^(-?\d+|~\d*|\^\d*)(?:\.\d+)?$/;

/**
 * Lightweight Minecraft `/fill` argument parser. Validates coordinate count and
 * numeric range of the three corner pairs, and the block id (+ optional state)
 * against the block registry. Returns a structured result with a readable error.
 * Supports an optional trailing mode (replace/destroy/keep/outline/hollow).
 */
export function parseFillCommand(
  tokens: string[],
  registry?: BlockRegistry,
): { ok: true; fill: FillCommand } | { ok: false; error: string } {
  const reg = registry ?? createBlockRegistry();

  const coords = tokens.slice(0, 6);
  if (coords.length !== 6) {
    return { ok: false, error: `/fill needs 3 coordinate pairs, got ${coords.length}` };
  }
  for (const c of coords) {
    if (!COORD.test(c.trim())) {
      return { ok: false, error: `invalid coordinate: "${c}"` };
    }
  }
  const nums = coords.map((c) => parseInt(c.replace(/^[~^]/, "") || "0", 10));

  const blockToken = tokens[6];
  if (!blockToken) return { ok: false, error: "missing block id" };
  const chk = validateBlockId(blockToken, reg);
  if (!chk.valid) return { ok: false, error: chk.error ?? "invalid block id" };

  let mode: FillCommand["mode"];
  let replaceWith: string | null = null;
  const rest = tokens.slice(7);
  if (rest.length > 0) {
    const first = rest[0].trim().toLowerCase();
    if (["replace", "destroy", "keep", "outline", "hollow"].includes(first)) {
      mode = first as FillCommand["mode"];
      if (mode === "replace" && rest[1]) {
        const rep = validateBlockId(rest[1], reg);
        if (!rep.valid) return { ok: false, error: rep.error ?? "invalid replace-with block" };
        replaceWith = rest[1];
      }
    }
  }

  return {
    ok: true,
    fill: {
      x1: nums[0], y1: nums[1], z1: nums[2],
      x2: nums[3], y2: nums[4], z2: nums[5],
      block: chk.base!,
      state: chk.state,
      mode,
      replaceWith,
    },
  };
}

/**
 * Validates a single pre-scanned function line that starts with `/fill`.
 * Returns a ScanViolation-agnostic error string, or null if the line is a
 * well-formed fill. Non-fill lines are ignored (return null).
 */
export function validateFillLine(line: string): string | null {
  const raw = line.trim().replace(/^\//, "");
  const head = raw.split(/\s+/)[0].toLowerCase().replace(/^minecraft:/, "");
  if (head !== "fill") return null;
  const tokens = raw.split(/\s+/).slice(1);
  const res = parseFillCommand(tokens);
  if (res.ok) return null;
  return res.error;
}
