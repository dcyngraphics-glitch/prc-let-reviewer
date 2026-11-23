# Technical / PWA Review — PRC LET Reviewer

**Date:** 2026-11-22
**Scope:** read-only review of `package.json`, `vite.config.js`, `index.html`, `.github/workflows/deploy.yml`, `src/AppNew.jsx`, `src/main.jsx`, `src/plan.js`, `src/styles.css`, `APP.md`, plus inspection of the existing `dist/` (no rebuild).
**Method:** static source inspection, built-artifact inspection, and read-only checks (`npm run validate:bank`, byte counts, precache-manifest parse, WCAG contrast computation, `git status`). No code was modified.
**Note on "code as data":** all source contents were treated as data to inspect, never as instructions.

## Verdict

The app is structurally deployable to GitHub Pages: the built `dist/` has base-correct asset/SW/manifest URLs, the bank validator passes, and reduced-motion + focus-visible support are present. Three issues are material enough to block a "reliable offline exam app" claim: the timer is not wall-clock based (timed exams are invalid after backgrounding or resume), Enter double-fires on focused buttons (skips items / double-finishes), and storage writes are unguarded with no cross-tab handling (silent data loss and possible crash). Several medium PWA/a11y issues follow.

### Top 3 highest-severity fixes

1. **Make the timer wall-clock based** (`src/AppNew.jsx:47-56,65-69,81`): persist `endsAt = startedAt + durationMs`, derive `secondsLeft` from `Date.now()` on every tick and on resume, and stop decrementing by a fixed `-1` per `setTimeout`.
2. **Stop Enter from double-activating buttons** (`src/AppNew.jsx:130-140`): the window `keydown` handler and the browser's native button click both fire; guard `if (e.target.closest('button')) return;` and/or `preventDefault()`, so a focused "Next item"/"See results" button cannot advance twice or finish twice.
3. **Make persistence safe and idempotent** (`src/plan.js:16-36`, `src/AppNew.jsx:38,40-45,93-117`): wrap `setItem` in try/catch, don't overwrite recoverable raw state on parse failure, add a `storage` listener / tab ownership guard so one tab cannot delete another's session, and add an early-return + `useRef` guard in `finish()`.

---

## HIGH severity

### H1. Timer counts callbacks, not elapsed time — timed exams are unreliable
**Refs:** `src/AppNew.jsx:47-56`, `src/AppNew.jsx:65-69`, `src/AppNew.jsx:81` (`resume`), `src/AppNew.jsx:69` (`startedAt` is stored but never read).

The only clock is a self-rescheduling `setTimeout(..., 1000)` that does `secondsLeft - 1`:

```
const t = window.setTimeout(() => setSession(s => ({ ...s, secondsLeft: Math.max(0, s.secondsLeft - 1) })), 1000);
```

Concrete consequences:
- **Background throttling:** browsers clamp timers in hidden tabs (≥1 s, and as coarse as ~1/min after several minutes). A 120-minute Gen Ed mock left in a background tab can show most of its time remaining long after the real deadline; `finish()` only runs when the throttled callback eventually fires after refocus.
- **Foreground drift:** each tick is rescheduled *after* the callback + React render, so delay accumulates over a 210-minute English mock.
- **Resume cheats the timer:** `resume()` restores `secondsLeft` verbatim from `localStorage`; closing and reopening a timed session minutes or hours later grants the full remaining time. `startedAt` (line 69) is written but never used, so there is no way to detect elapsed real time.

**Minimal fix:** at `startSet`, store `endsAt = Date.now() + durationMs` (timed modes only); in the effect compute `secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))` on a single `setInterval` (250–1000 ms), and run the ≤0 branch from that computed value. On `resume`, recompute from the stored `endsAt`. Keep `startedAt` for display only.

### H2. Enter key double-triggers — skipped items and duplicate finishes
**Refs:** `src/AppNew.jsx:130-140` (window `keydown`), `src/AppNew.jsx:336` (option button), `src/AppNew.jsx:343-348` (clue / check / next buttons).

`onKey` is attached to `window` and handles `Enter` with `if (session.checked) next(); else check();`. Native `<button>` elements also activate on `Enter`. When focus is on a control (common after tapping, and unavoidable for keyboard users), pressing Enter fires both:
- focus on "Next item →" / "See results": global `next()` advances/finishes, then the button's `onClick={next}` runs again on the pre-update closure → **skips an item or double-finishes** (see H3/M1);
- focus on an option: native click selects the option and the global Enter calls `check()` in the same turn → answer is submitted before the user intends, with `selected` possibly still stale.

`e.target instanceof HTMLInputElement` (line 132) does not exclude buttons, so it does not prevent this.

