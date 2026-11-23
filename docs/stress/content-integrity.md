# Content integrity audit — cleaned 1,781-item bank

Date: 2026-11-23. Scope: read-only audit of the bank actually loaded by the app (`src/data/index.js` → `questionBank` / `allQuestions`). Every number below was computed with code from `imported/*-clean.json`, `rejects.jsonl`, `manifest.json`, `scripts/clean_bank.py` and `scripts/validate-bank-strict.mjs`. No project data or app code was changed; the validator injection test ran against a scratch copy under `%TMPDIR%/content-integrity/valtest/`.

## Verdict

The clean gate did its job on the imported set: **0 residual hard-garble flags in the 1,705 imported-clean items**, 1,519 rejects recorded with reason counts matching the manifest exactly, answer letters balanced, and clue2 never reveals the key. Three defects injected into a scratch copy were all caught by the strict validator. What survives is not content quality but **coverage and traceability debt**: two English TOS areas are still at zero, 96% of items still carry a key-only placeholder rationale, and source strings are not unique (15 collisions in 13 groups) yet the validator passes all of it.

---

## 1. Counts and provenance (measured)

| Subject | `*final.json` in | Imported clean | Hand-written seeds | Delivered total | Rejected |
|---|---:|---:|---:|---:|---:|
| gened | 360 | 171 | 29 | 200 | 189 |
| profed | 1,441 | 789 | 29 | 818 | 652 |
| english | 1,423 | 745 | 18 | 763 | 678 |
| **Total** | **3,224** | **1,705** | **76** | **1,781** | **1,519** |

`1,705 + 76 = 1,781` and `3,224 − 1,519 = 1,705`; both identities hold. `rejects.jsonl` has 1,519 lines. Recomputed reject reasons match `manifest.json` **exactly**:

| fallback_topic | trailing_fragment | truncated_option | stem_length | repeated_word | duplicate_options | all_of_above | header_leak |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 705 | 668 | 507 | 60 | 21 | 19 | 60 | 7 |

## 2. Residual garble (gate regexes applied to the delivered bank)

| Check (`clean_bank.py` definition) | Imported clean (1,705) | Seeds (76) |
|---|---:|---:|
| stem length out of 20–400 | 0 | 0 |
| trailing fragment in stem (`TRAIL`) | 0 | 1 (`pe06`) |
| header leak in stem (`LEAK`) | 0 | 0 |
| repeated word in stem (`DUPW`, raw and stop-listed) | 0 | 0 |
| truncated option (`TRUNC`) | 0 | 1 (`ge21`) |
| duplicate options within item | 0 | 0 |
| all-of-above present / keyed | 0 | 0 |
| placeholder key (`N/P`, `N/A`, `TBA`, empty) | 0 | 0 |

The 1,705 imported-clean items are clean on every gate check. The two seed flags are heuristic false positives, not real garble:

- `ge21` — options `['are','is','were','shall be']` for `Leche flan on ice cream ___ my all-time favorite dessert.` `TRUNC` matches because each option ends in a stop-word; the options are legitimate short verbs.
- `pe06` — Roman-numeral combo item; `TRAIL` matches the `I./II./III./IV.` statements after `?`, the standard LET combo format.

**Validator blind spot:** the baseline strict validator prints `Strict bank validation: PASS` with both items present. It has no stem trailing-fragment check at all, and its truncated-option check is gated on `o.length > 12`, so `ge21`'s 3–8 char options are skipped. A real trailing-fragment or short truncated option in a delivered item would not fail the build.

## 3. Duplicate options and all-of-above keys

Zero in the delivered bank. The gate rejects any item with normalized duplicate options and any item where `all/none of the above/these` appears in *any* option; 19 and 60 items were rejected for those reasons respectively, and none recur in the clean set.

## 4. Clue-2 safety

All 1,705 imported-clean items have `clue2 = "Eliminate option <X> — it does not fit the stem."` where `<X>` is always a **non-key** option (chosen from indices whose normalized text differs from the key). Measured on the delivered bank:

- clue2 eliminates the key letter: **0**
- clue2 contains the full key text (case-insensitive, length ≥ 4): **0**
- validator `clue eliminates key` (`norm(clue2).includes(norm(key))`): **0**

Clue2 is safe from leaking the answer. It is, however, a generic hint rather than content: 1,705 of 1,781 items (**95.7%**) have `rationaleKind = 'keyed'`, i.e. `rationale = "Key only — check the source before trusting it. Answer: <text>."` Only the 76 seeds (4.3%) have curated rationales. Feedback still explains nothing.

## 5. Answer-letter balance (full 1,781-item bank)

