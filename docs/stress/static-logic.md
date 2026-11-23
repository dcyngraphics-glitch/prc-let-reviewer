# Static logic audit — PRC LET Reviewer (new code)

**Date:** 2026-11-23
**Scope (new code only):** `src/AppFinal.jsx`, `src/plan2.js`, `src/examConfig.js`, `src/data/index.js`, `scripts/clean_bank.py`, `scripts/validate-bank-strict.mjs`. Prior reviews cover `AppNew.jsx`/`plan.js`; those files are not re-audited here.
**Method:** full source read + Node probes against the real bank and the exported pure functions. No app code was edited.

## Summary — 12 findings

| Severity | Count | Headline |
|---|---|---|
| Critical | 1 | `weakSet()` returns question **objects**, not IDs — "Drill weak" blanks the quiz screen |
| High | 2 | Schema-less import crashes the app; ProfEd TOS quotas are mapped to the wrong areas |
| Medium | 5 | Dead 30-day SRS box, exam parts 2/3 ignore `hiddenIds`/quotas, impure `setState` updater, broken streak, quota backfill |
| Low | 4 | Validator blind spots, hardcoded floor, `fmt(NaN)`, clue boilerplate |

Healthy in the new code (verified by reading): wall-clock timer via `endsAt` (fixed old H1), Enter target guard (fixed H2), guarded storage writes (fixed H3), `finishedRef` idempotence, blanks-as-zero denominator, local `startDate`, duplicate-ID validation.

**Top 3 verified by Node:** C1, H1, H2 (probe output quoted under each).

---

## CRITICAL

### C1 — `weakSet()` returns question objects; `byId` lookup fails and the quiz does not render
**Files:** `src/plan2.js:137,139-140`; consumed at `src/AppFinal.jsx:139` (`startWeak`) and `src/AppFinal.jsx:155` (`question = byId[session.ids[session.index]]`).

`weakSet()` builds `ids` by pushing question **objects** from `pool.slice(...)`, while the no-weak-topic fallback returns IDs from `weightedSet()` (`plan2.js:132`). `AppFinal` treats every session's `ids` as an array of IDs. When `worst.length > 0`, `session.ids` are objects, so `byId[object]` is `undefined`, `question` is `null`, and the `view === 'quiz' && session && question` block at `AppFinal.jsx:428` renders nothing. The `rest` dedupe is also broken for the same reason: `ids.includes(q.id)` compares objects to strings, so it never excludes anything.

**Repro:** answer ≥3 items in one topic (creates `topicAnswers['english|…'].total ≥ 3` via `recordAnswer`, `plan2.js:154-156`), return to Dashboard, click **Drill weak Eng**. HUD shows `1/15` but the main pane is empty; only "End session" is available (soft-lock).

**Verified (Node, real bank):**
```
weakSet('english', stateWithWeakTopic, 15): firstType="object", byIdLookupWorks=false
weakSet('english', emptyState(), 15):       firstType="string", byIdLookupWorks=true
```
**Minimal fix:** in `plan2.js:137` map to IDs, and filter hidden IDs + dedupe in the fallback:
```js
ids.push(...pool.slice(0, Math.ceil(count / worst.length / 2)).map(q => q.id));
...
const rest = shuffled(questionBank[subject].filter(q => !state.hiddenIds.includes(q.id) && !ids.includes(q.id)), rnd);
return shuffled([...new Set([...ids, ...rest.map(q => q.id)])].slice(0, count), rnd);
```
Note the current code also ignores `hiddenIds` in weak drills, so hidden items can resurface even after the type fix.

---

## HIGH

### H1 — Import validation accepts any object with two fields and then crashes render
**Files:** `src/AppFinal.jsx:242-243` (check + `setState(parsed)`), consumers `AppFinal.jsx:250,309,405,408,412` and `plan2.js:143-146`.

`importProgress` only checks `parsed.startDate` truthiness and `Array.isArray(parsed.completedDays)`, then replaces the entire state verbatim. Unlike `loadState()` (`plan2.js:37`), no `emptyState()` merge is performed. A plausible hand-edited or truncated backup passes the gate; the very next render calls `dueMistakes(state)` → `state.mistakes.filter(...)` on `undefined`. A partial `answers` object also yields `NaN` totals in `recordAnswer` (`plan2.js:151`). The malformed state is then persisted by the save effect (`AppFinal.jsx:38`), so the app stays broken until storage is cleared.

**Repro:** export progress, replace the file contents with `{"startDate":"2026-01-01","completedDays":[]}`, click **Import progress**. Blank app; console shows `TypeError: Cannot read properties of undefined (reading 'filter')`.

