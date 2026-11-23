# F2 — LET English-Major Topic Coverage: Cited Findings & Hierarchical Outline

**Facet:** f2-english-major-outline
**Research date:** 2026-11-22
**Question:** What exact topics and subtopics are covered by the English-major area of the Philippine LET (language/grammar/linguistics, phonetics/phonology, semantics/syntax, Philippine/Asian/Western literature, composition/writing, and teaching of English)?
**Decision supported:** Defining question-bank categories for a mobile HTML LET reviewer aimed at English majors.
**Audience / geography / time frame:** App builder and LET examinees; Philippines; current 2024–2026 syllabus, older sources flagged.
**Method:** 5 seed searches; 8 pages opened with `web_extract` (plus `browser_exec` for one full article body); two PRC PDFs also downloaded and re-extracted with `pdftotext` to recover clean text from OCR-garbled `web_extract` output — same documents, no new sources. Only opened pages are cited; snippets were used purely as leads. Instruction-like text present in fetched pages was disregarded.

---

## 1. Bottom line

There are **two different scope lists in circulation**, and most reviewer sites still publish the older one:

- **CURRENT (governs 2024–2026 exams): the Enhanced Table of Specifications** issued as **BPT Resolution No. 11, s. 2022**, amended by **BPT Resolution No. 11, s. 2025** (signed 20 March 2025, effective on publication). The English (Secondary) majorship is **150 items / 40% of the Secondary rating**, organised as **22 numbered areas** in **3 sections**: A. Theoretical Foundations of Language, Culture, Literacies, and Literature (25%); B. Literature (30%); C. Methodology (45%). This is stated in the PRC document itself and corroborated by reviewers.[1][5][6][7]
- **SUPERSEDED: the older "program bulletin" coverage** (same 19-item grouping appears in PRC bulletins from at least 2012 through January 2022). It is still copied, verbatim and mislabeled "2026 coverage," by reviewer sites.[2][8]

**For a 2024–2026 question bank, use the 22-area Enhanced TOS as the category spine** (Section 3), and treat the older list as an alias/legacy crosswalk only (Section 5).

---

## 2. Source register — PRIMARY vs SECONDARY

| # | Source | Type | How opened | Use in this file |
|---|--------|------|-----------|------------------|
| [1] | PRC, *Professional Regulatory Board for Professional Teachers — Resolution No. 11 (s. 2025), amending Resolution No. 11 (s. 2022), Enhanced TOS* — https://prc.gov.ph/sites/default/files/2025-11%20published%20tos%20BOPT.pdf | **PRIMARY (current, authoritative)** | `web_extract` (OCR-garbled); clean text from the same downloaded PDF via `pdftotext` | Exact 22 areas, weights, item counts, learning outcomes |
| [2] | PRC, *Program of the LEPT, 28 March 2021* — https://www.prc.gov.ph/sites/default/files/LET%20PROG-%20MARCH%202021.pdf | **PRIMARY (older, superseded)** | `web_extract`; clean text via `pdftotext` | Legacy English coverage list; Gen Ed English list |
| [3] | CHED, *CMO No. 24, s. 2017 — AB English Language / English Language Studies PSG* — https://legacy.ched.gov.ph/wp-content/uploads/2017/10/CMO-24-s-2017.pdf | **PRIMARY (different degree track; background only)** | `web_extract` (partial OCR) | Course-name background; **not** the LET TOS |
| [4] | CHED, *Description of Courses* — https://legacy.ched.gov.ph/wp-content/uploads/2018/02/Description-of-Courses.pdf | **PRIMARY (unusable here)** | `web_extract` | Opened but extraction returned general-ed/nursing material; **not cited for English topics** — see gaps |
| [5] | EduReaper, *LET PRC TOS Enhanced and Updated (2026)* — https://www.edureaper.com/2025/10/licensure-examination-for-teachers-let.html | **SECONDARY (reproduces the PRC TOS)** | `web_extract` + full body via `browser_exec` | Learning-outcome wording, 25/30/45 section split, full 22-area breakdown |
| [6] | Super Tutor PH, *LET English Major: Literature, Linguistics, and Speaking Skills* — https://supertutor.ph/blog/let-english-major-strategy/ | **SECONDARY (commercial reviewer)** | `web_extract` | Five-block coaching view, recurring authors/works, item estimates, phonetics/IPA drill claims |
| [7] | LETPass, *English LET Reviewer* — https://letpass.ph/subjects/major-english | **SECONDARY (commercial question bank)** | `web_extract` | Clean enumeration of the 22 topics "in PRC TOS order" with question counts |
| [8] | TeachPinas, *LET COVERAGE 2026* — https://www.teachpinas.com/let-coverage-licensure-examination-for-teachers/ | **SECONDARY (review site, stale content)** | `web_extract` | Example of the **older** coverage list mislabeled as 2026 |

