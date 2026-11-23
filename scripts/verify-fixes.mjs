import { emptyState, weakSet, weightedSet, accuracyStat, recordAnswer, dueMistakes, streak, targetLevel } from '../src/plan2.js';
import { questionBank } from '../src/data/index.js';
import { byIdProbe } from './by-id-probe.mjs';

const state = emptyState();
const weak = weakSet('english', { ...state, topicAnswers: { 'english|Introduction to Linguistics': { total: 5, correct: 1 } } }, 15);
console.log('weakSet ids are strings:', weak.every((x) => typeof x === 'string'), '| all known:', weak.every((x) => byIdProbe.has(x)));

const g = weightedSet('profed', 1, state, 150);
const counts = {};
g.forEach((id) => { const q = questionBank.profed.find((x) => x.id === id); counts[q.topic] = (counts[q.topic] || 0) + 1; });
console.log('ProfEd quota sample:', JSON.stringify(counts));

const s = { ...state, startDate: '2026-11-01', completedDays: Array.from({ length: 10 }, (_, i) => i + 1) };
console.log('streak after completed days:', streak(s));

const aided = recordAnswer(emptyState(), questionBank.gened[0], true, 'practice', 'sure', true);
const unaided = recordAnswer(emptyState(), questionBank.gened[0], true, 'practice', 'sure', false);
console.log('aided accuracy:', JSON.stringify(accuracyStat(aided, 'gened')), 'unaided:', JSON.stringify(accuracyStat(unaided, 'gened')));
console.log('targetLevel day40 with n<20:', targetLevel(40, accuracyStat(emptyState(), 'gened')));

let srs = emptyState();
const q = questionBank.gened[0];
srs = recordAnswer(srs, q, false, 'practice', 'sure', false);
console.log('SRS after miss:', JSON.stringify(srs.mistakes.filter((m) => m.id === q.id)));
for (let i = 0; i < 5; i += 1) srs = recordAnswer(srs, q, true, 'practice', 'sure', false);
console.log('SRS after miss + 5 correct:', JSON.stringify(srs.mistakes.filter((m) => m.id === q.id)));
console.log('stale mistake filtered:', dueMistakes({ ...emptyState(), mistakes: [{ id: 'gone', due: '2000-01-01' }] }).length);
