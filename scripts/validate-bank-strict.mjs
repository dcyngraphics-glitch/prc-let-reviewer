import { allQuestions, questionBank } from '../src/data/index.js';

const errors = [];
const ids = new Set();
const locators = new Set();
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const TRUNC = /\b(?:the|and|or|of|to|in|for|a|an|with|by|from|on|is|are|was|were|that|this|as|at|be|it|its|their|into|than|then|but|which|who|what|when|where|how|why|do|does|did|can|will|would|should|may|might|must|have|has|had)\s*$|[-–—]\s*$|\.\.\.|…|[\[\]{}<>]/i;
const AO = /\b(?:all|none)\s+of\s+(?:the\s+above|these)\b/i;
const LEAK = /\b(?:ANSWER\s+KEYS?|RATIONALES?\s*:|Key\s*:|Page\s+\d+|BASED\s+ON\s+NEW\s+TABLE|EXTENSIVE\s+REVIEWER|LET\s+ENGLISH\s+SPECIALIZATION|DIRECTIONS?:)/i;

for (const q of allQuestions) {
  if (ids.has(q.id)) errors.push(`duplicate id ${q.id}`);
  ids.add(q.id);
  if (!q.subject || !q.stem || !q.source || !q.rationale) errors.push(`${q.id}: missing core field`);
  if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${q.id}: needs 4 options`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`${q.id}: bad answer`);
  if (!q.clue1 || !q.clue2) errors.push(`${q.id}: both clues required`);
  if (q.difficulty !== undefined && ![1, 2, 3].includes(q.difficulty)) errors.push(`${q.id}: difficulty out of range`);
  if (q.stem.length < 20 || q.stem.length > 400) errors.push(`${q.id}: stem length ${q.stem.length}`);
  if (LEAK.test(q.stem)) errors.push(`${q.id}: header leak in stem`);
  if (q.options.some((o) => !o.trim() || (o.length > 12 && TRUNC.test(o)))) errors.push(`${q.id}: truncated/empty option`);
  if (new Set(q.options.map(norm)).size !== 4) errors.push(`${q.id}: duplicate options`);
  if (AO.test(q.options[q.answer])) errors.push(`${q.id}: all-of-above keyed`);
  if (AO.test(q.stem)) errors.push(`${q.id}: all-of-above option present`);
  if (norm(q.clue2).includes(norm(q.options[q.answer]))) errors.push(`${q.id}: clue eliminates key`);
  const key = `${q.source}|${norm(q.stem).slice(0, 60)}`;
  if (locators.has(key)) errors.push(`${q.id}: duplicate source locator`);
  locators.add(key);
}

const counts = Object.fromEntries(Object.entries(questionBank).map(([k, v]) => [k, v.length]));
const total = allQuestions.length;
if (total < 1500) errors.push(`bank too small: ${total}`);
for (const [k, n] of Object.entries(counts)) if (n < 150) errors.push(`${k}: only ${n} items`);
const keyed = allQuestions.filter((q) => q.rationaleKind === 'keyed').length;
console.log('Bank counts:', JSON.stringify(counts), 'total:', total);
console.log('Key-only rationales:', keyed, `(${Math.round((100 * keyed) / total)}%)`);
console.log('Import manifest:', JSON.parse((await import('node:fs')).readFileSync(new URL('../src/data/imported/manifest.json', import.meta.url), 'utf8')).subjects);
if (errors.length) {
  console.error('VALIDATION FAILED:\n' + [...new Set(errors)].slice(0, 60).join('\n'));
  process.exit(1);
}
console.log('Strict bank validation: PASS');
