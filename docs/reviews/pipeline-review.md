# Data-pipeline and source-integrity review — PRC LET Reviewer

Date: 2026-11-22. Scope: read-only review of `scripts/{import_banks.py,prepare_bank.py,gen_icons.py,inspect_import.py,validate-bank.mjs}`, `src/data/index.js`, `src/data/imported/*.json`, `README.md`, `APP.md`, `docs/plans/80-day-pwa.md`, plus the committed raw extracts and runtime bank used to verify claims. No application code was changed. All counts below were computed from the files on disk, not taken from documentation.

## Verdict

**Mechanically reproducible: yes. Trustworthy as a sourced question bank: no.**

A clean re-run of `import_banks.py` then `prepare_bank.py` against the committed `docs/gen-ed-book-raw.txt` and `docs/english-bank-raw.txt` reproduced all five JSON files **byte-for-byte** (SHA-256 match on `gened-imported.json`, `english-imported.json`, `gened-final.json`, `profed-final.json`, `english-final.json`). The transform is deterministic.

That is where the good news ends. The transform systematically truncates options and pushes their continuation text into the stem, drops an entire 505-question source block, assigns circular "rationales" to 3,224 of 3,300 items, tags 56% of imported Gen Ed items and 50% of imported English items into two catch-all topics, and emits source citations that identify up to 13 *different* questions with the same string. `validate-bank.mjs` is a structural smoke test: I injected seven substantive defects (duplicate stem, `rationale: 'x'`, `source: '???'`, missing difficulty, clue that eliminates the key, wrong-topic item, duplicate option text) and reduced the bank to 79 items — it printed **PASS** in both cases, and it mutates `q.subject` in memory to make missing subject fields pass. A future contributor can reproduce the bank, but cannot currently verify that it is correct, and nothing in the repo would stop them from shipping a knowingly bad one.

## What the pipeline actually does

1. `import_banks.py` reads `pdftotext -raw`-style text, pairs numbered question blocks with a key dict built from `KEY_RE`, writes `*-imported.json`.
2. `prepare_bank.py` re-tags topics, splits the book extract into Gen Ed / Prof Ed, overwrites every rationale, regenerates both clues, writes `*-final.json`.
3. `src/data/index.js` concatenates 76 hand-curated JS items with 3,224 imported JSON items for 3,300 total (389 / 1,470 / 1,441).
4. `validate-bank.mjs` checks only field presence/shape on the concatenated runtime bank.

Computed item flow:

| Stage | Gen Ed book | English |
|---|---:|---:|
| Raw key lines recoverable | (not uniquely countable; see defect 2) | 1,478 of 1,500 claimed |
| Question blocks parsed with 4 options | 3,881 parsed overall (book) | 1,476 |
| After stem dedupe (`*-imported.json`) | 1,804 (book, both subjects) | 1,434 |
| After `prepare_bank` (`*-final.json`) | 360 Gen Ed + 1,441 Prof Ed = 1,801 | 1,423 |
| Curated JS items | 29 + 29 | 18 |
| Runtime total | 389 | 1,441 |

Three book items and eleven English items are lost between the two stages, with no reject report.

## Ten worst specific defects

Severity: **S1** = corrupts the question/key/content; **S2** = misleads the learner or evaluator; **S3** = reproducibility/integrity risk.

1. **[S1] Wrapped option lines are appended to the stem, not to the option.** `import_banks.py:172-173`: `if current and line.strip(): current['stem'] = clean(current['stem'] + ' ' + line)`. An `A./B./C./D.` match consumes only its first physical line; continuation lines fall through to the stem. Raw example (`gen-ed-book-raw.txt` around "25. Which is NOT true in Edgar Dale's Cone"): `A. You have 30% chance to remember if you` / `attended an actual exhibit or watched video` / `demonstration.` Final `imp-ge-00158` keeps the option as `"The closer you are to the base, the more"` and its stem ends `"... Cone of Experience? direct the"`. Conservative lower bound from dangling stopword endings on an option: **47/360 (13.1%) Gen Ed, 375/1,441 (26.0%) Prof Ed, 26/1,423 (1.8%) English** final items. This is the single largest source of "awkward phrasing" the README dismisses as inherited.

