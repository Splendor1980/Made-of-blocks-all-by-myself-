import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  emptyState,
  recordLaunch as coreRecordLaunch,
  recordPng as coreRecordPng,
  gateStatus,
} from "./metricsCore.js";

export function defaultPath() {
  return join(homedir(), ".mc-agent", "metrics.json");
}

export async function load(path = defaultPath()) {
  try {
    return { ...emptyState(), ...JSON.parse(await readFile(path, "utf8")) };
  } catch {
    return emptyState();
  }
}

async function save(state, path) {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 2));
}

export async function recordLaunch(path = defaultPath()) {
  const s = coreRecordLaunch(await load(path));
  await save(s, path);
  return s;
}

export async function recordPng(path = defaultPath()) {
  const s = coreRecordPng(await load(path));
  await save(s, path);
  return s;
}

export async function get(path = defaultPath()) {
  return load(path);
}

export { gateStatus };
