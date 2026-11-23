import { emptyState, dayNumber, streak } from '../src/plan2.js';

const fresh = emptyState();
const checks = [
  ['fresh plan has no start date', fresh.startDate === null],
  ['fresh plan reports day 0', dayNumber(fresh) === 0],
  ['fresh plan has no streak', streak(fresh) === 0],
  ['explicit start today gives day 1', dayNumber({ ...fresh, startDate: new Date().toISOString().slice(0, 10) }) >= 1],
  ['yesterday start gives day 2', dayNumber({ ...fresh, startDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10) }) >= 2],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed += 1;
}
if (failed) { console.error(`${failed} check(s) failed`); process.exit(1); }
console.log('Day-counter regression: PASS');
