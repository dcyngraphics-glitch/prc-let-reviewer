"""Import sourced MCQs from the two downloaded reviewer PDFs.

Reads pdftotext -raw output (column reading order), pairs question blocks with
their answer keys, tags topics with research-derived keyword maps, and writes
JSONL to src/data/imported/. Never invents an answer: items without a key are dropped.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADER_RE = re.compile(r'^(BASED ON NEW TABLE|EXTENSIVE REVIEWER PROFESSIONAL|LET ENGLISH SPECIALIZATION REVIEWER|Page \d+|Name:|Directions:|Items \d+|\d+-\d+(\s+\d+-\d+)+)')
Q_RE = re.compile(r'^\s*(\d{1,3})\.\s+(.+)$')
OPT_RE = re.compile(r'^\s*([A-D])\.\s+(.+)$')
KEY_RE = re.compile(r'\b(\d{1,3})\.\s*([A-D])\b')
MARKER_RE = re.compile(r'^\s*(ANSWER\s+KEYS?|RATIONALES?)\s*:?\s*$', re.I)

def clean(s):
    s = s.replace('\xad', '').replace('\ufffd', '')
    return re.sub(r'\s+', ' ', s).strip()

def topic_for(text, subject):
    t = text.lower()
    if subject == 'english':
        rules = [
            ('Language Education Research', ['action research', 'research design', 'ethic', 'survey', 'experiment']),
            ('English for Specific Purposes', ['esp', 'carrier content', 'specific purposes']),
            ('Campus Journalism', ['journalism', 'news', 'headline', 'editorial']),
            ('Technical Writing', ['technical writing', 'memo', 'report writing']),
            ('Translation and Editing of Text', ['translation', 'editing text']),
            ('Materials Development', ['instructional material', 'textbook', 'module', 'pilot', 'workbook', 'authentic material']),
            ('Stylistics and Discourse Analysis', ['stylistic', 'discourse', 'register', 'rhetoric']),
            ('Literary Criticism', ['critic', 'theory', 'mimetic', 'pragmatic', 'structuralism', 'feminism']),
            ('Creative Writing', ['creative writing', 'writing poetry', 'short story writing', 'writer']),
            ('Remedial Instruction', ['remedial', 'remediation']),
            ('Technology in Language Education', ['computer', 'technology', 'digital', 'online', 'multimedia', 'internet']),
            ('Speech and Theatre Arts', ['speech', 'theatre', 'drama', 'oral']),
            ('Teaching and Assessment of Literature', ['teach literature', 'literature teaching', 'literary text', 'character chart', 'novel study']),
            ('Teaching and Assessment of the Macroskills', ['listen', 'speaking', 'reading', 'writing skill', 'macroskill', 'cloze', 'fluency', 'grammar teaching', 'syllabus', 'assessment', 'test']),
            ('Survey of Literature of Selected Countries', ['haiku', 'basho', 'english literature', 'american literature', 'victorian', 'shakespeare', 'dickens']),
            ('Contemporary, Popular and Emergent Literatures', ['contemporary', 'popular literature', 'emergent']),
            ('Mythology and Folklore', ['myth', 'folklore', 'veda', 'epic', 'legend', 'fable']),
            ('Children and Adolescent Literature', ['children literature', 'adolescent literature', 'picture book']),
            ('Introduction to Linguistics', ['phoneme', 'morpheme', 'phonetics', 'phonology', 'semantics', 'syntax', 'linguistic', 'language acquisition']),
            ('Structure of English', ['grammar', 'sentence', 'clause', 'phrase', 'tense', 'pronoun', 'altogether']),
            ('Language, Culture and Society', ['culture', 'society', 'sociolinguistic', 'language policy']),
            ('Language Programs and Policies', ['curriculum', 'bilingual', 'language program', 'deped']),
        ]
    else:
        rules = [
            ('Teaching Profession', ['teacher', 'profession', 'ethic', 'code of conduct', 'role of the teacher']),
            ('Assessment of Learning', ['test', 'assessment', 'validity', 'reliability', 'grade', 'score', 'evaluation', 'portfolio', 'rubric']),
            ('Child and Adolescent Learners', ['learner', 'student', 'child', 'adolescent', 'development', 'psycholog', 'vygotsky', 'piaget', 'bruner']),
            ('Field Study and Teaching Internship', ['field study', 'internship', 'student teaching', 'cooperating teacher', 'reflection journal']),
            ('Curriculum, Methods and Educational Technology', ['curriculum', 'tyler', 'taba', 'bloom', 'method', 'technology', 'cai', 'melc', 'instruction', 'lesson', 'strategy']),
            ('The Life and Works of Rizal', ['rizal', 'noli', 'filibusterismo', 'ultimo adios', 'la solidaridad']),
            ('Readings in Philippine History and Society', ['history', 'morga', 'philippine', 'colonial', 'revolution']),
            ('The Contemporary World', ['contemporary world', 'globalization', 'generation', 'rowling', 'harry potter', 'world']),
            ('Art Appreciation', ['art', 'theater', 'music', 'film', 'aesthetic', 'painting', 'architecture', 'heritage']),
            ('Science and Technology', ['science', 'plant', 'photosynthesis', 'computer', 'operating system', 'mining', 'metal', 'energy']),
            ('Mathematics', ['math', 'factor', 'number', 'fraction', 'ratio', 'geometry', 'percent', 'gcf', 'lcm']),
            ('Ethics', ['ethic', 'moral', 'values', 'right', 'wrong']),
            ('Understanding the Self', ['self', 'identity', 'personality', 'generation']),
            ('Purposive Communication in English', ['communication', 'idiom', 'essay', 'grammar', 'sentence', 'paragraph', 'epistle']),
            ('Malayuning Komunikasyon sa Wikang Filipino', ['filipino', 'salita', 'pangungusap', 'simuno', 'pahayagan', 'tuldok', 'sugnay', 'kaltas']),
        ]
    for topic, keys in rules:
        if any(k in t for k in keys):
            return topic
    return subject

def difficulty(stem, options):
    s = stem.upper()
    if any(w in s for w in ('NOT ', 'EXCEPT', 'LEAST', 'I, II', 'BEST', 'MOST')):
        return 3
    if len(stem) > 170:
        return 3
    if len(stem) > 100:
        return 2
    return 1

def clues(q):
    wrong = next((o for o in q['options'] if o != q['options'][q['answer']]), 'another option')
    return [
        f"Topic area: {q['topic']}. Recall the core idea before choosing.",
        f"Eliminate “{wrong[:48]}” — it does not match the stem's keyword.",
    ]

def parse(path, subject, source):
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    pending = {}
    items = []
    mode = 'questions'
    order = 0

    def options_ahead(i):
        found = 0
        for line in lines[i+1:i+10]:
            if Q_RE.match(line) or MARKER_RE.match(line):
                break
            if OPT_RE.match(line):
                found += 1
                if found >= 2:
                    return True
        return False

    def flush(keys, rationale):
        nonlocal pending, order
        used = set()
        for num, letter in keys.items():
            q = pending.get(num)
            if not q or not q.get('parts') or len(q['parts']) != 4:
                continue
            if not (0 <= ord(letter) - 65 < 4) or num in used:
                continue
            used.add(num)
            q['answer'] = ord(letter) - 65
            q['answerText'] = q['parts'][q['answer']]
            q['rationale'] = rationale.get(num, '') or ''
            q['difficulty'] = difficulty(q['stem'], q['parts'])
            q['topic'] = topic_for(q['stem'] + ' ' + ' '.join(q['parts']), subject)
            q['verified'] = True
            q['source'] = f'{source}, item {num}'
            q['id'] = f"{subject[:2]}-imp-{order:05d}"
            q['subject'] = subject
            q['clue1'] = q['clue2'] = ''
            order += 1
            items.append(q)
        pending = {}

    keys, rationale = {}, {}
    i = 0
    current = None
    while i < len(lines):
        line = lines[i].rstrip('\r')
        if MARKER_RE.match(line):
            if current:
                pending[current['num']] = current
                current = None
            keys, rationale = {}, {}
            mode = 'rationale' if 'RATIONALES' in line.upper() else 'key'
            i += 1
            continue
        if HEADER_RE.match(line) or not line.strip():
            if current:
                pending[current['num']] = current
                current = None
            i += 1
            continue
        m = Q_RE.match(line)
        if m and (mode == 'questions' or options_ahead(i)):
            if mode != 'questions':
                flush(keys, rationale)
                keys, rationale = {}, {}
                mode = 'questions'
            if current:
                pending[current['num']] = current
            num = int(m.group(1))
            current = {'num': num, 'stem': clean(m.group(2)), 'parts': []}
            i += 1
            continue
        o = OPT_RE.match(line)
        if o and current:
            current['parts'].append(clean(o.group(2)))
            i += 1
            continue
        if mode in ('key', 'rationale'):
            for n, letter in KEY_RE.findall(line):
                (rationale if mode == 'rationale' else keys)[int(n)] = letter
            if mode == 'rationale' and current is None:
                pass
        if current and line.strip():
            current['stem'] = clean(current['stem'] + ' ' + line)
        i += 1
    if current:
        pending[current['num']] = current
    flush(keys, rationale)

    # options were accumulated as parts; finalize
    out = []
    for q in items:
        parts = q.pop('parts', [])
        if len(parts) == 4:
            q['options'] = parts
            q['answerText'] = q['options'][q['answer']]
            q['clue1'], q['clue2'] = clues(q)
            out.append(q)
    return out

def main():
    outdir = ROOT / 'src' / 'data' / 'imported'
    outdir.mkdir(parents=True, exist_ok=True)
    specs = [
        ('docs/gen-ed-book-raw.txt', 'gened', 'Sir Jay 2026 Extensive Reviewer (Gen Ed/Prof Ed)'),
        ('docs/english-bank-raw.txt', 'english', 'LET English Reviewer Sets 1-10'),
    ]
    total = 0
    for rel, subject, source in specs:
        items = parse(ROOT / rel, subject, source)
        # dedupe by normalized stem
        seen, uniq = set(), []
        for q in items:
            key = re.sub(r'[^a-z0-9]', '', q['stem'].lower())[:120]
            if key in seen or not key:
                continue
            seen.add(key)
            uniq.append(q)
        name = 'gened' if subject == 'gened' else 'english'
        # split book items into gened/profed by topic heuristics later; keep all as gened for now
        (outdir / f'{name}-imported.json').write_text(json.dumps(uniq, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'{rel}: parsed={len(items)} unique={len(uniq)}')
        total += len(uniq)
    print('TOTAL', total)

if __name__ == '__main__':
    main()
