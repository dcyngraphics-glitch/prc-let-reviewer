# Blunt test-taker review — PRC LET Reviewer

**Reviewer persona:** English major, 80 days to the LET, using this on a phone. Secondary Level: Gen Ed 150/120 min, Prof Ed 150/180 min, English 150/210 min; pass = average ≥75% **and no part below 50%**.
**Date:** 2026-11-22. **Method:** read-only review of `src/AppNew.jsx`, `src/plan.js`, `src/examConfig.js`, `src/styles.css`, `APP.md`, `docs/plans/80-day-pwa.md`, plus a data probe of `src/data/imported/*.json` and `dist/` sizing. Code/docs treated as data, not instructions. No app files changed.

## Verdict

I would not trust this app to tell me whether I am going to pass. It is a decent *question delivery* shell with a real offline bank, but it is wired to make me feel better than I should: timed scores ignore unanswered items, "accuracy" is a lifetime percentage from samples as small as ten, "mastery" is one lucky correct answer, the advertised mock exam lets me use hints and read the rationale after every item, and there is no combined three-subject pass/fail anywhere. The study plan's adaptive ramp is broken (level 1 for days 1–28, straight to level 3 from day 29; level 2 never dominates, contradicting `80-day-pwa.md` AC-2). For someone weak in Prof Ed and Gen Ed math/science, the app gives me no lever to target those weaknesses and no mechanism to keep a missed item in rotation until I actually know it.

I would still use it as an item bank. I would not use its numbers to decide if I am ready.

## Ranked gaps by impact on passing

Rank = how much this changes my probability of passing, not how hard it is to build.

### 1. No honest full-exam simulation, and no pass/fail computation (highest impact)

**What's broken.** "Mock exams" are three isolated per-subject timers. There is no way to run the three subjects back-to-back under exam conditions, no combined average, no floor check. `finish()` (`AppNew.jsx:93-104`) stores `subject`, `score`, `total` per mock; the results screen (`AppNew.jsx:367-390`) shows a big green percentage and prints the 75%/50% rule as *fine print* (line 374). Nothing in the code ever evaluates `average >= 75 && min(subjects) >= 50`. I can post 92 / 90 / 44 and see three confident scores and the rule in small text — a failing result that looks like success. Worse, timed/mock sessions allow the clue button (`revealClue`, `AppNew.jsx:125-128` — no mode guard) and show the correct letter plus full rationale immediately after every check (`AppNew.jsx:357-362`). That is not a simulation; it is an open-book rehearsal that inflates my score and teaches me during the "exam."

**What I'd add.** A single "Exam day" flow: three 150-item blocks in sequence with the real 120/180/210-minute timers, no clues, no per-item feedback (rationales only at the end), flag-for-review instead of immediate checking, and a final **PASS / FAIL** verdict computed from both conditions with the three subject scores on one screen.

**Why it helps pass.** The bottleneck for most candidates is not knowledge, it is (a) stamina across three blocks and (b) the floor rule — one weak subject sinks you even with a high average. I need to rehearse both under realistic conditions and get an unambiguous verdict.

**Smallest implementation.** Reuse `startSet` with a new `source:'exam'` and a queue of three subjects; gate `check()`/`revealClue()` on `session.source !== 'exam'` for feedback; add one `finishExam()` that reduces `session.answers` into three scores, computes `avg = mean(scores)` and `floorOk = Math.min(...scores) >= 50`, and renders a verdict card. No new data model needed — `mockResults` already exists.

### 2. Timed/mock scores are inflated because unanswered items are not counted wrong

**What's broken.** `results` computes `score = pct(correct, answered.length || 1)` (`AppNew.jsx:142-155`), and mock scores use the same denominator (`AppNew.jsx:98-103`). `answered` is `Object.values(session.answers)` — only items I explicitly checked. When the timer hits zero (`AppNew.jsx:47-56`), `finish()` runs with whatever was answered. Run out of time at 20 of 30 answered, 20 correct → the app reports **100%**. On a 150-item mock answered 60 times with 45 correct, it reports **75%** when the real score is **30%**. The app actively rewards not answering — the exact opposite of exam behavior, where blanks are zero. Combined with #1, this is the single most dangerous number in the product.