2. **[S1] An entire 505-question source block is silently dropped.** `import_banks.py:140` resets `keys, rationale = {}, {}` at *every* marker, and the first marker in the book is `RATIONALES:` (not `ANSWER KEY`). Questions before it are moved to `pending` but flushed with an empty key dict, so none are emitted. Measured: the 505 question blocks before `RATIONALES:` have **0/505** stems present in either imported JSON. 25 of the 29 curated Gen Ed items come from exactly that block (`ge01` "Which generation is often described as having grown up as digital natives?"), i.e. the block was rescued by hand, not by the pipeline. There is no warning or reject count.

3. **[S1] The `verified` flag and the rationale are fabrications, not verification.** `import_banks.py:122` sets `q['verified'] = True` for any item that merely found a key letter; `prepare_bank.py:91` replaces every rationale with `f"Keyed answer in the source: {q['options'][answer]}."`. All **3,300** runtime items carry `verified: true`; **3,224** rationales (97.7%) are that circular string, e.g. `imp-en-00714`: `"rationale": "Keyed answer in the source: pidgin."` The 76 curated items have real rationales. `README.md:39` and `APP.md:35` admit "shallow rationales" but the plan's AC-1 counts these as sourced and verified.

4. **[S2] Topic tagging is dominated by fallback buckets and substring rules.** `prepare_bank.py:118-120` sets Gen Ed fallback to `'The Contemporary World'` and English fallback to `'Teaching and Assessment of the Macroskills'`. Result: **203/360 (56.4%)** imported Gen Ed items land in "The Contemporary World" and **715/1,423 (50.2%)** English items in "Macroskills", including `"What is formed during the 2nd week of prenatal period that nourishes the developing embryo?"` and `"For a powerpoint slide, the minimum lettering size is ________."` `broad_topic`'s `(['art ', ...], 'Art Appreciation')` matches the substring in "part"/"start"/"chart": a Down-syndrome item ("all or part of a third copy of chromosome 21") is tagged **Art Appreciation**. `topic_for`'s `'esp'` matches "especially", `'test'` matches "contest/protest", and first-match-wins makes overlaps (`ethic`, `generation`, `technology`) arbitrary.

5. **[S2] Source citations do not identify a unique source item.** Only **754 distinct `source` strings for 3,300 items**. `LET English Reviewer Sets 1-10, item 1` is attached to **10 different questions**; `Sir Jay 2026 Extensive Reviewer (Gen Ed/Prof Ed), item 128` to **13 different questions** (max multiplicity 13 in Prof Ed). No page, set, section, or PDF locator is recorded; `num` is dropped from the final files. Independently, **24/29 curated Prof Ed** and **10/18 curated English** stems cannot be found in the committed raw text even though their tags claim "answer key verified". Examples: `pe01` "Hilda Taba proposed an 'inductive' or 'grassroots' approach…" and `en05` "How many inflectional morphemes are there in the English language?". The citation is therefore not a reproducible pointer.

6. **[S2] Key-to-question pairing is number-based and locally fragile (English is currently correct, book is unverifiable).** `import_banks.py:110-118` joins keys to questions by integer `num` inside a batch, assuming options arrive in strict A-B-C-D order (`current['parts'].append(...)` at line 164, no letter tracking). Independent re-parse of the English extract recovered 1,478 keys and matched the final answer *text* to the source key for **1,422/1,423** English items, and option order matched in all 1,422 — so current English pairing is sound. The one apparent exception is a source near-duplicate, not a miskey: Set 5 item 22 ("invented **but only** for the purpose of trade", options `a dialect/a creole/a pidgin`) vs item 96 ("invented **by them** for…", options `dialect/creole/pidgin`), both keyed C; only item 96 survived. For Gen Ed/Prof Ed no such check is possible: numbers repeat up to 14 times and there is no page/section locator, so a misordered answer key or a dropped option line would propagate invisibly.

7. **[S1] Duplicate option text creates items where the same answer is wrong or right depending on position.** Counted **11** items with fewer than four distinct options (3 Gen Ed, 6 Prof Ed, 2 English). `imp-en-00880`: `options: ['Pragmatics', 'Analysis', 'Phonetics', 'Pragmatics']`, key = 1 (`Analysis`). `imp-pr-00485`: `['II, III, IV', 'I, II, III', 'II, III, IV', 'I, II, III, IV']`, key = 3 (D). `imp-ge-00158`: options A and C are both `"The closer you are to the base, the more"` while the key is A — choosing the identical text at C is marked wrong. `make_clues` then picks the first non-key option and tells the learner to eliminate text identical to another option.