> Primary material = [1], [2], [3], [4]. Secondary reviewers = [5], [6], [7], [8]. Where they conflict, the PRC document [1] governs.

---

## 3. HIERARCHICAL TOPIC OUTLINE — current Enhanced TOS (PRIMARY: [1])

Document header: *"TABLE OF SPECIFICATIONS in ENGLISH* (Secondary) — With integration of Philippine Qualifications Framework Level 6 Domain Descriptors." Difficulty levels: Easy 30% / Moderate 50% / Difficult 20%; cognitive columns Remember, Understand, Apply, Analyze, Evaluate, Create.[1]

Section weights are not printed as a single line in [1] but are obtained by summing its per-area weights: A = 10+2+11+2 = **25%**; B = 8+5+13+4 = **30%**; C = 10+10+2+2+3+2+2+2+2+2+2+2+2+2 = **45%**; total **100%**. EduReaper states the same 25/30/45 split explicitly.[1][5]

### A. THEORETICAL FOUNDATIONS OF LANGUAGE, CULTURE, LITERACIES, AND LITERATURE — 25%

**A1. Introduction to Linguistics — 10% (15 items).** Learning outcomes:[1]
- 1.1 Knowledge and application of the **structural aspects of language: phonology, morphology, syntax, semantics, and pragmatics** across languages and related fields.
- 1.2 Apply theories, principles, concepts of language, literacies and language use in specific contexts for language and literacy acquisition and learning in multilingual and multicultural societies.
- 1.3 Draw implications of **linguistics, psycholinguistics, and sociolinguistics** theories to language teaching and learning.

**A2. Language, Culture, and Society — 2% (3 items).**
- 2.1 Relationship of language, culture, and society in English language teaching and learning.
- 2.2 Language learning environments with regard to community contexts.[1]

**A3. Structure of English — 11% (17 items).**
- 3.1 Describe and analyse the **form, meaning, and use** of various language structures; grammatical concepts.[1]

**A4. Language Programs and Policies in Multilingual Societies — 2% (3 items).**
- 4.1 Language policies and programs influencing language teaching/learning in a multicultural setting.
- 4.2 Designing and developing basic language programs in multilingual and multicultural societies.[1]
  - *Naming note:* [5] prints this as "Language Programs and Policies in Multilingual **Policies**" (apparent typo); [1] and [7] say "**Societies**" — use "Societies."

### B. LITERATURE — 30%

**B5. Children and Adolescent Literature — 8% (12 items).**
- 5.1 Knowledge and understanding of children literature and adolescent literature.
- 5.2 Apply concepts, principles, methods, strategies in teaching literacy skills using varied children and adolescent literary texts.[1]

**B6. Mythology and Folklore — 5% (7 items).**
- 6.1 Knowledge and principles of mythology and folklore **from different countries**.[1]

**B7. Survey of Literature of Selected Countries — 13% (20 items).** Largest single area.
- 7.1 Literature of the following countries:
  - **7.1.1 Philippine Literature in English**
  - **7.1.2 Afro-Asian Literature**
  - **7.1.3 English and American Literature**
- 7.2 Insights into other peoples' philosophy, culture, religions, beliefs, needs, aspirations.
- 7.3 Preparing annotated reading lists of selected literary pieces from different countries.
- 7.4 Analysing and appreciating outstanding characteristics of literature of different countries.[1]

