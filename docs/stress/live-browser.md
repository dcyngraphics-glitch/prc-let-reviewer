# Live browser stress-test — LET reviewer

**Target:** http://localhost:5173/ (dev server verified HTTP 200; Vite + React 19)
**Date:** 2026-11-23 (Asia/Manila)
**Viewport:** 390 × 844, dpr 1, mobile emulation — re-applied after any navigation that dropped it
**Method:** real browser via `browser_exec`; DOM text, rendered state and `localStorage` read back after each interaction. Console hook installed via `Page.addScriptToEvaluateOnNewDocument`. **No app code was edited.** Only this file was written.

## Result summary

| Severity | Count |
|---|---|
| High | 4 |
| Medium | 3 |
| Low | 2 |
| **Total failures** | **9** |

Additional observations, passes and blockers are at the end. All values below are **observed**, not expected.

---

## F-01 (High) — Two Enter presses or two Next clicks in one tick skip a question

**Reproduce**
1. Dashboard → Gen Ed **Practice**.
2. Select an option, press Enter once to check (or click **Check answer**).
3. Dispatch two `keydown` Enter events in the same JS tick (holds/repeats produce the same pattern). Alternative: click **Next item →** twice in the same tick.

**Observed evidence**

- After two Enter events: settled DOM `qnum = "ITEM 3 · practice"`, `hud = ['💡 5/5','3/30']`, persisted session `index = 2`, `answerCount = 1`, `ids = 30`. The item at index 1 was never shown as answerable.
- After two `.click()` calls on **Next item →**: settled DOM `qnum = "ITEM 3 · practice"`, session `index = 2`, `answerCount = 1`.
- Control: two clicks on **Check answer** in one tick were correctly guarded — `answerCount = 1`, `feedback` rendered, button became `Next item →`.
- Console errors: `[]`.

**Why it matters:** skipped items are never offered to the user but still count as blanks in the final score (`results.blanks = session.ids.length - answered.length`). rapid Enter/Next is normal phone behaviour.

**Likely cause:** `next()` (AppFinal.jsx:168-175) has no in-flight guard; rapid events run against a stale `session` closure, so the index advances twice.

---

## F-02 (High) — Resuming a session whose timer already expired leaves it stuck at 00:00 forever

**Reproduce**
1. Start **30 timed** (Gen Ed).
2. In `localStorage`, set `let-english-session-v1.endsAt = Date.now() - 60000`.
3. Reload, click **Resume**, wait >2 s.

**Observed evidence**

- Before tamper: HUD `⏱ 24:00`, `secondsLeft = 1440`, `endsAt - Date.now() = 1440`.
- After tamper + reload: resume card `Unfinished session | Gen Ed · practice · item 1 of 30 | Resume`.
- After Resume, immediately: HUD `⏱ 00:00`, `qnum = ITEM 1 · practice`.
- After 2.2 s: timer `⏱ 00:00`, `results: false`, `qnum = ITEM 1 · practice`, primary button still `Check answer`, stored `secondsLeft = 0`, console `[]`.
- No auto-finish occurred; the only exits are answering all 30 items or **End session** (which discards).

**Likely cause:** the 500 ms tick returns early when `left === s.secondsLeft`; resume already set `secondsLeft = 0`, so `finishNow()` is never reached.

---

## F-03 (High) — Two tabs silently destroy each other's progress and resurrect stale sessions

**Reproduce**
1. Open the app in two tabs (A and B) at the same origin.
2. In A, answer several items.
3. Without reloading B, answer one item there.
4. In A, click Resume / Next; then reload B.

**Observed evidence**

- A before B wrote: `answers.gened = {total:20, correct:3}`, `answers.profed = {total:11, correct:2}`.
- B's in-memory dashboard showed `accuracy n/a — answer 6 more` for Gen Ed (stale total 14).
- After B answered one item: stored `answers.gened = {total:15, correct:2}`, `answers.profed = {total:10, correct:1}` — 6 Gen Ed answers and 1 Prof Ed answer from A were gone. No warning or conflict UI.
- A's resume card at that moment still read `Unfinished session | Prof Ed · weak · item 2 of 15 | Resume` while the stored session was `subject: gened` — the card is a mount-time snapshot.
- A then clicked Resume + Next: stored session became `subject: profed, index: 1`, overwriting B's Gen Ed session.
- Reloading B showed resume card `Unfinished session | Prof Ed · weak · item 2 of 15 | Resume` — B's own Gen Ed session was gone.
- Console errors in both tabs: `[]`.

