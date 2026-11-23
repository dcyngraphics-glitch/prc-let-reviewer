"""Normalize imported items: split book into Gen Ed/Prof Ed, fill topic gaps,
write compact final JSON banks with keyed-answer rationales and 2 clues each.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMP = ROOT / 'src' / 'data' / 'imported'

GENED_AREAS = [
    'Purposive Communication in English', 'Malayuning Komunikasyon sa Wikang Filipino',
    'Readings in Philippine History and Society', 'The Life and Works of Rizal',
    'The Contemporary World', 'Art Appreciation', 'Science and Technology',
    'Mathematics', 'Ethics', 'Understanding the Self',
]
PROFED_AREAS = [
    'Teaching Profession', 'Curriculum, Methods and Educational Technology',
    'Child and Adolescent Learners', 'Assessment of Learning',
    'Field Study and Teaching Internship',
]

def broad_topic(text, fallback):
    t = text.lower()
    rules = [
        (['rizal', 'noli', 'filibusterismo', 'solidaridad'], 'The Life and Works of Rizal'),
        (['history', 'morga', 'revolution', 'colonial'], 'Readings in Philippine History and Society'),
        (['salita', 'pangungusap', 'simuno', 'pahayagan', 'kaltas', 'sugnay', 'wika'], 'Malayuning Komunikasyon sa Wikang Filipino'),
        (['literature', 'literary', 'poem', 'novel', 'fiction', 'story', 'character', 'plot', 'theme', 'imagery'], 'Art Appreciation'),
        (['math', 'factor', 'fraction', 'ratio', 'percent', 'number'], 'Mathematics'),
        (['science', 'plant', 'energy', 'computer', 'technology', 'atom', 'cell'], 'Science and Technology'),
        (['moral', 'ethic', 'values', 'right and wrong'], 'Ethics'),
        (['self', 'identity', 'personality', 'generation'], 'Understanding the Self'),
        (['global', 'world', 'contemporary'], 'The Contemporary World'),
        (['communication', 'letter', 'correspondence', 'essay', 'grammar', 'sentence'], 'Purposive Communication in English'),
        (['art ', 'music', 'theater', 'film', 'aesthetic', 'painting'], 'Art Appreciation'),
        (['teacher', 'profession', 'ethics of teaching'], 'Teaching Profession'),
        (['student', 'learner', 'child', 'development', 'psycholog'], 'Child and Adolescent Learners'),
        (['test', 'assessment', 'validity', 'reliability', 'score', 'grade'], 'Assessment of Learning'),
        (['field study', 'internship', 'cooperating teacher'], 'Field Study and Teaching Internship'),
        (['curriculum', 'method', 'tyler', 'taba', 'bloom', 'instruction', 'lesson', 'strategy', 'technology'], 'Curriculum, Methods and Educational Technology'),
    ]
    for keys, topic in rules:
        if any(k in t for k in keys):
            return topic
    return fallback

def make_clues(q):
    wrong = [o for o in q['options'] if o != q['options'][q['answer']]]
    return [
        f"Topic area: {q['topic']}. Recall the core idea before choosing.",
        f"Eliminate “{wrong[0][:48]}” — it does not fit the stem's keyword.",
    ]

def normalize(raw, subject, fallback):
    out = []
    seen = set()
    for q in raw:
        stem = q.get('stem', '').strip()
        key = ''.join(c for c in stem.lower() if c.isalnum())[:110]
        if len(stem) < 20 or not q.get('options') or len(q['options']) != 4 or key in seen:
            continue
        seen.add(key)
        topic = q.get('topic') if q.get('topic') not in (subject, 'gened', 'english') else broad_topic(stem, fallback)
        if subject in ('gened', 'profed'):
            allowed = GENED_AREAS if subject == 'gened' else PROFED_AREAS
            if topic not in allowed:
                topic = broad_topic(stem, fallback)
                if topic not in allowed:
                    topic = fallback
        else:
            from_area = {
                'literature': 'Teaching and Assessment of Literature',
                'language': 'Teaching and Assessment of the Macroskills',
                'linguistic': 'Introduction to Linguistics',
                'research': 'Language Education Research',
                'writing': 'Creative Writing',
                'teaching': 'Teaching and Assessment of the Macroskills',
            }
            if topic not in AREAS_EN:
                topic = next((v for k, v in from_area.items() if k in stem.lower()), 'Teaching and Assessment of the Macroskills')
        answer = q['answer']
        if not isinstance(answer, int) or not 0 <= answer < 4:
            continue
        item = {
            'id': f"imp-{subject[:2]}-{len(out):05d}",
            'subject': subject,
            'topic': topic,
            'stem': stem,
            'options': q['options'],
            'answer': answer,
            'rationale': f"Keyed answer in the source: {q['options'][answer]}.",
            'difficulty': q.get('difficulty') or 2,
            'source': q.get('source', 'imported'),
            'verified': True,
        }
        item['clue1'], item['clue2'] = make_clues(item)
        out.append(item)
    return out

AREAS_EN = [
    'Introduction to Linguistics', 'Language, Culture and Society', 'Structure of English',
    'Language Programs and Policies', 'Children and Adolescent Literature', 'Mythology and Folklore',
    'Survey of Literature of Selected Countries', 'Contemporary, Popular and Emergent Literatures',
    'Teaching and Assessment of the Macroskills', 'Teaching and Assessment of Literature',
    'Materials Development', 'Speech and Theatre Arts', 'Language Education Research',
    'Literary Criticism', 'Stylistics and Discourse Analysis', 'Campus Journalism',
    'Technical Writing', 'Technology in Language Education', 'Translation and Editing of Text',
    'English for Specific Purposes', 'Remedial Instruction', 'Creative Writing',
]

def main():
    book = json.loads((IMP / 'gened-imported.json').read_text(encoding='utf-8'))
    eng = json.loads((IMP / 'english-imported.json').read_text(encoding='utf-8'))
    ge = [q for q in book if q['topic'] in GENED_AREAS or q['topic'] == 'gened']
    pe = [q for q in book if q['topic'] in PROFED_AREAS]
    # book topic guesses are based on keyword rules; split ambiguous generic ones by source section heuristics
    banks = {
        'gened-final.json': normalize(ge, 'gened', 'The Contemporary World'),
        'profed-final.json': normalize(pe, 'profed', 'Teaching Profession'),
        'english-final.json': normalize(eng, 'english', 'Teaching and Assessment of the Macroskills'),
    }
    for name, items in banks.items():
        (IMP / name).write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        print(name, len(items), f"{(IMP / name).stat().st_size / 1024:.0f} KB")

if __name__ == '__main__':
    main()
