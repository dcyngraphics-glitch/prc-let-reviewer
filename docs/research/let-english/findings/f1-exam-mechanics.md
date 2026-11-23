# F1 — LET exam mechanics (official subjects, item counts, duration, passing rating, 2024–2026 changes)

- Facet: `f1-exam-mechanics`
- Researcher: research subagent
- Date: 2026-11-22
- Scope: current PRC/CHED rules, 2024–2026; older sources explicitly flagged
- Question: official subjects, number of items per subject, duration (hours) per subject, passing rating, and 2024–2026 changes for the Philippine PRC Licensure Examination for Teachers (LET / LEPT)
- Decision supported: building a **timed HTML LET reviewer for English majors**. The user's premise is **"PRC is 150 items each subject per hour."**

## VERDICT ON THE USER'S PREMISE

**PARTLY CONFIRMED, PARTLY CORRECTED.**

| Part of premise | Verdict | What the sources say |
|---|---|---|
| "150 items each subject" | **CONFIRMED (with exceptions)** | Official 2025 TOS: General Education = 150 (10 areas × 15 items); Professional Education (Elementary) = 150; English specialization = 150. Official 2022 TOS: GenEd (Elem/Sec) 150, ProfEd (Elem/Sec) 150, English 150. **Exception:** Mathematics specialization = **120** items (both 2022 and 2025 TOS); TLE/TVTEd totals are 150 in the 2022 TOS, but the post-Sept-2025 split majors' counts were not verified (gap). |
| "per hour" / one hour per subject | **CORRECTED — false** | PRC's official September 2025 and September 2026 LEPT programs: **General Education 2 hours** (8:00–10:00 a.m.), **Professional Education 3 hours** (11:00 a.m.–2:00 p.m.), **Specialization 3.5 hours** (3:00–6:30 p.m.). No one-hour subject exists in the current program. |

**Builder-facing consequence:** a faithful timed reviewer should run **150 items / 120 min for GenEd**, **150 items / 180 min for ProfEd**, **150 items / 210 min for the English specialization** (≈48 s, 72 s, and 84 s per item respectively). A 60-minute timer per 150-item set would be roughly 2×–3.5× stricter than the real exam.

---

## SOURCES ACTUALLY OPENED (only these are cited)

### Tier 1 — primary (PRC / government)
- **S1** — PRC Professional Regulatory Board for Professional Teachers (PRBP), **Resolution No. 11, s. 2025**, amending Res. 11, s. 2022 on the Enhanced Table of Specifications (TOS), adopted 20 Mar 2025, Annex A (50 pp. of TOS). https://prc.gov.ph/sites/default/files/2025-11%20published%20tos%20BOPT.pdf — opened via web_extract (first page) **and** downloaded + full PDF text extracted locally (pypdf).
- **S2** — PRBP **Resolution No. 20, s. 2025**, Alignment of CHED Teacher Education Curriculum and the LEPT, adopted 3 Jul 2025. https://www.prc.gov.ph/sites/default/files/2025-20%20published%20teachers.pdf — opened via web_extract **and** full PDF text extracted locally.
- **S3** — PRC **Program of the LEPT, 21 Sep 2025**. https://www.prc.gov.ph/sites/default/files/Sept%20%20%202025%20lept%20exam%20program%20(prof%20teachers)final.pdf — opened via web_extract **and** full PDF text extracted locally.
- **S4** — PRC **Program of the LEPT, 20 Sep 2026** (approved 7 Jul 2026). https://prc.gov.ph/sites/default/files/SEptember%202026%20LEPT%20Program%20final.pdf — opened via web_extract **and** full PDF text extracted locally.
- **S5** — **PRBP Resolution No. 228, s. 1996** (passing rating), reproduced by the Supreme Court of Philippines E-Library. https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/40411 — opened via web_extract.
- **S6** — PRBP **Resolution No. 11, s. 2022** (Enhanced TOS issuance), full PDF text extracted locally. https://prc.gov.ph/sites/default/files/2022-11%20published_PTeacher.pdf — "shall be applied beginning the March 2023 LEPT onwards"; "Board Resolution No. 10 (s. 2009) and all other issuances inconsistent herewith are hereby repealed." **OLDER — baseline, superseded as amended by S1.**
- **S7** — PRC **Annex A to Res. 11, s. 2022** (TOS tables), full PDF text extracted locally. https://www.prc.gov.ph/sites/default/files/2022%20-11%20Annex%20A%20PTeacher.pdf — also opened via web_extract. **OLDER — baseline.**
- **S8** — PRC **Program of the BLEPT, 26 Sep 2021** (old program that still prints the passing rule). https://www.prc.gov.ph/sites/default/files/LET%20PROG-%20SEPT%202021.pdf — opened via web_extract; full text retained at `C:\Users\bryan\AppData\Local\hermes\cache\web\prc.gov.ph-358474cb78.md`. **OLDER.**
- **S9** — PRC article, "March 2026 Licensure Examination for Professional Teachers Results Released in Thirty-Nine (39) Working Days" (12 May 2026). https://www.prc.gov.ph/article/march-2026-licensure-examination-professional-teachers-results-released-thirty-nine-39 — opened via web_extract.
- **S10** — PRC article, "The PRC announces the Opening of Applications for the September 2025 LEPT." https://www.prc.gov.ph/article/prc-announces-opening-applications-september-2025-lept — opened via web_extract.
- **S11** — PRC article, "Two Subjects to be given in the Licensure Exam for Teachers – Elementary Level" (2012). https://www.prc.gov.ph/article/two-subjects-be-given-licensure-exam-teachers-%E2%80%93-elementary-level/3128 — opened via web_extract. **OLD (2012) — historical only.**

