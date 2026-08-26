import { app } from "electron";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const FILE = join(app.getPath("userData"), "metrics.json");

const DEFAULT = { launches: 0, png: 0, returns: 0, days: [] };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function load() {
  try {
    return { ...DEFAULT, ...JSON.parse(await readFile(FILE, "utf8")) };
  } catch {
    return { ...DEFAULT };
  }
}

async function save(state) {
  await writeFile(FILE, JSON.stringify(state, null, 2));
}

export async function recordLaunch() {
  const s = await load();
  s.launches += 1;
  const d = today();
  if (!s.days.includes(d)) {
    s.days.push(d);
    if (s.days.length > 1) s.returns += 1;
  }
  await save(s);
  return s;
}

export async function recordPng() {
  const s = await load();
  s.png += 1;
  await save(s);
  return s;
}

export async function get() {
  return load();
}
