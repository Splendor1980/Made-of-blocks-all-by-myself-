import { writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  loadTemplate,
  recolorTemplate,
  recolorPart,
  validateSkin,
  decodePng,
  encodePng,
} from "../packages/core/dist/skin/index.js";
import * as metrics from "../packages/app/metricsStore.js";
import { runGateSwitch } from "./gate-switch.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "..", "assets", "templates");

async function listTemplateIds() {
  const files = await readdir(assets);
  return files
    .filter((f) => f.endsWith(".slots.json"))
    .map((f) => f.replace(/\.slots\.json$/, ""))
    .sort();
}

function parseArgs(argv) {
  const out = { cmd: argv[2] || "list", id: argv[3], color: argv[4], part: null, write: false, out: "out/skin-cli.png" };
  for (let i = 5; i < argv.length; i++) {
    if (argv[i] === "--write") out.write = true;
    else if (argv[i] === "--out") out.out = argv[++i];
    else if (!argv[i].startsWith("--")) out.part = argv[i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  await metrics.recordLaunch();
  try { await runGateSwitch(); } catch { /* non-fatal */ }

  if (args.cmd === "list") {
    const ids = await listTemplateIds();
    console.log("templates: " + ids.join(", "));
    return;
  }

  if (args.cmd !== "run") {
    console.error("usage: skin-cli.mjs [list | run <id> <hexcolor> [--write] [--out file]]");
    process.exit(2);
  }

  const tpl = await loadTemplate(assets, args.id);
  const color = "#" + args.color.replace("#", "");
  const part = args.part || null;

  let outTpl;
  if (part) {
    outTpl = recolorPart(tpl, part, color);
  } else {
    const overrides = {};
    for (const s of tpl.slots) overrides[s.name] = color;
    outTpl = recolorTemplate(tpl, overrides);
  }

  const v = validateSkin(outTpl);
  if (!v.valid) {
    console.error("VALIDATION FAILED: " + v.errors.join("; "));
    process.exit(1);
  }
  console.log(`template=${args.id} part=${part ?? "all"} model=${v.model} valid=true`);

  if (args.write) {
    const png = encodePng(outTpl);
    await writeFile(args.out, png);
    await metrics.recordPng();
    console.log("wrote " + args.out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
