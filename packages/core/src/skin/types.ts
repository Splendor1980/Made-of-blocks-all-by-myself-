export interface RGBA {
  width: number;
  height: number;
  /** RGBA, length = width*height*4, row-major. */
  data: Buffer;
}

export type SkinModel = "classic" | "slim" | "unknown";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  model: SkinModel;
}

export interface Slot {
  /** Human-readable slot name, e.g. "cloak". */
  name: string;
  /** Key color in the template PNG that this slot replaces (hex #rrggbb). */
  keyColor: string;
  /** Default color (hex #rrggbb). */
  defaultColor: string;
}

export interface SkinTemplate {
  id: string;
  displayName: string;
  model: SkinModel;
  slots: Slot[];
  image: RGBA;
}