| Letter | Count | Share | gened | profed | english |
|---|---:|---:|---:|---:|---:|
| A | 466 | 26.2% | 58 (29.0%) | 223 (27.3%) | 185 (24.2%) |
| B | 456 | 25.6% | 52 (26.0%) | 205 (25.1%) | 199 (26.1%) |
| C | 423 | 23.8% | 43 (21.5%) | 195 (23.8%) | 185 (24.2%) |
| D | 436 | 24.5% | 47 (23.5%) | 195 (23.8%) | 194 (25.4%) |

All letters are inside the 20–30% target band for every subject. Gen Ed A at 29.0% is the furthest from even, but not out of band. No action needed on balance.

## 6. Topic coverage — TOS areas at or near zero

Full bank (imported-clean counts in parentheses; TOS targets are the 150-item-exam counts from `docs/reviews/content-audit.md`):

| Subject | Topic | Full | Imported clean | TOS target |
|---|---|---:|---:|---:|
| english | Children and Adolescent Literature | **0** | **0** | 12 |
| english | Contemporary, Popular and Emergent Literatures | **0** | **0** | 6 |
| english | Remedial Instruction | 4 | 4 | — |
| english | Survey of Literature of Selected Countries | 10 (9) | 9 | 20 |
| profed | Field Study and Teaching Internship | 5 | 4 | 30 |
| gened | Malayuning Komunikasyon sa Wikang Filipino | 6 | **0** | 15 |
| gened | The Life and Works of Rizal | 8 | 3 | 15 |
| gened | Purposive Communication in English | 7 | 4 | — |
| gened | Science and Technology | 7 | 4 | — |

Three Gen Ed areas and two Prof Ed/English areas sit under 5 in the imported-clean set. Cleaning did not solve coverage; it removed items without adding any. Over-concentration remains: Teaching Profession 287, Child and Adolescent Learners 261, Macroskills 130, The Contemporary World 61. No topic outside the declared `KEYWORDS` universe appears in the bank.

## 7. Source traceability

- **Source strings are not unique.** 15 items beyond the first share a source string, across **13 duplicate groups**. Cause: `clean_bank.py:122` appends `| ref:<first 10 normalized stem chars>`; stems beginning "Which of the…" all collapse to `ref:whichofthe`, and `item N` pointers repeat across unrelated questions. Example: `LET English Reviewer Sets 1-10, item 5 | ref:whichofthe` is carried by `imp-en-00172`, `imp-en-00470` and `imp-en-00899` — three different questions, so at least two pointers are wrong. Same for `item 91` (3 items) and 11 two-item groups.
- The validator's own duplicate locator is `source|norm(stem)[:60]`; it sees **0** duplicates, so items remain technically distinguishable, but the human-facing `source` field alone is ambiguous.
- All 1,705 imported rationales are the key-only placeholder above. The source's own rationale text is still not stored, so following a key back to "why" remains impossible from this dataset.

## 8. Strict validator — injected-defect test (scratch copy only)

A full scratch tree (validator + `index.js` + seeds + clean JSON + manifest + `package.json`) was copied to `%TMPDIR%/content-integrity/valtest/`. Baseline on the untouched scratch copy: `Strict bank validation: PASS`. Three defects were then written into the scratch clean JSON only:

| # | Item | Injected defect | Validator output |
|---|---|---|---|
| 1 | `imp-ge-00000` | option[1] replaced with key text `Letter` → normalized duplicate options | `imp-ge-00000: duplicate options` |
| 2 | `imp-pr-00001` | keyed option replaced with `All of the above` | `imp-pr-00001: all-of-above keyed` |
| 3 | `imp-en-00000` | clue2 set to `The answer is Literature is aesthetic. Choose it.` | `imp-en-00000: clue eliminates key` |

Result: `VALIDATION FAILED`, exit code 1, exactly one message per injected defect. The validator is effective for duplicate options, all-of-above keys and clue2 key leaks. It is **not** a blanket content gate: as shown in §2 it misses trailing fragments and short truncated options, and it has no check for source-string uniqueness (the 15 collisions pass silently).

---

## Top 3 residual problems

1. **Coverage holes survive cleaning.** Two English TOS areas are at absolute zero (Children and Adolescent Literature 0/12; Contemporary/Popular/Emergent Literatures 0/6); Field Study is 5 vs 30, Rizal 8 vs 15, and Gen Ed Filipino/Malayuning is 0 in the imported-clean set. A uniformly sampled practice set never teaches these areas.
2. **Feedback and traceability are still untrustworthy.** 95.7% of items have a key-only placeholder rationale and a formulaic clue2, so no item explains its answer; 15 items across 13 groups carry a non-unique `source` pointer, and no imported item stores the source's rationale text.
3. **The strict validator has blind spots.** It passed the baseline despite 2 residual garble flags in seeds, ignores stem trailing fragments entirely, only tests truncated options longer than 12 characters, and never checks source uniqueness — so "PASS" still overstates content integrity.
