import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { CLASSIC_REGIONS, regionsForPart, encodePng } from "@mc-agent/core";

const W = 64;
const H = 64;

function hexToRgb(h) {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

const slots = [
  { name: "head", defaultColor: "#8b5a2b", key: "#101010" },
  { name: "torso", defaultColor: "#3b6ea5", key: "#202020" },
  { name: "rightArm", defaultColor: "#3b6ea5", key: "#303030" },
  { name: "leftArm", defaultColor: "#3b6ea5", key: "#404040" },
  { name: "rightLeg", defaultColor: "#2b2b2b", key: "#505050" },
  { name: "leftLeg", defaultColor: "#2b2b2b", key: "#606060" },
];

const data = Buffer.alloc(W * H * 4); // all zero -> transparent
for (const s of slots) {
  const [r, g, b] = hexToRgb(s.key);
  for (const region of regionsForPart(s.name)) {
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        const i = (y * W + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
  }
}

const img = { width: W, height: H, data };
const outDir = join(process.cwd(), "assets", "templates");
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "knight.png"), encodePng(img));
await writeFile(
  join(outDir, "knight.slots.json"),
  JSON.stringify(
    {
      id: "knight",
      displayName: "Knight",
      model: "classic",
      slots: slots.map(({ name, defaultColor, key }) => ({ name, defaultColor, keyColor: key })),
    },
    null,
    2,
  ),
);
console.log("wrote", join(outDir, "knight.png"));
