# mc-agent

OpenCode agents + a **companion Skin Studio UI** for Minecraft creativity (skins first; datapacks/structures gated behind Gate 0). This repo is meant to be **opened as a folder in OpenCode Desktop** — Desktop provides the models and runs the agents/tools defined in `.opencode/`.

**New here?** Read [GETTING_STARTED.md](./GETTING_STARTED.md) — a no-coding guide for players.

## What's inside
- `.opencode/agents/` — `skins` (active), `crafter` (active; builds datapacks/structures).
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
   - double-click the **`mc-agent Skin Studio`** shortcut on the Desktop (runs `launch-skin-studio.bat`),
   - `cd packages/app && npm install && npm start`,
   - or ask the `skins` agent to open it (`open_skin_studio` tool).
   > The Electron binary must be present in `node_modules/electron/dist` (downloaded by `npm install` on a normal network; see `docs/blockers.md` if it's missing).
3. **Headless / CLI only:**
   - skins: `node scripts/skin-cli.mjs list`, then `node scripts/skin-cli.mjs run <id> <hexcolor> [part] --write --out out/skin.png`
   - worlds: `node scripts/generate-world.mjs --type pyramid --size 3 --out out/world`

## Graceful degradation
The Skin Studio buttons work **without** any model/Desktop (deterministic). The agent chat reports "unavailable" if no provider is configured.

## Gate 0 (skins → crafter)
`crafter` stays disabled until metrics hit ≥20 launches, ≥10 PNG, ≥5 returns (distinct days). `gate-switch.mjs` runs automatically on every UI/CLI launch (and can be run manually) to auto-remove `disable: true` and log to `docs/gate-log.md`. Thresholds are fixed; metrics are never faked.

## Worlds (datapacks / structures)
A **Worlds** panel in the Skin Studio UI calls `generateWorld` and writes a datapack folder; no writes to existing saves happen automatically.
Headless equivalent: `node scripts/generate-world.mjs --type <house|box|tower|pyramid|fence|wall> --block <id> --size <n> --out <dir>`.
Output is a **folder** (not a zip), e.g. `out/world/pack.mcmeta` + `data/genmod/structures/<type>_<size>.nbt` + `data/genmod/functions/build_<type>.mcfunction`. Copy that folder into `saves/<world>/datapacks/`, then run `/function genmod:build_<type>` in-game.
The `generate_world` agent tool (`.opencode/tools`) wraps `datapack_create` + `build_nbt` for the same result from chat. The higher-level `craft_datapack` tool builds a full datapack in one call — an optional embedded `.nbt` structure **plus** recipes, advancements, loot tables and functions. The `crafter` subagent (`.opencode/agents/crafter.md`, now enabled) uses them: just ask the OpenCode agent to "build a pyramid world" or "make a starter kit with a recipe".

**Example gallery:** `node scripts/make-examples.mjs` generates ready-to-use datapacks into `examples/` (house, pyramid, tower, and a `example_starter_kit` with a recipe + advancement + loot + function). Copy any `examples/<name>` folder into `saves/<world>/datapacks/`.


## Notes
- This project is an **extension/overlay for OpenCode Desktop, not a fork** of OpenCode. Extend behavior via agents/tools/permissions in `.opencode/`; do not copy or modify the OpenCode core.
- Keep model keys in Desktop config only — never commit them.

## Publishing / external use
- `node_modules/` and `packages/core/dist/` are gitignored; a fresh clone needs `npm install` (the `prepare` script builds `@mc-agent/core` automatically) and then `npm start` in `packages/app`.
- Electron's binary is downloaded by `npm install` on a normal network. If it is blocked, see `docs/blockers.md` for the manual-install steps (including the required `node_modules/electron/path.txt`).
- MIT licensed — see `LICENSE`.

