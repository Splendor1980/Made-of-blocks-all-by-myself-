import { spawn } from "node:child_process";

let child = null;
const PORT = 4096;

/**
 * Spawns `opencode serve` as a sidecar the UI/agent talks to. The exact
 * serve flags should be confirmed against the installed OpenCode version;
 * this is a best-effort wrapper used by the stub.
 */
export function startSidecar() {
  if (child) return { state: "running", pid: child.pid };
  child = spawn("opencode", ["serve", "--port", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  child.on("exit", () => {
    child = null;
  });
  child.on("error", () => {
    child = null;
  });
  return { state: "starting", pid: child.pid };
}

export function stopSidecar() {
  if (child) child.kill();
  child = null;
}

export function sidecarState() {
  if (!child) return { state: "stopped" };
  return { state: "running", pid: child.pid };
}

export async function sidecarReady(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/`);
      if (r.ok || r.status !== 404) return true;
    } catch {
      // not up yet
    }
    await new Promise((res) => setTimeout(res, 250));
  }
  return false;
}