**Why it matters:** last-writer-wins across two tabs with no `storage` event handling; a user with the PWA open twice can lose an entire study session without any indication.

---

## F-04 (High) — Importing a shallow-valid JSON file blanks the whole app

**Reproduce**
1. Dashboard → **Import progress**.
2. Choose a file containing exactly: `{"startDate":"2026-01-01","completedDays":[]}`.

**Observed evidence**

- Immediately after the file change event: `document.body.innerText = ""`, `#root.innerHTML.length = 0` — completely blank page, no error overlay, no alert.
- Console hook: `[]` (no captured error text).
- `localStorage['let-english-state-v1']` still held the previous full 10-key state, so the failed import was **not** persisted.
- A reload recovered: `h1 = "Day 2 of 80"`, `#root.innerHTML.length = 3905`, all 10 state keys present.

**Likely cause:** `importProgress` only checks `startDate` and `Array.isArray(completedDays)` before `setState(parsed)`. The dashboard render immediately calls `dueMistakes(state)` → `state.mistakes.filter(...)`, which throws on the missing field. `loadState()` has the normalization that the import path skips.

---

## F-05 (Medium) — Stale question IDs inflate the Mistakes badge and make "Review due items" a dead button

**Reproduce (state already present in this browser profile)**
1. Open **Mistakes**.
2. Click **Review due items**.

**Observed evidence**

- Pre-existing `state.mistakes` entries use IDs like `imp-ge-00289`, `imp-pr-00793`, `imp-en-00365` (27 entries). The live bank loaded from `/src/data/index.js` has counts `{gened:200, profed:818, english:763}` and IDs like `ge01`, `ge02`, `ge03`; `hasTarget('imp-ge-00289') = false`.
- With one such stale due entry: nav button `Mistakes (1)`, `h1 = "Due mistakes (1)"`, `.mistake` cards `0`, `Hide this item` buttons `0`.
- Clicking **Review due items**: `qnum` stayed `null`, `h1` stayed `Due mistakes (1)` — no navigation, no session, no error.

**Likely cause:** `dueMistakes()` counts entries whose IDs no longer resolve, the card render drops them via `if (!q) return null`, and `startDue()` filters them out then `startSet()` returns early on an empty ID list.

---

## F-06 (Medium) — Rapid double-hide writes duplicate IDs into `hiddenIds`

**Reproduce:** in a Mistakes card, call `.click()` twice on **Hide this item** in one tick (or double-tap).

**Observed evidence**

- Before: `hiddenIds = []`, `mistakes = [{id:'ge01',...}]`, card visible.
- After: `hiddenIds = ['ge01','ge01']`, `mistakes = 0`, `h1 = "Due mistakes (0)"`, `.mistake` cards `0`.
- No dedupe on either `hiddenIds` or the surrounding state update.

---

## F-07 (Medium) — Wall-clock timer fully trusts the device clock in both directions

**Reproduce / evidence**

- **Forward jump:** started Gen Ed mock (`qnum = ITEM 1 · mock · feedback withheld`, HUD `⏱ 2:00:00`, `1/150`, `ids.length = 150`, `uniqueIds = 150`, `secondsLeft = 7200`). Overrode `Date.now = real + 7200000` for 1.6 s. Result: results view rendered, `h1 = "Gen Ed · mock"`, score `0%`, detail `0 correct · 150 blank · 150 total`, `mockResults = [{subject:'gened', at:1795404273310, score:0, total:150, blanks:150}]`, session key removed. The result timestamp is the tampered clock value.
- **Backward jump:** started **30 timed** (HUD `⏱ 24:00`), overrode `Date.now = real - 3600000` for 1.2 s. HUD became `⏱ 1:24:00`, stored `secondsLeft = 5040` — 1 hour of extra answering time granted from a clock change.