8. **[S2] Dedupe is stem-prefix-only, per-bank, and leaves exact duplicates in the shipped bank.** Two different key lengths (`[:120]` in `import_banks.py:203`, `[:110]` in `prepare_bank.py:59`) are used, options are ignored, and curated JS items are never deduped against imports. Result: **5 exact-stem groups / 6 extra copies** in the runtime bank, including the 3-way `"Which does not belong to the group?"` (`imp-pr-00577`, `en02`, `imp-en-00136`), plus `"It is a kind of listening for specific information."` (`en04` / `imp-en-00035`) and four more; **6/19 near-duplicate groups (7/19 extra copies)** at a 90-character normalised prefix in Gen Ed/Prof Ed, e.g. two variants of `"Ask to do a learning task, Joe hesitates and says 'Mahirap…'"`. Six of the 18 curated English items duplicate imported ones outright (`en02, en04, en08, en12, en14, en18`) and `pe20` duplicates a Prof Ed import.

9. **[S2] Generated clues are low-information and sometimes misleading.** `prepare_bank.py:47-52` emits `"Topic area: {topic}. Recall the core idea before choosing."` and `"Eliminate “{wrong[:48]}” — it does not fit the stem's keyword."` for 3,224 items. With 50% of English items in one topic and 56% of Gen Ed in one topic, clue 1 is effectively constant; clue 2's "stem's keyword" claim is unsupported for items like `"Which one has the correct stress?"` (`imp-en-01317`, clue: `Eliminate “ceremoNY” — it does not fit the stem's keyword.`) and for near-duplicate options. `wrong[0]` is the first non-key option, not the most plausible distractor, and truncation at 48 characters produces fragments such as `"The farther you are from the bottom, the"`.

10. **[S3] The contributor path is not documented or portable.** Raw text is committed (good), but the PDF, the `pdftotext -raw` command/version, and any input checksums are not; `README.md:19-23` and `APP.md:22-24` describe sourcing but not regeneration. Neither Python step is exposed in `package.json` (only `validate:bank` is), there is no `requirements.txt` or pinned Python version, `gen_icons.py:7` hardcodes `C:/Windows/Fonts/arialbd.ttf` and needs Pillow (not declared anywhere), and `inspect_import.py:4` hardcodes `C:/Users/bryan/…`. No golden-output check, reject log, or manifest records how the committed finals were approved.

## Validator blind spots — demonstrated, not hypothetical

I copied the validator and bank into a scratch directory (no project files changed) and injected defects into `english-final.json`. **All passed**:

- duplicate stem with a fresh unique ID → PASS (only ID uniqueness is checked);
- `rationale: 'x'` and `source: '???'` → PASS (only truthiness checked);
- `difficulty` deleted → PASS (never checked; note all 76 curated items already lack `difficulty`);
- clue 2 quoting the key as the option to eliminate → PASS;
- a clearly wrong-topic item (`stem: 'What is photosynthesis?'`, `topic: 'Creative Writing'`) → PASS (topic membership only, not correctness);
- duplicate option text and a changed answer index → PASS;
- every final truncated to one item → **79 items total, still PASS**, despite `80-day-pwa.md` AC-1 requiring ≥3,000 (`validate-bank.mjs:23-30` prints counts but never asserts them).

Further blind spots from reading the script: `validate-bank.mjs:8-10` mutates `q.subject` when absent, so 76 curated items pass by side effect rather than data quality; only the runtime bank built by `index.js` is checked, so hand-edited `*-final.json` files or drift from a fresh regeneration are invisible; `answerText` isn't checked against `options[answer]`; no answer-distribution or topic-distribution sanity check; whitespace-only strings pass; and the success message on line 25 claims "Every item has 4 options, a key, a rationale, a source tag and 2 clues" without gating on duplicate IDs, topic correctness, or any of the above.

## Proposed cleanup script design (`scripts/clean_bank.py`, not implemented here)

Run as a deterministic, logged pipeline that writes `*-final.json` plus a `manifest.json` and a `rejects.jsonl` with a reason code for every dropped item. It should never silently drop.

**Stage 0 — provenance gate.** Record `sha256` of each raw extract, source document ID, extraction command and tool version, and expected item counts. Refuse to run on an unknown hash unless `--allow-new-source` is passed with an explicit note. Provide `--check` that re-generates into a temp dir and fails on any byte difference from committed finals.