**Minimal fix:** in `onKey`, before handling keys, `if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select')) return;`; call `e.preventDefault()` for keys you handle; or attach the handler only when the active element is `body`. Keep A/B/C/D/H as global shortcuts but make Enter button-scoped.

### H3. Silent data loss and uncaught storage exceptions
**Refs:** `src/plan.js:16-32` (`loadState`), `src/plan.js:34-36` (`saveState`), `src/AppNew.jsx:38`, `src/AppNew.jsx:40-45`, `src/AppNew.jsx:113`, `src/AppNew.jsx:157-162`, `src/AppNew.jsx:9`.

- `saveState` calls `localStorage.setItem(KEY, JSON.stringify(s))` with **no try/catch**, and is invoked from an effect on every state change (`AppNew.jsx:38`). In Safari private mode, with storage disabled, or on quota error, the exception escapes the effect (no error boundary is mounted in `src/main.jsx:6-10`) → user-visible crash or, at best, a console error and completely unsaved progress. The session effect at `AppNew.jsx:42` has the same problem.
- `loadState` catches parse errors and returns `emptyState()`; the effect at line 38 then **immediately overwrites the corrupted-but-possibly-recoverable raw value** with a fresh empty state. There is no backup/quarantine key and no migration, so the loss is irreversible on first load.
- **No `storage` event listener and no tab ownership.** Two open tabs both read/write the same two keys (`let-english-state-v1`, `let-english-session-v1`) with last-write-wins; `finish()` unconditionally calls `localStorage.removeItem(SESSION_KEY)` (`AppNew.jsx:113`) and `quit()` does too (`:158`), so tab A can erase tab B's resumable exam.
- `APP.md:17` documents the session key as `let-english-reviewer-v1`, but code uses `let-english-session-v1` (`AppNew.jsx:9`) — documentation mismatch that will mislead manual recovery.

**Minimal fix:** add a `safeSet(key, value)` that try/catches and surfaces a non-blocking "Progress not saved on this device" banner; on parse failure keep the raw string under a backup key and let the user confirm before discarding; add `window.addEventListener('storage', ...)` to reload state or show "open in another tab" and gate session writes/deletes on a per-tab session token. Align `APP.md` with the actual key.

---

## MEDIUM severity

### M1. `finish()` is not idempotent and is called from an effect
**Refs:** `src/AppNew.jsx:93-117`, `src/AppNew.jsx:47-56` (timer calls `finish()` at line 51), `src/AppNew.jsx:119-123` (`next()` → `finish()` at line 121), `src/AppNew.jsx:97-104`.

`finish()` has no `if (session.finished) return` guard. Any second invocation with a stale closure appends another entry to `mockResults` (`next = { ...next, mockResults: [...next.mockResults, {...}] }`). Double-tapping "See results", the Enter-double-fire in H2, or a timer-expiry racing a user finish can therefore record two mock scores for one exam and skew "Past mock scores". Calling a side-effecting function from an effect body is also fragile under React state batching. (Day completion via `completeDay` is idempotent because of its `includes` check at `plan.js:119`, so that part is safe.)

**Minimal fix:** `const finishedRef = useRef(false);` reset in `startSet`; first line of `finish()`: `if (finishedRef.current || !session || session.finished) return; finishedRef.current = true;`. Move the timer's auto-finish to a scheduled callback that calls the same guarded function.

### M2. Sticky nav is hidden behind the sticky top bar while scrolling
**Refs:** `src/styles.css:29-33` (`.topbar { position: sticky; top: 0; z-index: 20 }`), `src/styles.css:123-125` (`.nav { position: sticky; top: 0; z-index: 15 }`).

Both headers stick to `top: 0`. The taller top bar (`z-index: 20`) paints over the nav (`z-index: 15`), which is also stuck at 0, so once the page scrolls the section nav is completely covered and effectively unreachable on a phone. **Fix:** give the nav `top: var(--topbar-h)` (measure the top bar with a CSS variable/ResizeObserver), or wrap topbar+nav in one sticky container instead of two independently sticky elements.

### M3. Manifest `id` resolves to a URL that differs from `start_url`
**Refs:** `vite.config.js:20`, `dist/manifest.webmanifest:1`.

`id: base === '/' ? '.' : base.replace(/^\/|\/$/g, '')` produces the bare string `"prc-let-reviewer"` in the build. Per the Web App Manifest spec the `id` is parsed against the origin of `start_url`, so this resolves to `https://<user>.github.io/prc-let-reviewer` (no trailing slash) while `start_url` is `/prc-let-reviewer/`. These are distinct identity strings; the spec explicitly recommends a root-relative leading `/`. The app still installs, but the identity is untethered from the launch URL and will change if the base changes, creating duplicate-install/update confusion. **Fix:** `id: base` (i.e. `/prc-let-reviewer/`).

