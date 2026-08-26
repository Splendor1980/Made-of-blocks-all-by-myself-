import { app } from "electron";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { emptyState, recordLaunch, recordPng } from "./metricsCore.js";

const FILE = join(app.getPath("userData"), "metrics.json");

export async function load() {
  try {
    return { ...emptyState(), ...JSON.parse(await readFile(FILE, "utf8")) };
  } catch {
    return emptyState();
  }
}

async function save(state) {
  await writeFile(FILE, JSON.stringify(state, null, 2));
}

export async function recordLaunch() {
  const s = recordLaunch(await load());
  await save(s);
  return s;
}

export async function recordPng() {
  const s = recordPng(await load());
  await save(s);
  return s;
}

export async function get() {
  return load();
}
