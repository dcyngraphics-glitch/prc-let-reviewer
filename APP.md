# APP.md — PRC LET Reviewer

## Run locally
```bash
cd C:/Users/bryan/Documents/Hermes/Projects/prc-let-reviewer
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run validate:bank
```

## What is implemented
- **Home** — one card per subject: Gen Ed (150/120 min), Prof Ed (150/180 min), English (150/210 min). Each card offers a timed set or untimed practice.
- **Timer** — shortened sets keep the real seconds-per-item pace: `officialMinutes × 60 × itemCount / 150`. The timer and remaining clue count stay visible while answering.
- **Clues** — 5 uses per session, at most 2 escalating hints per item; a hint needs a selected answer first. Level 1 is a topic/strategy nudge; level 2 eliminates a distractor. Never reveals the key.
- **Feedback** — after checking: correctness, rationale and source tag. Results show score, per-TOS-area breakdown and the LET passing rule (75% average, no part below 50%).
- **Persistence** — an unfinished session is stored in `localStorage` under `let-english-reviewer-v1` and can be resumed after reload; it clears when the set finishes.
- **Keyboard** — A/B/C/D select, C is not used for clue (H reveals a clue), Enter checks or advances. All controls are ≥44 px for phone use.

## Data and sourcing
- `src/data/gened.js`, `profed.js`, `english.js` — every item has `topic`, `options`, `answer`, `rationale`, `clue1`, `clue2`, `source`, `verified`.
- Gen Ed/Prof Ed items: `docs/gen-ed-book.txt`, extracted from the owner's password-protected 491-page *2026 Extensive Reviewer* (Sir Jay); answer letters checked against the book's rationales/answer keys.
- English items: free third-party *LET English Specialization Reviewer Sets 1–10*, whose own keys were checked. These are **not** official PRC-released items.
- Exam rules and topic weights: `docs/research/let-english/report.md` (independent verification of claims C1–C5).

## 80-day plan, dashboard and PWA (2026-11-22)
- **80-day plan** — starts only when you press **Start my 80 days**; before that the counter shows "not started" and daily sets are hidden. A Restart button clears the clock without deleting answers. Generated from that date; 10 items per subject per day (30/day). Weeks 1–4 level 1, 5–8 level 2, 9–12 level 3; accuracy <50% eases a level, ≥85% advances one. One prior mistake is swapped into each daily set when available.
- **Dashboard** — day X/80, completed days, streak, per-subject accuracy, and buttons for today's three 10-item sets.
- **Mock exams** — 150 items per subject, official timers (120/180/210 min), result scored against 75%/50%, saved locally.
- **Mistake book** — wrong answers saved with timestamp; a later correct answer removes the item, or use "Mark mastered". Data lives in `localStorage` only.
- **PWA** — `vite-plugin-pwa`, manifest, 192/512 PNG icons, service worker with `NavigationRoute` fallback; offline question bank. `VITE_BASE` sets the Pages subpath (`/prc-let-reviewer/`); `.github/workflows/deploy.yml` builds with that base and uses `upload-pages-artifact` + `deploy-pages`.
- Run a Pages-shaped build locally: `VITE_BASE=/prc-let-reviewer/ npm run build`.

## Review fixes (2026-11-23)
Five blunt reviewers produced `docs/reviews/{content-audit,test-taker-review,exam-realism,technical-review,pipeline-review}.md`. Implemented:
- Content gate: `scripts/clean_bank.py` quarantines garbled/ambiguous/fallback items into `rejects.jsonl`; bank is 1,781 clean items; `validate:bank` now enforces structure, uniqueness, clue safety and minimum counts. A strict reading of the old bank found only 58 trustworthy items — that is why the count dropped.
- Honest scoring: blanks count as zero; results show correct/blank/total; accuracy shows `n/a` until 20 answers; difficulty ramp fixed to 1/2/3 across the three month blocks.
- Exam realism: daily quota is 6/12/12 (20/40/40); area quotas follow TOS sections; mock/exam modes disable clues and per-item feedback; exam-day runs all three parts and computes weighted average + 50% floor → PASS/FAIL.
- Retention: missed items use 1/3/7/14/30-day boxes; guessed-correct items enter the queue; weak-area drill and due-today review added; confidence tagging (guess/unsure/sure) added.
- Technical: wall-clock timer via `endsAt`, Enter key guarded, storage writes wrapped, finish idempotent, local-date plan start, accessible HUD/contrast, manifest id fixed, progress export/import.

