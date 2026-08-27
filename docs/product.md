# Product decision (fixed)

This is the authoritative product framing for `mc-agent`. Do not re-litigate.

## Main entry point = OpenCode Desktop
- The user already has models and agents in **OpenCode Desktop** (e.g. Hy3 Free and others).
- That Desktop is the **primary interface**. `mc-agent` is opened as a **folder** inside Desktop; Desktop loads the agents, custom tools and permissions from `.opencode/`.
- The **Skin Studio Electron window is NOT a separate competitor** to Desktop. It is a **companion preview window** that Desktop (or our agent, or a script) launches.

## Architecture rules
- **Do not fork OpenCode.** Extend it via: agents (`.opencode/agents/*.md`), custom tools (`.opencode/tools/*.ts`), permissions (`permission:` frontmatter).
- Agents + custom tools + permissions live **in this repo** (`.opencode/`). The user opens the `mc-agent` folder in Desktop.
- The Electron window (template cards, 3D preview, region paint, export) is the **companion UI**. Launch it:
  - from Desktop, or
  - via a script (`cd packages/app && npm start`), or
  - via the agent button (`open_skin_studio` tool).
  - It is **not** a second account / separate login.
- **LLM always goes through the Desktop config on this machine.** Never bundle our own API key into the app or repo.

## Graceful degradation
- **No model / no Desktop** → the Skin Studio buttons (templates, recolor, import, paint, export) still work fully (they are deterministic, no LLM needed).
- The chat/agent surface, when unavailable, must state honestly **"agent unavailable"** — never fake a response.

## Gate 0 (skins → crafter)
- Skins stage is the MVP and is complete.
- `crafter` agent stays `disable: true` until Gate 0 metrics pass (≥20 launches, ≥10 PNG, ≥5 returns). `scripts/gate-switch.mjs` auto-enables it; thresholds are fixed at 20/10/5; metrics are never faked.
- Datapack/structure world UI stays out of the menu until the gate passes.