### Tier 2 — secondary / commercial (used only as corroboration or as conflict examples)
- **S12** — The Summit Express, "O-R Passers Elementary Level: LET Results September 2026" (18 Nov 2026). https://www.thesummitexpress.com/2026/11/o-r-passers-let-results-elementary-september-2026.html — opened via web_extract; full text at `C:\Users\bryan\AppData\Local\hermes\cache\web\www.thesummitexpress.com-0200977d25.md`, line 57 restates the 75%/50% rule "PRC said."
- **S13** — Let360, "What Score Do You Need to Pass the LET? The 75% Rule, Explained" (29 Jul 2026). https://let360.net/blog/let-passing-score/ — opened via web_extract.
- **S14** — Teach Pinas, "FREE 2026 LET Reviewer with Answers (New Curriculum)." https://www.teachpinas.com/let-reviewer-new-curriculum-with-answers-prof-ed-gen-ed-major/ — opened via web_extract.
- **S15** — Filcil, "The Licensure Exam for Teachers (LET): 6 Tips..." https://filcil.com/let-licensure-exam-teachers-6-tips-on-how-to-answer-multiple-choice-questions/ — opened via web_extract.
- **S16** — LEPT Reviewer AI, "Complete LET Reviewer Guide 2026" (updated 30 Mar 2026). https://leptreviewer.com/blog/let-reviewer-guide — opened via web_extract.
- **S17** — Super Tutor, "LET Secondary 2026 — Complete Guide." https://supertutor.ph/resources/exams/let-secondary/ — opened via web_extract.

### Blocked / not opened (recorded as gaps, NOT used as evidence)
- **G1** — CHED CMO No. 82, s. 2017 (BCAEd PSG): https://legacy.ched.gov.ph/wp-content/uploads/2017/11/CMO-No.-82-s.-2017.pdf — web_extract returned HTTP 502 "target_unreachable"; direct `curl` failed with connection error (exit 7). Search snippets seen but **not** used as evidence.
- **G2** — Annex A-1 to PRBP Resolution No. 20, s. 2025 (TOS for the new ECEd, SNed, PE, Culture & Arts, split TLE majors, refocused TVTEd): referenced in S2 but the annex file itself was not located/opened.
- **G3** — A 2024–2026 PRC document that restates the 75%/50% passing rule. The 2025 and 2026 program PDFs (S3, S4) do **not** contain the sentence; the 2026 PRC results article (S9) does not either. Rule is evidenced by S5 (1996 resolution, still cited) plus the 2021 program (S8) and 2026 secondary restatement (S12).

---

## CLAIM 1 — Official subject list and structure

