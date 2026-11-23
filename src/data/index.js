import { genEdQuestions } from './gened.js';
import { profEdQuestions } from './profed.js';
import { englishQuestions } from './english.js';
import genEdImported from './imported/gened-clean.json' with { type: 'json' };
import profEdImported from './imported/profed-clean.json' with { type: 'json' };
import englishImported from './imported/english-clean.json' with { type: 'json' };
import { coverageQuestions } from './coverage.js';
import genEdRecovered from './imported/recovered-gened.json' with { type: 'json' };
import profEdRecovered from './imported/recovered-profed.json' with { type: 'json' };
import englishRecovered from './imported/recovered-english.json' with { type: 'json' };

const tag = (arr, subject) => arr.map((q) => ({ ...q, subject, difficulty: q.difficulty || 2 }));

export const questionBank = {
  gened: [...tag(genEdQuestions, 'gened'), ...genEdImported, ...genEdRecovered],
  profed: [...tag(profEdQuestions, 'profed'), ...profEdImported, ...profEdRecovered],
  english: [...tag(englishQuestions, 'english'), ...tag(coverageQuestions, 'english'), ...englishImported, ...englishRecovered],
};

export const allQuestions = Object.values(questionBank).flat();
