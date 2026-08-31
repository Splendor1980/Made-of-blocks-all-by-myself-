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
- 2026-08-27T15:49:58.606Z | launches=12 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:08:09.925Z | launches=13 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:10:00.187Z | launches=14 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:11:46.935Z | launches=15 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:17:09.611Z | launches=16 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:25:12.288Z | launches=17 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:25:36.648Z | launches=18 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:25:50.383Z | launches=19 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T16:45:31.038Z | launches=19 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T18:29:41.437Z | launches=19 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T18:29:41.881Z | launches=20 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T18:36:20.618Z | launches=20 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-27T18:36:21.059Z | launches=21 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-31T09:42:31.786Z | launches=21 png=2 returns=1 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
- 2026-08-31T09:42:32.309Z | launches=22 png=2 returns=2 passed=false -> no change: thresholds not met (need >=20 launches, >=10 png, >=5 returns)
