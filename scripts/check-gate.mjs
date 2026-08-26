import { readFile } from "node:fs/promises";
import { gateStatus } from "../packages/app/metricsCore.js";

const path = process.argv[2] || "./metrics.json";
let state;
try {
  state = JSON.parse(await readFile(path, "utf8"));
} catch {
  state = { launches: 0, png: 0, returns: 0, days: [] };
}
const g = gateStatus(state);
console.log(
  `Gate 0: launches=${g.launches}/${g.thresholds.launches} ` +
    `png=${g.png}/${g.thresholds.png} returns=${g.returns}/${g.thresholds.returns}`,
);
console.log(g.passed ? "PASS -> crafter may be enabled (remove disable:true)" : "not yet");
