import mc from "minecraft-data";

export interface BlockRegistry {
  version: string;
  isValid(id: string): boolean;
  normalize(id: string): string | null;
  list(): string[];
}

/**
 * Block-id registry backed by minecraft-data (authoritative). Never hand-roll
 * the id list. Falls back gracefully if a version is unknown.
 */
export function createBlockRegistry(version = "1.20.1"): BlockRegistry {
  let byName: Record<string, { name: string }> = {};
  try {
    byName = mc(version)?.blocksByName ?? {};
  } catch {
    byName = {};
  }
  const ids = Object.keys(byName);
  const bare = (id: string) => (id.startsWith("minecraft:") ? id.slice(10) : id);
  return {
    version,
    isValid: (id) => Object.prototype.hasOwnProperty.call(byName, bare(id)),
    normalize: (id) => (Object.prototype.hasOwnProperty.call(byName, bare(id)) ? bare(id) : null),
    list: () => ids,
  };
}
