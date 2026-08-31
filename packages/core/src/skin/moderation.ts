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
/**
 * Deterministic, offline prompt moderation (Layer 1 from the product spec).
 * Refuses prompts that name copyrighted/branded characters or ask for an exact
 * clone/copy of an existing work, and suggests an original alternative.
 * This is the mandatory day-one guard; it does not replace a real classifier.
 */
const BRAND_TERMS = [
  "elsa", "anna", "spiderman", "spider-man", "iron man", "ironman", "batman",
  "superman", "darth vader", "luke skywalker", "yoda", "mickey", "minnie",
  "mario", "luigi", "pikachu", "pokemon", "sonic", "naruto", "goku", "hello kitty",
  "peppa", "shrek", "hulk", "thor", "captain america", "wonder woman", "harry potter",
  "frozen", "disney", "marvel", "dc comics", "star wars", "nintendo", "sega",
  "minecraft", "mojang", "steve", "alex",
];

const CLONE_PATTERNS = [
  /точь-в-точь/i, /точно как/i, /1 в 1/i, /один в один/i, /в один в один/i,
  /как в фильме/i, /как в игре/i, /как в мультике/i, /копия/i, /идентичн/i,
  /повтор/i, /пиксель в пиксель/i,
  /exact(ly)? (like|as|copy)/i, /pixel[- ]?perfect (copy|replica)/i,
  /as in the (movie|game|show)/i, /replica of/i, /copy of/i, /looks like (the|from)/i,
  /make me (a|an) .* (from|of) /i,
];

export interface PromptModeration {
  allowed: boolean;
  reasons: string[];
  suggestion?: string;
}

export function moderatePrompt(text: string): PromptModeration {
  const reasons: string[] = [];
  const lower = (text || "").toLowerCase();

  for (const term of BRAND_TERMS) {
    if (lower.includes(term)) {
      reasons.push(`references a branded/ copyrighted character or property: "${term}"`);
    }
  }
  for (const re of CLONE_PATTERNS) {
    if (re.test(text || "")) {
      reasons.push("asks for an exact copy/clone of an existing work (not allowed)");
      break;
    }
  }

  if (reasons.length) {
    return {
      allowed: false,
      reasons,
      suggestion:
        "Make an ORIGINAL character instead — pick your own colors, theme and name. " +
        "I can build a custom skin from a description like \"a blue robot with glowing eyes\" without copying any brand.",
    };
  }
  return { allowed: true, reasons: [] };
}

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
