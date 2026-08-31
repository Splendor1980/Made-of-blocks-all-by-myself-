import mc from "minecraft-data";

export interface BlockRegistry {
  version: string;
  isValid(id: string): boolean;
  normalize(id: string): string | null;
  list(): string[];
}

interface MCBlock {
  name: string;
  states?: { name: string; values?: string[] }[];
}

/**
 * Parses "base_id[state]" into { base, state } or null. State part is optional.
 * Preserves the raw state string verbatim (for canonical output).
 */
export function splitBlockId(
  id: string,
): { base: string; state: string | null } | null {
  const s = String(id ?? "");
  const open = s.indexOf("[");
  if (open === -1) return { base: s, state: null };
  if (!s.endsWith("]")) return null;
  return { base: s.slice(0, open), state: s.slice(open + 1, -1) };
}

/**
 * Block-id registry backed by minecraft-data (authoritative). Validates BOTH the
 * base id AND any `[state]` (key=value) against the block's declared states, so
 * `minecraft:oak_log[axis=y]` passes but `oak_log[axis=warp]` or `stone[bogus=1]`
 * fail. Never hand-roll the id list. Falls back gracefully if a version is
 * unknown.
 */
export interface BlockValidation {
  valid: boolean;
  base: string | null;
  state: string | null;
  error?: string;
}

/** Human-readable validation of a single block id (base + optional state). */
export function validateBlockId(
  id: string,
  registry?: BlockRegistry,
): BlockValidation {
  const reg = registry ?? createBlockRegistry();
  const parsed = splitBlockId(id);
  if (!parsed) return { valid: false, base: null, state: null, error: `malformed block id: ${id}` };
  const baseBare = parsed.base.startsWith("minecraft:") ? parsed.base.slice(10) : parsed.base;
  if (!reg.isValid(id)) {
    return {
      valid: false,
      base: baseBare,
      state: parsed.state,
      error: `invalid block id or state: ${id}`,
    };
  }
  return { valid: true, base: baseBare, state: parsed.state };
}

export function createBlockRegistry(version = "1.20.1"): BlockRegistry {
  let byName: Record<string, MCBlock> = {};
  try {
    byName = mc(version)?.blocksByName ?? {};
  } catch {
    byName = {};
  }
  const bare = (id: string) => (id.startsWith("minecraft:") ? id.slice(10) : id);
  const stateDefs = (base: string) => byName[bare(base)]?.states ?? [];

  /** Validates the state portion against the block's declared states. */
  function isValidState(base: string, state: string | null): boolean {
    if (!state) return true;
    const defs = stateDefs(base);
    const allowed = new Map<string, Set<string>>();
    for (const d of defs) allowed.set(d.name, new Set(d.values ?? []));
    for (const pair of state.split(",")) {
      const eq = pair.indexOf("=");
      if (eq <= 0) return false;
      const key = pair.slice(0, eq).trim();
      const val = pair.slice(eq + 1).trim();
      const vals = allowed.get(key);
      if (!vals) return false;
      if (!vals.has(val)) return false;
    }
    return true;
  }

  return {
    version,
    isValid: (id) => {
      const parsed = splitBlockId(id);
      if (!parsed) return false;
      if (!byName[bare(parsed.base)]) return false;
      return isValidState(parsed.base, parsed.state);
    },
    normalize: (id) => {
      const parsed = splitBlockId(id);
      if (!parsed) return null;
      if (!byName[bare(parsed.base)]) return null;
      if (!isValidState(parsed.base, parsed.state)) return null;
      // Canonical: bare id, re-add explicit state if the caller supplied one.
      const base = bare(parsed.base);
      return parsed.state ? `${base}[${parsed.state}]` : base;
    },
    list: () => Object.keys(byName),
  };
}
