# PWA / Deploy audit — prc-let-reviewer

Date: 2026-11-23. Read-only audit. No rebuild, no deploy, no app-code edits.
Evidence sources: `vite.config.js`, `index.html`, `.github/workflows/deploy.yml`, `package.json`, and on-disk `dist/` (built with `VITE_BASE=/prc-let-reviewer/`). File mtimes used as stale-dist evidence.

## Verdict

Installability and base-path wiring inside `dist/` are **consistent and deploy-ready**. Three material risks remain: (1) no GitHub remote/repo matching the hard-coded `/prc-let-reviewer/` base, (2) the project sits untracked inside a monorepo whose root `git add -A` stages unrelated credentials and artifacts, (3) a single 1.49 MB JS chunk with no splitting.

## Installability — PASS (with one note)

| Check | Evidence | Result |
|---|---|---|
| Manifest `id` / `start_url` / `scope` | `dist/manifest.webmanifest`: all three = `/prc-let-reviewer/` | PASS — root-relative, matches base, consistent install identity |
| Raster icons | `dist/icon-192.png` = PNG 192x192 RGBA (1,101 B); `dist/icon-512.png` = PNG 512x512 RGBA (3,285 B), verified with `file` | PASS — both required raster sizes present, not SVG-only |
| Manifest icon refs | `icons[].src` = `/prc-let-reviewer/icon-192.png` and `/prc-let-reviewer/icon-512.png`, type `image/png`, 512 has `purpose: any maskable` | PASS — paths resolve under base |
| Precache manifest | `dist/sw.js` precaches `registerSW.js`, `manifest.webmanifest`, `index.html`, both icons, `assets/index-Wa5Elvaf.js`, `assets/index-DGyT5trA.css` | PASS — non-empty; 1.49 MB JS is under the 6 MB `maximumFileSizeToCacheInBytes` cap |
| Navigation fallback | `dist/sw.js` contains `new e.NavigationRoute(e.createHandlerBoundToURL("/prc-let-reviewer/index.html"))` | PASS — SPA fallback registered at the correct subpath |
| SW registration | `dist/registerSW.js` registers `/prc-let-reviewer/sw.js` with `scope: '/prc-let-reviewer/'`; `sw.js` has `skipWaiting()` + `clientsClaim()` (autoUpdate) | PASS |
| HTML meta | `dist/index.html` has `mobile-web-app-capable`, `apple-mobile-web-app-capable`, status-bar style, apple title, `viewport-fit=cover`, `theme-color`, `description`; `apple-touch-icon` is relative `icon-192.png` (resolves to `/prc-let-reviewer/icon-192.png`) | PASS |
| `404.html` | Absent from `dist/`; `grep` for `BrowserRouter|HashRouter|createBrowserRouter|useNavigate|window.location|location.hash|<Routes>` in `src/` found nothing | OK — no client-side router, so GitHub Pages deep links are not a concern; SW NavigationRoute is still present |

Note (non-blocking): `workbox-9c191d2f.js` is loaded by `sw.js` via `importScripts` but is **not** in the precache list; if the HTTP cache evicts it, offline SW startup could fail. The precache array also lists icons/manifest twice (from `includeAssets` plus `globPatterns`) — harmless duplication.

## Base paths — internally consistent, but target repo unconfirmed

- `vite.config.js:5` `const base = process.env.VITE_BASE || '/'`; `start_url`, `scope`, `id`, and both icon paths derive from `base` — single source of truth.
- `dist/index.html`: module script and stylesheet are `/prc-let-reviewer/assets/...`; injected `<link rel="manifest">` and `registerSW.js` are `/prc-let-reviewer/...`. No stray root-relative or unrewritten URLs. `index.html:12` apple-touch-icon stays relative and is correctly prefixed by Vite.
- Workflow sets `VITE_BASE: /prc-let-reviewer/` on the build step and asserts `test -f dist/manifest.webmanifest && grep -q '/prc-let-reviewer/' dist/index.html`.
- **Risk:** `git rev-parse --show-toplevel` = `C:/Users/bryan/Documents/Hermes`; the project has **no own `.git`**. Remotes are `origin` → `github.com/dcyngraphics-glitch/tindahan-pos.git` and `letprep` → `github.com/dcyngraphics-glitch/let-prep-bcaed.git`. **No remote named for, or pointing to, a `prc-let-reviewer` repo exists.** If this workflow is committed to either existing repo, Pages serves at `/tindahan-pos/` or `/let-prep-bcaed/`, and every asset/manifest/SW URL under `/prc-let-reviewer/` 404s. Confirm and create the target repo before deploying. Pages source must be **GitHub Actions** (the workflow uses `upload-pages-artifact@v3` + `deploy-pages@v4`).

