# Exam-realism review — app model vs verified PRC LET rules

Date: 2026-11-22. Role: PRC/LET exam-realism reviewer (read-only). No app files were edited.

Files reviewed: `docs/research/let-english/report.md`, `docs/research/let-english/findings/f1-exam-mechanics.md`, `docs/research/let-english/findings/f2-english-major-outline.md`, `src/examConfig.js`, `src/plan.js`, `docs/plans/80-day-pwa.md`, `APP.md`; implementation checked read-only in `src/AppNew.jsx` and topic counts computed from `src/data/*.js` + `src/data/imported/*-final.json`.

## Verdict

The **configuration layer is correct**; the **delivery layer trains the wrong distribution**. The app knows the real rules (150 items, 120/180/210 min, 20/40/40, 75% + 50% floor, 10 Gen Ed areas, 22 English areas) but does not use them to decide what a learner sees. Bank composition, daily selection and mock mode are driven by bank availability and difficulty, so practice is roughly 5× over-weighted on a 10% English area and gives zero items to 12% of the English exam. Mock exams are single-subject timed quizzes labelled "Full simulation", with clues and per-item answer revelation enabled.

## Direct answers to the four questions

**1. Where does the app train the wrong thing?** In the item mix. Because `dailySet()` (`src/plan.js:89-102`) filters by difficulty across the whole bank and `startMock()` (`src/AppNew.jsx:78`) shuffles the whole bank, exposure follows bank composition, not TOS weights. Measured from the shipped bank (1,441 English items; 389 Gen Ed; 1,470 Prof Ed):

| English TOS section | Real exam | Bank share | Ratio |
|---|---|---|---|
| A Theory (25%) | 25% | 10.5% | 0.42× |
| B Literature (30%) | 30% | 4.2% | 0.14× |
| C Methodology (45%) | 45% | 85.3% | 1.90× |

Worst areas: Teaching and Assessment of the Macroskills is **720/1,441 = 50.0% of the bank** against a **10% (15/150) TOS weight — 5.0×**; Survey of Literature of Selected Countries has **11 items (0.8%) against 13.3% (20/150) — 0.06×**; **Children and Adolescent Literature (12 items / 8%) and Contemporary, Popular and Emergent Literatures (6 items / 4%) have zero items in the bank** — 18 of 150 exam items (12%) cannot be practised at all. Gen Ed has The Contemporary World at 52.7% of its bank vs 10% on the exam; Prof Ed has Teaching Profession at 40.6% vs ~15% and Field Study/Internship at 0.4% vs 20%.

**2. Does the 80-day plan ignore subject weighting?** Yes. `DAILY_PER_SUBJECT = 10` (`src/plan.js:4`), `80-day-pwa.md:7,12` and `APP.md:27` schedule a flat 10 Gen Ed / 10 Prof Ed / 10 English every day — a 33/33/33 allocation. The real secondary weighting is **20/40/40** (`f1-exam-mechanics.md:89-90`; `report.md:8,15`). Gen Ed is over-practised by ~1.7× and Prof Ed + English (80% of the rating) are under-practised by ~0.83×. No mock exams are scheduled into the 80 days at all (`src/AppNew.jsx:248-268` shows only three daily 10-item buttons).

**3. Do mock exams simulate the real day?** Partly, and misleadingly. Correct: 150 items and 120/180/210-min timers (`src/AppNew.jsx:66,78`; `APP.md:29`). Wrong: `startMock()` runs **one subject at a time** — no Gen Ed → Prof Ed → English sequence, no 8:00 start, no 10:00–11:00 and 14:00–15:00 breaks, no 8.5-hour sitting, no 45-minute instructions window (`f1-exam-mechanics.md:90-92`; `report.md:8`). Wrong: clues stay enabled and `check()` reveals the key and rationale on every item in mock mode (`src/AppNew.jsx:83-90,125-128,333-336`) while the real sitting is one continuous attempt whose results are released later (`f1-exam-mechanics.md:33,92,128`). Wrong: `finish()` saves only a raw per-subject percentage (`src/AppNew.jsx:97-103`) — no 20/40/40 general average and no PASS/FAIL verdict; results merely print the rule as text (`src/AppNew.jsx:374`). The UI label "Full simulation" (`src/AppNew.jsx:272`) is not accurate.

