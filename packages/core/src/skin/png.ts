import { PNG } from "pngjs";
import { Buffer } from "node:buffer";
import * as jpeg from "jpeg-js";
import type { RGBA } from "./types.js";

export function decodePng(buffer: Buffer): RGBA {
  const p = PNG.sync.read(buffer);
  return { width: p.width, height: p.height, data: Buffer.from(p.data) };
}

export function encodePng(img: RGBA): Buffer {
  const p = new PNG({ width: img.width, height: img.height });
  // Ensure we own a fresh buffer of the right length.
  p.data = Buffer.alloc(img.width * img.height * 4);
  img.data.copy(p.data);
  return PNG.sync.write(p);
}

export function decodeImage(buffer: Buffer, isJpeg: boolean): RGBA {
  if (isJpeg) {
    const decoded = jpeg.decode(buffer, { maxMemoryUsageInMB: 256 });
    const out = Buffer.alloc(decoded.width * decoded.height * 4);
    // jpeg-js gives RGB; expand to RGBA with full alpha.
    for (let i = 0; i < decoded.width * decoded.height; i++) {
      out[i * 4 + 0] = decoded.data[i * 4 + 0];
      out[i * 4 + 1] = decoded.data[i * 4 + 1];
      out[i * 4 + 2] = decoded.data[i * 4 + 2];
      out[i * 4 + 3] = 255;
    }
    return { width: decoded.width, height: decoded.height, data: out };
  }
  return decodePng(buffer);
}
