# Manual acceptance checklist (real machine)

Everything in this doc needs a real machine with internet and, ideally, a configured
OpenCode Desktop model. This is the un-verified, out-of-code remainder of the project;
code-side is green (`npm run check`).

Running order matters: install first, then skin flow, then the live agent, then Gate 0.

---

## 1. One-click install (`setup-windows.bat`)
- [ ] Fresh clone of `mc-agent` (no `node_modules`).
- [ ] Node.js 24+ installed (`node --version`).
- [ ] Double-click **`setup-windows.bat`**.
- [ ] It runs `npm install` (builds core via `prepare`, downloads Electron).
- [ ] Verifies `node_modules/electron/dist/electron.exe` + `path.txt` exist; self-heals
      if missing (auto-extracts a dropped `electron-*.zip`, writes `path.txt`).
- [ ] Creates a **`mc-agent Skin Studio`** Desktop shortcut.
- [ ] The Skin Studio window opens.
- [ ] Re-run `launch-skin-studio.bat` (or the shortcut) a second time → still opens
      (confirms the launch-path self-heal works).

> If the Electron binary can't be downloaded (blocked network), drop
> `electron-v33.4.11-win32-x64.zip` next to the installer and re-run; the installer
> extracts it. See `docs/blockers.md`.

## 2. Skin Studio manual flow (no model required)
- [ ] **Onboarding** modal shows the disclaimer + age consent; "Let's go" is disabled
      until the checkbox is ticked.
- [ ] Load each template (knight / mage / robot); 3D preview renders and rotates.
- [ ] Recolor a part (e.g. armor → red); preview updates.
- [ ] Import a 64×64 PNG and a legacy 64×32 PNG (warnings shown for empty face /
      padding pixels).
- [ ] Paint in the region editor; Export PNG works.
- [ ] Project **Save** → **Load** round-trips the working skin.
- [ ] An **Idea card** applies a theme; **"Evil version of MY skin"** tints the loaded
      skin.
- [ ] A **branded/clone prompt** (e.g. "make an Elsa skin") is refused by the
      moderation check.

## 3. Worlds / datapack flow (no model required)
- [ ] A preset (e.g. House) renders the isometric preview.
- [ ] **Generate datapack** writes a folder; **Download .zip** produces a zip.
- [ ] Import an existing `.nbt` → it is rendered and wrapped into a fresh datapack.
- [ ] Copy the folder (or unzip) into `saves/<world>/datapacks/`, run
      `/function genmod:build_house` in a **new** test world → the structure appears.
- [ ] Block-state typed explicitly (e.g. `minecraft:oak_log[axis=y]`) is accepted;
      an invalid state is rejected with an error.

## 4. Live LLM agent (needs a configured model)
- [ ] Open the `mc-agent` folder in **OpenCode Desktop** with a provider logged in.
- [ ] Ask the **`skins`** agent: "make a glowing ice mage skin" → it uses `generate_skin`
      and produces a result.
- [ ] Ask the **`crafter`** agent: "build a pyramid world" → it uses
      `craft_datapack`/`generate_world` and produces a datapack.
- [ ] Confirm agents report "unavailable" cleanly when no provider is set (degradation).

## 5. Gate 0 (honest, real usage)
Thresholds: ≥20 launches, ≥10 PNG, ≥5 returns (distinct days). Metrics are never faked;
`returns` needs real calendar days. Track in `~/.mc-agent/metrics.json` and
`docs/gate-log.md` (`scripts/check-gate.mjs`):
- [ ] `launches` ≥ 20
- [ ] `png` ≥ 10
- [ ] `returns` ≥ 5 distinct days
- [ ] Once all three pass, the `crafter` unlocks automatically (see `gate-switch.mjs`).
- [ ] Confirm `gateStatus.passed === true` in the logs.

## 6. Sign-off
- [ ] `npm run check` green on the machine.
- [ ] No secrets in the repo; disclaimer present in README and UI footer.
- [ ] Update `docs/blockers.md` with anything surprising found.