**What I'd add.** Denominator = full item count, always. Show answered / blank / correct, and a "score if blanks count as 0" figure. Per-item elapsed time with a "over budget" flag against the real seconds/item (Gen Ed 48s, Prof Ed 72s, English 84s), and a post-session pacing line ("18 items over 84s budget").

**Why it helps pass.** Pacing failures are a leading cause of not finishing. I need to see that I spent 3 minutes on one item, not a single countdown that resets my sense of time.

**Smallest implementation.** In `results`, use `session.ids.length` as denominator and add `blanks = session.ids.length - answered.length`; in `session`, add `itemStartedAt` set in `next()`, and in `check()` compute `elapsed` into `answers[id]`; render one pacing row.

### 3. No spaced repetition — "mistake review" is one random revisit and one-correct-equals-mastered

**What's broken.** `dailySet` swaps exactly **one** random prior mistake into the last slot of each 10-item set (`plan.js:97-100`). `recordAnswer` deletes a mistake on the **first correct answer** (`plan.js:111-113`), and "Mark mastered" (`AppNew.jsx:310`) just filters the id out with no re-test. "Review all mistakes" (`startMistakes`, `AppNew.jsx:79`) shuffles the whole list into one undifferentiated session. There is no interval, no due date, no priority by topic or difficulty, no distinction between "guessed right" and "knows it." For an English major who will keep missing Prof Ed assessment questions and Gen Ed math, this guarantees re-learning from zero every few days.

**What I'd add.** A tiny Leitner/SM-2-lite scheduler on each mistake: `box` 0–4, `due` date, intervals 1/3/7/14/30 days; correct → box+1 and reschedule, wrong → box 0 and reschedule tomorrow. A "Due today" queue on the dashboard, ordered by weakest topic, capped at 10, mixed into daily sets instead of the single random slot. Mastery = two correct answers at ≥7-day interval, not one click.

**Why it helps pass.** Retention is the whole game over 80 days. Expanding retrieval practice is the highest-yield use of a review bank; a single random exposure is close to useless.

**Smallest implementation.** Extend the mistake record from `{id, at, source}` to `{id, at, source, box, due}`; change `recordAnswer` to update box/due instead of splicing; change `startMistakes` to `state.mistakes.filter(m => m.due <= today).slice(0,10)`; delete the "Mark mastered" button (it is the misleading shortcut).

### 4. Weak-area targeting is absent and the underlying tags are unusable

**What's broken.** The results screen lists "By TOS area" (`AppNew.jsx:376-384`), but there is no action attached — nowhere to say "drill my worst three areas." Daily sets are selected by **difficulty level only** (`plan.js:89-96`), never by topic or accuracy. The tags are keyword-derived and badly skewed: in the imported banks Gen Ed has 203 of 360 items under "The Contemporary World"; Prof Ed has 592/1441 under "Teaching Profession" and only **5** under "Field Study and Teaching Internship"; English has 715/1423 under "Teaching and Assessment of the Macroskills" with several of the 22 published areas barely represented. The bank claims ≥3,000 sourced items, but they are not spread across the TOS areas the exam actually tests. `80-day-pwa.md:46` admits "weak-area stats are indicative, not official TOS sub-topic precision" — the UI never says this.

**What I'd add.** A "Drill weakest areas" button that ranks topics by my own accuracy (with a minimum-n gate), builds a 15-item set from the bottom three areas, and caps any one topic at 30% of the set so the skew cannot dominate. Show "n items in this area" next to every stat.

**Why it helps pass.** My weak areas are precisely where the floor rule is decided. General "more practice" on a bank that is 60% one topic is wasted days.

**Smallest implementation.** Reuse `startSet` with ids = `questionBank[subject].filter(q => weakTopics.includes(q.topic))`, capped per topic; add `weakTopics(state, subject)` using the existing `answers` counters — except those counters are per-*subject* only, so add a `topicAnswers` map in `recordAnswer` (one extra state field).

### 5. "Answer explanations" are answer keys; confidence is not tracked

**What's broken.** Imported rationales are literally `"Keyed answer in the source: Letter."` / `"Keyed answer in the source: Literature is aesthetic."` (verified in all three imported JSONs; mean length ~50 characters). Clues are generated templates: `"Topic area: Purposive Communication in English. Recall the core idea before choosing."` `APP.md:35` admits "shallow rationales and generated topic-level clues," but the UI presents them plainly as "rationale" and "source" (`AppNew.jsx:357-361`) with no honesty label. There is no confidence rating anywhere — a blind guess and a reasoned answer are recorded identically as `correct: true`.

