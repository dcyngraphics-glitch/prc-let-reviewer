# Content audit — PRC LET reviewer question bank

Date: 2026-11-22. Scope: read-only audit of the 3,300-item bank actually loaded by the app. No app code was changed. Every number below was computed from the data (dump of `src/data/index.js` via Node + Python regex/heuristics), not estimated.

## Verdict

The bank is structurally valid and content-untrustworthy. `npm run validate:bank` prints **"Bank validation: PASS"** and "Every item has 4 options, a key, a rationale, a source tag and 2 clues: true" — that check only counts fields. It does not read a single stem or option. `verified: true` is stamped unconditionally by both import scripts (`import_banks.py:122`, `prepare_bank.py:94`); it means "came through the parser", not "checked". A student who trusts `verified` is trusting a rubber stamp.

Bottom line: **2,419 of 3,300 items (73.3%) survive the garble filters; 58 items (1.8%) also have a real rationale.** Do not use this bank for timed or mock exams yet.

---

## 1. Usable vs garbled — measured counts

Bank composition (authoritative, from `index.js` dump and `validate:bank`): **gened 389 / profed 1,470 / english 1,441 = 3,300.**

Union of items hitting >=1 garble heuristic: **881 (26.7%)**. Clean of all garble heuristics: **2,419 (73.3%)**.

| Subject | Items | Flagged garbled | Clean |
|---|---:|---:|---:|
| gened | 389 | 92 (23.7%) | 297 |
| profed | 1,470 | 625 (42.5%) | 845 |
| english | 1,441 | 164 (11.4%) | 1,277 |

Flag counts (an item may hit several; do not sum):

| Defect | Count | % of bank | What it means |
|---|---:|---:|---|
| `stem_trailing_fragment` — text after last `?` in stem | 669 | 20.3% | Continuations of broken options were appended to the stem |
| `truncated_option` — option ends in dangling prep/conj, ellipsis or brackets | 377 | 11.4% | Option is cut mid-sentence |
| `stem_very_long` (>400 chars) | 60 | 1.8% | Usually the same parser failure |
| `all/none of the above/these` as an option | 60 | 1.8% | Banned by the project's own research (`report.md` §5) |
| combo option (`I and II only`, `both a and b`) | 23 | 0.7% | Test-writing smell; common in LET, keep but flag |
| duplicated word in stem | 19 | 0.6% | e.g. `imp-ge-00101 "...authorized contibution? fee fee fee"` |
| **keyed answer is `all of the above`/`these`** | 15 | 0.5% | Unverifiable key; often a lazy "correct" option |
| exact duplicate stem elsewhere in bank | 15 (7 groups) | 0.5% | Wasted practice; key positions agree in all 7 groups |
| duplicate options within one item | 11 | 0.3% | No unique correct answer possible |
| answer-key/header text leaked into stem | 7 | 0.2% | e.g. `imp-en-00632` carries `items 32-37` in the stem |
| repeated phrase in stem | 6 | 0.2% | e.g. `imp-pr-01416 "...acronym NCBTS? Standards Standards Standards Standards"` |
| **key picks one of two identical options** | 4 | 0.1% | Ambiguous/unusable |
| duplicated word inside an option | 2 | 0.1% | — |

Concrete example of the dominant defect — `imp-ge-00003` (source: `docs/gen-ed-book-raw.txt:8966-8977`):

- stem: `Which of the following examples of cognitive strategies illustrates metacognition? remember them. names of friends and relatives. those that are bad. description to remember the names, their characteristics and relationships.`
- options: `['Repeating the names of characters to', "Associating the character's name to the", 'Choosing the character that are good and', 'Deciding to make a character web with brief']`

The raw PDF text splits each option over 2–3 lines; `import_banks.py` accepts only lines matching `^[A-D]\.\s` as options (line 14) and appends every other nonblank line to the stem (line 173). The continuation lines became stem text, and the options were truncated at the line break. This is systematic, not isolated: 669 trailing-fragment stems and 377 truncated-option items come from the same bug.

