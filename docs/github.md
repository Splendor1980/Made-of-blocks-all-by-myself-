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
A static one-page site (no build step) lives at **`docs/index.html`** and is served
directly from the `main` branch — no workflow or extra token scope needed:
1. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch `main` →
   folder `/docs` → **Save**.
2. After a minute, the landing is live at
   `https://<you>.github.io/<repo>/` (e.g.
   `https://splendor1980.github.io/Made-of-blocks-all-by-myself-/`).
3. On the repo **About**, set the **Website** field to that URL.

Preview locally (optional, no tools): just open `docs/index.html`.

Note: GitHub Pages serves only the `/` or `/docs` folders; that's why the landing is
under `docs/`. The other `.md` files in `docs/` are served as plain files (harmless).

### Optional SEO base (already committed)
- `docs/robots.txt` — allows indexing, points to the sitemap.
- `docs/sitemap.xml` — lists the landing + repo URLs.
These get published with every push and are enough for a *basic* indexing signal.

### Optional: register in Google Search Console (needs YOUR Google account)
1. Go to https://search.google.com/search-console → add property → type the Pages URL.
2. Pick verification: **HTML file** — download the verification file, place it as
   `docs/<verification>.html`, commit+push (I can add it if you paste the filename).
3. Submit `sitemap.xml` in Search Console.
> Honest expectation: this makes the page *technically findable*, but it will NOT
> produce meaningful traffic for this niche — the real channel is sharing the link
> in Minecraft communities.

## 6. What to update after publishing
- Put the release/Pages URL into `docs/release.md` (distribution channel) and into your
  Discord / community posts.

## Honest note on "search"
- GitHub search will find you via the topics + description (good).
- Google/Яндекс indexing takes time and this tiny project won't outrank big sites.
- The effective channel is **sharing the link in Minecraft communities**, not SEO.
