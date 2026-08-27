import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { CLASSIC_REGIONS, regionsForPart, encodePng } from "@mc-agent/core";

const W = 64;
const H = 64;

const KEYS = {
  head: "#101010",
  torso: "#202020",
  rightArm: "#303030",
  leftArm: "#404040",
  rightLeg: "#505050",
  leftLeg: "#606060",
};

// Each entry: which body parts share a color, and that color.
const TEMPLATES = [
  {
    id: "knight",
    displayName: "Knight",
    model: "classic",
    palette: {
      head: "#8b5a2b",
      torso: "#3b6ea5",
      arms: "#3b6ea5",
      legs: "#2b2b2b",
    },
  },
  {
    id: "mage",
    displayName: "Mage",
    model: "classic",
    palette: {
      head: "#d9b38c",
      torso: "#5b2a83",
      arms: "#5b2a83",
      legs: "#2b2b2b",
    },
  },
  {
    id: "robot",
    displayName: "Robot",
    model: "classic",
    palette: {
      head: "#9aa3ad",
      torso: "#4a5560",
      arms: "#4a5560",
      legs: "#2b2b2b",
    },
  },
];

function hexToRgb(h) {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function generateTemplate(t) {
  const data = Buffer.alloc(W * H * 4); // transparent by default
  const partColor = (name) => {
    if (name === "rightArm" || name === "leftArm") return t.palette.arms;
    if (name === "rightLeg" || name === "leftLeg") return t.palette.legs;
    if (name === "torso") return t.palette.torso;
    return t.palette.head;
  };
  const slotDefs = [];
  for (const [part, key] of Object.entries(KEYS)) {
    const defaultColor = partColor(part);
    const [r, g, b] = hexToRgb(key);
    for (const region of regionsForPart(part)) {
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
    slotDefs.push({ name: part, defaultColor, keyColor: key });
  }
  return { img: { width: W, height: H, data }, slots: slotDefs };
}

const outDir = join(process.cwd(), "assets", "templates");
await mkdir(outDir, { recursive: true });

for (const t of TEMPLATES) {
  const { img, slots } = generateTemplate(t);
  await writeFile(join(outDir, `${t.id}.png`), encodePng(img));
  await writeFile(
    join(outDir, `${t.id}.slots.json`),
    JSON.stringify({ id: t.id, displayName: t.displayName, model: t.model, slots }, null, 2),
  );
  console.log("wrote", join(outDir, `${t.id}.png`));
}