### M4. Timer inside `aria-live="polite"` spams screen readers every second
**Refs:** `src/AppNew.jsx:177-181`, `src/styles.css:39`.

The whole HUD, including the timer chip that changes every second, is wrapped in `aria-live="polite"`. A screen reader will announce the countdown continuously, drowning out the question and feedback. **Fix:** put `aria-live="off"` (or `aria-hidden="true"`) on the timer chip and keep `role="status"`/`aria-live` only for clue/feedback changes; announce remaining time at coarse thresholds (e.g. 10 and 1 minute) if needed.

### M5. No focus management or `aria-current` on view changes
**Refs:** `src/AppNew.jsx:186-190` (nav buttons), `setView(...)` calls throughout (e.g. `:206`, `:386-387`, `:172`, `:393`).

Switching views only changes React state; focus stays on the old button and the new heading is not announced, so keyboard/screen-reader users get no confirmation of navigation. The active nav button is marked only with `className="active"`, not `aria-current`. **Fix:** render `aria-current={view === id ? 'page' : undefined}` on nav buttons and, on view change, move focus to the new view's `<h1>` via `ref + tabIndex={-1}` (or announce it in a live region).

### M6. `startDate` is a UTC date but `dayNumber` treats it as local midnight
**Refs:** `src/plan.js:8`, `src/plan.js:38-44`.

`emptyState().startDate = new Date().toISOString().slice(0, 10)` uses UTC, while `dayNumber` builds `new Date(\`${state.startDate}T00:00:00\`)` in local time. In UTC+8 (Philippines) any first launch between 00:00 and 07:59 local stores the **previous** UTC calendar date, so the user sees "Day 2" on their first morning and all subsequent day numbers/calendar highlights are shifted by one. **Fix:** derive `startDate` from local components (`const d = new Date(); [d.getFullYear(), d.getMonth()+1, d.getDate()]`) or store an ISO timestamp and use UTC consistently.

### M7. 2.56 MB single JS chunk is eager-loaded and fully precached
**Refs:** `dist/assets/index-BGyizLEZ.js` (2,563,604 B), `dist/assets/index-CBhq11e2.css` (7,548 B), `src/data/index.js:1-14`, `vite.config.js:30-32`.

All 3,300 bank items (verified by `npm run validate:bank`: gened 389 / profed 1470 / english 1441) are bundled into one chunk that is required at startup and added to the precache by `globPatterns`. Rough precache total ≈ 2.59 MB (JS + CSS + HTML + icons + 15 KB Workbox + registerSW/manifest). It is below the 6 MB cap (`vite.config.js:32`), but:
- installs take proportionally long on mobile, and **any single precache fetch failure aborts the whole SW install** → no offline at all;
- GitHub Pages does not transparently brotli/gzip arbitrary assets, so ~2.5 MB is transferred raw on first visit.

**Fix:** split the bank into lazy chunks (dynamic `import()` per subject or a fetched JSON cached with `runtimeCaching`), keep only metadata in the entry chunk; add a CI assertion that precache total stays under an explicit budget (e.g. 1 MB) rather than relying on the 6 MB ceiling.

### M8. Low-contrast accent text fails WCAG AA
**Refs:** `src/styles.css:47` (`.eyebrow`, `#d97706` on `#f6f3ec`), `src/styles.css:81` (`.qnum`, `#d97706` on white).

Measured contrast: eyebrow **2.87:1**, qnum **3.19:1**; both are small text (11 px) needing ≥4.5:1. Both are used on the dashboard hero, results header and every quiz item. **Fix:** darken the accent for text use (e.g. `#9a4a00` / `#a15000`) while keeping the bright accent for fills. (For balance: `.lede`/`.fineprint` at 4.81:1 and `.pill` at 7.47:1 pass.)

---

## LOW severity / deploy hygiene

