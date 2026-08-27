# mc-agent

OpenCode agents + a **companion Skin Studio UI** for Minecraft creativity (skins first; datapacks/structures gated behind Gate 0). This repo is meant to be **opened as a folder in OpenCode Desktop** — Desktop provides the models and runs the agents/tools defined in `.opencode/`.

## What's inside
- `.opencode/agents/` — `skins` (active), `crafter` (disabled until Gate 0).
- `.opencode/tools/` — deterministic skin tools (validate, recolor, import, region-edit, open window) + datapack/build tools.
- `packages/core` — `@mc-agent/core`: skin/template/region/recolor/import, build (mcfunction/NBT), textureless datapacks.
- `packages/app` — Electron **Skin Studio** companion window: template cards → 3D preview (skinview3d) → region paint → Export PNG.
- `scripts/` — `skin-cli.mjs` (headless pipeline), `gate-switch.mjs` / `check-gate.mjs` (Gate 0 automation).

## Prerequisites
- Node.js 24+.
- **OpenCode Desktop** with your model configured (e.g. Hy3 Free). No model key is bundled here.

## Quick start
1. **Open this folder (`mc-agent`) in OpenCode Desktop.** Agents and tools are picked up from `.opencode/` automatically.
2. **Skin Studio window** (companion UI), any of:
   - `cd packages/app && npm install && npm start`
   - or ask the `skins` agent to open it (`open_skin_studio` tool).
   > The Electron binary must be present in `node_modules/electron/dist` (downloaded by `npm install` on a normal network; see `docs/blockers.md` if it's missing).
3. **Headless / CLI only:** `node scripts/skin-cli.mjs list`, then `node scripts/skin-cli.mjs run <id> <hexcolor> [part] --write --out out/skin.png`.

## Graceful degradation
The Skin Studio buttons work **without** any model/Desktop (deterministic). The agent chat reports "unavailable" if no provider is configured.

## Gate 0 (skins → crafter)
`crafter` stays disabled until metrics hit ≥20 launches, ≥10 PNG, ≥5 returns (distinct days). `node scripts/gate-switch.mjs` auto-removes `disable: true` and logs to `docs/gate-log.md`. Thresholds are fixed; metrics are never faked.

## Notes
- Don't fork OpenCode; extend via agents/tools/permissions in `.opencode/`.
- Keep model keys in Desktop config only — never commit them.
