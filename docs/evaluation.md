# Project evaluation — mc-agent

Purpose: a documented, honest assessment of **functionality** and **user-friendliness**
as of the MVP-complete milestone. Revisit on each release (see `docs/release.md`).

---

## 1. Functionality (what is actually closed)

### Skins — full loop, and mature
- Built-in templates (knight / mage / robot) → recolor by body part → UV-region
  painting editor → Export PNG.
- Import your own 64×64, plus **legacy 64×32** (auto-duplicates the top half), with
  objective health warnings (empty face, pixels in padding zones).
- Textual `generate_skin` (offline keyword→template+color) as a no-drawing path.
- **Prompt moderation** (brand/clone blocklist: Elsa, Pikachu, Disney, …) plus
  "Evil version of MY skin" (hex tint) — a safe, complete set.
- Save/Load project (`.mcskin.json`).

### Worlds / datapacks
- 14 primitives with a live isometric preview.
- Own RLE `/fill` generator, an NBT **writer** and **reader** (`.nbt` import).
- **Block-state validation** against Minecraft's declared states
  (`oak_log[axis=y]` → `Name`+`Properties` in NBT) — above average for amateur tools.
- Datapack → folder **or `.zip`** (jszip), scenes (multi-structure), recipes /
  advancements / loot, and a security `sanitizeFunction` (denies `op`, `execute`,
  `give command_block`; malformed `/fill` is caught).
- Honest size guard: huge builds (≥4096 blocks) get a warning note instead of an
  uncontrolled command split (which would conflict with the deliberate `/function` ban).

### Platform
- Correct scope: an **overlay for OpenCode Desktop, not a fork**. All external
  behaviour lives in `.opencode/` (agents skins / crafter / qa + deterministic tools);
  the model always comes from Desktop config, no keys in the repo.

### Functionality verdict: **8/10**
Strong for an MVP. A couple of conscious "Later" deferrals remain (art gallery — a
human/artist path, not code; huge-build chunk splitting — intentionally not done to
keep the `/function` security policy strict).

---

## 2. User-friendliness (UX)

### Strong
- **Onboarding**: age consent (13+) + legal disclaimer modal — right for the
  kids-first audience and for parent trust.
- **Idea cards** (6 themes with live previews + "Evil version") lower the blank-canvas
  barrier. The strongest UX feature.
- "How-to-wear" collapsible — practical for beginners.
- Graceful degradation: buttons work without any model; agents honestly report
  "unavailable" when no provider is set.
- Gate 0 as an unlocked "achievement" (skins → crafter) rather than a hard block,
  with an honest "come back tomorrow" nudge.

### Weak / gaps (honest)
1. **Entry threshold is higher than the "beginners" framing.** Node 24+ + OpenCode
   Desktop + Electron binary/path.txt. Docs cover it, and `setup-windows.bat` now
   automates it, but the shortest real path is "install Node → use the one-click
   installer".
2. **Dual UI/CLI reality.** Everything exists both in the window and headless CLI.
   Functionally rich but heavier to maintain/test; for the user the window matters,
   while CLI is a byproduct.
3. **Some technical vocabulary leaks into the UI** ("Gate 0", "datapacks",
   `minecraft:oak_planks[axis=y]`). Presets/buttons compensate, but plain-language
   labels would help younger users.
4. **3D preview is not covered by automated tests** (jsdom falls back to 2D). The
   real window shows 3D, but it's untested territory.
5. **Gate 0 `returns` needs 5 distinct real days** — nothing in code speeds this;
   it must be earned honestly.
6. **Template gallery is narrow (3)** — an art critical-path item; expansion waits
   on an artist, not on code.

### UX verdict: **7/10**
Idea cards, onboarding and the honest Gate are done well; the delta is the launch
barrier (now largely handled) and technical wording in the UI.

---

## 3. Engineering
- 112 automated tests, full `npm run check` green, typed core; clean architecture
  (deterministic `core/` vs Electron `app/`).
- **9/10.**

---

## 4. Overall / recommended focus
- Composite ≈ **8/9/7** (functionality / engineering / UX).
- **Do NOT keep adding features.** The highest-value next step is lowering and
  proving the launch path for the target user: one-click install is done; next is a
  real-machine run of `skins`/`crafter` with a configured model, and honestly passing
  Gate 0 (≥20 launches / ≥10 png / ≥5 returns across real days).
- After that, invest in the art gallery (artist + cleared license) if budget allows.
