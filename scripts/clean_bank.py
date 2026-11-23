"""Deterministic content gate for imported LET items.

Reads src/data/imported/*-final.json, rejects garbled/ambiguous/fallback-tagged
items into quarantine.jsonl, writes *-clean.json plus a manifest. Run before UI build.
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMP = ROOT / 'src' / 'data' / 'imported'

TRUNC = re.compile(r'(?:\b(?:the|and|or|of|to|in|for|a|an|with|by|from|on|is|are|was|were|that|this|as|at|be|it|its|their|his|her|into|than|then|but|not|which|who|what|when|where|how|why|do|does|did|can|will|would|should|may|might|must|have|has|had)\s*$|[-–—]\s*$|\.\.\.|…|[\[\]{}<>])', re.I)
LEAK = re.compile(r'\b(?:ANSWER\s+KEYS?|RATIONALES?\s*:|Key\s*:|Page\s+\d+|BASED\s+ON\s+NEW\s+TABLE|EXTENSIVE\s+REVIEWER|LET\s+ENGLISH\s+SPECIALIZATION|DIRECTIONS?:|Items?\s+\d+\s*[-–]\s*\d+)', re.I)
AO = re.compile(r'\b(?:all|none)\s+of\s+(?:the\s+above|these)\b', re.I)
DUPW = re.compile(r'\b([A-Za-zÀ-ÿ][\wÀ-ÿ]*)\s+\1\b', re.I)
TRAIL = re.compile(r'\?\s+[^?]{18,}\s*$')
STOP = {'the', 'a', 'an', 'and', 'or', 'is', 'was', 'were', 'be', 'to', 'of', 'in', 'very', 'that', 'this', 'have', 'has', 'had', 'it', 'its', 'as', 'at', 'by', 'for', 'on', 'with', 'not', 'but', 'if', 'so', 'do', 'does', 'did', 'he', 'she', 'they', 'we', 'you', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'into', 'than', 'then'}

FALLBACK = {
    'gened': 'The Contemporary World',
    'profed': 'Teaching Profession',
    'english': 'Teaching and Assessment of the Macroskills',
}
KEYWORDS = {
    'gened': {
        'The Contemporary World': ['globalization', 'contemporary world', 'world', 'generation', 'culture', 'society', 'barangay', 'republic act', 'education act', 'school', 'learning', 'teacher', 'student', 'democracy', 'confucius'],
        'Purposive Communication in English': ['communication', 'idiom', 'essay', 'grammar', 'sentence', 'paragraph', 'letter', 'correspondence', 'writer', 'reading'],
        'Malayuning Komunikasyon sa Wikang Filipino': ['salita', 'pangungusap', 'simuno', 'pahayagan', 'tuldok', 'sugnay', 'kaltas', 'filipino', 'wika', 'lathalain'],
        'Readings in Philippine History and Society': ['history', 'morga', 'revolution', 'colonial', 'philippines', 'rizal', 'national'],
        'The Life and Works of Rizal': ['rizal', 'noli', 'filibusterismo', 'solidaridad', 'ultimo adios'],
        'Art Appreciation': ['art', 'music', 'theater', 'film', 'aesthetic', 'painting', 'architecture', 'heritage', 'literature', 'poem', 'novel'],
        'Science and Technology': ['science', 'plant', 'photosynthesis', 'computer', 'technology', 'atom', 'cell', 'virus', 'energy', 'mining'],
        'Mathematics': ['math', 'factor', 'fraction', 'ratio', 'percent', 'number', 'gcf', 'lcm', 'correlation', 'graph'],
        'Ethics': ['ethic', 'moral', 'values', 'right and wrong', 'rights', 'mores', 'folkways'],
        'Understanding the Self': ['self', 'identity', 'personality', 'psychology', 'bandura', 'piaget', 'vygotsky', 'bandura'],
    },
    'profed': {
        'Teaching Profession': ['teacher', 'profession', 'code of ethics', 'role of the teacher', 'professional'],
        'Curriculum, Methods and Educational Technology': ['curriculum', 'method', 'tyler', 'taba', 'bloom', 'instruction', 'lesson', 'strategy', 'technology', 'cai', 'melc', 'assessment technique'],
        'Child and Adolescent Learners': ['learner', 'student', 'child', 'adolescent', 'development', 'psycholog', 'vygotsky', 'piaget', 'bruner', 'cognitive', 'affective'],
        'Assessment of Learning': ['test', 'assessment', 'validity', 'reliability', 'score', 'grade', 'portfolio', 'rubric', 'evaluation'],
        'Field Study and Teaching Internship': ['field study', 'internship', 'student teaching', 'cooperating teacher', 'reflection journal', 'practicum'],
    },
    'english': {
        'Introduction to Linguistics': ['phoneme', 'morpheme', 'phonetic', 'phonolog', 'semantic', 'syntax', 'linguistic', 'language acquisition'],
        'Language, Culture and Society': ['culture', 'society', 'sociolinguistic', 'language and society'],
        'Structure of English': ['grammar', 'sentence', 'clause', 'phrase', 'tense', 'pronoun', 'altogether', 'word order'],
        'Language Programs and Policies': ['curriculum', 'bilingual', 'language program', 'deped', 'policy'],
        'Children and Adolescent Literature': ['children literature', 'adolescent literature', 'picture book'],
        'Mythology and Folklore': ['myth', 'folklore', 'veda', 'epic', 'legend', 'fable'],
        'Survey of Literature of Selected Countries': ['haiku', 'basho', 'english literature', 'american literature', 'victorian', 'shakespeare', 'dickens', 'literature'],
        'Contemporary, Popular and Emergent Literatures': ['contemporary literature', 'popular literature', 'emergent literature'],
        'Teaching and Assessment of the Macroskills': ['listening', 'speaking', 'reading', 'writing skill', 'macroskill', 'cloze', 'fluency', 'grammar teaching', 'syllabus', 'test', 'tier'],
        'Teaching and Assessment of Literature': ['teach literature', 'literature teaching', 'literary text', 'character chart', 'novel study'],
        'Materials Development': ['instructional material', 'textbook', 'module', 'pilot', 'workbook', 'authentic material'],
        'Speech and Theatre Arts': ['speech', 'theatre', 'drama', 'oral', 'scripting'],
        'Language Education Research': ['action research', 'research', 'case study', 'ethnography', 'naturalistic'],
        'Literary Criticism': ['critic', 'theory', 'mimetic', 'pragmatic', 'structuralism', 'feminism'],
        'Stylistics and Discourse Analysis': ['stylistic', 'discourse', 'register', 'rhetoric', 'dictogloss'],
        'Campus Journalism': ['journalism', 'news', 'headline', 'editorial', 'broadcast'],
        'Technical Writing': ['technical writing', 'memo', 'report writing'],
        'Technology in Language Education': ['computer', 'technology', 'digital', 'online', 'multimedia', 'internet', 'powerpoint'],
        'Translation and Editing of Text': ['translation', 'editing text'],
        'English for Specific Purposes': ['esp', 'carrier content', 'specific purposes', 'tourist guides'],
        'Remedial Instruction': ['remedial', 'remediation'],
        'Creative Writing': ['creative writing', 'writing poetry', 'short story writing', 'writer', 'fiction'],
    },
}

def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

def flagged(item):
    stem = item['stem']
    opts = item['options']
    reasons = []
    if len(stem) < 20 or len(stem) > 400: reasons.append('stem_length')
    if TRAIL.search(stem): reasons.append('trailing_fragment')
    if LEAK.search(stem): reasons.append('header_leak')
    if DUPW.search(stem): reasons.append('repeated_word')
    if any(TRUNC.search(o) for o in opts): reasons.append('truncated_option')
    if len({norm(o) for o in opts}) < 4: reasons.append('duplicate_options')
    key = opts[item['answer']] if 0 <= item['answer'] < len(opts) else ''
    if AO.search(key) or any(AO.search(o) for o in opts): reasons.append('all_of_above')
    if not key.strip() or any(p in key for p in ('N/P', 'N/A', 'TBA')): reasons.append('placeholder_key')
    return reasons

def topic_ok(item):
    text = (item['stem'] + ' ' + ' '.join(item['options'])).lower()
    words = set(re.findall(r'[a-z]{3,}', text))
    return any(k in text or k in words for k in KEYWORDS[item['subject']].get(item['topic'], []))

def main():
    manifest = {'generated_from': 'src/data/imported/*-final.json', 'subjects': {}, 'reject_reasons': {}}
    rejects = []
    for name in ('gened-final.json', 'profed-final.json', 'english-final.json'):
        subject = name.split('-')[0]
        items = json.loads((IMP / name).read_text(encoding='utf-8'))
        clean, seen = [], set()
        reasons_counter = Counter()
        for item in items:
            reasons = flagged(item)
            if item['topic'] == FALLBACK[subject] and not topic_ok(item):
                reasons.append('fallback_topic')
            identity = (norm(item['stem'])[:110], tuple(sorted(norm(o) for o in item['options'])))
            if identity in seen:
                reasons.append('duplicate')
            seen.add(identity)
            if reasons:
                reasons_counter.update(reasons)
                rejects.append({'id': item['id'], 'reasons': reasons, 'stem': item['stem'][:160]})
                continue
            keyed = item['rationale'].startswith('Keyed answer in the source')
            item['rationaleKind'] = 'keyed' if keyed else 'curated'
            item['rationale'] = ('Key only — check the source before trusting it. Answer: ' + item['options'][item['answer']]) if keyed else item['rationale']
            wrong = [i for i, o in enumerate(item['options']) if norm(o) != norm(item['options'][item['answer']])]
            wrong.sort(key=lambda i: -len(set(norm(item['options'][i])) & set(norm(item['options'][item['answer']]))))
            item['clue1'] = f"Area: {item['topic']}. Recall the core rule before choosing."
            item['clue2'] = f"Eliminate option {'ABCD'[wrong[0]]} — it does not fit the stem." if wrong else 'Review the stem carefully.'
            item['source'] = f"{item['source']} | ref:{norm(item['stem'])[:10]}"
            clean.append(item)
        out = IMP / name.replace('-final', '-clean')
        out.write_text(json.dumps(clean, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        manifest['subjects'][subject] = {'in': len(items), 'clean': len(clean), 'rejected': len(items) - len(clean)}
        for k, v in reasons_counter.items():
            manifest['reject_reasons'][k] = manifest['reject_reasons'].get(k, 0) + v
        print(subject, len(items), '->', len(clean), dict(reasons_counter))
    (IMP / 'rejects.jsonl').write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in rejects), encoding='utf-8')
    (IMP / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print('manifest:', json.dumps(manifest['subjects']))

if __name__ == '__main__':
    main()