**Verified (Node):**
```
dueMistakes(JSON.parse('{"startDate":"2026-01-01","completedDays":[]}'))
  -> TypeError: Cannot read properties of undefined (reading 'filter')
```
**Minimal fix:** import `emptyState` in `AppFinal.jsx` and normalize before `setState`:
```js
const merged = { ...emptyState(), ...parsed,
  answers: { ...emptyState().answers, ...(parsed.answers || {}) },
  completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
  mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
  hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
  examResults: Array.isArray(parsed.examResults) ? parsed.examResults : [],
  mockResults: Array.isArray(parsed.mockResults) ? parsed.mockResults : [],
  daySets: parsed.daySets && typeof parsed.daySets === 'object' ? parsed.daySets : {},
};
setState(merged);
```
(Optionally validate each answer's `total`/`correct` are finite non-negative integers.)

### H2 — ProfEd TOS quotas are assigned by bank insertion order, not the configured area order
**Files:** `src/plan2.js:96-99` (`areaShares`), intended mapping from `src/examConfig.js:35-41` and comment `plan2.js:90`.

`budgets = [23,45,30,22,30]` is intended to follow `SUBJECTS.profed.areas` order (Teaching, Curriculum, Child, Assessment, Field Study), but the code zips it to `names = [...new Set(questionBank[subject].map(q => q.topic))]`, i.e. first-appearance order in the bank: **Curriculum, Child, Teaching, Assessment, Field Study**. Three of five areas get the wrong share, in every daily set, practice set, timed 30, mock, and exam part 1.

**Repro:** call `weightedSet('profed', 1, emptyState(), 150)` and count topics. Expected Teaching 23 / Curriculum 45 / Child 30; actual Teaching 30 / Curriculum 23 / Child 45.

**Verified (Node):**
```
expected: {Teaching Profession:23, Curriculum:45, Child:30, Assessment:22, Field Study:30}
actual:   {Curriculum:23, Child:45, Teaching Profession:30, Assessment:22, Field Study:30}
mismatches: Teaching (+7), Curriculum (-22), Child (+15)
```
**Minimal fix:** import `SUBJECTS` and key budgets by area name:
```js
const budgets = { 'Teaching Profession':23, 'Curriculum, Methods and Educational Technology':45,
  'Child and Adolescent Learners':30, 'Assessment of Learning':22,
  'Field Study and Teaching Internship':30 };
return names.map(name => [name, (budgets[name] ?? 20) / 150]);
```
See also M5: Field Study has only 5 items in the bank, so even the correct 30/150 quota cannot be filled.

---

## MEDIUM

### M1 — Spaced repetition's 30-day box is dead code; item graduates one answer early
**Files:** `src/plan2.js:7` (`INTERVALS = [1,3,7,14,30]`), `src/plan2.js:161-163`; UI claim at `src/AppFinal.jsx:406` ("return after 1, 3, 7, 14 and 30 days … graduates after two correct answers at the top box").

On a correct answer the box is capped at 4 and the item is spliced out **immediately** when `box === 4`. The computed `due: addDays(INTERVALS[4])` (30 days) is never observed, and there is no "two correct at top box" counter. An item is removed after 4 correct answers (miss → box0 → box1 → box2 → box3 → removed on the promotion to box4).

**Repro / verified trace (Node):** miss → box 0, due +1d; correct #1 → box 1/+3d; #2 → box 2/+7d; #3 → box 3/+14d; **#4 → item absent from `mistakes`** (never scheduled at +30d).
**Minimal fix:** don't splice at `box >= 4`; set `due = addDays(INTERVALS[box])` and keep the item, then on a subsequent correct while `box === 4` and `lastCorrect` true, remove it (track a `topBoxCorrects` count to get "two correct at top box").

### M2 — Exam parts 2 and 3 bypass `hiddenIds`, TOS weighting and current state
**File:** `src/AppFinal.jsx:73`.

Part 1 is built with `weightedSet('gened', day, state, 150)` (`:138`), but the continuation in `finishNow` builds parts 2/3 with `shuffle(questionBank[subject].map(q => q.id)).slice(0, 150)` — an unfiltered uniform sample of the whole bank. Hidden items can be served during exam day, and the 20/40/40 area quotas silently disappear for two of the three parts.

**Repro:** hide a Prof Ed item via "Hide this item", start exam day, reach part 2; the hidden ID can be drawn (probability 150/818 ≈ 18% per hidden item per run), and topic distribution is uniform over bank sizes rather than TOS shares.
**Minimal fix:** `ids: weightedSet(subject, s.day ?? day, stateRef.current, 150)` — keep a `stateRef` (or pass the computed `next` state) so the latest `hiddenIds` is used.

### M3 — `finishNow` performs side effects inside a `setState` updater (StrictMode double-invokes it)
**Files:** `src/AppFinal.jsx:56-89`; StrictMode enabled at `src/main.jsx:7`.

The functional updater mutates `sessionRef.current` and `finishedRef.current`, calls `setSession`/`setView`, and constructs appended results. React 18 StrictMode deliberately double-invokes state updater functions in development to surface impurity; any non-idempotent work here runs twice, and calling other setters from an updater is unsupported.

**Repro:** in dev, finish a mock or exam part; the updater runs twice, `setSession`/`setView` and ref mutations execute twice. The current operations happen to be mostly idempotent, so the visible symptom is React warnings today, but the pattern will double any future non-idempotent effect (e.g. result logging).
**Minimal fix:** compute `next` (state result) and `nextSession` outside the updater from a `stateRef.current`, call `setState(next)`, then do `setSession`/`setView`/ref assignments after. Or move the whole exam/day transition into a reducer.

### M4 — `streak` reports 0 until today's set is finished, and permanently after the plan ends
**Files:** `src/plan2.js:63-69`, with the clamp at `src/plan2.js:48-54`.

`streak()` starts counting at `dayNumber(state)` (today), not at the most recently completed day. If today's sets are not yet done, the streak is 0 even after 79 consecutive completed days. After day 80, `dayNumber` is clamped to `PLAN_DAYS`, so a user who completed days 1–79 sees "0-day streak" forever unless day 80 was also completed.

**Repro:** `state.startDate` 79 days ago, `completedDays = [1..79]` → `dayNumber = 80`, `streak = 0`.
**Minimal fix:** start at `Math.min(dayNumber(state), Math.max(0, ...state.completedDays))` and count backwards while consecutive.

### M5 — Area quotas silently backfill from the whole bank, contradicting the "TOS, not bank size" claim
**Files:** `src/plan2.js:109-116`; UI claim `src/AppFinal.jsx:300` ("Area quotas follow the TOS, not bank size").

`take = Math.min(pool.length, Math.round(count * share))` and then `rest` fills any shortfall from all remaining items. Where a topic's pool is smaller than its quota, the deficit is redistributed to already over-represented topics.

**Repro / verified counts:** ProfEd "Field Study and Teaching Internship" has **5** items but a 30/150 quota; Gen Ed has four topics with 6–8 items against 15/150 quotas; English "Remedial Instruction" has 4. A 150-item Prof Ed set therefore contains at most 5 Field Study items, with 25 slots backfilled.
**Minimal fix:** cap the requested `count` to what the quota-constrained pools can supply and surface a warning, or expand the under-covered areas; at minimum stop claiming quotas are honored when they are not.

---

## LOW

### L1 — `validate-bank-strict.mjs` blind spots
**File:** `scripts/validate-bank-strict.mjs:14,17,35-37`.

`subject` and clue fields are checked only for truthiness; there is no assertion that `subject` matches the bank key it was imported into, that `topic ∈ SUBJECTS[subject].areas`, that `rationaleKind` is `'keyed' | 'curated'`, or that the letter named by `clue2` is actually a wrong option. `scripts/clean_bank.py:120` writes identical boilerplate `clue1` (`"Area: <topic>. Recall the core rule before choosing."`) for all 1,705 key-only items, which passes presence-only validation.

**Repro:** change one `gened-clean.json` item's `subject` to `"english"`; `npm run validate:bank` still passes, but `tag()`/`byId`/`areaShares` then misclassify it. (Current data has 0 such mismatches — this is a guard gap, not a live defect.)
**Minimal fix:** import `SUBJECTS` from `src/examConfig.js` and assert the four invariants above.

### L2 — Exam floor rule hardcodes 50 instead of `PASSING.floor`
**Files:** `src/AppFinal.jsx:85,216`.

`parts.every(p => p.score >= 50)` appears twice while the UI displays `PASSING.floor` (`:496`). A future config change would make the verdict and its explanation disagree.
**Minimal fix:** use `PASSING.floor` in both places.

### L3 — `fmt()` can render `NaN:NaN`
**File:** `src/AppFinal.jsx:17-21`.

`Math.max(0, NaN)` is `NaN`; a malformed saved session (see H1) with non-numeric `secondsLeft` displays "NaN:NaN" in the HUD instead of a safe fallback.
**Minimal fix:** `const n = Number.isFinite(s) ? Math.max(0, s) : 0;`

---

## Verification evidence

- `npm run validate:bank` → PASS; current counts `{gened:200, profed:818, english:763}`, total **1781**, 96% key-only rationales (down from 3300 in the prior review — this is the new bank).
- Node probes (`plan2.js` + `data/index.js` imported directly): C1 return types/lookups, H1 thrown error string, H2 quota table, M1 box trace, M2/M5 pool sizes, all as quoted above.
- No files outside `docs/stress/static-logic.md` were modified in the project tree.
