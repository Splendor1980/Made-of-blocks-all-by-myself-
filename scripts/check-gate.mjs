import * as metrics from "../packages/app/metricsStore.js";

// Reads the shared metrics store (same file as the UI and skin-cli use).
// Optional arg: path to a metrics.json to inspect instead of the default store.
const path = process.argv[2];
const state = path ? await metrics.load(path) : await metrics.get();
const g = metrics.gateStatus(state);
console.log(
  `Gate 0: launches=${g.launches}/${g.thresholds.launches} ` +
    `png=${g.png}/${g.thresholds.png} returns=${g.returns}/${g.thresholds.returns}`,
);
console.log(g.passed ? "PASS -> crafter may be enabled (run scripts/gate-switch.mjs)" : "not yet");
