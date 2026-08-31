# mc-agent

OpenCode agents + a **companion Skin Studio UI** for Minecraft creativity (skins first; datapacks/structures gated behind Gate 0). This repo is meant to be **opened as a folder in OpenCode Desktop** — Desktop provides the models and runs the agents/tools defined in `.opencode/`.

> **NOT AN OFFICIAL MINECRAFT PRODUCT, NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.**  
> This tool creates custom skin PNGs and textureless datapacks; it never contains or distributes official Minecraft game assets. See [docs/legal.md](./docs/legal.md) for the full disclaimer.

**New here?** Read [GETTING_STARTED.md](./GETTING_STARTED.md) — a no-coding guide for players.

## What's inside
- `.opencode/agents/` — `skins` (active), `crafter` (active; builds datapacks/structures).
- `.opencode/tools/` — deterministic skin tools (validate, recolor, import, region-edit, `generate_skin` from text, open window) + datapack/build tools (`build_nbt`, `datapack_create`, `generate_world`, `craft_datapack` scenes, `import_structure`).
- `packages/core` — `@mc-agent/core`: skin/template/region/recolor/import, build (mcfunction/NBT + NBT **reader**), textureless datapacks, **isometric preview** renderer.
- `packages/app` — Electron **Skin Studio** companion window: template cards → 3D preview (skinview3d) → region paint → Export PNG; **Worlds** panel (shapes, live isometric preview, `.nbt` import) and **skin project Save/Load**.
- `scripts/` — `skin-cli.mjs` (headless pipeline), `gate-switch.mjs` / `check-gate.mjs` (Gate 0 automation).

## Prerequisites
- Node.js 24+.
- **OpenCode Desktop** with your model configured (e.g. Hy3 Free). No model key is bundled here.

## Quick start
1. **Open this folder (`mc-agent`) in OpenCode Desktop.** Agents and tools are picked up from `.opencode/` automatically.
2. **One-click install (Windows, easy path):** double-click **`setup-windows.bat`** in the repo root. It checks Node, runs `npm install`, self-heals the Electron binary + `path.txt`, creates a **`mc-agent Skin Studio`** Desktop shortcut, and launches the app.
3. **Any of the manual ways to open Skin Studio** (companion UI):
   - double-click the **`mc-agent Skin Studio`** shortcut on the Desktop (runs `launch-skin-studio.bat`),
   - `cd packages/app && npm install && npm start`,
   - or ask the `skins` agent to open it (`open_skin_studio` tool).
   > `launch-skin-studio.bat` recreates the Electron `path.txt` automatically if it's missing, so a fresh clone with the binary present still starts. See `docs/blockers.md` if the binary itself is absent.
4. **Headless / CLI only:**
   - skins: `node scripts/skin-cli.mjs list`, then `node scripts/skin-cli.mjs run <id> <hexcolor> [part] --write --out out/skin.png`
   - worlds: `node scripts/generate-world.mjs --type pyramid --size 3 --out out/world`

## Graceful degradation
The Skin Studio buttons work **without** any model/Desktop (deterministic). The agent chat reports "unavailable" if no provider is configured.

## Skins (deterministic, no AI pixels)
Start from a built-in template (knight/mage/robot) and recolor by body part, import your own 64×64 PNG, or paint specific UV regions in the editor. A first-run **onboarding** shows the disclaimer + age consent, and an **Ideas** panel has 6 clickable starter cards (Ice Mage, Steel Robot, Sun Knight, …) with live previews, plus an **"Evil version of MY skin"** one-click tint that works on any loaded template or import. You can also **describe a skin in text** — the `generate_skin` tool maps keywords (e.g. "glowing ice mage", "dark steel robot") to a template + colors, fully offline. Project **Save/Load** (`.mcskin.json`) preserves the working skin including edits and template state.

## Gate 0 (skins → crafter)
`crafter` stays disabled until metrics hit ≥20 launches, ≥10 PNG, ≥5 returns (distinct days). `gate-switch.mjs` runs automatically on every UI/CLI launch (and can be run manually) to auto-remove `disable: true` and log to `docs/gate-log.md`. Thresholds are fixed; metrics are never faked.

## Worlds (datapacks / structures)
A **Worlds** panel in the Skin Studio UI calls `generateWorld` and writes a datapack folder; no writes to existing saves happen automatically. The panel shows a **live isometric preview** of the selected shape, and you can **import an existing `.nbt`** structure (it is rendered and wrapped into a fresh datapack with a load function).
Headless equivalent: `node scripts/generate-world.mjs --type <house|box|tower|pyramid|fence|wall|sphere|dome|bridge|stairs|column|ramp|arch|ring> --block <id> --size <n> --out <dir>`.
The block id can include an explicit **state** (e.g. `minecraft:oak_log[axis=y]`) which is validated against Minecraft's declared block states and written into the structure `.nbt` `Properties` (and preserved in `/fill` commands you emit via the core).
Output is a **folder** by default, e.g. `out/world/pack.mcmeta` + `data/genmod/structures/<type>_<size>.nbt` + `data/genmod/functions/build_<type>.mcfunction`. In the UI you can also press **Download .zip** to get a ready-to-copy `generated_pack.zip`. Copy the folder (or unzip the .zip) into `saves/<world>/datapacks/`, then run `/function genmod:build_<type>` in-game.
The `generate_world` agent tool (`.opencode/tools`) wraps `datapack_create` + `build_nbt` for the same result from chat. The higher-level `craft_datapack` tool builds a full datapack in **one call** — a single structure **or a `structures` array (a multi-structure "scene")** plus recipes/advancements/loot/functions. `import_structure` imports a player's existing `.nbt` (Java structure format, gzip-aware) — never touches an existing save. The `crafter` subagent (`.opencode/agents/crafter.md`, enabled) uses them: ask the OpenCode agent to "build a pyramid world", "make a starter kit with a recipe", or "import my castle.nbt".

**Example gallery:** `node scripts/make-examples.mjs` generates ready-to-use datapacks into `examples/` (house, pyramid, tower, and a `example_starter_kit` with a recipe + advancement + loot + function). Copy any `examples/<name>` folder into `saves/<world>/datapacks/`.


## Notes
- This project is an **extension/overlay for OpenCode Desktop, not a fork** of OpenCode. Extend behavior via agents/tools/permissions in `.opencode/`; do not copy or modify the OpenCode core.
- Keep model keys in Desktop config only — never commit them.

## Checks & release
- `npm run check` runs the full gate: unit/UI tests, `tsc -b`, tool typechecks, and the headless CLI smoke pipeline. Run it before any release.
- See [docs/release.md](./docs/release.md) for the release checklist, [docs/qa.md](./.opencode/agents/qa.md) for the QA subagent contract, and [docs/evaluation.md](./docs/evaluation.md) for the latest functionality/UX assessment.

## Publishing / external use
- `node_modules/` and `packages/core/dist/` are gitignored; a fresh clone needs `npm install` (the `prepare` script builds `@mc-agent/core` automatically) and then `npm start` in `packages/app`.
- Electron's binary is downloaded by `npm install` on a normal network. If it is blocked, see `docs/blockers.md` for the manual-install steps (including the required `node_modules/electron/path.txt`).
- MIT licensed — see `LICENSE`.

