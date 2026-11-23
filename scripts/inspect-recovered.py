import json
from pathlib import Path
from collections import Counter
p = Path('C:/Users/bryan/Documents/Hermes/Projects/prc-let-reviewer/src/data/imported')
for name in ('recovered-gened.json', 'recovered-profed.json', 'recovered-english.json'):
    items = json.loads((p / name).read_text(encoding='utf-8'))
    print('\n', name, len(items), 'real rationales:', sum(i['rationaleKind'] == 'curated' for i in items))
    for q in items[:2]:
        print('  ', q['stem'][:95], '|', ' / '.join(o[:28] for o in q['options']), '| key', 'ABCD'[q['answer']], '|', q['rationale'][:70])
