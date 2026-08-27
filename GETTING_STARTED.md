# Getting Started — mc-agent (for players, not developers)

mc-agent is a helper that lives inside **OpenCode Desktop** and lets you:

- make **Minecraft skins** (for Java Edition, 64×64), and
- build **datapacks / structures** (houses, pyramids, towers, walls…) you can drop into a world.

You do **not** need to code. You talk to it, or click buttons.

---

## 1. One-time setup

1. Install **OpenCode Desktop** (the app that runs mc-agent).
2. Put the `mc-agent` folder somewhere on your computer.
3. Open **OpenCode Desktop** and open the `mc-agent` folder (File → Open Folder).
4. Make sure OpenCode has a model available (it usually comes with your account or built-in models). That's it — no installs, no keys to type.

> If the Skin Studio window does not open, see `docs/blockers.md` (it's almost always a missing Electron binary, with a one-line fix).

---

## 2. Make a skin (two ways)

**Way A — just ask (easiest):**
In the OpenCode chat, tell the **skins** agent what you want, e.g.:
- “Make me a red knight skin.”
- “Recolor the robot template to green.”
- “Import this PNG and make the head blue.” (drag/drop or paste a 64×64 PNG)

**Way B — Skin Studio window (visual):**
- Double-click the **`mc-agent Skin Studio`** shortcut on your Desktop, **or**
  run `cd packages/app && npm start`, **or** ask the skins agent to open it.
- In the window: pick a template (Knight / Mage / Robot), click a body part and a color, import your own PNG and paint on it, then **Export PNG**.

---

## 3. Build a world / datapack (two ways)

**Way A — just ask:**
In the OpenCode chat, tell the **crafter** agent, e.g.:
- “Build a pyramid base.”
- “Make a starter kit with a recipe and a structure.”

**Way B — Worlds panel in the Skin Studio window:**
- Open the **Worlds** panel on the right.
- Pick a **Type** (house / box / tower / pyramid / fence / wall), a **Block**, a **Size**, then **Generate datapack**.
- The panel shows an in-game command like `/function genmod:build_pyramid`.
- Copy the generated folder (it tells you where) into your world:
  `saves/<your-world>/datapacks/`.
- In Minecraft, run the shown `/function …` command. Done.

You can also grab ready-made examples from the `examples/` folder (house, pyramid, tower, starter kit).

---

## 4. Need help?

- Skins not generating? Ask the **skins** agent; it works even without an AI model (templates + your edits).
- Build not showing in-game? Make sure you copied the **whole folder** into `datapacks/`, then reopen the world.
- This is an add-on for OpenCode, not a replacement — your worlds and skins stay yours.