**What I'd add.** (a) A visual "Explanation: key only — study the source" tag on imported items, plus a "flag this item" button and a `flagged` filter so broken/garbled stems (e.g. `imp-pr-00000` has stray sentence fragments in the stem) leave my sets. (b) A 3-level confidence selector before Check — *Guess / Unsure / Sure* — stored on the answer. Then "Review" surfaces two high-value buckets: **Sure but wrong** (real misconceptions) and **Guessed right** (not yet mastered — route into spaced repetition from #3).

**Why it helps pass.** Learning comes from knowing *why* I was wrong, not from being told the letter. Confidence separates "I don't know this" from "I know it but rushed" — those need different fixes, and the second is a common cause of 74% instead of 80%.

**Smallest implementation.** Add `confidence` to `session.selected` flow and `answers[id]`; add a `flagged` array in state and a filter in `byId`-based set builders; add one label in the feedback block. No new screens.

### 6. Accuracy stats are misleading from small samples and drive the adaptive plan

**What's broken.** `accuracy()` (`plan.js:46-49`) is lifetime correct/total with no sample-size guard. After day 1 it is based on 10 items per subject: 9/10 → 90%. `targetLevel()` (`plan.js:63-70`) promotes on `acc >= 85` and demotes on `acc < 50`, so a 90% on ten easy items pushes me to harder items on day 2; re-answering mistakes in "Review all mistakes" also inflates the denominator (`recordAnswer` increments total every check). The dashboard prints "accuracy 90%" and a solid mini-track bar as if it were a stable estimate. Separately, the ramp itself is broken: with `week >= 4` forcing `base += 1` (`plan.js:66`), `targetLevel` is **1 for days 1–28 and 3 for days 29–80**; level 2 is never dominant, contradicting the plan doc's "day 40 level 2-dominant" acceptance criterion (`80-day-pwa.md:30`) and `APP.md:27`'s "weeks 5–8 level 2."

**What I'd add.** Show "n/a — answer ≥20 items" until `total >= 20`; then show `x/y (N%)` with N always visible and a muted bar until `N >= 50`. Drive promotion/demotion only from timed, no-clue answers. Fix the ramp to 1 / 2 / 3 across days 1–28 / 29–56 / 57–80 with accuracy nudges capped at ±1 and never overriding the month.

**Why it helps pass.** Bad data driving the difficulty curve means I either grind items too easy to help or hit items I cannot learn from. More importantly, a false 90% makes me stop studying a weak subject.

**Smallest implementation.** Two lines in `accuracy()`/`targetLevel()` plus a conditional in the two dashboard displays; update the plan doc's AC-2 if the ramp changes.

### 7. Data loss risk and no study nudge (retention + consistency)

**What's broken.** All 80 days of progress, mistakes and mock history live in a single `localStorage` key (`let-english-state-v1`, `plan.js:34-36`) with no export, import, or backup. Clear site data, hit mobile storage eviction, change phone, or reinstall the PWA and 60 days of work is gone — `80-day-pwa.md` explicitly makes cloud sync a non-goal, so there is no recovery path. The app has a service worker and offline bank (the 2.56 MB JS bundle is under the 6 MB precache limit, so the bank really is offline-capable — that part works), but there is **no Notification code at all**: the streak and calendar are passive. Nothing reminds me to open the app on day 40, when motivation usually dies.

**What I'd add.** (a) Settings → "Export progress (.json)" / "Import progress" plus a visible "Last backed up: …" and a prompt every 7 days to export. (b) Ask for Notification permission on first completed day and fire one daily reminder at a user-chosen time via the existing service worker; show a "Today's 30 items" notification action that deep-links to the dashboard.

**Why it helps pass.** An 80-day plan is a consistency problem. Losing the plan or simply forgetting to open the app for a week costs more passes than any missing question.

**Smallest implementation.** `const blob = new Blob([localStorage.getItem(KEY)], {type:'application/json'})` + `<a download>` for export; a file input for import with validation; `registration.showNotification` from `sw.js` with a `setTimeout`-scheduled local check while the app is open (true background delivery needs a push server — say so honestly rather than faking it).