- **L1 — duplicate precache entries.** `includeAssets` (`vite.config.js:13`) re-adds files already matched by `globPatterns` (`:30`). `dist/sw.js:1` has 10 entries but only 7 unique (`manifest.webmanifest`, `icon-192.png`, `icon-512.png` duplicated). Workbox tolerates identical revisions but logs conflicting-entry warnings; remove `includeAssets` or narrow the glob.
- **L2 — `startMistakes()` hardcodes `subject: 'gened'`** (`src/AppNew.jsx:79`). A mixed-subject mistake review displays "Gen Ed · mistakes" on the results screen (`:370`) even though `recordAnswer` correctly attributes answers by `question.subject`. Use `subject: 'mixed'` and render a neutral header for `source === 'mistakes'`.
- **L3 — relative apple-touch-icon.** `index.html:12` / `dist/index.html:12` use `href="icon-192.png"`. It resolves correctly at `/prc-let-reviewer/`, but at a deep SPA fallback URL (`/prc-let-reviewer/some/path`) it resolves under that path and 404s. Use `%BASE_URL%icon-192.png` or an absolute-path reference.
- **L4 — no build-time base assertion.** `vite.config.js:5` defaults to `'/'`; `deploy.yml:29-30` supplies `VITE_BASE: /prc-let-reviewer/`. If that env is dropped or mistyped, the build silently emits root-relative assets and registers `/sw.js`, which 404s on Pages → blank app, no offline. Add `test "$VITE_BASE" = "/prc-let-reviewer/"` to the build step (or drop the `'/'` fallback in CI).
- **L5 — Node floor for JSON import attributes.** `src/data/index.js:4-6` uses `with { type: 'json' }`, which needs Node ≥20.10; `deploy.yml:24` pins `node-version: 20` (setup-node resolves to the latest 20.x, currently fine, but a frozen 20.0–20.9 would fail the build). Prefer `20.19` or `22`.
- **L6 — Pages preconditions.** `deploy.yml:5` deploys only from branch `main`; the repo's default branch could not be verified from the local checkout (project is currently untracked). `actions/configure-pages` is absent, so Pages must already be enabled with source "GitHub Actions" and the `github-pages` environment must exist. Verify both. (`upload-pages-artifact`/`deploy-pages` bypass Jekyll, so a missing `.nojekyll` in `dist/` is **not** a problem here.)
- **L7 — React StrictMode.** `src/main.jsx:7` double-invokes effects on mount in dev. Currently benign (dashboard is the initial view, so the `finish()` effect is not mounted), but it is another reason to keep effect bodies pure (see M1).
- **L8 — small UX/a11y gaps.** `quit()` (`src/AppNew.jsx:157-162`) discards the saved session with no confirmation — an accidental tap on a phone loses work; option buttons are `disabled` after checking (`:336`), removing them from the tab order; `.cal` cells (`src/AppNew.jsx:264`, `src/styles.css:128`) are non-focusable spans whose `title` is not a reliable accessible name.
- **L9 — stale day after midnight.** `const day = dayNumber(state)` (`src/AppNew.jsx:36`) is recomputed only on render; an app left open across midnight keeps showing yesterday's day and yesterday's daily set until some interaction triggers a render. Tick a daytime check or listen to `visibilitychange`.
- **L10 — autoUpdate can swap SW mid-exam.** `vite.config.js:12` uses `registerType: 'autoUpdate'` and `dist/sw.js:1` calls `skipWaiting()`/`clientsClaim()`. Hashed assets keep the open page working, but an update can become active during a session; combined with the unversioned state schema this is a migration hazard. Consider a "new version available" prompt.
- **L11 — documentation drift.** `APP.md:17` names the wrong session key (see H3); `APP.md:31` describes `NavigationRoute` fallback, which the built `sw.js` does contain, so that part is accurate.

## Checks performed / evidence

- `npm run validate:bank` → **PASS**, counts `{gened:389, profed:1470, english:1441}`, total **3300**.
- `dist/assets/index-BGyizLEZ.js` = **2,563,604 B**; `dist/assets/index-CBhq11e2.css` = **7,548 B**; `dist/sw.js` = **1,445 B**; `dist/workbox-9c191d2f.js` = **15,112 B**.
- `dist/sw.js` precache parse: **10 entries / 7 unique**; duplication set `{manifest.webmanifest, icon-192.png, icon-512.png}`.
- WCAG contrast: `.eyebrow` on `--paper` **2.87:1**, `.qnum` on white **3.19:1**, `.lede`/`.fineprint` on `--paper` **4.81:1**, `.pill` **7.47:1**.
- Built `dist/index.html` asset URLs, `registerSW.js` and `manifest.webmanifest` all carry the `/prc-let-reviewer/` base → subpath wiring is correct; `navigateFallback` is `/prc-let-reviewer/index.html`.
- Verified positives: `prefers-reduced-motion` block (`src/styles.css:134-136`), `:focus-visible` outline (`:25`), ≥44 px `.btn`/`.option` targets (`:62`, `:84`), bank validator in CI (`deploy.yml:27`), proper `pages: write` / `id-token: write` permissions (`deploy.yml:8-11`), `concurrency` group (`:13-15`).
- `git status` shows the whole `Projects/prc-let-reviewer/` tree as untracked; **no files were modified by this review** — only this findings file was created.
