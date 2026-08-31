#!/usr/bin/env node
// Builds a self-contained Windows "portable" distribution of mc-agent that an
// end user can download and run WITHOUT Node.js (Electron is bundled).
//
// Usage (on a machine that already has the repo installed):
//   node scripts/package-portable.mjs
//
// Output:
//   dist/mc-agent-win/            <- self-contained folder
//   dist/mc-agent-win.zip         <- the shareable artifact (host it on
//                                      itch.io / a cloud drive / GitHub Releases)
//
// It mirrors the dev layout exactly so the app's relative ../../ paths keep
// resolving (assets/templates, scripts/gate-switch.mjs, @mc-agent/core dist).
// The user starts it with start.cmd, which runs the bundled Electron directly
// (no Node needed). launch-skin-studio.bat still works for dev machines.

import { existsSync, cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const OUT = join(root, "dist", "mc-agent-win");
const ZIP = join(root, "dist", "mc-agent-win.zip");
const CORE = join(root, "packages", "core");
const APP = join(root, "packages", "app");

function step(msg) {
  console.log(`\n[package-portable] ${msg}`);
}

async function buildCore() {
  const dist = join(CORE, "dist", "index.js");
  if (existsSync(dist)) {
    step(`core already built (${dist}) — skipping (delete it to force)`);
    return;
  }
  step("building @mc-agent/core (tsc)...");
  const { execFileSync } = await import("node:child_process");
  // Use the real build so the packaged core matches the tested output.
  execFileSync("npm", ["run", "build", "--workspace", "@mc-agent/core"], {
    cwd: root,
    stdio: "inherit",
  });
  if (!existsSync(dist)) throw new Error("core build produced no dist/index.js");
}

function cleanOut() {
  step("cleaning output dir");
  rmSync(OUT, { recursive: true, force: true });
  rmSync(ZIP, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
}

function copyDir(src, dest) {
  if (!existsSync(src)) throw new Error(`missing source: ${src}`);
  cpSync(src, dest, { recursive: true });
  console.log(`  copied ${src} -> ${dest}`);
}

function writeStartCmd() {
  const cmd = `@echo off\r\nsetlocal\r\ncd /d "%~dp0packages\\app"\r\nstart "" "%~dp0node_modules\\electron\\dist\\electron.exe" "%~dp0packages\\app"\r\nendlocal\r\n`;
  writeFileSync(join(OUT, "start.cmd"), cmd, "utf8");
  console.log("  wrote start.cmd (runs bundled Electron directly, no Node needed)");
}

async function zipDir() {
  step("zipping...");
  const { execFileSync } = await import("node:child_process");
  // Use PowerShell Compress-Archive (native; robust enough for our sizes).
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${OUT.replaceAll("'", "''")}\\*' -DestinationPath '${ZIP.replaceAll("'", "''")}' -Force`,
    ],
    { stdio: "inherit" },
  );
  console.log(`  zip written: ${ZIP}`);
}

console.log("mc-agent portable pack\n========================");
console.log("Root:", root);

await buildCore();
cleanOut();

step("copying app + core dist");
copyDir(APP, join(OUT, "packages", "app"));
copyDir(join(CORE, "dist"), join(OUT, "packages", "core", "dist"));

step("copying assets (templates)");
copyDir(join(root, "assets"), join(OUT, "assets"));

step("copying runtime scripts (gate-switch/check-gate)");
copyDir(join(root, "scripts"), join(OUT, "scripts"));

step("copying root package.json (workspace resolution)");
copyDir(join(root, "package.json"), join(OUT, "package.json"));

step("copying node_modules (bundled, so no Node/install needed by the user)");
copyDir(join(root, "node_modules"), join(OUT, "node_modules"));

step("writing launcher");
writeStartCmd();

step("copying README + instructions for the user");
for (const f of ["README.md", "INSTRUCTIONS.md", "GETTING_STARTED.md", "LICENSE"]) {
  const src = join(root, f);
  if (existsSync(src)) copyDir(src, join(OUT, f));
}

await zipDir();

console.log("\nDone. Shareable artifact: " + ZIP);
console.log("End user: download -> unzip -> run start.cmd (no Node needed).");