**B8. Contemporary, Popular and Emergent Literatures — 4% (6 items).**
- 8.1 Analyse and evaluate critical issues in contemporary, popular and emergent literature and their relevance in the teaching-learning process.
- 8.2 Use various methods of literary analysis.[1]

### C. METHODOLOGY — 45%

**C9. Teaching and Assessment of the Macroskills — 10% (15 items).**
- 9.1 Nature of the **five language components** and the theoretical bases, principles, methods in teaching them. (Note: [1] says "five"; [5] renders "fine language components" — likely OCR/transcription error. Use "five".)
- 9.2 Apply concepts, principles, methods in language teaching and assessment of language proficiency following the rules of grammar.[1]

**C10. Teaching and Assessment of Literature — 10% (15 items).**
- 10.1 Nature of literature; theoretical basis, principles, methods, strategies in literature teaching and assessment.
- 10.2 Categories, types/genres of literature and their relevance in the teaching-learning process.[1]

**C11. Language and Literature Learning Materials Development — 2% (3 items).**
- 11.1 Develop contextualized and localized teaching and learning materials.
- 11.2 Develop, implement, evaluate instructional materials in print and non-print form for language, literacy and literature instruction.
- 11.3 Apply technology for designing/developing materials for hybrid learning.[1]

**C12. Speech and Theatre Arts — 2% (3 items).**
- 12.1 Oral communication; public speaking, group discussion, debate, oral interpretation, dramatics in English language teaching and learning.[1]

**C13. Language Education Research — 3% (4 items).**
- 13.1 Identify pressing issues and problems in language teaching and learning.
- 13.2 Apply principles and approaches in research to answer questions in language and literature teaching and learning.[1]

**C14. Literary Criticism — 2% (3 items).**
- 14.1 Basic approaches to problems in critical theory **from classical to modern times** as applied to literary works.
- 14.2 Implications of literary criticism and critical theory in English language and literature teaching.[1]

**C15. Stylistics and Discourse Analysis — 2% (3 items).**
- 15.1 Literary, scientific, and technical aspects of language and texts through stylistic analysis and discourse analysis.
- 15.2 Conceptual framework and schema of linguistics and literature in understanding literary language.[1]

**C16. Campus Journalism — 2% (3 items).**
- 16.1 Concepts, principles, strategies in creative writing for **traditional and new media**.[1]

**C17. Technical Writing — 2% (3 items).**
- 17.1 Write and revise different technical reports; proficiency in written communication.
- 17.2 Technical and scientific writing skills for communication across disciplines.[1]

**C18. Technology in Language Education — 2% (3 items).**
- 18.1 Design, production, utilization, evaluation of ICT materials for teaching and learning.[1]

**C19. Translation and Editing of Text — 2% (3 items).**
- 19.1 Theories, principles, methods, approaches applied to writing and editing various types of texts.
- 19.2 Translate texts from English to another language or from other Philippine languages to English.[1]

**C20. English for Specific Purposes — 2% (3 items).**
- 20.1 Content-based principles and strategies in developing language proficiency for a specific discipline.[1]

**C21. Remedial Instruction and Early Intervention for Language Learning Difficulties — 2% (3 items).**
- 21.1 Approaches, strategies, techniques in organizing, designing, implementing, evaluating remedial and early intervention programs in language and literacy across the discipline.[1]

**C22. Creative Writing — 2% (3 items).**
- 22.1 Theories, concepts, principles, techniques in creative writing: **biographical sketches, fiction, creative nonfiction, poetry**.[1]

### Crosswalk: the six facets named in the question → official 22 areas

