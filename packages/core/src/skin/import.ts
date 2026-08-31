import type { RGBA, SkinModel } from "./types.js";
import { detectModel, expandLegacySkin, validateSkin } from "./validate.js";

/**
 * Validates an uploaded skin PNG and coerces it to the requested model.
 * Returns the (cloned) RGBA plus validation result. If model is "auto" the
 * detected model is used.
 */
export function importSkin(
  img: RGBA,
  opts?: { model?: SkinModel | "auto"; strict?: boolean },
): { image: RGBA; model: SkinModel; result: ReturnType<typeof validateSkin> } {
  const result = validateSkin(img);
  const model: SkinModel =
    opts?.model && opts.model !== "auto"
      ? opts.model
      : (result.model as SkinModel);

  if (opts?.strict && !result.valid) {
    throw new Error(`Skin import rejected: ${result.errors.join("; ")}`);
  }

  // Normalize legacy 64x32 uploads to the modern 64x64 layout.
  const normalized = img.width === 64 && img.height === 32 ? expandLegacySkin(img) : img;
  const image: RGBA = {
    width: normalized.width,
    height: normalized.height,
    data: Buffer.from(normalized.data),
  };
  return { image, model, result };
}

export { detectModel };
