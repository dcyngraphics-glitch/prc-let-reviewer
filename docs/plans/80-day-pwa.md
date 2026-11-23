# Design — 80-day plan, progress, mock exams and PWA

Date: 2026-11-22. Origin: user request, expanded scope after first build.

## Decisions (confirmed 2026-11-22)
- Progress/mistakes: local device only (localStorage), no sign-in.
- Daily load: 30 items/day — 10 Gen Ed, 10 Prof Ed, 10 English.
- Difficulty: adaptive + weekly/monthly ramp (levels 1→3; accuracy can promote/demote).
- Target: GitHub Pages repo `prc-let-reviewer` (base `/prc-let-reviewer/`).

## Goals
1. 80-day study plan generated from first launch date; each day has three 10-item sets with escalating difficulty.
2. Dashboard: day X/80, streak, accuracy by subject and TOS area, mistakes count, ready mock-exam status.
3. Mock exams: 150 items per subject, official timers, pass rule (75% average, no part below 50%), per-area breakdown.
4. Mistake book: wrong answers stored with question id, subject and timestamp; review queue with "mastered" removal.
5. PWA: installable on phone, offline question bank, manifest + raster icons + service worker.
6. Bank: ≥3,000 sourced, keyed items with source tags and two clues each.

## Non-goals
- Cloud sync / accounts (local only).
- Editing BCAED app.
- Deploying before explicit go-ahead.

## Data sources
- `scripts/import_banks.py` + `scripts/prepare_bank.py`: extract from owner's Sir Jay 2026 PDF (491 pages) and the 1,500-item third-party English bank; pair answer keys, dedupe, tag topics/difficulty, write compact JSON.
- Manual 76 items remain as curated exemplars.

## Acceptance criteria
- AC-1: `npm run validate:bank` passes with ≥3,000 items, every item keyed, sourced, clue-equipped.
- AC-2: Day 1 plan shows 10/10/10 items; difficulty level 1-dominant; day 40 level 2-dominant; day 80 level 3-dominant.
- AC-3: Answering a practice item wrong adds it to mistakes; marking mastered removes it.
- AC-4: Mock exam has 150 items and the official timer for the chosen subject; results show score and pass rule.
- AC-5: Dashboard reflects completed days and accuracy; data survives reload.
- AC-6: `dist/` contains manifest, sw.js and 192/512 PNG icons; Pages build uses `/prc-let-reviewer/` base.

## Test cases
- AC-1 → `npm run validate:bank` prints counts and PASS.
- AC-2 → browser: set plan start date 80 days ago, open dashboard, inspect day-80 set difficulty distribution via DOM/state.
- AC-3 → browser: answer wrong, open Mistakes, mark mastered, verify removal and persistence after reload.
- AC-4 → browser: start English mock, verify `150` items and `210:00` timer.
- AC-5 → browser: complete day 1, reload, verify streak/day counters.
- AC-6 → `npm run build` + inspect `dist/` and fetch live URLs after deploy.

## Risks
- Imported items have keyed answers but shallow rationales; clue text is topic-level and generated. Label honestly in UI.
- Topic tagging is keyword-based; weak-area stats are indicative, not official TOS sub-topic precision.