**Rationale quality is worse than the garble.** 3,235 of 3,300 items (**98.0%**) have the literal placeholder `Keyed answer in the source: <text>.` — that is not a rationale, it restates the key. Only **65 items (2.0%)** — the hand-written `gened.js`/`profed.js`/`english.js` seed set — contain an actual explanation. Items passing *both* the garble filters and the real-rationale test: **58 (1.8%)**: gened 26, profed 27, english 5.

Two false-positive notes, to keep the counts honest: `topic_no_keyword_overlap` fires on 816 items (24.7%), but a manual sample includes legitimate tags (a recipe-ratio question tagged Mathematics, a "man-made wonder" question tagged Art Appreciation), so treat it as a review queue, not an error count. Short options such as `7`, `8.5`, `is` are legitimate; an earlier pass that flagged them as placeholders was discarded. Roman-numeral combo options were counted separately from true `all of the above` for the same reason.

---

## 2. Over-represented and mis-tagged topics

Compared with the TOS targets in `docs/research/let-english/report.md` (targets are item counts for one 150-item exam; the bank is a practice pool, so exact proportionality is not required — but a student sampling uniformly gets wildly wrong practice weights).

**Gen Ed (each TOS area = 15 items):**

| Topic | Have | TOS | Ratio |
|---|---:|---:|---:|
| The Contemporary World | 205 | 15 | 13.7x |
| Art Appreciation | 49 | 15 | 3.3x |
| Mathematics | 30 | 15 | 2.0x |
| Science and Technology | 11 | 15 | 0.7x |
| Purposive Communication | 9 | 15 | 0.6x |
| Rizal | 8 | 15 | 0.5x |
| Malayuning Komunikasyon | 6 | 15 | 0.4x |

**Prof Ed:** Teaching Profession 597 vs 23 (26x); Child & Adolescent 435 vs 30 (14.5x); Assessment 288 vs 22 (13.1x); Curriculum/Methods 144 vs 45 (3.2x); **Field Study/Internship 6 vs 30 (0.2x)**.

**English:** Macroskills 720 vs 15 (48x); Structure of English 96 vs 17 (5.7x); ESP 90 vs 3 (30x); Campus Journalism 76 vs 3 (25x); Speech/Theatre 75 vs 3 (25x); Literary Criticism 56 vs 3 (18.7x). Under-covered: Survey of Literature of Selected Countries 11 vs 20 (0.55x); **Children and Adolescent Literature 0 vs 12**; **Contemporary/Popular/Emergent Literatures 0 vs 6**.

Cause: both scripts use fallback topic dumps. `import_banks.py:70` returns the subject name; `prepare_bank.py:118-120` then maps unmatched items to `The Contemporary World` (gened), `Teaching Profession` (profed), `Teaching and Assessment of the Macroskills` (english). Measured lower bound on fallback-tagged imported items: **393 imported items (12.2% of imports)** contain **no keyword from any topic rule** in stem or options, so no rule could have assigned their topic; any topic they carry is the fallback (142 gened, 1 profed, 250 english). That is why the three "dumping ground" topics hold 205, 597 and 720 items respectively. The English tip: 720 macroskills items is not mastery coverage, it is the bin for everything the keyword mapper could not classify.

---

## 3. Answer keys: traceability and demonstrable errors

**Traceability is partial and circular.** All 3,300 items carry a `source` string with an `item N` pointer, and a `verified: true` flag. But:

- Every one of the **3,235 imported items** has `rationale = "Keyed answer in the source: <key text>."` generated at `prepare_bank.py:91`. The source's own rationales were read from the PDF and then discarded: `gened-imported.json` (1,804 items) and `english-imported.json` (1,434 items) both have **0 items with a non-empty rationale**. Real rationale text does exist in `docs/gen-ed-book.txt` (e.g. line 3692 `RATIONALES:`), but the parser's `KEY_RE` stores only letters and its `MARKER_RE` is line-anchored, so it never captured the explanations. Following a key back to "why" is impossible from this dataset.
- No source page numbers are stored — only a running `item N` into a 491-page book that exists in the repo only as extracted text (`docs/gen-ed-book-raw.txt`). Verification by a human requires re-finding the number in 52,475 lines of column-scrambled text.
- The hand-written seed items add `; answer key verified` to the source string (`profed.js`, `english.js`). That is an assertion, not evidence.