## Stale dist — NOT stale (mtime evidence)

| File | mtime |
|---|---|
| newest source: `src/styles.css` | 2026-11-23 09:07:44 |
| `src/main.jsx`, `vite.config.js` | 2026-11-23 09:07:26 |
| `src/AppFinal.jsx` | 2026-11-23 09:07:08 |
| `src/plan2.js` | 2026-11-23 09:06:23 |
| `dist/index.html`, `manifest.webmanifest`, `assets/*`, `registerSW.js` | 2026-11-23 09:12:59 |
| `dist/sw.js`, `workbox-*.js` | 2026-11-23 09:13:05 |
| `public/icon-192.png`, `icon-512.png` and their `dist/` copies | 2026-11-22 23:01:05 |

`dist` build artifacts (09:12:59–09:13:05) are **newer than every source file** (max 09:07:44) — the build reflects current sources. Icons are unchanged copies from `public/` (same mtime), consistent with Vite's public-asset copy, not staleness.

## Workflow review

- Node pinned `20.19` — adequate for Vite 6 and JSON import attributes (≥20.10). `checkout@v4` / `setup-node@v4` are current stable majors.
- `npm ci` + `npm run validate:bank` run before build; no test/type-check script exists in `package.json`, so none is expected.
- Permissions: `contents: read`, `pages: write`, `id-token: write` — correct for the artifact flow. `concurrency: group pages, cancel-in-progress: true` present.
- Trigger: `push` to `main` plus `workflow_dispatch`. Pushing `main` auto-publishes with no manual gate — review/branch workflow required by standing policy (commit to a branch, deploy only on explicit signal).

## Bundle size

- `dist/assets/index-Wa5Elvaf.js` = 1,494,799 bytes (~1.43 MiB); CSS 7,942 B; `workbox-*.js` 15,112 B; `sw.js` 1,445 B.
- Single unchunked JS bundle; `vite.config.js` has no `manualChunks`. The question banks (`src/data/imported/*.json`, 0.5–1.5 MB each) are compiled into this one chunk. Under the 6 MB precache cap, so installability is unaffected, but first load is heavy. Splitting would improve caching/execution, not first-visit bytes for a PWA that precaches everything by design.

## Secrets / large files / commit inventory

- Within `prc-let-reviewer`: no `.env*` files; `git check-ignore` confirms `.gitignore` blocks `dist/`, `.env*`, `node_modules/`. Credential-pattern scan (ghp_/sk-/AIza/private key/secret assignments, excluding question-bank data, lockfile, dist, node_modules) found **nothing**. The only textual "secret" hits were ordinary English question-bank prose and `id-token: write` (a workflow permission, not a credential).
- Largest files in project (build inputs/docs, not shipped in `dist/`): `assets/source/UPDATED EXTENSIVE BOOK VERSION 2027 B3.pdf` 8.64 MB, `docs/gen-ed-book.txt` 2.21 MB, `docs/gen-ed-book-raw.txt` 1.63 MB, `assets/source/LET_English_Specialization_Reviewer_Sets_1_to_10_Combined.pdf` 0.91 MB, plus imported JSON banks ~1.5 MB each. Repo would be ~15+ MB but `dist/` stays 1.5 MB.
- **Risk — monorepo commit scope:** the project is entirely untracked (`?? ./`) inside the Hermes monorepo. A root-level `git add -A --dry-run` would stage, among unrelated projects, `Projects/tindahan-pos-apk/project/signing-passwords.txt`, `Projects/tindahan-pos-apk/project/android-keystore`, signed APKs, an embedded git repo `Projects/jonard`, and many MB of other projects' assets. Within this project's own standalone repo the `.gitignore` is adequate; the danger is committing from the wrong root. Verify with `git ls-files` / scoped `git add` before any push.

## Top 3 risks

1. **Base path has no matching repo** — `/prc-let-reviewer/` is hard-coded in manifest/SW/assets/workflow, but no such GitHub remote exists (`origin` = tindahan-pos, `letprep` = let-prep-bcaed); deploying from the wrong repo 404s every asset and the PWA files.
2. **Monorepo staging of credentials** — `git add -A` at the Hermes root would stage `signing-passwords.txt` and `android-keystore` from `tindahan-pos-apk` plus an embedded repo; the project is untracked and has no own `.git`.
3. **1.49 MB unchunked JS bundle** — no `manualChunks`; all question banks ship in one precached chunk, inflating first load (installability itself is fine).