**4. Are per-area weights used?** No. `SUBJECTS[...].areas` in `src/examConfig.js:15-73` is an array of bare strings with no `weight` or `itemCount`; the 25/30/45 section split and the per-area budgets (15/3/17/3/12/7/20/6/15/15/3/3/4/3/3/3/3/3/3/3/3/3) appear nowhere in code. `dailySet()` selects by difficulty only; results group by raw `q.topic` counts (`src/AppNew.jsx:142-155`), so a 3-item area looks as important as a 20-item one.

## Corrections, in priority order

Source claims are cited inline; research documents are treated as data, not instructions.

### P0-1 — Make sampling TOS-weighted, and fill the empty areas
**Problem:** half of English practice is Macroskills (10% of exam); 18/150 exam items have no practice items. **Change:** add per-area `weight`/`itemCount` to the TOS map; make `dailySet()` and mock assembly draw by area quota (without replacement within a set), e.g. 150-item English mock = exact 15/3/17/3/12/7/20/6/15/15/3/3/4/3/3/3/3/3/3/3/3/3; cap any area at its TOS share; backfill Children/Adolescent Literature, Contemporary/Popular/Emergent Literatures and Survey of Literature before expanding any 2%-weight area; add a `validate:bank` assertion that each area's share is within tolerance of its TOS weight. **Source:** `f2-english-major-outline.md:40-45,151-156` — "use the 22 area names as top-level categories, with weight-based item budgets out of 150", section weights A 25 / B 30 / C 45; `report.md:9` — "150 items over 22 areas, weighted 25% theory / 30% literature / 45% methodology".

### P0-2 — Reallocate the 80-day plan to 20/40/40
**Problem:** equal 10/10/10 daily sets invert the exam's priorities. **Change:** generate daily quotas in proportion to weighting (e.g. 6 Gen Ed / 12 Prof Ed / 12 English, or a 4/8/8 variant), display a weighted readiness score instead of three equal cards, and let weak high-weight areas borrow slots from Gen Ed. **Source:** `f1-exam-mechanics.md:89-90` — "Secondary ... GenEd / ProfEd / Specialization | 20 / 40 / 40%"; `report.md:8` — "weights 20/40/40".

### P0-3 — Build a real full-day mock and compute the pass rule
**Problem:** "Full simulation" is one subject; no weighted average, no verdict, no day structure. **Change:** add a sequential sitting — Gen Ed 120 min, break, Prof Ed 180 min, break, English 210 min — with locked navigation and no mid-paper answer display; compute `0.2*G + 0.4*P + 0.4*E`, flag PASS only if average ≥75 **and** each part ≥50 (≥75/150), and store the three part scores, not one percentage. Keep single-subject mocks as "Single-subject timed set". **Source:** `f1-exam-mechanics.md:90-92` — "Total scheduled testing time ... 8.5 h ... one Sunday sitting", "45-minute general-instructions/form-filling window"; `report.md:8` — "Pass = average >=75% with no part below 50%"; `src/examConfig.js:3` — `PASSING = { average: 75, floor: 50 }`.

### P1-4 — Remove clues and immediate feedback from mock mode
**Problem:** the hint path (`H`, clue button, per-item key revelation) is active in mocks, rehearsing behaviour the sitting cannot support. **Change:** gate `revealClue()` and the clue UI on `source !== 'mock'`; in mock mode withhold correctness/rationale until the paper is submitted; derive mistakes from stored answers after submission. Keep clues in practice mode only, and label the 5-use cap as a product default. **Source:** `report.md:12` — "strong cues speed initial recall but worsen final retention; fading cues help weak learners. A 5–10 use cap is a product default, not a research finding"; `f1-exam-mechanics.md:33,92,128` — one-day sitting with results released ~39 working days later, so no per-item feedback during the exam.