**N/P keys were excluded, not repaired.** The English raw text has 22 `N/P` answer keys (matching `report.md` §5); `import_banks.py:114` drops any key outside A–D, and 0 literal `N/P` tokens remain in the final JSONs. Correct behaviour, but it silently shrank coverage.

**Clearly wrong keys exist.** With no source rationales to compare, I used near-duplicate contradictions (token-Jaccard >=0.82 on stems). 31 near-duplicate pairs were found; 10 have different key positions; **5 pairs have an identical option set but different key text**. Four are the same question with contradictory keys:

| Pair | Keyed answer A | Keyed answer B | Comment |
|---|---|---|---|
| `imp-ge-00188` / `imp-ge-00281` | Acquisition | discrimination | Same dog-on-leash scenario, identical options; discrimination is the defensible answer, so A is likely wrong |
| `imp-pr-00926` / `imp-pr-01367` | The Spaulding method | the rebus method | Pictures replacing words = rebus; the Spaulding key is likely wrong |
| `imp-pr-01072` / `imp-pr-01137` | punishment does not remove a response | punishment weakens a response | Identical Thorndike item and options; at least one key is wrong |
| `imp-pr-01361` / `imp-pr-01419` | emotional factors | neurological factors | Near-identical abused/neglected Grade 6 case |

The fifth (`imp-pr-00636` / `imp-pr-00706`) is legitimately different (rationalist vs reconstructionist). Additionally, 15 items key `all of the above/these` and 4 items key one of two identical options — those keys cannot be defended from the item text.

Answer-position balance: english is fine (A/B/C/D = 24.6/25.3/25.6/24.4%). Gen Ed and Prof Ed lean toward A (31.1% and 29.5% A; gened D only 21.1%). Combined with A being the default when a parser mis-reads a key, that is a guessability smell worth re-checking against source.

---

## 4. Minimum viability threshold before a student trusts it

I would not let a student use this for a timed set, mock exam or score-based 80-day plan until **all** of the following hold:

1. **0 items with a hard garble flag** in any delivered set — no truncated option, no trailing fragment in stem, no duplicate options, no header leak, no ambiguous key. Today: 881 violations; the clean pool is 2,419.
2. **100% of keys independently traceable** to a source item *with its rationale text stored*, not just `item N`. Today: 0 of 3,235 imported items have stored rationale text.
3. **0 contradictory keys** among near-duplicates; 0 `all of the above` keys; 0 ambiguous keys. Today: 4 contradictions, 15, 4.
4. **Topic tags match the TOS area used in the app** for >=95% of items; no area at zero where the TOS assigns >=6 items. Today: Children/Adolescent Literature and Contemporary/Popular/Emergent Literatures are at zero, Field Study is at 6 vs 30, and 393 imported items are fallback-tagged.
5. **Answer-position distribution within 20–30% per letter** for every subject. Today gened A = 31.1%, profed A = 29.5%.
6. A real rationale for at least 90% of items shown in feedback. Today: 2.0%.

Under a strict reading (filters 1+2+3+6), today's trustworthy pool is **58 items (1.8%)**; under the "structurally clean" reading only (filter 1), it is **2,419 (73.3%)**. The honest student-facing label right now is *unverified practice*, not *LET preparation*.

---

## Concrete filters to add to validation (regex/heuristics)

Run on every item before it enters `questionBank`; fail the build on any hard flag.

