import type { RGBA, SkinModel } from "./types.js";
import { detectModel, validateSkin } from "./validate.js";

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

  const image: RGBA = {
    width: img.width,
    height: img.height,
    data: Buffer.from(img.data),
  };
  return { image, model, result };
}

export { detectModel };
