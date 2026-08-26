import { mkdir, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadTemplate, recolorTemplate, recolorPart, validateSkin, encodePng } from "@mc-agent/core";

const TEMPLATES = join(process.cwd(), "assets", "templates");
const files = await readdir(TEMPLATES);
const ids = files.filter((f) => f.endsWith(".slots.json")).map((f) => f.replace(/\.slots\.json$/, ""));
console.log("available templates:", ids);

if (ids.length === 0) {
  console.log("No templates found in assets/templates. Add a <id>.slots.json + <id>.png.");
  process.exit(0);
}

const tpl = loadTemplate(TEMPLATES, ids[0]);
const img = recolorPart(tpl, "head", "#ff0000");
const v = validateSkin(img);
await mkdir("out", { recursive: true });
await writeFile(join("out", "skin-cli.png"), encodePng(img));
console.log(`wrote out/skin-cli.png via template '${ids[0]}' (model=${v.model}, valid=${v.valid})`);
