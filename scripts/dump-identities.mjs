import { writeFileSync } from 'node:fs';
import { allQuestions } from '../src/data/index.js';
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const ids = allQuestions.map((q) => [norm(q.stem).slice(0, 110), q.options.map(norm).sort()]);
writeFileSync(new URL('../src/data/current-bank-stems.json', import.meta.url), JSON.stringify(ids));
console.log('current identities:', ids.length);