| Requested facet | Official TOS home | Evidence & caveat |
|---|---|---|
| Language / grammar / linguistics | A1 Introduction to Linguistics (phonology, morphology, syntax, semantics, pragmatics), A3 Structure of English (form/meaning/use), C15 Stylistics and Discourse Analysis | [1] |
| Phonetics / phonology | **Phonology only** is named in A1.1. "Phonetics," IPA, 44 phonemes, minimal pairs appear **only in a secondary reviewer** ([6]), not in the PRC learning outcomes | [1] vs [6] — see §6 dispute 2 |
| Semantics / syntax | A1.1 and A3.1 explicitly | [1] |
| Philippine / Asian / Western literature | B7 with sub-labels 7.1.1 Philippine Literature in English, 7.1.2 Afro-Asian Literature, 7.1.3 English and American Literature; plus B6 Mythology and Folklore, B5 Children/Adolescent, B8 Contemporary/Popular/Emergent. "Western" is not a TOS label — the nearest official label is "English and American Literature" | [1] |
| Composition / writing | C17 Technical Writing, C22 Creative Writing, C19 Translation and Editing, C16 Campus Journalism. "Composition" is **not** a majorship area name; it appears in the Gen Ed English list ("Writing in the Discipline", "Study and Thinking Skills") and in secondary reviewer topic labels | [1][2][7] — see §6 dispute 3 |
| Teaching of English | C9 Macroskills, C10 Literature teaching, C11 Materials Development, C12 Speech/Theatre, C13 Research, C14 Criticism, C18 Technology, C20 ESP, C21 Remedial — 45% of the paper | [1] |

### Recommended question-bank categories (derived mechanically from [1])

Use the 22 area names as top-level categories, with weight-based item budgets out of 150:
`01 Introduction to Linguistics 15` · `02 Language, Culture, and Society 3` · `03 Structure of English 17` · `04 Language Programs and Policies in Multilingual Societies 3` · `05 Children and Adolescent Literature 12` · `06 Mythology and Folklore 7` · `07 Survey of Literature of Selected Countries 20` · `08 Contemporary, Popular and Emergent Literatures 6` · `09 Teaching and Assessment of the Macroskills 15` · `10 Teaching and Assessment of Literature 15` · `11 Language and Literature Learning Materials Development 3` · `12 Speech and Theatre Arts 3` · `13 Language Education Research 4` · `14 Literary Criticism 3` · `15 Stylistics and Discourse Analysis 3` · `16 Campus Journalism 3` · `17 Technical Writing 3` · `18 Technology in Language Education 3` · `19 Translation and Editing of Text 3` · `20 English for Specific Purposes 3` · `21 Remedial Instruction and Early Intervention for Language Learning Difficulties 3` · `22 Creative Writing 3`. Sum = 150 items. Category order matches the PRC numbering and LETPass's "22 topics from the PRC table of specifications."[1][7]

Second-level tags can be taken from the numbered learning outcomes quoted above (e.g. 7.1.1 Philippine Literature in English; 1.1 phonology/morphology/syntax/semantics/pragmatics) and from the explicit genres in 22.1 (biographical sketch, fiction, creative nonfiction, poetry).[1]

---

## 4. Secondary elaboration of topic *content* (what reviewers say is actually tested)

These are **not** PRC categories; they are useful as question-level subtags but must be labelled as reviewer-derived.

- **Super Tutor** describes five coaching blocks: Philippine Literature (~20 items: pre-colonial, Spanish, American, contemporary); World Literature (~20: ancient, medieval, Renaissance, modern, postmodern); Linguistics and Grammar (~25: phonetics, phonology, morphology, syntax, semantics, English usage); Language Teaching (~20: methods, approaches, four macro skills, assessment); Speech, Drama and Communication Arts (~15: speaking, listening, mass media, discourse). It names recurring authors: **Rizal, Balagtas, Bulosan, Joaquin, F. Sionil Jose**, pre-colonial epics **Hudhud, Darangen, Ibalon**, playwrights **Severino Reyes, Wilfrido Maria Guerrero**; **Shakespeare, Greek tragedy, Homer, Bible as literature, Joyce/Woolf/Eliot/Hemingway, Marquez/Borges/Atwood, Tagore/Mishima/Murakami**. It also asserts 8–10 embedded grammar/usage items and direct IPA testing (2–3 items). Its percentages/blocks do **not** match the official TOS and should not be used as weights.[6]
- **EduReaper** reproduces the full 22-area TOS with learning outcomes and the 25/30/45 section split; its wording agrees with [1] almost verbatim (it omits the detailed 7.2–7.4 outcomes).[5]
- **LETPass** confirms the 22-area enumeration in PRC TOS order; its per-topic **question counts are its own bank inventory**, not exam weights (e.g. 465 items for Macroskills), so do not use them as TOS percentages.[7]

