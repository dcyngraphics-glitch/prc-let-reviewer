// Verified against PRC/BPT Res. 11 s.2025 and PRC 2025/2026 LEPT programs.
// See docs/research/let-english/report.md (claims C1–C5 independently verified).
export const PASSING = { average: 75, floor: 50 };
export const CLUES_PER_SESSION = 5;
export const HINTS_PER_ITEM = 2;

export const SUBJECTS = {
  gened: {
    id: 'gened',
    name: 'General Education',
    short: 'Gen Ed',
    officialItems: 150,
    officialMinutes: 120,
    weightSecondary: 20,
    areas: [
      'Purposive Communication in English',
      'Malayuning Komunikasyon sa Wikang Filipino',
      'Readings in Philippine History and Society',
      'The Life and Works of Rizal',
      'The Contemporary World',
      'Art Appreciation',
      'Science and Technology',
      'Mathematics',
      'Ethics',
      'Understanding the Self',
    ],
  },
  profed: {
    id: 'profed',
    name: 'Professional Education',
    short: 'Prof Ed',
    officialItems: 150,
    officialMinutes: 180,
    weightSecondary: 40,
    areas: [
      'Teaching Profession',
      'Curriculum, Methods and Educational Technology',
      'Child and Adolescent Learners',
      'Assessment of Learning',
      'Field Study and Teaching Internship',
    ],
  },
  english: {
    id: 'english',
    name: 'English Specialization',
    short: 'English',
    officialItems: 150,
    officialMinutes: 210,
    weightSecondary: 40,
    areas: [
      'Introduction to Linguistics',
      'Language, Culture and Society',
      'Structure of English',
      'Language Programs and Policies',
      'Children and Adolescent Literature',
      'Mythology and Folklore',
      'Survey of Literature of Selected Countries',
      'Contemporary, Popular and Emergent Literatures',
      'Teaching and Assessment of the Macroskills',
      'Teaching and Assessment of Literature',
      'Materials Development',
      'Speech and Theatre Arts',
      'Language Education Research',
      'Literary Criticism',
      'Stylistics and Discourse Analysis',
      'Campus Journalism',
      'Technical Writing',
      'Technology in Language Education',
      'Translation and Editing of Text',
      'English for Specific Purposes',
      'Remedial Instruction',
      'Creative Writing',
    ],
  },
};

// Timer for a shortened, sourced practice set keeps the real seconds-per-item pace.
export function scaledSeconds(subjectId, itemCount) {
  const s = SUBJECTS[subjectId];
  return Math.round((s.officialMinutes * 60 * itemCount) / s.officialItems);
}
