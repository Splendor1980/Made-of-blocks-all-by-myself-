import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RGBA, SkinModel, SkinTemplate, Slot } from "./types.js";
import { decodePng } from "./png.js";

export interface TemplateDescriptor {
  id: string;
  displayName: string;
  model: SkinModel;
  slots: Slot[];
}

/**
 * Loads a built-in template from a directory containing `${id}.slots.json`
 * and `${id}.png`. The PNG may use key colors that recolor.ts maps to slots.
 */
export function loadTemplate(dir: string, id: string): SkinTemplate {
  const desc = JSON.parse(
    readFileSync(join(dir, `${id}.slots.json`), "utf8"),
  ) as TemplateDescriptor;
  const image = decodePng(readFileSync(join(dir, `${id}.png`)));
  return { ...desc, image };
}

/**
 * Built-in template ids shipped with the app. The asset files themselves
 * are produced by the art pipeline (see docs/agent-spec §8); this list is the
 * registry the UI iterates over.
 */
export const builtinTemplateIds: string[] = ["knight", "mage", "robot"];

/**
 * Creates a blank template with uniform key colors per slot. Used for tests
 * and for the "start from scratch" path where the user picks colors only.
 */
export function createBlankTemplate(
  id: string,
  model: SkinModel,
  slots: Omit<Slot, "keyColor">[],
): SkinTemplate {
  const size = 64;
  const data = Buffer.alloc(size * size * 4);
  // Assign a distinct gray key per slot so recolor can target them.
  const image: RGBA = { width: size, height: size, data };
  slots.forEach((s, idx) => {
    const v = 30 + idx * 20;
    const key = `#${v.toString(16).padStart(2, "0").repeat(3)}`;
    (s as Slot).keyColor = key;
  });
  return {
    id,
    displayName: id,
    model,
    slots: slots as Slot[],
    image,
  };
}
