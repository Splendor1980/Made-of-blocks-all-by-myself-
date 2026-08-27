# Gate 0 log

Auto-maintained by `scripts/gate-switch.mjs`. Each run appends a line:
timestamp | launches | png | returns | passed | action

The script enables the `crafter` agent (removes `disable: true` from
`.opencode/agents/crafter.md`) only when all thresholds are met
(>=20 launches, >=10 png, >=5 returns). On FAIL it makes no changes.

---
- 2026-08-26T18:38:24.042Z | launches=2 png=1 returns=0 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T15:33:43.355Z | launches=11 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T15:33:43.473Z | launches=12 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T15:33:43.591Z | launches=12 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