---

## 5. SUPERSEDED coverage list (PRIMARY [2], still copied by [8])

PRC program bulletin, 28 March 2021, "COVERAGE OF EXAMINATION IN THE FIELDS OF SPECIALIZATION FOR SECONDARY TEACHER EXAMINEES ONLY":

> 1. ENGLISH (Remedial Instruction in English; English for Specific Purposes; **THEORETICAL FOUNDATIONS OF LANGUAGE AND LITERATURE**: Introduction to Linguistics; Structure of English; Introduction of Stylistics; Literary Criticism; **LITERATURE**: Mythology and Folklore; Afro-Asian Literature; English and American Literature; **METHODOLOGY**: The Teaching of Speaking, Listening and Reading; Teaching of Literature; Preparation and Evaluation of Instructional Materials; Language and Literature Assessment; Language Research; Campus Journalism; Translation and Editing of Text; Speech and Stage Arts; Creative Writing).[2]

[8] reproduces this list verbatim under a "2026 LET Coverage" heading while also correctly quoting the Enhanced-TOS implementation note (Board Resolution No. 11, s. 2022, applied beginning March 2023) — internally inconsistent, so treat [8]'s English list as stale.[8]

**Legacy → current aliases:** "Remedial Instruction in English" → C21 "Remedial Instruction and Early Intervention for Language Learning Difficulties"; "Introduction of Stylistics" → C15 "Stylistics and Discourse Analysis"; "The Teaching of Speaking, Listening and Reading" + "Language and Literature Assessment" → C9 "Teaching and Assessment of the Macroskills" and C10 "Teaching and Assessment of Literature"; "Preparation and Evaluation of Instructional Materials" → C11; "Afro-Asian Literature" + "English and American Literature" → sub-labels under B7 "Survey of Literature of Selected Countries"; "Philippine Literature in English" is explicitly a B7 sub-label in the current TOS but was Gen Ed only in the old bulletin.[1][2]

### Gen Ed English (context — NOT the majorship)

PRC [2], "COVERAGE OF EXAMINATION FOR GENERAL EDUCATION": English = **Study and Thinking Skills; Writing in the Discipline; Speech and Oral Communication; Philippine Literature; Master Works of the World**. This is where "composition" and basic grammar/usage sit for exam purposes; do not mix these into the 22 majorship categories.[2]

---

## 6. Disputed scope — evidence for and against

**Dispute 1 — which list governs 2024–2026?**
- *For the 22-area Enhanced TOS:* [1] is a later PRC resolution that expressly amends Res. 11 (s. 2022); [5] states the enhanced TOS has applied since March 2023 and "continues to be applicable for 2026 examinations"; [6] cites BPT Resolution No. 11, s. 2025 for its "22 areas"; [7] enumerates the same 22 topics "from the PRC table of specifications."
- *For the older 19-item list:* [2] is an official PRC bulletin; [8] still publishes it as "2026 coverage."
- **Resolution:** [1] governs (later, primary, and the only source that carries per-area weights and learning outcomes). [8] is internally inconsistent, and [2] is a dated exam-program bulletin, not a syllabus/TOS. Weight: primary + later document over secondary copy.

**Dispute 2 — are phonetics and IPA in scope?**
- *Against (primary):* [1] A1.1 names phonology, morphology, syntax, semantics, pragmatics; neither "phonetics" nor "IPA" appears in the English-major TOS learning outcomes.
- *For (secondary):* [6] devotes a section to phonetics (places/manners of articulation, IPA basics, 44 phonemes, minimal pairs) and claims 2–3 directly tested IPA items per paper.
- **Resolution:** treat phonetics/IPA as a reviewer-recommended enrichment tag under A1, not an official category or weighted topic. No primary evidence found for a separate phonetics area.

**Dispute 3 — is "Composition" a category?**
- *Against:* no "Composition" area in [1]; writing appears as C16–C17, C19, C22. Gen Ed [2] has "Writing in the Discipline" / "Study and Thinking Skills."
- *For:* secondary question banks label topics "English Composition" (noted as a lead only; that page was **not opened**, see gaps). [7] has Technical/Creative Writing, not "Composition."
- **Resolution:** use official writing-area names; expose "composition" only as an alias/tag, not a top-level category.

