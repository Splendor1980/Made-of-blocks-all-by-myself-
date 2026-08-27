# Blockers (environment / network / electron)

Tracked here so the next step is obvious. Update when resolved.

## 1. Electron binary cannot be downloaded from the shell
- The Electron **npm package installs**, but its **postinstall binary download is blocked**: the shell can reach the npm registry, but **GitHub Releases and CDNs (npmmirror) are unreachable** (`Invoke-WebRequest` to `github.com/electron/electron/releases` and `registry.npmmirror.com/-/binary/electron` both fail with connection errors). `npm rebuild electron` exits 0 but does **not** produce `electron.exe`.
- **Workaround (done):** the user supplied `electron-v42.10.1-win32-x64.zip`; it was extracted into `node_modules/electron/dist`. The binary (v42) runs the app whose `package.json` pins `electron ^33` — the version mismatch is tolerated, window opens fine. **Do not bump `packages/app/package.json` electron version unless intentional.**
- On a normal machine with internet, `cd packages/app && npm install` downloads the binary automatically.

## 2. Headless: window cannot be visually verified here
- This environment is headless. Launching Electron spawns the process and the window title `mc-agent - Skin Studio` appears (confirmed via `Get-Process`), but nothing is visible to verify pixels.
- Verification method used: launch with `electron . --enable-logging=stderr --v=1`, then read `out/ui*.err` for Chromium console lines (`3D preview ready`, IPC errors, CSP refusals). The harness kills the launch command, but the Electron process survives; inspect in a separate command.

## 3. Live LLM agent (opencode serve) blocked without a provider
- `opencode/*-free` returns `Unexpected server error` (no provider login). This is outside our code: the app/agents/tools are correctly wired and load. A real run needs `opencode providers login` or an OpenRouter key on the user's machine.
- Deterministic skin flow (templates, recolor, import, paint, export) needs **no LLM** and is fully usable now.

## 4. CSP for the companion UI
- `index.html` uses `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';`. The skinview3d bundle is loaded from `../../node_modules/skinview3d/bundles/skinview3d.bundle.js`. If you change the bundle path, keep it within `file://` self-origin.
