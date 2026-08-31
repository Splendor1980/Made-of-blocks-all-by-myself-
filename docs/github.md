# Publishing mc-agent to GitHub (practical guide)

This makes GitHub the project's "home" (code + releases + landing page) and helps it
show up in **GitHub search**. It does NOT give you Google-search visibility on its own —
real reach comes from sharing the link in Minecraft communities. But it is the right base.

## 1. Create the repository (you, ~2 min)
1. Log in to github.com (account is yours, not the agent's).
2. New repository → name `mc-agent` → **Public** → do NOT add README/license (we have them).
3. Copy the HTTPS "quick setup" URL, e.g. `https://github.com/<you>/mc-agent.git`.

## 2. Push the existing repo (you, on a machine with the repo)
From the mc-agent folder:
```
git branch -m master main
git remote add origin https://github.com/<you>/mc-agent.git
git push -u origin main
```

## 3. Make it findable in GitHub search
On the repo page → **About** (right rail) → **gear icon**:
- **Description** (short, keyword-rich — this is what shows in search):
  > Companion skin + datapack studio for Minecraft beginners, built on OpenCode. Make a 64×64 skin or a structure datapack with no coding. Windows, free, open source.
- **Topics** (press Enter after each; these power GitHub search):
  > `minecraft` `skin-editor` `datapack` `structures` `minecraft-datapack` `open-source` `educational` `beginner-friendly` `electron` `nodejs` `opencode`
- Toggle **"Include in home page"** if present.

## 4. Create a release (needs a built zip first)
1. First build the artifact on any networked machine: `npm run pack:portable`
   → produces `dist/mc-agent-win.zip`.
2. Repo → **Releases** → **Create a new release**:
   - Tag: `v0.1.0`
   - Title: `mc-agent v0.1.0 — first public build`
   - Body: short blurb + the legal disclaimer + link to INSTRUCTIONS.md.
   - Attach: `dist/mc-agent-win.zip`.
3. The release gives you a stable public download URL.

## 5. GitHub Pages landing (recommended, free)
A static one-page site is included in `site/`. Deploy via the workflow in
`.github/workflows/pages.yml`:
1. Repo → **Settings → Pages** → Source: **GitHub Actions**.
2. Push to `main` → the workflow builds and publishes to
   `https://<you>.github.io/mc-agent/`.
3. On the repo **About**, set the **Website** field to that URL.

Preview locally (optional, needs no tools): just open `site/index.html`.

## 6. What to update after publishing
- Put the release/Pages URL into `docs/release.md` (distribution channel) and into your
  Discord / community posts.

## Honest note on "search"
- GitHub search will find you via the topics + description (good).
- Google/Яндекс indexing takes time and this tiny project won't outrank big sites.
- The effective channel is **sharing the link in Minecraft communities**, not SEO.
