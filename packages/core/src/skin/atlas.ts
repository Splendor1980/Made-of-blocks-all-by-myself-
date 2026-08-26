import type { RGBA } from "./types.js";

/**
 * UV region rectangles (x, y, w, h) in a 64x64 classic Minecraft skin.
 * Coordinates follow the vanilla skin layout. Slim model shares the same
 * layout except the left/right arm widths are 3px instead of 4px; that
 * difference is enforced by the importer, not the atlas.
 */
export const CLASSIC_REGIONS = {
  head: { x: 8, y: 8, w: 8, h: 8 },
  headTop: { x: 8, y: 0, w: 8, h: 8 },
  headBottom: { x: 16, y: 0, w: 8, h: 8 },
  headRight: { x: 0, y: 8, w: 8, h: 8 },
  headFront: { x: 8, y: 8, w: 8, h: 8 },
  headLeft: { x: 16, y: 8, w: 8, h: 8 },
  headBack: { x: 24, y: 8, w: 8, h: 8 },

  torso: { x: 20, y: 20, w: 8, h: 12 },
  torsoTop: { x: 20, y: 16, w: 8, h: 4 },
  torsoBottom: { x: 28, y: 16, w: 8, h: 4 },
  torsoRight: { x: 16, y: 20, w: 4, h: 12 },
  torsoFront: { x: 20, y: 20, w: 8, h: 12 },
  torsoLeft: { x: 28, y: 20, w: 4, h: 12 },
  torsoBack: { x: 32, y: 20, w: 8, h: 12 },

  rightArm: { x: 44, y: 20, w: 4, h: 12 },
  rightArmTop: { x: 44, y: 16, w: 4, h: 4 },
  rightArmBottom: { x: 48, y: 16, w: 4, h: 4 },
  rightArmOuter: { x: 40, y: 20, w: 4, h: 12 },
  rightArmFront: { x: 44, y: 20, w: 4, h: 12 },
  rightArmInner: { x: 48, y: 20, w: 4, h: 12 },
  rightArmBack: { x: 52, y: 20, w: 4, h: 12 },

  leftArm: { x: 36, y: 52, w: 4, h: 12 },
  leftArmTop: { x: 36, y: 48, w: 4, h: 4 },
  leftArmBottom: { x: 40, y: 48, w: 4, h: 4 },
  leftArmOuter: { x: 32, y: 52, w: 4, h: 12 },
  leftArmFront: { x: 36, y: 52, w: 4, h: 12 },
  leftArmInner: { x: 40, y: 52, w: 4, h: 12 },
  leftArmBack: { x: 44, y: 52, w: 4, h: 12 },

  rightLeg: { x: 4, y: 20, w: 4, h: 12 },
  rightLegTop: { x: 4, y: 16, w: 4, h: 4 },
  rightLegBottom: { x: 8, y: 16, w: 4, h: 4 },
  rightLegOuter: { x: 0, y: 20, w: 4, h: 12 },
  rightLegFront: { x: 4, y: 20, w: 4, h: 12 },
  rightLegInner: { x: 8, y: 20, w: 4, h: 12 },
  rightLegBack: { x: 12, y: 20, w: 4, h: 12 },

  leftLeg: { x: 20, y: 52, w: 4, h: 12 },
  leftLegTop: { x: 20, y: 48, w: 4, h: 4 },
  leftLegBottom: { x: 24, y: 48, w: 4, h: 4 },
  leftLegOuter: { x: 16, y: 52, w: 4, h: 12 },
  leftLegFront: { x: 20, y: 52, w: 4, h: 12 },
  leftLegInner: { x: 24, y: 52, w: 4, h: 12 },
  leftLegBack: { x: 28, y: 52, w: 4, h: 12 },
} as const;

export type RegionName = keyof typeof CLASSIC_REGIONS;

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Returns the set of skin regions that map to a given body part group. */
export function regionsForPart(part: string): Region[] {
  const out: Region[] = [];
  for (const [name, region] of Object.entries(CLASSIC_REGIONS)) {
    if (name.startsWith(part)) out.push(region);
  }
  return out;
}

/**
 * Mask of fully-transparent pixels: map of "x,y" -> true.
 * Used to avoid painting "empty" overlay areas (second skin layer).
 */
export function transparentMask(img: RGBA): Set<string> {
  const mask = new Set<string>();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const a = img.data[(y * img.width + x) * 4 + 3];
      if (a === 0) mask.add(`${x},${y}`);
    }
  }
  return mask;
}