**Finding (current, 2024–2026):**
- **Elementary, standard BEEd:** two subjects — **General Education** and **Professional Education** (S3, S4; statutory basis quoted in S1/S7: RA 7836 s.14). S11 (2012) is the old PRC announcement of this two-subject rule — historical confirmation only.
- **Elementary with specialization:** three subjects — GenEd, ProfEd, **Specialization**; since September 2025 the elementary specializations are **Early Childhood Education** and **Special Needs Education** (S2). S4's program confirms a third 3:00–6:30 p.m. specialization session for "Elementary examinees with specialization."
- **Secondary:** three subjects — **General Education, Professional Education, Specialization** (S3, S4; S1/S7 quote RA 7836 s.14).
- Secondary specializations after the September 2025 alignment (S2): **English, Filipino, Mathematics, Science, Social Studies, Values Education** (unchanged list per S10's application categories), plus **Culture and Arts Education** and **Physical Education** (MAPEH split), **Agriculture and Fishery Arts, Home Economics, Information and Communication Technology, Industrial Arts** (TLE split into four majors), and **TVTEd** refocused on Introductory Courses and Common Competencies. S10 (PRC, Sept 2025 application opening) corroborates the new-curriculum categories: Physical Education, Culture and Arts Education, BTLEd, BTVTEd; old-curriculum MAPEH/BSEd-MAPEH/TLE applicants choose a field at application.

**Evidence FOR:** S2 (explicit resolutions), S3/S4 (three-session program for secondary and elementary-with-specialization), S7 (RA 7836 s.14), S10 (application categories), S11 (old two-subject announcement).
**Evidence AGAINST / conflicting:** S16 (leptreviewer.com, commercial) says Elementary has "General Education (40%), Professional Education (40%), and General Education electives (20%)" and only "150 items total" — this contradicts the 40/60 two-subject program in S3/S4 and the 20/40/40 three-part track in S2/S4. Source quality: **low — commercial reviewer with internal contradictions** (it also claims "a strong score in one area can compensate" for the 50% floor). S17 (Super Tutor) lists "10 subjects" and a generic "2 days, around 4 hours per day" — contradicts the one-day PRC program (S4); **low quality / internally inconsistent** (its own search snippet claimed 8.5 hours in one day, while the opened page says 2 days × ~4 h).

## CLAIM 2 — Number of items per subject

**Finding:** 150 items per subject is the rule, with verified exceptions.

| Subject / paper | Items | Source (tier) | Notes |
|---|---|---|---|
| General Education (Elementary & Secondary) | **150** | S1 (2025 TOS, 10 units × 15 items = 150; totals row "100% 150"), S7 (2022 TOS, totals 150 for Elem and Sec) | Current 2025 GenEd units, 10% / 15 items each: Purposive Communication in English; Malayuning Komunikasyon sa Wikang Filipino; Readings in Philippine History and Society; The Life and Works of Rizal; The Contemporary World; Art Appreciation; Science and Technology; Mathematics; Ethics; Understanding the Self (S1). |
| Professional Education (Elementary) | **150** | S1 (totals "100% 150"), S7 (totals 150) | 2025 areas: Teaching Profession 15% / 23; Teacher & School Curriculum, Methods & Strategies, Educational Technology 30% / 45; Child & Adolescent Learners and Learning Principles 20% / 30; Assessment of Learning 15% / 22; Field Study and Teaching Internship 20% / 30; Action Research 5% / ~7 (S1). |
| Professional Education (Secondary) | **150** (baseline) | S7 (2022 TOS has a distinct "PROFESSIONAL EDUCATION (Secondary)" table, totals 150) | **Gap:** the 2025 Res. 11 annex (S1) prints only "PROFESSIONAL EDUCATION (Elementary)"; no separate secondary ProfEd table was found in it. 150 for secondary rests on S7 + secondary sources (S13, S14). |
| English specialization (Secondary) | **150** | S1 (English section totals "100% 150 ..."), S7 (English totals 150) | **Directly relevant to the English-major reviewer.** |
| Mathematics specialization | **120** | S1 ("TOTAL: 100% 120 18 18 60 12 6 6"), S7 (totals 120) | Verified exception to the 150 rule. |
| Filipino, Science, Social Studies, Values Education, MAPEH, TLE/TVTEd (legacy lists) | 150 each in the 2022 TOS | S7 (totals rows 150 for Values, MAPEH, Social Studies, TLE/TVTEd; Filipino 150) | S1 (2025) still carries legacy MAPEH and TLE/TVTEd tables; the new split majors' item counts are in G2 (not opened). |
| Elementary ECEd / SNed specializations | **not verified** | G2 | No item count obtained from an opened source. |

**Evidence FOR 150/subject:** S1, S7 (primary TOS totals), corroborated by S13 (secondary: "150 questions" per part; 450 total for secondary) and S14 (secondary: "each part consists of 150 test items").
**Evidence AGAINST / exceptions:** S1 and S7 themselves show Mathematics = 120. S16 claims "150 items total" for the whole LET (wrong); S17's opened page gives "Total Marks 0" and no reliable item count; both are low-quality commercial pages. No primary source supports a one-hour-per-150-items timing.

## CLAIM 3 — Duration / time allocation per subject

**Finding (official, S3 = Sep 2025, S4 = Sep 2026 — identical):**

| Track | Time | Subject | Weight | Duration |
|---|---|---|---|---|
| Elementary, no specialization | 8:00–10:00 a.m. | General Education | 40% | **2 h** |
| | 11:00 a.m.–2:00 p.m. | Professional Education | 60% | **3 h** |
| Elementary with specialization | 8:00–10:00 a.m. / 11:00–2:00 / 3:00–6:30 p.m. | GenEd / ProfEd / Specialization | 20 / 40 / 40% | **2 h / 3 h / 3.5 h** |
| Secondary | 8:00–10:00 a.m. / 11:00–2:00 / 3:00–6:30 p.m. | GenEd / ProfEd / Specialization | 20 / 40 / 40% | **2 h / 3 h / 3.5 h** |

Total scheduled testing time: **5 h** (elementary, no specialization) or **8.5 h** (secondary and elementary-with-specialization), plus a 45-minute general-instructions/form-filling window (7:00/6:30–7:45 a.m.) in the programs. All in one Sunday sitting (S3, S4, S9).

**Evidence FOR:** S3, S4 — primary PRC programs for two consecutive sittings spanning the whole 2025–2026 window; S8 (2021 program) shows the same 2 h / 3 h / 3.5 h pattern historically, so timing has been stable, not changed.
**Evidence AGAINST the user's "one hour" and conflicting secondary claims:**
- S15 (Filcil): "150 items ... time allotment of 2 hours for each subject. For Secondary ... specialization 2 hours and 30 minutes" — 2 h / 2 h / 2.5 h; contradicts S3/S4's 2 h / 3 h / 3.5 h. **Low quality — review-tips blog, no source cited.**
- S14 (Teach Pinas): "Each part consists of 150 test items that will be taken for over 3 hours" for both elementary and secondary parts — overstates GenEd's 2 h. **Low quality — commercial reviewer, explicit disclaimer of accuracy.**
- S16 (LEPT Reviewer AI): "Duration: Approximately 5 hours" for the whole exam — consistent with elementary-no-specialization but wrong for secondary. **Low quality / internally inconsistent.**
- S17 (Super Tutor): opened page says "2 days, around 4 hours per day"; its own search snippet claimed "8.5 hours in one day: GenEd 2 h, ProfEd 3 h, Specialization 3.5 h" — the opened page contradicts its snippet and the PRC program. **Low quality.**
- Search snippets also showed "150 items per subject ... ~3 hrs per subject" (PinoyBix) and "150 items per subject, 1 hour" style framings — snippets were leads only, not opened, so not cited as evidence.

## CLAIM 4 — Passing rating

**Finding:** To pass, an examinee must obtain a **general average rating of at least 75%**, with **no rating below 50% in any subject/test**. Both conditions must hold.

- Primary basis: **PRBP Resolution No. 228, s. 1996** (S5), which explicitly notes that RA 7836 does not set a passing average and that the Board, under PD 223 s.6(g), adopts 75% with a 50% floor per subject, effective from the August 1996 LEPT.
- Still being applied in the current window: S12 (18 Nov 2026 news item) reports "In order to pass the LET, an examinee must obtain an average rating of not less than 75% and must have no rating lower than 50% in any of the tests, PRC said." S13 (2026 secondary guide) states the same two-rule test and that 50% of a 150-item part = 75 correct.
- Historical program PDFs printed the rule verbatim (S8, 2021: "TO PASS THE EXAMINATION, AN EXAMINEE MUST OBTAIN AN AVERAGE RATING OF NOT LESS THAN 75% AND MUST HAVE NO RATING LOWER THAN 50% IN ANY OF THE TESTS"). S3 (2025) and S4 (2026) no longer print that line; S9 (PRC's March 2026 results article) does not print it either — **presentation change, not evidence of a rule change**.

**Evidence FOR:** S5 (primary resolution), S8 (primary program), S12 (secondary, PRC-attributed, 2026), S13 (secondary, 2026).
**Evidence AGAINST / conflicting:** S16 claims "you do not need to pass every single component individually — a strong score in one area can compensate for a weaker score" and suggests "aim for at least 70% in each area" — directly contradicts the 50% floor in S5/S8/S12. **Low quality — commercial reviewer.** No opened primary source supersedes S5's 75%/50% rule. **Gap G3:** no 2024–2026 primary document restating it was found.

## CLAIM 5 — Changes 2024–2026

Established timeline from opened primary sources:

1. **Baseline (older, flagged):** PRBP **Res. 11, s. 2022** issued the Enhanced TOS, "applied beginning the March 2023 LEPT onwards," repealing Res. 10, s. 2009 and inconsistent issuances (S6). Its Annex A (S7) set 150-item GenEd/ProfEd and specialization tables, including legacy MAPEH and combined TLE/TVTEd.
2. **2024 inputs to the 2025 amendments:** S1 recounts an **11 July 2024** meeting among PRC, the Board, the PRB of Guidance and Counseling and EDCOM II, concluding that PPST-domain articulation must be shown in the LEPT TOS. S4 notes the calculator policy for the Secondary Mathematics major under **Commission Resolution No. 1809-2024** (elementary: all calculators prohibited; secondary: all prohibited except Mathematics majors).
3. **March 2025 — new TOS:** PRBP **Res. 11, s. 2025** (adopted 20 Mar 2025) amends Res. 11, s. 2022 by incorporating PPST Domains into the Enhanced TOS (S1). Effective immediately following publication (S1 notes publication in Business Mirror; handwritten effective date not legible in the extract). GenEd is now printed as "(Elementary/Secondary)" with 10 units × 15 items; ProfEd (Elementary) totals 150; English specialization totals 150; Mathematics 120.
4. **April 2025:** PRC and CHED signed a **Joint Memorandum Circular dated 10 April 2025** agreeing to align the LEPT with new teacher-education curricula beginning September 2025 (S2; also referenced in S10).
5. **July 2025 — specialization restructuring:** PRBP **Res. 20, s. 2025** (adopted 3 Jul 2025) (S2):
   - Elementary gains **two specializations: Early Childhood Education and Special Needs Education**; BEEd degree holders still take GenEd + ProfEd only.
   - Secondary **TLE** split into four areas/majors: **Agriculture and Fishery Arts, Home Economics, Information and Communication Technology, Industrial Arts**; **TVTEd** focuses on Introductory Courses and Common Competencies.
   - **MAPEH** split into **Culture and Arts Education** and **Physical Education**.
   - Examinees under previous CHED-PSGs for MAPEH/TLE choose their field/major during application; new TOS in Annex A-1; **implemented at the September 2025 LEPT and subsequent schedules**.
   - S10 corroborates the new-curriculum application categories effective September 2025.
6. **2026:** S4 (program approved 7 Jul 2026 for the 20 Sep 2026 LEPT) retains the **same subjects, weights, 2 h / 3 h / 3.5 h timings, and 40/60 vs 20/40/40 weights** as S3 (Sept 2025) and S8 (2021). No opened primary source shows a change to item counts or durations through September 2026. S9 confirms the March 2026 sitting ran as a one-day exam with the same elementary/secondary pass reporting.

**Evidence FOR:** S1, S2, S3, S4, S6, S7, S8, S10, S9.
**Evidence AGAINST / limitations:** None of the opened primary sources states that the 150-item counts or the 2/3/3.5-hour timings changed in 2024–2026; the changes found are to TOS content and the specialization roster. G2 prevents verification of item counts for the newly created elementary and split-secondary specializations. G1 (CHED CMO 82) could not be opened, so curriculum details for BCAEd were not verified.

## Implementation note for the reviewer (derived, not a new claim)
- Elementary BEEd timed set: 150 GenEd items in 120 min; 150 ProfEd items in 180 min.
- Secondary English-major timed set: 150 GenEd / 120 min; 150 ProfEd / 180 min; 150 English specialization / 210 min.
- Display weights: secondary 20/40/40; elementary no-spec 40/60; elementary-with-spec 20/40/40.
- Passing display: 75% weighted average AND no part below 50% (≥75/150 per part).
- treat Math = 120 as an explicit exception if the reviewer ever serves Math majors.

## Top gaps (carry forward)
1. **G2 (highest):** Annex A-1 TOS of Res. 20, s. 2025 — item counts and topic weights for ECEd, SNed, Culture & Arts, Physical Education, the four TLE majors, and refocused TVTEd were not obtained.
2. **G3:** no 2024–2026 **primary** PRC document restating the 75%/50% passing rule; relies on the 1996 resolution, a 2021 program, and 2026 secondary reporting.
3. **G1:** CHED CMO 82, s. 2017 blocked (HTTP 502 / connection failure); BCAEd curriculum linkage unverified. Also note CMO 82 is a curriculum PSG, not an exam-mechanics document.
4. Secondary ProfEd item count for 2025–2026 is inferred from the 2022 TOS (S7) because the 2025 annex (S1) prints only the Elementary ProfEd table.
5. Effective date of Res. 11, s. 2025 is only partly legible in the PDF extract (publication in Business Mirror noted; exact effective date not confirmed).