**Dispute 4 — section weights 25/30/45.** Directly stated in [5]; independently derivable by summing the per-area weights printed in [1]. No conflict found.

**Dispute 5 — exact wording variants.** "Multilingual Societies" ([1][7]) vs "Multilingual Policies" ([5]); "five language components" ([1]) vs "fine language components" ([5]); "Macroskills" ([1]) vs "Macro skills" ([5]). [1] is authoritative; the [5] variants look like transcription errors.

---

## 7. Gaps, blocked/unusable pages, and unverified leads

1. **CHED CMO No. 75, s. 2017 (BSEd PSG)** — cited as a reference inside the PRC TOS [1] and named by an unopened university syllabus result; **not opened**. The TOS says the exam is aligned to it, so the exact course-to-area mapping remains unverified.
2. **CHED *Description of Courses* [4]** — opened, but the extraction returned general-education and nursing course descriptions, not English-major course descriptions. Not used; not cited for topics.
3. **CHED CMO No. 24, s. 2017 [3]** — opened; it governs **AB English Language / English Language Studies**, not BSEd English (the LET majorship track). Partial OCR. Used only as background; do not infer LET coverage from it.
4. **PRC 2025 TOS PDF** — `web_extract` returned OCR-garbled text; clean text was obtained by downloading that same PDF and running `pdftotext`. All quoted weights/outcomes in Section 3 come from that clean text of [1].
5. **Unopened search-result leads (snippets only, deliberately not cited):** boardexams.ph March 2025 and 2024 coverage pages; Studocu "LET English Majorship Reviewer 2025"; multiple Scribd reviewers (`LET_English_Reviewer_2025`, `LET-English-Majorship-Reviewer-with-Schedule-2025`, `English-Major-Reviewer`, `LET-REVIEWER-ENGLISH`); LET360 topic lists; supertutor's own linked "Major Field guide." These contain finer-grained subtopic lists (e.g. Chomsky, text structures, APA formatting, CLT/GTM, TOS/OBE) that could not be verified against an opened page.
6. **Secondary item-count claims** ([6] five-block counts and embedded grammar count; [7] bank inventory counts) are reviewer estimates/inventory, **not** PRC weights; no primary confirmation obtained.
7. **No evidence found** in any opened page for a separate "phonetics," "composition," "speech and oral communication," or "master works" area inside the English **majorship** TOS; those belong either to A1 enrichment, C12, or Gen Ed [2].

---

## Sources (all pages actually opened)

[1] PRC — BPT Resolution No. 11 (s. 2025), amending Res. 11 (s. 2022), Enhanced LET TOS: https://prc.gov.ph/sites/default/files/2025-11%20published%20tos%20BOPT.pdf — **PRIMARY**
[2] PRC — Program of the LEPT, 28 March 2021: https://www.prc.gov.ph/sites/default/files/LET%20PROG-%20MARCH%202021.pdf — **PRIMARY (older)**
[3] CHED — CMO No. 24, s. 2017 (AB English Language PSG): https://legacy.ched.gov.ph/wp-content/uploads/2017/10/CMO-24-s-2017.pdf — **PRIMARY (background)**
[4] CHED — Description of Courses: https://legacy.ched.gov.ph/wp-content/uploads/2018/02/Description-of-Courses.pdf — **PRIMARY (opened, unusable for this facet)**
[5] EduReaper — LET PRC TOS Enhanced and Updated: https://www.edureaper.com/2025/10/licensure-examination-for-teachers-let.html — **SECONDARY**
[6] Super Tutor PH — LET English Major strategy: https://supertutor.ph/blog/let-english-major-strategy/ — **SECONDARY**
[7] LETPass — English Major LET Reviewer: https://letpass.ph/subjects/major-english — **SECONDARY**
[8] TeachPinas — LET COVERAGE 2026: https://www.teachpinas.com/let-coverage-licensure-examination-for-teachers/ — **SECONDARY (stale list)**
