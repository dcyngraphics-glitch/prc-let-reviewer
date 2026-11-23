"""Apply the curated id->topic map for items that had fallen back to the subject name.

The maps in `src/data/imported/general-map-<subject>.json` were produced by reviewing
every item that the keyword pass in `retag_untagged.py` could not place. This script
writes the topic (and clue 1) onto those items. Items the reviewers could not place
stay in the neutral `General` bucket; the subject name is never used as a topic.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMP = ROOT / 'src' / 'data' / 'imported'
GENERAL_CLUE = 'General area — read the stem\'s key term, then recall the core rule before choosing.'


def clue_for(topic):
    return GENERAL_CLUE if topic == 'General' else f'Area: {topic}. Recall the core rule before choosing.'


def main():
    dry = '--write' not in sys.argv
    for subject in ('gened', 'english'):
        bank_path = IMP / f'recovered-{subject}.json'
        map_path = IMP / f'general-map-{subject}.json'
        if not map_path.exists():
            print(f'{subject}: no map at {map_path}')
            continue
        items = json.loads(bank_path.read_text(encoding='utf-8'))
        mapping = json.loads(map_path.read_text(encoding='utf-8'))
        changed = 0
        for q in items:
            topic = mapping.get(q['id'])
            if not topic or topic == q['topic']:
                continue
            q['topic'] = topic
            q['clue1'] = clue_for(topic)
            changed += 1
        print(f'{subject}: applied {changed} topics from {map_path.name}')
        if not dry:
            bank_path.write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    if dry:
        print('\n(dry run — pass --write to apply)')


if __name__ == '__main__':
    main()
