import json
from collections import Counter
from pathlib import Path
p = Path('C:/Users/bryan/Documents/Hermes/Projects/prc-let-reviewer/src/data/imported')
for name in ['gened-imported.json', 'english-imported.json']:
    items = json.loads((p / name).read_text(encoding='utf-8'))
    print('\n===', name, len(items))
    print('topics:', Counter(i['topic'] for i in items).most_common(12))
    print('difficulty:', Counter(i.get('difficulty') for i in items))
    print('answers:', Counter('ABCD'[i['answer']] for i in items))
    print('empty rationale:', sum(not i['rationale'] for i in items))
    for i in items[:3]:
        print('-', i['stem'][:90], '|', ' / '.join(o[:30] for o in i['options']), '| key', 'ABCD'[i['answer']], '|', i['source'])