## Audit and stress test (2026-11-23)
Five more auditors wrote `docs/stress/{live-browser,static-logic,content-integrity,pwa-deploy,premortem}.md`. The premortem used Klein's premortem and Munger's inversion (creative-ideation). Fixed: weak-drill soft-lock, schema-less import crash, Prof Ed quota names mapped by insertion order, rapid Enter/Next double-advance, expired-timer resume deadlock, stale mistake IDs, duplicate hidden IDs, dead 30-day SRS box, exam parts 2/3 bypassing quotas and hidden items, clue-aided answers inflating accuracy, hidden by-area table on FAIL, streak after day 80, identical repeated sets, cross-tab warning. `npm run coverage` now reports the 3 under-covered TOS areas instead of silently backfilling them.

## Coverage and tab sync (2026-11-23)
Added 15 researched questions from LETPass's free English-major sample pages (published answers and rationales) into Children & Adolescent Literature, Contemporary/Popular/Emergent Literatures and Remedial Instruction. `npm run coverage` now reports 0 gaps. Progress state syncs across tabs via the `storage` event; a session opened in another tab is marked read-only with a takeover banner.

## Bank expansion to 3,507 (2026-11-23)
`scripts/recover_bank.py` re-parses the committed raw PDF text with option-aware continuation handling and rationale-letter cross-checks. It recovered 1,711 additional keyed items with new `rec-*` IDs, so existing saved progress keeps working. Bank: 3,507 items (730 / 1,479 / 1,298); `npm run coverage` still reports 0 gaps; strict validator passes. 86% of items have key-only explanations, disclosed in the UI.

## Post-exam answer review (2026-11-23)
Clue button is hidden during mock/exam mode; answers, explanations and both clues are revealed only after submission on the results screen. The review covers every item in all three exam-day parts, including blanks (scored zero), with filters for All / Wrong / Blank. Each row shows your answer, the keyed answer, a "Why" line, both clues and the source. Key-only explanations are labelled honestly rather than presented as full rationales.

## Area tags and mistake count (2026-11-23)
`scripts/retag_untagged.py` re-tagged the recovered items whose topic had fallen back to the subject name (248 Gen Ed, 484 English), and `scripts/apply_general_map.py` applied a curated review of what that keyword pass could not place. Every item now carries a real TOS area or the neutral bucket `General` (38 Gen Ed items) — the subject name is never shown as an area, and Gen Ed sets draw from the 10 official TOS areas. The nav "Mistakes (n)" count is the size of the saved spaced-repetition queue; the Mistakes screen still leads with "Due mistakes (n)" for today's review.

## Exam-day soft-lock fix (2026-11-23)
Found by running a full 450-item exam day: after part 1 the app could answer but "Next item" never advanced, so the run stuck at part 2 item 1. Cause: `next()` set `advanceRef.current = true` and returned early into `finishNow()`, which built the next part but never cleared that guard (its 120 ms reset lives after the early return). Fixed by clearing `advanceRef` in the part-transition branch. Re-ran the whole exam day: 3 parts, 450 items, verdict FAIL 29% weighted (Gen Ed 23% / Prof Ed 36% / English 26%), 450 review rows.

## Known limits
- 3,507 clean practice items, not an official PRC question bank; 86% have key-only explanations, so treat them as keyed practice, not explanations.
- Topic tags are keyword-derived and still approximate; weak-area stats are indicative.
- Imported source locators include a stem-hash ref, not a page number; traceability is partial.
- Some source items have awkward phrasing inherited from the reviewer books; they are kept where the answer key is verifiable.
- The 2025 TOS uses 10 Gen Ed areas while 2026 program bulletins still publish 5; the app uses 10 as primary categories.
