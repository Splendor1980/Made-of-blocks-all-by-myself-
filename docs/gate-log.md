# Gate 0 log

Auto-maintained by `scripts/gate-switch.mjs`. Each run appends a line:
timestamp | launches | png | returns | passed | action

The script enables the `crafter` agent (removes `disable: true` from
`.opencode/agents/crafter.md`) only when all thresholds are met
(>=20 launches, >=10 png, >=5 returns). On FAIL it makes no changes.

---