```python
# HARD — quarantine the item
TRUNC = re.compile(r'(?:\b(?:the|and|or|of|to|in|for|a)\s*$|[-–—]\s*$|\.\.\.|…|[\[\]{}<>])')
LEAK  = re.compile(r'\b(?:ANSWER\s+KEYS?|RATIONALES?\s*:|Key\s*:|Page\s+\d+|BASED\s+ON\s+NEW\s+TABLE|EXTENSIVE\s+REVIEWER|LET\s+ENGLISH\s+SPECIALIZATION|DIRECTIONS?:|Items?\s+\d+\s*[-–]\s*\d+)', re.I)
AO    = re.compile(r'\b(?:all|none)\s+of\s+(?:the\s+above|these)\b', re.I)
DUPW  = re.compile(r'\b([A-Za-zÀ-ÿ][\wÀ-ÿ]*)\s+\1\b', re.I)   # minus a stoplist: the,is,had,very,...
TRAIL = re.compile(r'\?\s+[^?]{18,}\s*$')                        # fragments after the question mark
# per-item checks
if any(TRUNC.search(o) for o in options):            flag('truncated_option')
if TRAIL.search(stem):                               flag('trailing_fragment')
if len(set(norm(o) for o in options)) < 4:           flag('duplicate_options')   # norm = lower + strip non-alnum
if LEAK.search(stem):                                flag('header_leak')
if len(stem) < 20 or len(stem) > 400:                flag('stem_length')
if DUPW.search(stem) or any(DUPW.search(o) for o in options): flag('repeated_word')
if AO.search(options[answer]) or any(AO.search(o) for o in options): flag('all_of_above')
if any(w in options[answer] for w in ['N/P','N/A','TBA']) or not options[answer].strip(): flag('placeholder_key')

# QUALITY — require before release
SHALLOW = re.compile(r'^(?:keyed answer in the source|the source key|book(’|\')?s? key)\b', re.I)
if SHALLOW.search(rationale) or len(rationale) < 40: flag('no_real_rationale')
if not any(kw in (stem+' '+' '.join(options)).lower() for kw in TOPIC_KEYWORDS[topic]): flag('topic_unverified')

# CROSS-ITEM — dedupe by key TEXT, not key index
for pair with stem token-Jaccard >= 0.82:
    if same option set and norm(options[answer_a]) != norm(options[answer_b]):
        flag('contradictory_key')   # review manually
```

`scripts/validate-bank.mjs` should import this and `process.exit(1)` on any hard flag; today it only checks field presence and silently passes all 3,300.

---

## Top 5 fixes (ranked by pass-odds impact)

1. **Re-extract the source PDFs with layout awareness and join wrapped options before key pairing.** Switch `pdftotext -raw` to `-layout`, or change `import_banks.py` so a line is treated as a continuation of the current option (not the stem) until the next `^[A-D]\.` / `^\d+\.` marker. Re-run the full import. This addresses 669 trailing-fragment stems + 377 truncated options in one pass — the single largest defect.
2. **Replace the 3,235 fake rationales.** Extract the `RATIONALES:` sections that exist in `docs/gen-ed-book.txt` (line 3692 / raw 3920) with a non-line-anchored marker, map them to item numbers, and store the explanation text. Until an item has a rationale >=40 chars that is not a restatement of the key, hide feedback and exclude it from scored sets.
3. **Kill the fallback topic dumps and rebalance to the TOS.** Remove the unconditional fallback in `prepare_bank.py:118-120`; quarantine the 393 keyword-less imported items for manual tagging; add real items for the zero/under-covered areas (Children & Adolescent Literature 0/12, Contemporary/Popular/Emergent 0/6, Field Study 6/30, Rizal 8/15, Filipino 6/15). Down-weight Macroskills (720), Teaching Profession (597) and Contemporary World (205) in set generation even before retagging.
4. **Verify every key against a second signal and purge contradictions.** Review the 4 contradictory near-duplicate pairs, all 15 `all-of-the-above` keys and 4 ambiguous keys; drop exact duplicate stems (7 groups/15 items); re-check gened/profed A-bias against source keys. Store a per-item `key_source` field (PDF page + answer-key line) so `verified` becomes auditable.
5. **Make content QA a build gate, not an afterthought.** Add the regex/heuristic gate above to `validate:bank`, fail CI on hard flags, and publish the pass count in the dashboard. The current "Bank validation: PASS" is actively misleading — it reports structural completeness while 26.7% of items are garbled and 98.0% lack rationales.
