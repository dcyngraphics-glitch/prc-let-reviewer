import { allQuestions } from '../src/data/index.js';
export const byIdProbe = new Set(allQuestions.map((q) => q.id));
