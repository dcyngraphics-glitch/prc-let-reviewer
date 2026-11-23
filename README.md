# PRC LET Reviewer (English major)

> React + Vite phone-first LET reviewer: Gen Ed, Prof Ed and English specialization with real PRC pacing and a limited clue button.

**Status:** Active — 80-day plan, mock exams, mistake book and PWA build complete, verified 2026-11-22
**Goal:** A sourced, TOS-aligned LET reviewer for English majors with real PRC pacing, 5 clues/session, an 80-day adaptive plan and offline progress tracking.
**Deadline:** none
**Stakeholders:** Cyron Jay Salvador

## Context
Cyron wanted the same style as `bcaed-reviewer-app` but strictly for English majors. Research corrected the recalled exam rule: 150 items/subject is right, but the official timings are Gen Ed 2 h, Prof Ed 3 h, English 3.5 h. The owner's encrypted Sir Jay 2026 Gen Ed/Prof Ed PDF was unlocked and mined for sourced items.

## Scope
- In scope: React 19 + Vite PWA; phone-first UI; three subject sets; **3,507 clean keyed questions** (730 Gen Ed / 1,479 Prof Ed / 1,298 English) after a strict content gate; TOS-weighted area quotas; 20/40/40 daily split; timed and practice modes; scaled real pacing; 5 clues/session; 2 escalating hints/item; source tag per item; **80-day adaptive plan**; dashboard with streak/sample-honest accuracy; **single-subject mocks and a full exam-day simulation with PASS/FAIL verdict**; spaced-repetition mistake book; confidence tagging; progress export/import; localStorage persistence; installable offline build; GitHub Pages workflow.
- Out of scope: BCAEd app changes; Filipino-major specialization; ECEd/SNed/split-TLE majors; accounts/cloud sync; deployment (no Vercel or Pages push without explicit request).

## Plan
- [x] Deep research (5 researchers, 2 verifiers) → `docs/research/let-english/report.md`
- [x] Ingest encrypted Gen Ed PDF with owner's password → `docs/gen-ed-book.txt`
- [x] Build curated bank (76 items) then bulk-import to 3,300 sourced items
- [x] Build React app, timer, clue flow, scoring, persistence
- [x] Browser-test full session at 390 px (timer, clue cap, resume, results)
- [x] Expanded bank to 3,300, then content-gated to 1,781 clean items with reject log and strict validator
- [x] 80-day plan, dashboard, mock exams, mistake book, PWA build
- [x] Five blunt reviewers; implemented content gate, wall-clock timer, honest scoring, exam-day verdict, spaced repetition, weighted quotas
- [x] Audited and stress-tested; fixed soft-lock, double-advance, timer resume, quota mapping, import crash, aided accuracy and verdict autopsy
- [x] Backfilled 3 TOS gaps with 15 researched, rationalized items; coverage gaps now 0
- [x] Recovered 1,711 more keyed items with option-aware parsing; bank now 3,507
- [x] Post-exam answer review with explanations and both clues for every item, including blanks
- [x] Re-tagged recovered items that fell back to the subject name as topic; nav mistake count shows the saved queue
- [x] Deployed to GitHub Pages: https://dcyngraphics-glitch.github.io/prc-let-reviewer/

## Session Log
| Date | Work |
|---|---|
| 2026-11-22 | Research fan-out, PDF unlock, first full build, browser verification |

## Links
- Research: `docs/research/let-english/report.md`
- Setup/usage: `APP.md`
- Prior app (read-only): `../bcaed-reviewer-app/`
- Vault: `ObsidianVault/Projects/PRC LET Reviewer.md`

## Notes
- Question items are sourced, not authored from model memory; every item carries `source` and `verified`.
- Gen Ed uses the 10-area 2025 TOS; legacy 5-area names remain aliases for the PDF's chapter structure.
