import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import {
  createBlankTemplate,
  recolorTemplate,
  encodePng,
  validateSkin,
} from "@mc-agent/core";
import { startSidecar, stopSidecar, sidecarState } from "./sidecar.js";

const PARTS = ["head", "torso", "rightArm", "leftArm", "rightLeg", "leftLeg"];

let overrides = {};
let template = createBlankTemplate("demo", "classic", [
  { name: "head", defaultColor: "#8b5a2b" },
  { name: "torso", defaultColor: "#3b6ea5" },
  { name: "rightArm", defaultColor: "#3b6ea5" },
  { name: "leftArm", defaultColor: "#3b6ea5" },
  { name: "rightLeg", defaultColor: "#2b2b2b" },
  { name: "leftLeg", defaultColor: "#2b2b2b" },
]);

function render() {
  const img = recolorTemplate(template, overrides);
  const v = validateSkin(img);
  if (!v.valid) throw new Error(v.errors.join("; "));
  const png = encodePng(img);
  return `data:image/png;base64,${png.toString("base64")}`;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 640,
    webPreferences: {
      preload: join(import.meta.dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(join(import.meta.dirname, "index.html"));
}

ipcMain.handle("getParts", () => PARTS);
ipcMain.handle("recolor", (_e, { part, color }) => {
  overrides[part] = color;
  return render();
});
ipcMain.handle("reset", () => {
  overrides = {};
  return render();
});
ipcMain.handle("export", async (_e, { dataUrl }) => {
  const out = await dialog.showSaveDialog({
    defaultPath: "skin.png",
    filters: [{ name: "PNG", extensions: ["png"] }],
  });
  if (out.canceled || !out.filePath) return { ok: false };
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  await writeFile(out.filePath, Buffer.from(b64, "base64"));
  return { ok: true, path: out.filePath };
});

ipcMain.handle("startSidecar", () => {
  try {
    return startSidecar();
  } catch {
    return { state: "error" };
  }
});
ipcMain.handle("sidecarStatus", () => sidecarState());

app.whenReady().then(() => {
  try {
    startSidecar();
  } catch {
    // OpenCode sidecar is optional for the stub; continue without it.
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopSidecar();
  if (process.platform !== "darwin") app.quit();
});
