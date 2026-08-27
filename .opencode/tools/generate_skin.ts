import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import {
  loadTemplate,
  recolorTemplate,
  encodePng,
  validateSkin,
  builtinTemplateIds,
  type SkinTemplate,
} from "@mc-agent/core";

const COLOR_WORDS: [string, string][] = [
  ["fire", "#e0531a"],
  ["lava", "#d63a14"],
  ["flame", "#e0531a"],
  ["ice", "#7fdbff"],
  ["frost", "#aee3ff"],
  ["snow", "#eef6ff"],
  ["ocean", "#1f6fdb"],
  ["water", "#2b7fe0"],
  ["sea", "#1f6fdb"],
  ["forest", "#2e8b3d"],
  ["nature", "#3aa64a"],
  ["leaf", "#3aa64a"],
  ["grass", "#4caf50"],
  ["slime", "#5cd63a"],
  ["creeper", "#3aa64a"],
  ["dragon", "#1f5e3a"],
  ["demon", "#b81e1e"],
  ["blood", "#b81e1e"],
  ["rose", "#d63a6a"],
  ["pink", "#e85aa0"],
  ["royal", "#7a3fd6"],
  ["purple", "#8a4fe0"],
  ["amethyst", "#9b59ff"],
  ["gold", "#e6c63c"],
  ["golden", "#e6c63c"],
  ["sun", "#f2c12e"],
  ["sand", "#d9bd72"],
  ["desert", "#d9bd72"],
  ["steel", "#8a93a0"],
  ["iron", "#9aa3ad"],
  ["metal", "#9aa3ad"],
  ["silver", "#cfd6dd"],
  ["ghost", "#e9eef2"],
  ["bone", "#e9e3d2"],
  ["shadow", "#2b2b33"],
  ["night", "#2b2b55"],
  ["red", "#d62f2f"],
  ["green", "#2e9e3f"],
  ["blue", "#2b6fe0"],
  ["yellow", "#e6c63c"],
  ["orange", "#e07b1a"],
  ["cyan", "#22c3d6"],
  ["teal", "#1fae9b"],
  ["magenta", "#d63ad6"],
  ["violet", "#8a4fe0"],
  ["brown", "#7a4a23"],
  ["black", "#222222"],
  ["white", "#eef1f4"],
  ["gray", "#8a8f96"],
  ["grey", "#8a8f96"],
];

const TEMPLATE_WORDS: [string, string][] = [
  ["robot", "robot"],
  ["android", "robot"],
  ["machine", "robot"],
  ["mage", "mage"],
  ["wizard", "mage"],
  ["sorcerer", "mage"],
  ["witch", "mage"],
  ["knight", "knight"],
  ["warrior", "knight"],
  ["paladin", "knight"],
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function adjust(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * f, g * f, b * f);
}

function parsePrompt(prompt: string): { color: string; template: string } {
  const p = prompt.toLowerCase();
  let color: string | null = null;
  for (const [word, hex] of COLOR_WORDS) if (p.includes(word)) { color = hex; break; }
  if (!color) {
    const h = hashStr(prompt);
    const hue = h % 360;
    // simple HSL->hex (s=60%, l=52%)
    color = hslToHex(hue, 60, 52);
  }
  let template: string | null = null;
  for (const [word, id] of TEMPLATE_WORDS) if (p.includes(word)) { template = id; break; }
  if (!template) {
    const ids = builtinTemplateIds;
    template = ids[hashStr(prompt) % ids.length];
  }
  let f = 1;
  if (/(dark|shadow|night|black)/.test(p)) f *= 0.62;
  if (/(bright|light|glow|neon|pale)/.test(p)) f *= 1.22;
  return { color: adjust(color, f), template };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(255 * f(0), 255 * f(8), 255 * f(4));
}

const SLOT_FACTORS = [1.0, 0.92, 0.85, 0.85, 0.7, 0.7];

export default tool({
  description:
    "Generate a Minecraft skin from a TEXT description (e.g. 'a glowing ice mage' or 'dark steel robot'). " +
    "Deterministic keyword->template+color mapping; no AI pixels. Writes a 64x64 PNG. Works offline.",
  args: {
    prompt: tool.schema.string().describe("Free-text description of the skin to create."),
    templateId: tool.schema.string().optional().describe("Force a base template: knight | mage | robot."),
    output: tool.schema.string().describe("Output PNG path, relative to project root."),
  },
  async execute({ prompt, templateId, output }, ctx) {
    const { color, template } = parsePrompt(prompt);
    const dir = join(ctx.worktree, "assets", "templates");
    const tpl: SkinTemplate = loadTemplate(dir, templateId ?? template);
    const overrides: Record<string, string> = {};
    tpl.slots.forEach((s, i) => {
      overrides[s.name] = adjust(color, SLOT_FACTORS[i % SLOT_FACTORS.length]);
    });
    const img = recolorTemplate(tpl, overrides);
    const v = validateSkin(img);
    if (!v.valid) return `Generated skin was invalid: ${v.errors.join("; ")}`;
    const abs = join(ctx.worktree, output);
    await mkdir(join(abs, ".."), { recursive: true });
    await writeFile(abs, encodePng(img));
    return `Generated '${prompt}' -> ${output} (template=${tpl.id}, color=${color}, model=${v.model})`;
  },
});