**Stage 1 — structure-aware parser.** Track the current option *letter*; append continuation lines to that option until the next `A./B./C./D.` or numbered question. Require exactly A, B, C, D in order; reject (do not truncate) any block with missing, extra, or out-of-order options. Keep the stem free of option text. Emit a unique locator `{source_id, set_or_section, page, item_no}`; reject a question whose locator is already used.

**Stage 2 — key pairing.** Parse key/rationale sections into typed records; pair only within a section whose boundary is explicit, flush before clearing buffers at any marker, and derive a letter from `RATIONALES:`-style text only with an explicit flag and a logged warning. Require exactly one key per locator, in range, with no duplicate numbering inside a section. Cross-check the keyed option's text against the answer text where the source supplies it (English and the book's `ANSWER KEY` sections both do).

**Stage 3 — content filters (reject with reason).** Stem 25–400 characters and containing an interrogative/blank (drops context-free stems like "Which does not belong to the group?"); no dangling stopword/terminal fragment; options non-empty, ≥8 characters unless whitelisted (`I only`, `II, III, IV`, single words), and all distinct after case/punctuation normalisation; `answerText == options[answer]`; no `\ufffd`, `\xad`, or control characters; no stem longer than 400 characters (current max is 871).

**Stage 4 — dedupe across all banks.** Key on normalised stem **plus sorted normalised options**; then cluster with token-level similarity (Jaccard ≥ 0.9 / MinHash) over the union of curated + imported items in *all three subjects*. Keep the item with the best provenance (locator + real rationale), log every dropped pair with both IDs.

**Stage 5 — topic assignment.** Replace substring rules with word-boundary regexes; score all rules and require a clear winner, otherwise emit `topic: 'UNCLASSIFIED'` and quarantine for review — never fall back to the subject name or a arbitrary TOS area. Use `SUBJECTS[*].areas` from `examConfig.js` as the single source of truth; add explicit excludes so `literature` never maps to Art Appreciation and `test` does not imply Assessment of Learning.

**Stage 6 — rationale and clues.** Introduce `rationaleKind: 'curated' | 'keyed'`; keyed rationales must include the locator and are capped/reported, never counted as verified explanations. Choose the eliminated distractor by highest token similarity to the key (most plausible wrong answer), assert its normalised text differs from the key, include the option letter, and drop the "stem's keyword" phrase unless a literal keyword match exists. Clues must be ≥20 characters and distinct.

**Stage 7 — output.** Compact JSON plus a manifest with counts by subject/topic/difficulty, SHA-256 of each output, filter/dedupe drop counts by reason, and a sample of before/after pairs for human sign-off.

## Proposed stricter validator (`validate-bank.mjs`)

Keep all current checks and add; fail on any error (no soft warnings for integrity fields):

- total ≥ 3,000 and per-subject ≥ 150; print and compare against the manifest.
- never mutate data; reject missing or wrong `subject`; require `difficulty ∈ {1,2,3}`.
- `options` all non-empty, distinct after normalisation, no dangling-fragment pattern; `answerText` present and equal to `options[answer]`.
- `source` matches `source_id:set/section:page:item`; reject duplicate locators with different stems; reject any item whose locator is not in the manifest.
- exact and near-duplicate stem detection across the whole bank (normalised exact + token Jaccard ≥ 0.9).
- rationale: non-empty, ≥ 25 characters unless `rationaleKind === 'keyed'`; cap keyed rationales at a declared share and print it.
- clue 2 parses to an existing non-key option; clue 1 ≠ clue 2; both ≥ 20 characters.
- keyed answer appears among options; per-letter answer share within 15–35%; no single topic above 40% of a subject; no topic equal to the subject id.
- run against `rejects.jsonl`/manifest and verify that committed finals equal a fresh `clean_bank.py --check` regeneration; fail if the bank was hand-edited without a manifest update.

## Bottom line for a future contributor

To reproduce today: check out the repo, install Python 3 with stdlib only, run `python scripts/import_banks.py && python scripts/prepare_bank.py` from the repo root (the two raw `.txt` files are committed), then `npm run validate:bank`. SHA-256 equality with the committed JSONs is the only integrity check currently available, and it checks determinism, not correctness. Until the parser, provenance manifest, and validator above are in place, the bank should be described as **deterministically generated from two third-party text extracts, with unverified keys for the book items and key-only rationales** — not as 3,300 independently sourced and verified questions.
