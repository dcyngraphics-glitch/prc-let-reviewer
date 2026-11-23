import { questionBank } from './data/index.js';
import { SUBJECTS } from './examConfig.js';

export const PLAN_DAYS = 80;
export const DAILY_QUOTAS = { gened: 6, profed: 12, english: 12 };
const KEY = 'let-english-state-v1';
const BACKUP = `${KEY}-corrupt-backup`;
const INTERVALS = [1, 3, 7, 14, 30];

export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const emptyState = () => ({
  startDate: null,
  completedDays: [],
  answers: { gened: { total: 0, correct: 0 }, profed: { total: 0, correct: 0 }, english: { total: 0, correct: 0 } },
  topicAnswers: {},
  mistakes: [],
  mockResults: [],
  examResults: [],
  daySets: {},
  hiddenIds: [],
  lastExport: null,
});

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const s = JSON.parse(raw);
    return { ...emptyState(), ...s, answers: { ...emptyState().answers, ...(s.answers || {}) } };
  } catch {
    try { localStorage.setItem(BACKUP, localStorage.getItem(KEY) || ''); } catch { /* storage disabled */ }
    return emptyState();
  }
}

export function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}

export function dayNumber(state) {
  if (!state.startDate) return 0;
  const [y, m, d] = state.startDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.min(PLAN_DAYS, Math.max(1, Math.floor((today - start) / 86400000) + 1));
}

export const startPlan = (state) => ({ ...state, startDate: localToday() });
export const restartPlan = (state) => ({ ...state, startDate: null, completedDays: [], daySets: {} });

export function accuracyStat(state, subject) {
  const a = state.answers[subject] || { total: 0, correct: 0 };
  const useUnaided = typeof a.unaidedTotal === 'number' && a.unaidedTotal > 0;
  const total = useUnaided ? a.unaidedTotal : a.total;
  const correct = useUnaided ? a.unaidedCorrect : a.correct;
  return { total, correct, pct: total ? Math.round((100 * correct) / total) : 0, aided: Math.max(0, (a.total || 0) - (a.unaidedTotal || 0)) };
}

export function accuracy(state, subject) { return accuracyStat(state, subject).pct; }

export function streak(state) {
  if (!state.startDate) return 0;
  const days = new Set(state.completedDays);
  let n = 0;
  let d = Math.min(dayNumber(state), days.size ? Math.max(...days) : dayNumber(state));
  while (days.has(d) && n < PLAN_DAYS) { n += 1; d -= 1; }
  return n;
}

export function targetLevel(day, stat) {
  const base = day <= 28 ? 1 : day <= 56 ? 2 : 3;
  if (stat.total < 20) return base;
  let level = base;
  if (stat.pct >= 85) level = Math.min(3, level + 1);
  if (stat.pct < 50) level = Math.max(1, level - 1);
  return level;
}

const seeded = (seed) => {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};
const shuffled = (arr, rnd) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// TOS-aligned area budgets. Gen Ed: 10 areas x 15. Prof Ed: 23/45/30/22/30.
// English: sections A 25%, B 30%, C 45% spread over their numbered areas.
function areaShares(subject) {
  if (subject === 'gened') return SUBJECTS.gened.areas.map((name) => [name, 1 / SUBJECTS.gened.areas.length]);
  if (subject === 'profed') {
    const budgets = {
      'Teaching Profession': 23,
      'Curriculum, Methods and Educational Technology': 45,
      'Child and Adolescent Learners': 30,
      'Assessment of Learning': 22,
      'Field Study and Teaching Internship': 30,
    };
    return SUBJECTS.profed.areas.map((name) => [name, (budgets[name] || 20) / 150]);
  }
  return SUBJECTS.english.areas.map((name, i) => [name, (i < 4 ? 0.25 / 4 : i < 8 ? 0.30 / 4 : 0.45 / (SUBJECTS.english.areas.length - 8))]);
}

export function weightedSet(subject, day, state, count, exclude = new Set()) {
  const rnd = seeded(day * 7919 + subject.length * 104729 + count);
  const bank = questionBank[subject].filter((q) => !state.hiddenIds.includes(q.id) && !exclude.has(q.id));
  const shares = areaShares(subject);
  const chosen = [];
  const used = new Set();
  for (const [topic, share] of shares) {
    const pool = shuffled(bank.filter((q) => q.topic === topic), rnd);
    const take = Math.min(pool.length, Math.round(count * share));
    pool.slice(0, take).forEach((q) => { if (!used.has(q.id)) { chosen.push(q.id); used.add(q.id); } });
  }
  const rest = shuffled(bank.filter((q) => !used.has(q.id)), rnd);
  rest.slice(0, Math.max(0, count - chosen.length)).forEach((q) => chosen.push(q.id));
  return shuffled(chosen.slice(0, count), rnd);
}