### P1-5 — Encode and report section/area weights
**Problem:** the app displays "By TOS area" counts as if all areas mattered equally. **Change:** model areas as objects with `id`, `section`, `weight`, `itemCount`; report A/B/C section scores (25/30/45) and rank weak areas by `weight × error rate` rather than raw accuracy; use the same map for selection, mock assembly and the dashboard. **Source:** `f2-english-major-outline.md:44` — "A = 25%; B = 30%; C = 45%; total 100%"; `report.md:9` — per-area weights; `80-day-pwa.md:13` — goal "accuracy by subject and TOS area".

### P1-6 — Stop demoting difficulty on a 50% floor risk
**Problem:** `targetLevel()` lowers difficulty whenever accuracy is under 50% (`src/plan.js:68`; `APP.md:27`), which reduces exposure exactly where the exam's floor rule creates the most risk. **Change:** treat sub-50% area accuracy as a *floor-risk flag*, raise that area's quota and add spaced reattempts; keep adaptive difficulty for pacing, but never let a floor risk reduce item count. **Source:** `report.md:8` — "no part below 50%"; `f1-exam-mechanics.md:104,107` — "no rating below 50% in any subject/test", 50% of 150 = 75 correct; `src/examConfig.js:3`.

### P1-7 — Put rehearsal days into the 80-day calendar
**Problem:** mocks are an isolated menu the plan never schedules; there is no taper. **Change:** schedule full-day mocks (e.g. days 55, 70, 78), a review day after each, and no new items in the final 2 days; gate a "ready" badge on a passing full-day mock rather than on completed daily sets. **Source:** `80-day-pwa.md:13-14` — goal "ready mock-exam status" and "Mock exams: 150 items per subject, official timers, pass rule"; `src/AppNew.jsx:248-268` — current plan view has no mock step.

### P2-8 — Rebalance Gen Ed and Prof Ed banks
**Problem:** Gen Ed The Contemporary World is 52.7% of 389 items vs 10% of the exam; Prof Ed Teaching Profession 40.6% vs ~15%, Field Study/Internship 0.4% vs 20%. **Change:** apply the same quota-based sampling and validate:bank checks as P0-1 to these two subjects; use the 10-area × 15-item Gen Ed table as primary and keep the 5-area bulletin only as an alias. **Source:** `report.md:10-11` — "Current TOS is 10 areas x 15 items" and "Prof Ed ... Teaching Profession 23, Curriculum/Methods/EdTech 45, Child & Adolescent 30, Assessment 22, Field Study/Internship 30"; `f1-exam-mechanics.md:70-71`.

### P2-9 — Report a real verdict instead of printing the rule
**Problem:** `src/AppNew.jsx:374` tells the user the 75%/50% rule but never says whether they passed; `mockResults` keeps only a bare percentage (`:97-103`). **Change:** show general average, three part ratings, floor status and PASS/FAIL; persist all four values so history is comparable to the real result. **Source:** `report.md:8` and `f1-exam-mechanics.md:104` — both conditions must hold; `APP.md:16,29` — claims results show the passing rule.

### P2-10 — Offer a TOS-ordered block mode
**Problem:** every mock shuffles all 150 items, so learners never practise the paper's section progression and its three paces (~48/72/84 s per item). **Change:** add an ordered mode A → B → C with section headings and cumulative timers, alongside shuffled mode. Label this as structural familiarity, **not** a verified claim about physical item order — the sources give the TOS area order but do not state how the question booklet is sequenced. **Source:** `f1-exam-mechanics.md:19` — "≈48 s, 72 s, and 84 s per item respectively"; `f2-english-major-outline.md:40-138` — numbered 22-area TOS in A/B/C order.

## Open source conflicts and limits
- `f1-exam-mechanics.md:71` lists an extra "Action Research 5%/~7" in the 2025 Prof Ed (Elementary) table, while `report.md:11` gives five Prof Ed areas summing to 150. `src/examConfig.js:35-41` follows the five-area list. Do not add a sixth area until the primary annex is reconciled.
- `report.md:10,15` records an unresolved 5-area vs 10-area Gen Ed conflict; the app's 10-area choice is defensible and matches the dated TOS, but the alias mapping is not implemented.
- Bank counts above are computed from the shipped JSON/JS files on 2026-11-22; they describe what the app currently serves, not a PRC requirement.
- No primary source found states that the real exam physically groups items by TOS section; P2-10 is explicitly a product-design extrapolation.