No guard compares wall-clock time against a monotonic clock or rejects implausible jumps.

---

## F-08 (Low) — "Hide this item" in quiz feedback leaves the mistake in the book, with no way to recover it

**Reproduce**
1. Seed a one-item session for a valid bank ID (`ge01`), resume, answer it wrong, click **Hide this item** in the feedback panel, then open **End session** → dashboard → **Mistakes**.

**Observed evidence**

- Feedback: `Not quite — answer is C`, hide button present.
- `mistakes` before hide: `['ge01']`; after hide: `['ge01']` (unchanged); `hiddenIds` after hide: `['ge01']`.
- Dashboard nav then showed `Mistakes (0)`, `h1 = "Due mistakes (0)"`, `.mistake` cards `0` — the wrong answer is still stored but permanently invisible, and there is no unhide control.
- Contrast: the Mistakes-view hide button removes the entry from `mistakes` as well as adding it to `hiddenIds`; the two hide paths are inconsistent.

---

## F-09 (Low) — Resume card labels a timed session as "practice"

**Observed evidence:** with stored `mode: 'timed'`, `source: 'practice'`, the dashboard resume card read `Unfinished session | Gen Ed · practice · item 1 of 30 | Resume`. The card renders the `source` field, not `mode`, so a timed set is described as practice. The quiz itself correctly showed the timer.

---

## Observations that did **not** reproduce a failure

- **150-item mock:** Gen Ed mock produced `ids.length = 150`, `uniqueIds = 150`, HUD `⏱ 2:00:00`, progress `1/150`, 150 distinct questions rendered without error.
- **Reload/resume (normal):** answered item 1, advanced, reloaded → resume card `Gen Ed · practice · item 2 of 30`; after Resume: `qnum = ITEM 2 · practice`, HUD `23:55`, `💡 5/5`, `2/30`, session `index = 1`, `answers = 1`, `selected = null`, `checked = false`, console `[]`.
- **Rapid option clicks:** `[0,1,2,3,0]` clicked in one tick settled to `aria-pressed = ['true','false','false','false']`, stored `selected = 0` — last choice wins, no corruption.
- **Export/import round-trip:** export produced `let-reviewer-progress-2026-11-23.json`, `size = 2184`, `type = application/json`, beginning `{"startDate":"2026-11-22","completedDays":[1],"answers":...}`, and updated `Last exported: 11/23/2026, 9:30:20 AM`. Importing that same file back preserved `answers.gened = {total:15, correct:2}` and the dashboard view, console `[]`.
- **Storage quota:** filling `localStorage` to the real Chrome limit (`QuotaExceededError` on the 6th 1 MB chunk; ~5,002,776 chars used) still let the app replace its own state key, so no save failure was produced that way. Fault-injecting `QuotaExceededError` on `Storage.prototype.setItem` for `let-english-*` keys produced the intended banner `Progress could not be saved on this device. Export a backup from the dashboard.` with four attempted writes (`session`, `session`, `state`, `session`) and no console errors.
- **Keyboard Enter with focus on a button:** pressing real Enter after a programmatic option click checked the answer rather than re-selecting, because focus remained on `body`.
- **Offline:** `navigator.serviceWorker.controller = false`, `getRegistrations() = []` on the dev server. With CDP offline emulation, reloading `http://localhost:5173/` landed on `chrome-error://chromewebdata/` with body `ERR_INTERNET_DISCONNECTED`. The offline PWA claim is not observable in dev; the built `dist/` service worker was not exercised.

## Blockers / limitations

- Console-error capture returned `[]` even for F-04's blank render; React's render error was not captured by the installed hook. Evidence for F-04 is the blank DOM plus preserved localStorage.
- Screenshots were captured during the run but the harness path is overwritten on each capture, so no per-finding screenshot files were retained. Exact DOM/localStorage values above are the durable evidence.
- "End session" opens a native `window.confirm`, which blocks `Runtime.evaluate` until dismissed with `Page.handleJavaScriptDialog`.
- Browser state (both tabs, all injected localStorage fixtures) was left as-is; no app code or repo files other than this report were changed.
