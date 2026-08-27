import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { join } from "node:path";
import { writeFile, readdir, readFile, mkdir } from "node:fs/promises";
import {
  loadTemplate,
  recolorTemplate,
  recolorPart,
  validateSkin,
  decodePng,
  encodePng,
  importSkin,
  paintPixel,
  insideRegions,
  regionsForPart,
  createDatapack,
  writeStructureNbt,
  box,
  pyramid,
  wall,
} from "@mc-agent/core";
import { startSidecar, stopSidecar, sidecarState } from "./sidecar.js";
import * as metrics from "./metrics.js";
import { runGateSwitch } from "../../scripts/gate-switch.mjs";

const TEMPLATES_DIR = join(import.meta.dirname, "..", "..", "assets", "templates");
const REPO_ROOT = join(import.meta.dirname, "..", "..");

function generateGrid(type, block, size) {
  switch (type) {
    case "house":
    case "box":
      return box(size, block, type !== "box");
    case "tower":
    case "pyramid":
      return pyramid(size, block);
    case "fence":
    case "wall":
      return wall(size, Math.max(2, Math.floor(size / 2)), block);
    default:
      throw new Error(`unknown type: ${type} (house|box|tower|pyramid|fence|wall)`);
  }
}

async function templateList() {
  const files = await readdir(TEMPLATES_DIR).catch(() => []);
  const ids = files
    .filter((f) => f.endsWith(".slots.json"))
    .map((f) => f.replace(/\.slots\.json$/, ""));
  const out = [];
  for (const id of ids) {
    try {
      const d = JSON.parse(await readFile(join(TEMPLATES_DIR, `${id}.slots.json`), "utf8"));
      out.push({ id, displayName: d.displayName ?? id });
    } catch {
      out.push({ id, displayName: id });
    }
  }
  return out;
}

function renderTemplate(id, overrides, part, partColor) {
  const tpl = loadTemplate(TEMPLATES_DIR, id);
  const img = part && partColor ? recolorPart(tpl, part, partColor, overrides) : recolorTemplate(tpl, overrides);
  const v = validateSkin(img);
  if (!v.valid) throw new Error(v.errors.join("; "));
  const png = encodePng(img);
  return `data:image/png;base64,${png.toString("base64")}`;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 680,
    webPreferences: {
      preload: join(import.meta.dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(join(import.meta.dirname, "index.html"));
  return win;
}

ipcMain.handle("listTemplates", () => templateList());
ipcMain.handle("recolorTemplate", (_e, { templateId, colors, part, partColor }) =>
  renderTemplate(templateId, colors, part, partColor),
);
ipcMain.handle("importSkin", async (_e, { dataUrl }) => {
  const b64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
  const buf = Buffer.from(b64, "base64");
  const img = decodePng(buf);
  const { model, result } = importSkin(img, { model: "auto" });
  if (!result.valid) throw new Error(result.errors.join("; "));
  return { model, dataUrl: `data:image/png;base64,${encodePng(img).toString("base64")}` };
});
ipcMain.handle("getMetrics", () => metrics.get());
ipcMain.handle("partRegions", (_e, { part }) => regionsForPart(part));
ipcMain.handle("paintSkin", async (_e, { dataUrl, part, x, y, color, size }) => {
  const b64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
  const img = decodePng(Buffer.from(b64, "base64"));
  const regions = regionsForPart(part);
  const parsed = parseInt(color.replace("#", ""), 16);
  const rgb = [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
  const s = size && size > 0 ? size : 1;
  let out = img;
  for (let dy = 0; dy < s; dy++) {
    for (let dx = 0; dx < s; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (insideRegions(regions, px, py)) out = paintPixel(out, px, py, rgb);
    }
  }
  return `data:image/png;base64,${encodePng(out).toString("base64")}`;
});
ipcMain.handle("export", async (_e, { dataUrl }) => {
  const out = await dialog.showSaveDialog({
    defaultPath: "skin.png",
    filters: [{ name: "PNG", extensions: ["png"] }],
  });
  if (out.canceled || !out.filePath) return { ok: false };
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  await writeFile(out.filePath, Buffer.from(b64, "base64"));
  await metrics.recordPng();
  return { ok: true, path: out.filePath };
});
ipcMain.handle("startSidecar", () => {
  try { return startSidecar(); } catch { return { state: "error" }; }
});
ipcMain.handle("sidecarStatus", () => sidecarState());

ipcMain.handle("getGateStatus", async () => {
  const g = metrics.gateStatus(await metrics.load());
  return { launches: g.launches, png: g.png, returns: g.returns, passed: g.passed, thresholds: g.thresholds };
});

ipcMain.handle(
  "generateWorld",
  async (_e, { type = "house", block = "minecraft:oak_planks", size = 5, out = "out/world" }) => {
    const grid = generateGrid(type, block, size);
    const structureId = `${type}_${size}`;
    const dp = createDatapack({
      name: "generated_pack",
      namespace: "genmod",
      description: `mc-agent ${type} (${block})`,
    });
    dp.addStructure(structureId, writeStructureNbt(grid));
    dp.addFunction({
      id: `build_${type}`,
      commands: [`structure load genmod:${structureId} ~ ~ ~`, `say ${type} placed`],
    });
    const v = dp.validate();
    if (!v.valid) throw new Error(v.errors.join("; "));
    const outDir = join(REPO_ROOT, out);
    await mkdir(outDir, { recursive: true });
    const files = await dp.build(outDir);
    return { files, command: `/function genmod:build_${type}`, structureId, outDir };
  },
);

ipcMain.handle("openPath", async (_e, { path }) => {
  try {
    await shell.openPath(path);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err && err.message) || String(err) };
  }
});

app.whenReady().then(async () => {
  await metrics.recordLaunch();
  try { startSidecar(); } catch { /* optional */ }
  // Gate 0: if metrics now pass, auto-enable the crafter agent before the UI opens.
  try { await runGateSwitch(); } catch (e) { console.warn("gate-switch failed:", e); }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopSidecar();
  if (process.platform !== "darwin") app.quit();
});
