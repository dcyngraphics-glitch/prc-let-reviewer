import { questionBank } from '../src/data/index.js';
import { SUBJECTS } from '../src/examConfig.js';

let gaps = 0;
for (const [id, subject] of Object.entries(SUBJECTS)) {
  const counts = Object.fromEntries(subject.areas.map((a) => [a, 0]));
  questionBank[id].forEach((q) => { if (q.topic in counts) counts[q.topic] += 1; });
  console.log(`\n${subject.name}: ${subject.areas.length} TOS areas, ${questionBank[id].length} items`);
  for (const [area, n] of Object.entries(counts)) {
    if (n < 5) {
      gaps += 1;
      console.log(`  GAP  ${area}: ${n} items`);
    }
  }
}
console.log(`\nCoverage gaps (areas with <5 items): ${gaps}`);
if (gaps > 0) process.exit(1);
