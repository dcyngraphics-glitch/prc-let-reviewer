import { genEdQuestions } from './gened.js';
import { profEdQuestions } from './profed.js';
import { englishQuestions } from './english.js';
import genEdImported from './imported/gened-clean.json' with { type: 'json' };
import profEdImported from './imported/profed-clean.json' with { type: 'json' };
import englishImported from './imported/english-clean.json' with { type: 'json' };
import { coverageQuestions } from './coverage.js';

const tag = (arr, subject) => arr.map((q) => ({ ...q, subject, difficulty: q.difficulty || 2 }));

export const questionBank = {
  gened: [...tag(genEdQuestions, 'gened'), ...genEdImported],
  profed: [...tag(profEdQuestions, 'profed'), ...profEdImported],
  english: [...tag(englishQuestions, 'english'), ...tag(coverageQuestions, 'english'), ...englishImported],
};

export const allQuestions = Object.values(questionBank).flat();
