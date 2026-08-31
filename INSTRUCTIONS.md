# mc-agent — quick instructions (how to run & use)

Short version. Full player guide (incl. troubleshooting) is in `GETTING_STARTED.md`.

## Where to launch

| What | How |
|------|-----|
| **One-click install (Windows, from zero)** | Double-click **`setup-windows.bat`** in the repo root → installs deps, self-heals Electron, makes a Desktop shortcut, opens the window. |
| **Skin Studio window (after setup)** | Double-click the **`mc-agent Skin Studio`** Desktop shortcut, or run `launch-skin-studio.bat`. |
| **Manually (dev style)** | `cd packages/app` → `npm start`. |
| **From OpenCode chat** | Open the `mc-agent` folder in **OpenCode Desktop**, talk to the `skins` / `crafter` agents. |
| **No window (headless/CLI)** | `node scripts/skin-cli.mjs list` · `node scripts/generate-world.mjs --type pyramid --size 3 --out out/world` |

Requirements: **Node.js 24+** and (for chat) **OpenCode Desktop** with a model.
The Skin Studio window itself needs **no** model — it works offline.

## How to use — skins (3 ways)
1. **Describe it in chat** (needs a model): “make a glowing ice mage” → `generate_skin` picks template + colors.
2. **Skin Studio window:** pick a template (Knight/Mage/Robot) → click a body part + color → **Export PNG**.
3. **Import your own** PNG (64×64, or legacy 64×32) → paint on it in the editor.
- Not sure what to make? Click an **Idea card**, or use **“Evil version of MY skin”** to tint what you have.
- **Save/Load** a working skin as `.mcskin.json`.

## How to use — builds / datapacks (2 ways)
1. **Ask the `crafter` agent** (needs a model): “build a pyramid base”. Or
2. **Worlds panel in the window:** pick a **Type** + **Block** + **Size** → live preview → **Generate datapack** (or **Download .zip**).

**To see it in Minecraft** (always use a NEW world, never an existing save):
- Copy the generated folder (the app shows the path) into `saves/<your-world>/datapacks/`
  (zip → unzip it there first).
- Start the world, run `/function genmod:build_<type>` (e.g. `/function genmod:build_pyramid`).

## Gate 0 (unlock)
- The **builds/datapacks** tools unlock automatically once you reach **20 uses, 10 skins, and 5 return days**.
- See the live progress in the **Worlds** panel and in `docs/gate-log.md`.

## Quick checks
- Everything OK? Run `npm run check` (tests + typecheck + smoke).
- Window won't open? See `docs/blockers.md` (usually a missing Electron binary; the launcher self-heals `path.txt`).
