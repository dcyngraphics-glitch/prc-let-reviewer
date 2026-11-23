# Premortem / inversion — PRC LET Reviewer (English major)

**Date of exercise:** 2026-11-23
**Subject:** Cyron Jay Salvador, 80 days on the app, LET 2027.
**Method:** Premortem (Gary Klein, "Performing a Project Premortem", *HBR* Sept 2007) + Inversion (Charlie Munger via Carl Jacobi, *Poor Charlie's Almanack* 2005). Both exploit prospective hindsight: Mitchell, Russo & Pennington (1989) — people generate more concrete causes for an event imagined as *already happened*.
**Source of truth:** `README.md`, `APP.md`, `src/AppFinal.jsx`, `src/plan2.js`, `src/examConfig.js`, `src/main.jsx`, `src/data/imported/*-clean.json`, `docs/reviews/*.md`. The five reviews were written against the *older* `AppNew.jsx`/`plan.js`; where they conflict with current code, current code wins.
**Constraint:** no application code was changed. This file is the only artifact.

---

## Frame

> It is exam morning 2027. Cyron used the app for all 80 days. He opened it most days, finished the daily 30, took mocks, saw PASS/FAIL verdicts. He failed the LET. We are writing the autopsy.

The app is not obviously broken. The 2026-11-23 fixes landed: wall-clock `endsAt`, blanks-as-zero, clues disabled in mock/exam, a real 20/40/40 PASS/FAIL verdict, Leitner boxes, weighted quotas, export/import, fixed ramp. That matters, because **the remaining failure modes hide behind correct-looking labels**. The dashboard says "TOS-weighted", "spaced repetition", "confidence tagging", "PASS/FAIL". Each label is true at the field level and false at the mechanism level. That gap is the story.

---

## Part 1 — Failure narratives (eleven, worked backwards)

Each narrative names the specific mechanic that produced it.

### F1 — The 33 questions he never saw
The English paper put 18 items in Children and Adolescent Literature (12) and Contemporary, Popular and Emergent Literatures (6). The shipped clean English bank has **20 topics, not the 22 in `SUBJECTS.english.areas`** — both of those areas have zero items. Gen Ed has the same hole: **9 topics, not 10** — Malayuning Komunikasyon sa Wikang Filipino is absent (15 exam items). `areaShares()` builds its shares from `[...new Set(questionBank[subject].map(q => q.topic))]`, so an area with no items is not merely under-weighted — it does not exist. Its TOS weight evaporates and `weightedSet()`'s `rest` refill quietly fills the gap from topics that do exist. Cyron saw "TOS-weighted" on every set and never once saw a question from 33 of the 450 exam items. He did not lose those marks to ignorance; he lost them to a silent `filter`.

### F2 — Quota roulette
`areaShares()` assigns Prof Ed budgets by **insertion order of topic names**, not by TOS identity: `[23,45,30,22,30]` is zipped onto whatever order the clean JSON happens to contain. Measured on the shipped file:

| Topic (shipped order) | Code assigns | TOS says |
|---|---:|---:|
| Child and Adolescent Learners | 45 | 30 |
| Teaching Profession | 45 | 23 |
| Field Study and Teaching Internship | 30 | 30 |
| Assessment of Learning | 22 | 22 |
| Curriculum, Methods and Educational Technology | 30 | 45 |

Teaching Profession — already the 282-item dumping ground — is served **nearly twice its exam weight**; Curriculum, a 45-item area, gets 30. Field Study is assigned its correct 30, but the bank holds **4 items**, so `take = Math.min(pool.length, Math.round(count*share))` returns 4 and 26 slots are backfilled from the dumping ground. English is worse: 20 topics get positional shares of 9/11/6 per 150 — Campus Journalism (3 TOS items) gets 9, Introduction to Linguistics gets 6, Structure of English gets 6, Survey of Literature (20 TOS items) gets 6. The quotas are real arithmetic attached to the wrong names. Cyron drilled the wrong distribution for 80 days and the floor rule punished him in the areas he'd under-served.

### F3 — The green 92
Clues are a headline feature: 5 per session, 2 per item. `revealClue()` only decrements `cluesLeft`/increments `hintLevel`; it never marks the eventual answer as aided. `check()` calls `recordAnswer(prev, question, correct, s.source, s.confidence)` with no clue parameter. So every clue-aided correct answer increments `answers.total`, `answers.correct` and `topicAnswers` exactly like an unaided one. `accuracyStat()` → `targetLevel()` promoted Cyron to level 3 early, the dashboard reported a confident percentage, and `weakSet()` — which reads those same `topicAnswers` — aimed his "Drill weak" sessions at topics where he was only weak *without* help. On exam day there are no clues. His unaided English accuracy was in the high 60s; the app had been telling him low 80s.

### F4 — FAIL with no autopsy
Cyron took the day-70 exam-day rehearsal. It returned `FAIL · 61% weighted · parts 74 / 58 / 55`. He needed to know *which topics* leaked. He could not. `finishNow()` persists only `{at, parts, avg, passed}` in `examResults` and then calls `localStorage.removeItem(SESSION_KEY)` — the per-item answers are gone. And the results screen wraps the entire "By TOS area" table in `{!results.verdict && ...}`, so the breakdown is hidden **exactly on the verdict screen**. He had two weeks left and no target. The day-78 rehearsal failed too.

### F5 — One answer, one chance
In exam/mock mode the button says "Save answer", `check()` sets `checked: true`, and option buttons are `disabled={session.checked}`. There is no flag-for-review, no return visit, no change of mind — stricter than the real LET, which allows review within the time limit. Cyron rehearsed 450 answers as 450 irreversible commits. On exam day he spent the last 20 minutes trying to recall what he had clicked in hour one, with no practice at triage-and-return. The three blocks also auto-chain with no break and no fixed start time, so an "8.5-hour sitting" was rehearsed as three back-to-back countdowns starting whenever he tapped. He hit a wall in the English block and left the last 40 items blank — and blanks correctly count as zero.

### F6 — The same ten, again
`weightedSet()`'s seed is `day * 7919 + subject.length * 104729 + count`. No attempt number, no state. Re-tapping a day's set returns the identical items; on day 40 Cyron saw six familiar Gen Ed stems and read that as retention. Worse, `startMock('gened')` and part 1 of `startExam()` both call `weightedSet('gened', day, state, 150)` — same seed, same 150 items. He ran a Gen Ed mock on the morning of his day-70 exam day, then scored well on part 1 of the "exam day" verdict because he had seen those exact questions hours earlier. Parts 2 and 3 use random `shuffle(...)`, so the inflated block was specifically the 20%-weighted one. The verdict he trusted was contaminated.

### F7 — The starving queue
Leitner intervals `[1, 3, 7, 14, 30]` are implemented, but scheduling is not. `dueMistakes()` returns *every* item whose `due <= today`, then `startDue()` takes `.slice(0, 10)`. By day 60 Cyron had ~90 items due; each day the first ten in array order were reviewed and the rest stayed due. A wrong answer resets to box 0 with `due = tomorrow`, so the same ten old items were recycled while newer due items waited indefinitely. Worse, the nav badge `Mistakes (90)` counts everything due, not what the 10-item session can reach — a number that looks like a to-do list and behaves like a ceiling. Spaced repetition was on the box, not on the queue.

### F8 — Hide is forever
"Hide this item" appears in quiz feedback and in the mistakes list; both do `hiddenIds: [...s.hiddenIds, id]`. Nothing anywhere removes an id. There is no un-hide, no reason code, no "report bad item" that reaches the bank. A mis-tap in the mistakes list deletes a good item from every future `weightedSet()` and from `dueMistakes()`. A genuinely broken item with a wrong key is hidden locally while the same defect stays in the shipped bank for the next candidate. With a finite clean pool and repeated sets, the effective bank shrank week by week.

### F9 — Day 80 is a plateau
`dayNumber()` clamps with `Math.min(PLAN_DAYS, ...)`: after day 80 the app says "Day 80 of 80" forever, with no graduation, no taper, no readiness gate. `completeDay()` fires as soon as the three subject sets are finished — a passing rehearsal is not required. Full exam days on days 55, 70 and 78 exist as **one fineprint sentence** in the plan view (`AppFinal.jsx:374`); there is no calendar enforcement, no prompt, no notification code anywhere in the repo. Cyron completed 80 daily sets, never started an exam day, and arrived at the real sitting with zero 8.5-hour rehearsals.

### F10 — Day 1 again
Export/import are two quiet buttons inside the "Verified rules" card; `lastExport` only prints a timestamp, nothing prompts it. On day 65 a browser cleanup removed `let-english-state-v1`. `loadState()` found nothing and returned `emptyState()` with `startDate: localToday()` — the app calmly announced "Day 1 of 80". `storageWarn` only fires when a *write* fails, so a clean wipe produces no warning at all. He had 15 days left and spent them cramming instead of retrieving.

### F11 — Confidence that went nowhere
The app asks Guess / Unsure / Sure before every check. `recordAnswer()` uses that value in exactly one branch: a correct answer with `confidence === 'guess'` and no prior mistake enters the queue at box 1. A **sure-but-wrong** answer — the highest-value misconception signal in the whole product — is stored as an ordinary mistake with the same interval as an uncertain slip. No view in `AppFinal.jsx` filters or groups by confidence. Cyron re-read the same wrong rationale the same way every time, because the app could not tell a misconception from a rush job.

---

## Part 2 — Inversion: how to guarantee failure

Goal: Cyron passes. Inverted goal: guarantee he fails. The following app behaviours would do it. They are written as design decisions, not vague risks.

1. Derive "TOS-weighted" quotas from the order items happen to appear in a JSON file, and never assert that every TOS area exists in the bank.
2. Let every correct answer raise accuracy and difficulty, including answers reached with two hints — and never record that a hint was used.
3. Show a PASS/FAIL verdict, hide the by-area table on that screen, and discard the per-item answers when the session closes.
4. Lock each answer permanently on save; offer no flag-for-review and no second pass before the deadline.
5. Seed set selection from day + subject-name length + count only, so repeats are identical and a morning mock is the afternoon's exam part 1.
6. Cap the due queue at ten items while displaying the full due count in the navigation badge.
7. Make "hide item" permanent and one-way; give no path from a bad local item to a corrected bank.
8. Mark a plan day complete when sets are finished, not when a rehearsal is passed; bury the only full-exam instruction in fineprint; ship no reminder.
9. Keep 80 days in a single localStorage key with no prompted backup, and reset the plan start date when state disappears.
10. Collect a confidence rating, then use it only to catch guesses that were right. Never surface "sure but wrong".
11. Run the three exam blocks back to back with no break, no fixed start and no taper, so stamina is never rehearsed separately from knowledge.

### Self-check: which are we accidentally doing?

Honest answer: **1, 2, 3, 4, 5, 6, 7, 8, 10 and 11 are true of the shipping app today; 9 is true in all but the export button, which exists but is never prompted.** Only the crude predecessors of these were fixed in November — clues in mocks, blanks excluded from the denominator, callback timers, unguarded storage, the 1-28/29-80 ramp. The fixes were real. But they were implemented as *features with names* ("weighted quotas", "spaced repetition", "confidence tagging", "exam-day verdict") rather than as *guarantees about outcomes*, and the names now suppress the question "does this mechanism actually deliver what the label says?" That is the drift to watch: **the app brands the fix instead of verifying the behavior.** The "Bank validation: PASS" message that content-audit flagged is the same pattern — a green light that counts fields, not correctness.

---

## Part 3 — Clustering, estimates, top-three mitigations

Probability and severity are relative to one candidate's 80-day run. P = likelihood the mechanic bites Cyron; S = damage to pass odds if it does.

| Cluster | Narratives | P | S | Why |
|---|---|---|---|---|
| A. Coverage & weighting illusion | F1, F2 | **High** | **High** | Structurally present in shipped data; misdirects every study day; up to 33 exam items unpractised |
| B. Feedback & diagnostic integrity | F3, F4, F11 | **High** | **High** | Corrupts the signals used to choose what to study, at the point where there is least time to recover |
| C. Exam-day fidelity & stamina | F5, F6, F9 | Medium-High | High | Only bites if he takes the rehearsals, which the plan does not force — but then it bites hard |
| D. Retention scheduling | F7, F8 | Medium-High | Medium-High | A capped queue plus a one-way hide quietly shrinks what can be learned |
| E. Continuity & trust | F10 | Medium | High | A single cleanup event erases 65 days; probability depends on device hygiene |

### Top 3

**#1 — Cluster A: coverage and weighting illusion (F1 + F2).** P High, S High. Guaranteed now, measurable now, invisible to the user.

*Mitigation — coverage gate plus identity-keyed quotas.* Replace `areaShares()`'s `names.map((name, i) => ...)` with a lookup keyed by the exact strings in `SUBJECTS[subject].areas`, each carrying its TOS item count. Make `validate:bank` fail the build when any area is missing or holds less than, say, half its TOS count. Replace the silent `rest` refill with a dashboard line: "Coverage: 20/22 English areas — 18 exam items unpractised; Field Study 4/30." Do **not** fake the missing coverage with model-authored items — that recreates the unverified-content problem the content gate was built to remove. An honest red build is the correct outcome.

**#2 — Clue-aided accuracy (F3).** P High, S High. Clues are a promoted feature, so nearly certain to be used; they poison both difficulty promotion and weak-area targeting.

*Mitigation — an unaided ledger.* Pass `clueUsed = session.hintLevel > 0` from `check()` into `recordAnswer()`. Keep two counters per subject/topic — `unaided` and `aided` — and have `accuracyStat()`, `targetLevel()` and `weakSet()` read only `unaided`. Display "68% unaided / 84% with clues" so the hint benefit stays visible without driving decisions. Old `answers` objects need a defaulted `unaided` field on load.

**#3 — Verdict with no autopsy (F4).** P Medium-High, S High. Fewer candidates run exam days, but those who do are at the most time-poor moment.

*Mitigation — keep the verdict, open the autopsy.* Persist a compact per-item record per exam/mock part (id, correct, topic, seconds) inside `examResults`, and remove the `!results.verdict &&` guard so the by-area table renders under the PASS/FAIL card, ranked by `TOS weight × error rate` rather than raw count, with `n` always shown. Add a five-line "leaks" summary. Keep the verdict prominent; make the diagnosis equally prominent.

---

## Part 4 — Five ranked improvements

Ranked by effect on pass odds, not effort. Each carries its honest failure mode. Per the anti-slop rule, these are not five equal-shaped items.

### 1. Coverage gate + identity-keyed quota — **GROUNDED / buildable now**
**Mechanism:** `areaShares()` stops deriving topic names from bank order and reads `SUBJECTS[subject].areas` with explicit TOS counts; `validate:bank` asserts coverage and fails CI; the dashboard prints the coverage fraction next to "TOS-weighted".
**Who it helps:** Cyron in weeks 1–2, and specifically any candidate whose floor could be decided by Field Study or Children's Literature — the areas the current bank cannot teach.
**Honest failure mode:** the build goes red immediately and there is no source material to fill three of the holes. The honest product output is "we cannot prepare you for 18 English items and 15 Gen Ed items", which is uncomfortable and correct. Hand-writing replacements risks reintroducing exactly the unverified items the content gate quarantined.
**Real first step:** add the coverage assertion to `scripts/validate-bank.mjs` against `SUBJECTS` and run `npm run validate:bank`. Expect failure on Malayuning Komunikasyon sa Wikang Filipino, Children and Adolescent Literature, Contemporary/Popular and Emergent Literatures, and Field Study (4 vs 30). That four-line failure is the deliverable — it converts an invisible gap into a build error.

### 2. Unaided ledger
**Mechanism:** `check()` records whether a clue was used; `recordAnswer()` splits counters into aided/unaided; difficulty promotion, the dashboard percentage and weak-area drill consume only unaided data.
**Who it helps:** the diligent candidate who uses hints as intended and is then told a number that will not survive exam day.
**Honest failure mode:** it removes the legitimate "I improved with hints" signal — someone who practices only with clues sees a flat line and may quit. Applying the gate too rigidly to brand-new topics (n < 20) also produces noise; the existing `total >= 20` guard should be reused. Requires a state-shape migration.

### 3. Verdict autopsy
**Mechanism:** compact per-item answers persist in `examResults`; the by-area table is unhidden on verdict screens and ranked by `TOS weight × error rate` with `n` shown; a five-line "leaks" block leads the results page.
**Who it helps:** the day-70 and day-78 candidate with two weeks left and no idea where the 39 points went.
**Honest failure mode:** a 3-item area at 33% will outrank a 20-item area at 60% unless the sample gate is raised from `v.total >= 3`. Showing a confidently ranked "worst area" from five answers is a new way to be wrong, and it looks more authoritative than the old silence.

### 4. Fixed-start exam day with a pacing ledger
**Mechanism:** a rehearsal mode with a chosen 08:00 start, Gen Ed 120 → break → Prof Ed 180 → break → English 210; answers unlock for review until each part's deadline rather than locking on click; a per-item ledger flags time over the 48/72/84-second budgets.
**Who it helps:** the candidate who knows the content but fades in hour five, and the one who has never practiced changing an answer under time pressure.
**Honest failure mode:** it costs a full 8.5-hour day — precisely the commitment a time-poor reviewer will decline, so it may be built and never used. And the research doc states plainly that no primary source confirms the physical item order; TOS-ordered rehearsal is structural familiarity, not a verified exam fact. Label it as such.

### 5. Pre-mortem card, quoted back at verdict
**Mechanism:** on day 55, before the first full exam, one text field: "In one sentence, why will you fail?" Stored in state; on the day-70 and day-78 verdict screens that sentence is printed above the score, beside the weighted-average number.
**Who it helps:** the candidate who quietly avoids one subject — usually Prof Ed — and needs the fear made explicit before the last two weeks.
**Honest failure mode:** if the sentence is "I didn't study enough", it is decoration. It only works when the app also shows the concrete counter-evidence (coverage, aided/unaided split, leaks); alone it is a mood piece. A dated, re-editable field also invites rumination rather than action.

---

## Discarded first-pass ideas

Per the anti-slop rule, the first wave was refused:

- **"Add a daily study-reminder notification."** Generic habit-app slop. Honest background delivery needs a push server; the app has no account system and cloud sync is explicitly out of scope. A `setTimeout` in a PWA is not a reminder.
- **"Add dark mode / fix contrast."** Real a11y debt from the technical review, but it does not change pass odds and would dilute a failure analysis.
- **"More streaks, badges and gamification."** A streak already exists and is passive. More badges would reinforce the "finished a day" behavior that F9 identifies as the problem.
- **"AI tutor that writes real rationales."** Trending-tech slop with no substrate: the source PDFs' rationale text exists in `gen-ed-book.txt` but was never captured by the parser. There is nothing to ground a model on, and the content gate exists precisely to stop unverified text entering the bank.
- **"Cloud sync / accounts."** Explicitly out of scope in `README.md`; proposing it here would ignore a deliberate project constraint rather than work inside it.

---

## Closing check

No app code was edited. The only file created is this one. The three mitigation targets are the ones with evidence in the shipped data: missing TOS areas (measured from `*-clean.json`), unaided-vs-aided accounting (traced through `revealClue` → `check` → `recordAnswer`), and the verdict screen's hidden breakdown (a single conditional render in `AppFinal.jsx`). Re-run this premortem after any of the three mitigations lands — Klein's method is explicitly periodic, and the November fixes show how quickly a resolved failure mode stops being discussed.