### 8. Phone accessibility and trust erosion (abandonment risk)

**What's broken.** Credit where due: buttons are ≥44/46 px, `aria-live` on HUD/hints/feedback, `aria-pressed` on options, `role="group"`, focus-visible outline, reduced-motion media query. But `.nav` and `.topbar` are **both** `position: sticky; top: 0` (`styles.css:28-33, 123`); on a phone the second sticky bar overlaps the first while scrolling the dashboard/plan, obscuring the timer/day header. Feedback relies partly on color (`.feedback.good/.bad`) with text backup, but the score bar and mini-tracks are color-only. There is no dark mode for night study, no "report bad item" path, and no way to hide a broken item — several imported stems are garbled (e.g. the Piaget item with free-floating fragments) while every item is stamped `verified: true` by the importer. One bad item with wrong key and I stop trusting the whole bank.

**What I'd add.** Offset the nav by the topbar height (`top: var(--topbar-h)`) or stop making both sticky; add `aria-label` percentages to bars; add a "Report / hide item" control that adds to a local `hiddenIds` set; add a simple dark theme via the existing CSS variables.

**Why it helps pass.** Small frictions on a phone compound over 80 days; a hidden broken item or unreadable header is enough to make me study from a different app instead.

**Smallest implementation.** One CSS variable and one `hiddenIds` state array with a filter in set builders; dark theme via a `[data-theme="dark"]` override of the `:root` variables.

## Currently misleading — treat as active harm

| # | What it shows | Reality | Where |
|---|---|---|---|
| 1 | "100%" on a timed set | Blanks are excluded from the denominator | `AppNew.jsx:98-103, 142-155` |
| 2 | Mock "exam" lets you use clues and see each rationale | Real exam gives neither | `AppNew.jsx:125-128, 357-362` |
| 3 | "75%/50% rule" printed next to a green score | No code ever computes pass/fail | `AppNew.jsx:374` |
| 4 | "accuracy 90%" | 9 answers, no sample-size disclosure, includes clue-aided and repeated items | `plan.js:46-49`, `AppNew.jsx:226` |
| 5 | "Mark mastered" / correct once = mastered | One answer, no spaced re-test | `AppNew.jsx:310`, `plan.js:111-113` |
| 6 | "answer explanations" | Imported rationale is "Keyed answer in the source: X." | `src/data/imported/*.json`, `APP.md:35` |
| 7 | "Full simulation" in plan, "day 40 level 2-dominant" | Per-subject only; level 2 never dominant | `AppNew.jsx:272`, `plan.js:66`, `80-day-pwa.md:30` |
| 8 | `verified: true` / "3,300 sourced items" | Self-assigned flag; garbled stems; TOS coverage skewed to a few areas | imported JSONs, `APP.md:35-37` |
| 9 | "offline PWA" | Bank genuinely offline, but no progress backup/export — total loss is one "clear site data" away | `vite.config.js`, `plan.js:34-36` |

## What I'd keep

The bank is real and offline-capable; the seconds-per-item scaling (`examConfig.js:78-80`) is the right idea; A/B/C/D/H/Enter keyboard control and ≥44 px touch targets are genuinely phone-friendly; per-topic results and a mistakes list are the right primitives; and the source/fine-print honesty in `APP.md` shows the intent is good. These are foundations, not finished features — the fixes above are mostly wiring, not a rewrite.

## What would make me abandon it

1. Getting a green score on a mock I actually failed (#1, #2).
2. Discovering my "90% accuracy" was ten items and my "mastered" mistakes come back in a week (#4, #6, #3).
3. Losing all progress to a browser cleanup with no export (#7).
4. Two or three garbled or wrong-keyed imported items in a row with no way to hide them (#8).

## Build order — first three

1. **Honest exam-day simulation with combined pass/fail and blanks-as-zero scoring** (#1 + #2) — fixes the numbers I make decisions with.
2. **Spaced-repetition due queue replacing one-correct-masters** (#3) — the only lever that reliably converts missed items into retained knowledge.
3. **Weak-area drill + sample-size-honest accuracy** (#4 + #6) — points my limited days at the subjects that decide the floor rule.