export function dailySet(subject, day, state) {
  return weightedSet(subject, day, state, DAILY_QUOTAS[subject] || 10);
}

export function weakSet(subject, state, count = 15) {
  const stats = {};
  for (const [key, v] of Object.entries(state.topicAnswers)) {
    const [s, topic] = key.split('|');
    if (s === subject && v.total >= 3) stats[topic] = v;
  }
  const worst = Object.entries(stats)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .slice(0, 2).map(([topic]) => topic);
  if (!worst.length) return weightedSet(subject, 1, state, count);
  const rnd = seeded(Date.now() % 100000 + Object.values(state.answers).reduce((n, a) => n + (a.total || 0), 0));
  const hidden = new Set(state.hiddenIds || []);
  const ids = [];
  worst.forEach((topic) => {
    const pool = shuffled(questionBank[subject].filter((q) => q.topic === topic && !hidden.has(q.id)), rnd);
    ids.push(...pool.slice(0, Math.ceil(count / worst.length / 2)).map((q) => q.id));
  });
  const rest = shuffled(questionBank[subject].filter((q) => !hidden.has(q.id) && !ids.includes(q.id)), rnd);
  return shuffled([...new Set([...ids, ...rest.map((q) => q.id)])].slice(0, count), rnd);
}

export function dueMistakes(state) {
  const today = localToday();
  const known = new Set(Object.values(questionBank).flat().map((q) => q.id));
  return (state.mistakes || []).filter((m) => known.has(m.id) && !(state.hiddenIds || []).includes(m.id) && m.due <= today);
}

// Total saved mistakes (spaced-repetition queue), as opposed to those due today.
export function savedMistakes(state) {
  const hidden = new Set(state.hiddenIds || []);
  return (state.mistakes || []).filter((m) => !hidden.has(m.id)).length;
}

export function recordAnswer(state, question, correct, source = 'practice', confidence = 'sure', aided = false) {
  const next = { ...state, answers: { ...state.answers }, topicAnswers: { ...state.topicAnswers } };
  const a = { ...(next.answers[question.subject] || { total: 0, correct: 0, unaidedTotal: 0, unaidedCorrect: 0 }) };
  a.total += 1; if (correct) a.correct += 1;
  if (!aided) { a.unaidedTotal = (a.unaidedTotal || 0) + 1; if (correct) a.unaidedCorrect = (a.unaidedCorrect || 0) + 1; }
  next.answers[question.subject] = a;
  const tkey = `${question.subject}|${question.topic}`;
  const t = { ...(next.topicAnswers[tkey] || { total: 0, correct: 0, unaidedTotal: 0, unaidedCorrect: 0 }) };
  t.total += 1; if (correct) t.correct += 1;
  if (!aided) { t.unaidedTotal = (t.unaidedTotal || 0) + 1; if (correct) t.unaidedCorrect = (t.unaidedCorrect || 0) + 1; }
  next.topicAnswers[tkey] = t;
  const mistakes = (state.mistakes || []).map((m) => ({ ...m }));
  const idx = mistakes.findIndex((m) => m.id === question.id);
  if (correct) {
    if (idx >= 0) {
      const m = mistakes[idx];
      const box = Math.min(4, (m.box || 0) + 1);
      if (box >= 4 && m.lastCorrect && (m.topCorrects || 0) >= 1) {
        mistakes.splice(idx, 1);
      } else {
        mistakes[idx] = { ...m, box, due: addDays(INTERVALS[box]), lastCorrect: true, topCorrects: box >= 4 ? 1 : 0, confidence };
      }
    } else if (confidence === 'guess' || aided) {
      mistakes.push({ id: question.id, at: Date.now(), source, box: 1, due: addDays(1), lastCorrect: true, topCorrects: 0, confidence, aided });
    }
  } else if (idx >= 0) {
    mistakes[idx] = { ...mistakes[idx], box: 0, due: addDays(1), lastCorrect: false, topCorrects: 0, confidence, aided };
  } else {
    mistakes.push({ id: question.id, at: Date.now(), source, box: 0, due: addDays(1), lastCorrect: false, topCorrects: 0, confidence, aided });
  }
  next.mistakes = mistakes;
  return next;
}

export function completeDay(state, day) {
  if (state.completedDays.includes(day)) return state;
  return { ...state, completedDays: [...state.completedDays, day].sort((a, b) => a - b) };
}
