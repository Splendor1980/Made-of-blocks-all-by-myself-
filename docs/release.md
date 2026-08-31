# Release checklist (mc-agent)

Manual gate to run before shipping a version. Everything here is tracked so the
next release is repeatable.

## 0. Product identity (spec §8)
- [ ] Product **name** confirmed — must NOT contain "Mine"/"Craft" as a trademarked mark (use `mc-agent` until legal review).
- [ ] License: MIT (already in `LICENSE`). Confirm repo is public and carries the `NOT AN OFFICIAL MINECRAFT PRODUCT, NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT` disclaimer (in `README.md`, `docs/legal.md`, and the Skin Studio UI footer/node).
- [ ] Gate 0 metrics review: `docs/gate-log.md` shows the honest `launches/png/returns` vs thresholds (20/10/5). **Never fake metrics.**

## 1. Automated checks (must be green)
- [ ] `npm run check` passes:
  - `npm run qa` (vitest + `tsc -b`),
  - `npx tsc -p tsconfig.json --noEmit` (covers `.opencode/tools/**`),
  - `npm run smoke` (headless CLI pipeline).
- [ ] `git status` clean after the above (no build artifacts tracked).

## 2. Manual verification (no MC server required)
- [ ] Skin Studio launches (see `docs/blockers.md` §1 for the electron binary + `path.txt`; `setup-windows.bat` one-click installs + self-heals both).
- [ ] Templates render, recolor by part works, Import 64×64 and legacy 64×32, region paint, Export PNG.
- [ ] Idea cards render with previews; "Evil version of MY skin" works after loading a skin; branded/clone prompts are refused.
- [ ] Words panel: shape preview, `.nbt` import, folder + zip export.
- [ ] A datapack loads in a real test world via `/function <ns>:build_<type>`.

## 3. Windows release packaging
- [ ] **Option A — portable zip (easiest, no Node needed by users):** on a machine that has the repo installed, run `npm run pack:portable`. It produces
      `dist/mc-agent-win/` + `dist/mc-agent-win.zip` (bundles the Electron binary +
      app + core + assets + scripts). End user: download → unzip → run `start.cmd`.
      This is the **recommended first release artifact** for beginners.
- [ ] **Option B — installer `.exe` (nicer, needs internet):** optional `electron-builder`
      flow — `npm i -D electron-builder` then
      `npx electron-builder --config packages/app/electron-builder.yml --win nsis`
      (or `--win portable`). Produces an installer with a Desktop shortcut.
- [ ] A code-signing certificate removes SmartScreen/Defender warnings (see
      `docs/blockers.md` §4).
- [ ] Host the artifact + readme on a free distribution channel (recommendation:
      **itch.io** page — download button + built-in comments/rating; alternatives:
      GitHub Releases, Mega/Yandex/Drive). Create a **Discord** server for live feedback.
- [ ] No secret keys in the repo or release artifacts (Desktop keys stay in user config).

## 4. Art / content status
- [ ] Skin base templates: currently a hand-authored set (knight/mage/robot). Per spec §8 the "assets/CRIT-PATH" item needs an artist + cleared license (own or CC0 + markup) to expand the gallery.

## 5. Testing on a real machine
- [ ] Fresh clone → `npm install` (downloads electron binary) → `npm run check` → `npm start`.
- [ ] OpenCode Desktop folder open → agents/tools load; ask the `skins`/`crafter` agents to do one task each.

## 6. Announce
- [ ] Tag + GitHub release with a build artifact and the disclaimer in the body.
- [ ] Beta-testers channel (Discord) link (spec §8).
