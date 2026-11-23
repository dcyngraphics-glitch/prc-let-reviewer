"""Recover additional keyed items from raw PDF text with option-aware parsing.

Existing clean IDs stay untouched; recovered items get new `rec-*` IDs.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).parent))
from clean_bank import flagged, norm, KEYWORDS  # noqa: E402
from import_banks import clean, difficulty, topic_for  # noqa: E402

IMP = ROOT / 'src' / 'data' / 'imported'
HEADER_RE = re.compile(r'^(BASED ON NEW TABLE|EXTENSIVE REVIEWER PROFESSIONAL|LET ENGLISH SPECIALIZATION REVIEWER|Page \d+|Name:|Directions:|Items \d+|\d+-\d+(\s+\d+-\d+)+)')
Q_RE = re.compile(r'^\s*(\d{1,3})\.\s+(.+)$')
OPT_RE = re.compile(r'^\s*([A-D])\.\s+(.+)$')
KEY_RE = re.compile(r'\b(\d{1,3})\.\s*([A-D])\b')
MARKER_RE = re.compile(r'^\s*(ANSWER\s+KEYS?|RATIONALES?)\s*:?\s*$', re.I)
RAT_ENTRY = re.compile(r'^\s*(\d{1,3})\.\s*([A-D])\.\s*(.*)$')
PROFED = set(KEYWORDS['profed'])


def parse(path, source):
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    pending, items, keys, rat_keys, rat_text = {}, [], {}, {}, {}
    mode, current, current_option = 'questions', None, None

    def options_ahead(i):
        found = 0
        for line in lines[i + 1:i + 10]:
            if Q_RE.match(line) or MARKER_RE.match(line):
                break
            if OPT_RE.match(line):
                found += 1
                if found >= 2:
                    return True
        return False

    def flush():
        nonlocal pending
        used = set()
        for num, letter in {**rat_keys, **keys}.items():
            q = pending.get(num)
            if not q or len(q['parts']) != 4 or not (0 <= ord(letter) - 65 < 4) or num in used:
                continue
            used.add(num)
            q['answer'] = ord(letter) - 65
            q['rationale'] = rat_text.get(num, '')
            items.append(q)
        pending = {}
        keys.clear(); rat_keys.clear(); rat_text.clear()

    for i, line in enumerate(lines):
        line = line.rstrip('\r')
        if MARKER_RE.match(line):
            if current:
                pending[current['num']] = current
                current, current_option = None, None
            mode = 'rationale' if 'RATIONALES' in line.upper() else 'key'
            continue
        if HEADER_RE.match(line) or not line.strip():
            if current:
                pending[current['num']] = current
                current, current_option = None, None
            continue
        m = Q_RE.match(line)
        if m and (mode == 'questions' or options_ahead(i)):
            if mode != 'questions':
                flush()
                mode = 'questions'
            if current:
                pending[current['num']] = current
            current = {'num': int(m.group(1)), 'stem': clean(m.group(2)), 'parts': [], 'source': source}
            current_option = None
            continue
        o = OPT_RE.match(line)
        if o and current:
            current['parts'].append(clean(o.group(2)))
            current_option = len(current['parts']) - 1
            continue
        if mode in ('key', 'rationale'):
            for n, letter in KEY_RE.findall(line):
                (rat_keys if mode == 'rationale' else keys)[int(n)] = letter
            re_ = RAT_ENTRY.match(line)
            if mode == 'rationale' and re_:
                rat_text.setdefault(int(re_.group(1)), re_.group(3).strip())
            elif mode == 'rationale' and rat_text:
                last = max(rat_text)
                rat_text[last] = clean(rat_text[last] + ' ' + line)
            continue
        if current and line.strip():
            if current_option is not None and current_option < len(current['parts']):
                current['parts'][current_option] = clean(current['parts'][current_option] + ' ' + line)
            else:
                current['stem'] = clean(current['stem'] + ' ' + line)
    if current:
        pending[current['num']] = current
    flush()
    return items


def subject_topic(item):
    text = item['stem'] + ' ' + ' '.join(item['parts'])
    topic = topic_for(text, 'gened')
    return ('profed' if topic in PROFED else 'gened'), topic


def make_clues(q):
    key = norm(q['options'][q['answer']])
    wrong = sorted((o for o in q['options'] if norm(o) != key), key=lambda o: -len(set(norm(o)) & set(key)))
    return [
        f"Area: {q['topic']}. Recall the core rule before choosing.",
        f"Eliminate option {'ABCD'[q['options'].index(wrong[0])]} — it does not fit the stem.",
    ]


def main():
    current_file = ROOT / 'src' / 'data' / 'current-bank-stems.json'
    known_raw = json.loads(current_file.read_text(encoding='utf-8')) if current_file.exists() else []
    known = {(x[0], tuple(x[1])) for x in known_raw}
    specs = [
        ('docs/gen-ed-book-raw.txt', 'Sir Jay 2026 Extensive Reviewer (Gen Ed/Prof Ed)'),
        ('docs/english-bank-raw.txt', 'LET English Reviewer Sets 1-10'),
    ]
    out = {'gened': [], 'profed': [], 'english': []}
    seen = set(known)
    counts = {'parsed': 0, 'flagged': 0, 'duplicate': 0, 'kept': 0}
    for rel, source in specs:
        for item in parse(ROOT / rel, source):
            counts['parsed'] += 1
            subject, topic = (subject_topic(item) if 'Sir Jay' in source else ('english', topic_for(item['stem'] + ' ' + ' '.join(item['parts']), 'english')))
            options = item['parts']
            stem = item['stem']
            probe = {'stem': stem, 'options': options, 'answer': item['answer']}
            if flagged(probe):
                counts['flagged'] += 1
                continue
            identity = (norm(stem)[:110], tuple(sorted(norm(o) for o in options)))
            if identity in seen:
                counts['duplicate'] += 1
                continue
            seen.add(identity)
            rationale = item.get('rationale') or ''
            lead = re.match(r'^\s*([A-D])\.\s*', rationale)
            if lead and (ord(lead.group(1)) - 65) != item['answer']:
                counts['flagged'] += 1
                continue
            q = {
                'id': f"rec-{subject[:2]}-{len(out[subject]):05d}",
                'subject': subject,
                'topic': topic,
                'stem': stem,
                'options': options,
                'answer': item['answer'],
                'rationale': rationale if len(rationale) >= 40 else f"Key only — check the source. Answer: {options[item['answer']]}.",
                'rationaleKind': 'curated' if len(rationale) >= 40 else 'keyed',
                'difficulty': difficulty(stem, options),
                'source': f"{source}, item {item['num']} | rec:{subject[:2]}-{len(out[subject]):05d} | ref:{norm(stem)[:10]}",
                'verified': True,
            }
            q['clue1'], q['clue2'] = make_clues(q)
            out[subject].append(q)
            counts['kept'] += 1
    for subject, items in out.items():
        (IMP / f'recovered-{subject}.json').write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(f'recovered {subject}: {len(items)}')
    print('stats:', json.dumps(counts))


if __name__ == '__main__':
    main()
