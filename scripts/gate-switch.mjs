import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as metrics from "../packages/app/metricsStore.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CRAFTER = join(root, ".opencode", "agents", "crafter.md");
const LOG_DIR = join(root, "docs");
const LOG = join(LOG_DIR, "gate-log.md");

const DISABLE_RE = /^\s*disable:\s*true\s*$/m;

/** Checks Gate 0 and removes `disable: true` from crafter.md on PASS. Idempotent. */
export async function runGateSwitch() {
  const state = await metrics.load();
  const g = metrics.gateStatus(state);
  const ts = new Date().toISOString();
  let action;
  if (g.passed) {
    let txt = await readFile(CRAFTER, "utf8");
    if (DISABLE_RE.test(txt)) {
      txt = txt.replace(DISABLE_RE, "").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
      await writeFile(CRAFTER, txt);
      action = "ENABLED: removed 'disable: true' from crafter.md";
    } else {
      action = "already enabled (no disable line)";
    }
  } else {
    action = "no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)";
  }

  const summary = `- ${ts} | launches=${g.launches} png=${g.png} returns=${g.returns} passed=${g.passed} -> ${action}`;
  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(LOG, summary + "\n");
  console.log(summary);
  return { passed: g.passed, action };
}

// Run when executed directly: node scripts/gate-switch.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runGateSwitch().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
