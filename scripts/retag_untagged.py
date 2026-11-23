"""Re-tag recovered items whose topic fell back to the subject name.

`topic_for` returns the subject as a fallback when no keyword matches, which puts a
bogus "gened"/"english" row in the TOS breakdown and yields a useless clue
("Area: gened."). This pass only re-tags items that are still untagged, and only
to a real area of the SAME subject, so ids, counts and subject membership stay
stable. Anything still unmatched is bucketed as "General" instead of the subject
name so the UI never shows a subject as its own TOS area.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMP = ROOT / 'src' / 'data' / 'imported'

GENED = {
    'Mathematics': ['ratio', 'fraction', 'percent', 'equation', 'algebra', 'geometry', 'probability', 'integer', 'decimal', 'quotient', 'numerator', 'denominator', 'digit', 'profit', 'interest', 'discount', 'average', 'mean', 'median', 'prime', 'multiple', 'divisor', 'arithmetic', 'trigonometry', 'polynomial', 'permutation', 'combination', 'statistic', 'graph of', 'how many', 'sum of', 'product of', 'area of', 'volume of', 'angle', 'triangle', 'circle', 'radius', 'theorem', 'pythagorean'],
    'Science and Technology': ['science', 'biology', 'chemistry', 'physics', 'cell', 'atom', 'molecule', 'energy', 'force', 'motion', 'electric', 'magnet', 'planet', 'solar', 'ecosystem', 'species', 'virus', 'bacteria', 'disease', 'health', 'nutrition', 'environment', 'climate', 'weather', 'earthquake', 'volcano', 'photosynthesis', 'respiration', 'dna', 'gene', 'evolution', 'laboratory', 'experiment', 'technology', 'computer', 'internet', 'software', 'hardware', 'operating system', 'mining', 'metal', 'pollution', 'agriculture', 'plant', 'animal', 'human body', 'circulatory', 'digestive', 'nervous system', 'matter', 'element', 'compound', 'reaction', 'acid', 'base', 'salt', 'temperature', 'heat', 'light', 'sound', 'wave', 'telescope', 'microscope', 'scientific method', 'hypothesis', 'vaccine', 'immune', 'covid', 'pandemic', 'population', 'habitat', 'food chain'],
    'Readings in Philippine History and Society': ['history', 'katipunan', 'revolution', 'colonial', 'spanish', 'american', 'japanese', 'morga', 'bonifacio', 'aguinaldo', 'quezon', 'marcos', 'edsa', 'constitution', 'barangay', 'datu', 'sultan', 'kastila', 'galleon', 'treaty of paris', 'biak-na-bato', 'malolos', 'martial law', 'people power', 'philippine', 'pilipinas', 'kastila', 'ilustrado', 'propaganda movement', 'katipunero', 'cavite', 'intramuros', 'mactan', 'lapu-lapu', 'magellan', 'limasawa', 'plaridel', 'jaena', 'del pilar', 'diego silang', 'gabriela', 'silang', 'basi', 'dagohoy', 'tayabas', 'erecta', 'universidad', 'santo tomas', 'la solidaria'],
    'The Life and Works of Rizal': ['rizal', 'noli', 'fili', 'filibusterismo', 'la solidaridad', 'ultimo adios', 'mi ultimo adios', 'a la juventud filipina', 'junto al pasig', 'calamba', 'dapitan', 'exile', 'gomburza', 'burgos', 'zamora', 'gomez', 'elfilibusterismo', 'megano'],
    'The Contemporary World': ['globalization', 'globalisation', 'contemporary', 'world war', 'united nations', 'asean', 'european union', 'generation', 'millennial', 'gen z', 'social media', 'climate change', 'sustainable', 'human rights', 'terrorism', 'communism', 'capitalism', 'cold war', 'modern world', 'regional', 'interdependence'],
    'Art Appreciation': ['art', 'theater', 'theatre', 'music', 'film', 'movie', 'painting', 'sculpture', 'architecture', 'aesthetic', 'dance', 'literature', 'poem', 'poetry', 'novel', 'artist', 'masterpiece', 'renaissance', 'baroque', 'impressionist', 'shakespeare', 'opera', 'photography', 'design', 'heritage', 'sarswela', 'kundiman', 'rondalla', 'mural', 'gallery', 'museum', 'portrait', 'landscape'],
    'Purposive Communication in English': ['communication', 'idiom', 'essay', 'grammar', 'sentence', 'paragraph', 'epistle', 'vocabulary', 'spelling', 'punctuation', 'tense', 'comprehension', 'reading', 'writing', 'functional grammar', 'text', 'letter', 'email', 'paragraph', 'essay', 'composition', 'note', 'memo', 'summary', 'outline', 'punctuation'],
    'Malayuning Komunikasyon sa Wikang Filipino': ['filipino', 'salita', 'pangungusap', 'simuno', 'pahayagan', 'tuldok', 'sugnay', 'kaltas', 'wikang', 'tagalog', 'pandiwa', 'pangngalan', 'pang-uri', 'pang-abay', 'taludtud', 'tula', 'balagtasan', 'sanaysay', 'maikling kwento', 'nobela', 'dula', 'panitikan', 'kasaysayan', 'baybayin', 'gramatica', 'panghalip', 'pang-ukol', 'pang-aping', 'parirala', 'pangungusap', 'diwa', 'kahulugan', 'sawikain', 'idiyoma', 'tayutay', 'talatinig', 'talasalitaan'],
    'Ethics': ['ethic', 'moral', 'values', 'virtue', 'conscience', 'freedom', 'responsibility', 'integrity', 'honesty', 'corruption', 'bribery', 'kasamaan', 'kabutihan', 'tama at mali', 'right and wrong', 'pananagutan', 'katapatan', 'katarungan'],
    'Understanding the Self': ['self', 'identity', 'personality', 'ego', 'superego', 'freud', 'maslow', 'rogers', 'emotion', 'stress', 'coping', 'mental health', 'self-esteem', 'adolescence', 'identity crisis', 'sigmund', 'carl rogers', 'abraham maslow', 'hierarchy of needs', 'kahulugang pansarili', 'pagkatao'],
}

ENGLISH = {
    'Introduction to Linguistics': ['phoneme', 'morpheme', 'phonetics', 'phonology', 'semantics', 'syntax', 'linguistic', 'language acquisition', 'morphology', 'pragmatics', 'sociolinguistics', 'dialect', 'idiolect', 'allophone', 'syllable', 'stress pattern', 'transformational', 'generative', 'deep structure', 'surface structure', 'chomsky', 'descriptive grammar', 'prescriptive'],
    'Language, Culture and Society': ['culture', 'society', 'sociolinguistic', 'language policy', 'code-switching', 'code switching', 'multilingual', 'bilingual', 'language and culture', 'ethnolinguistic', 'lingua franca', 'interlanguage'],
    'Structure of English': ['grammar', 'sentence', 'clause', 'phrase', 'tense', 'pronoun', 'subject-verb', 'concord', 'modifier', 'parts of speech', 'noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'interjection', 'article', 'voice', 'mood', 'number agreement', 'word order', 'transformation'],
    'Language Programs and Policies': ['curriculum', 'bilingual', 'language program', 'deped', 'mtb-mle', 'mother tongue', 'language policy', 'k to 12', 'k-12', 'program implementation'],
    'Children and Adolescent Literature': ['children literature', 'adolescent literature', 'picture book', 'ya novel', 'young adult', 'folktale for children', 'juvenile'],
    'Mythology and Folklore': ['myth', 'folklore', 'veda', 'epic', 'legend', 'fable', 'gods', 'goddess', 'zeus', 'olympus', 'iliad', 'odyssey', 'mahabharata', 'ramayana', 'alamat', 'engkanto', 'aswang', 'tall tale', 'archetyp'],
    'Survey of Literature of Selected Countries': ['haiku', 'basho', 'english literature', 'american literature', 'victorian', 'shakespeare', 'dickens', 'chaucer', 'milton', 'wordsworth', 'coleridge', 'keats', 'shelley', 'byron', 'austen', 'bronte', 'hardy', 'eliot', 'woolf', 'joyce', 'hemingway', 'fitzgerald', 'whitman', 'emerson', 'thoreau', 'poe', 'twain', 'melville', 'hawthorne', 'dickinson', 'eliot, t.', 'romantic period', 'restoration', 'modernist', 'elizabethan', 'jacobean', 'metaphysical', 'satire', 'epic poem', 'tragedy', 'comedy', 'sonnet', 'playwright', 'dramatist', 'novelist', 'poet laureate', 'literary period'],
    'Contemporary, Popular and Emergent Literatures': ['contemporary', 'popular literature', 'emergent', 'climate fiction', 'cyberpunk', 'dystopian', 'utopian', 'graphic novel', 'erasure poetry', 'spoken word', 'flash fiction', 'fan fiction', 'web novel', 'sci-fi', 'science fiction', 'fantasy', 'steampunk'],
    'Teaching and Assessment of the Macroskills': ['listen', 'speaking', 'reading skill', 'writing skill', 'macroskill', 'cloze', 'fluency', 'grammar teaching', 'syllabus', 'assessment', 'test', 'oral', 'pronunciation', 'intensive reading', 'extensive reading', 'scanning', 'skimming', 'note-taking', 'listening comprehension', 'oral reading', 'rubric'],
    'Teaching and Assessment of Literature': ['teach literature', 'literature teaching', 'literary text', 'character chart', 'novel study', 'literature instruction', 'teaching poetry', 'drama teaching', 'literary appreciation', 'response to literature'],
    'Materials Development': ['instructional material', 'textbook', 'module', 'pilot', 'workbook', 'authentic material', 'improved material', 'learning material', 'visual material', 'instructional aid', 'slm', 'self-learning module', 'workbook'],
    'Speech and Theatre Arts': ['speech', 'theatre', 'drama', 'oral', 'stage', 'actor', 'director', 'blocking', 'costume', 'stagecraft', 'play production', 'debate', 'oratory', 'elocution', 'choral'],
    'Language Education Research': ['action research', 'research design', 'ethic', 'survey', 'experiment', 'hypothesis', 'variable', 'correlation', 'case study', 'qualitative', 'quantitative', 'sampling', 'questionnaire', 'interview', 'statistics', 'mean score', 'research instrument', 'validity', 'reliability', 'statistical'],
    'Literary Criticism': ['critic', 'theory', 'mimetic', 'pragmatic', 'structuralism', 'feminism', 'formalism', 'new criticism', 'reader-response', 'postcolonial', 'marxist', 'psychoanalytic', 'archetypal', 'deconstruction', 'postmodern', 'critical approach', 'literary theory'],
    'Stylistics and Discourse Analysis': ['stylistic', 'discourse', 'register', 'rhetoric', 'cohesion', 'coherence', 'speech act', 'conversation', 'text analysis', 'genre', 'figurative', 'metaphor', 'simile', 'symbolism', 'imagery', 'tone', 'mood', 'point of view', 'theme'],
    'Campus Journalism': ['journalism', 'news', 'headline', 'editorial', 'campus paper', 'school paper', 'column', 'feature', 'editorial cartoon', 'layout', 'byline', 'deadline', 'press'],
    'Technical Writing': ['technical writing', 'memo', 'report writing', 'business letter', 'proposal', 'abstract', 'minutes', 'technical report', 'letter of request', 'memo'],
    'Technology in Language Education': ['computer', 'technology', 'digital', 'online', 'multimedia', 'internet', 'powerpoint', 'slide', 'video', 'audio', 'blog', 'website', 'e-learning', 'blended', 'ict', 'computer-assisted'],
    'Translation and Editing of Text': ['translation', 'editing text', 'translate', 'editing', 'proofread', 'copy editing', 'subtitl'],
    'English for Specific Purposes': ['esp', 'carrier content', 'specific purposes', 'english for', 'academic purposes', 'occupational', 'workplace english'],
    'Remedial Instruction': ['remedial', 'remediation', 'tier 1', 'tier 2', 'tier 3', 'mtss', 'intervention', 'learning difficulty', 'reading remediation', 'special education', 'inclusive education', 'slow learner'],
    'Creative Writing': ['creative writing', 'writing poetry', 'short story writing', 'writer', 'freewriting', 'workshop', 'fiction writing', 'poetry writing', 'narrative'],
}


def classify(text, subject):
    t = text.lower()
    rules = GENED if subject == 'gened' else ENGLISH
    for topic, keys in rules.items():
        if any(k in t for k in keys):
            return topic
    return 'General'


def main():
    dry = '--write' not in sys.argv
    for subject in ('gened', 'english'):
        path = IMP / f'recovered-{subject}.json'
        items = json.loads(path.read_text(encoding='utf-8'))
        changed = 0
        buckets = {}
        for q in items:
            if q.get('topic') != subject:
                continue
            new = classify(q['stem'] + ' ' + ' '.join(q['options']), subject)
            buckets[new] = buckets.get(new, 0) + 1
            if new != q['topic']:
                changed += 1
                if not dry:
                    q['topic'] = new
                    q['clue1'] = f"Area: {new}. Recall the core rule before choosing."
        print(f'{subject}: {changed} re-tagged of {len(items)}')
        print('  buckets:', json.dumps(dict(sorted(buckets.items(), key=lambda x: -x[1])), ensure_ascii=False))
        if not dry:
            path.write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    if dry:
        print('\n(dry run — pass --write to apply)')


if __name__ == '__main__':
    main()
