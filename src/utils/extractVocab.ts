import type { TPOTest, TPOQuestion, TPOSection } from '../components/ContentManagement';
import type { SATWord } from '../components/vocaWordSets';

// ─── stopwords (TOEFL/수능/토익 수준에서 제외할 일상어) ────────────────────────
const STOPWORDS = new Set<string>([
  // articles, pronouns, prepositions, conjunctions, be-verbs, auxiliaries
  'the','a','an','this','that','these','those','it','its','they','them','their','there',
  'he','she','his','her','we','us','our','you','your','i','me','my',
  'is','are','was','were','be','been','being','am','do','does','did','done','have','has','had',
  'will','would','can','could','should','shall','may','might','must',
  'and','or','but','if','then','else','when','while','where','why','how','what','who','which','whose',
  'in','on','at','of','to','for','with','from','by','as','about','into','through','during','before','after',
  'above','below','between','among','under','over','off','up','down','out','away','back','again',
  'not','no','nor','so','than','too','very','just','only','also','more','most','much','many','some','any','all',
  'one','two','three','four','five','six','seven','eight','nine','ten','first','second','third',
  'other','another','such','same','each','every','both','either','neither',
  // common verbs/nouns/adjs with low test value
  'said','say','says','saying','get','got','make','made','go','went','gone','come','came','take','took','taken',
  'give','gave','given','find','found','know','knew','known','think','thought','see','saw','seen',
  'look','looked','look','feel','felt','want','wanted','need','needed','like','liked','use','used','using',
  'put','set','let','keep','kept','try','tried','ask','asked','tell','told','telling','show','showed','shown',
  'leave','left','begin','began','begun','seem','seemed','help','helped','turn','turned','start','started',
  'play','played','run','ran','move','moved','live','lived','believe','believed','held','bring','brought',
  'happen','happened','write','wrote','written','sit','sat','stand','stood','lose','lost','pay','paid',
  'meet','met','include','included','continue','continued','learn','learned','change','changed','lead','led',
  'understand','understood','watch','watched','follow','followed','stop','stopped','create','created','speak',
  'spoke','spoken','read','allow','allowed','add','added','spend','spent','grow','grew','grown','open','opened',
  'walk','walked','win','won','offer','offered','remember','remembered','love','consider','considered','appear',
  'appeared','buy','bought','wait','waited','serve','served','die','died','send','sent','expect','expected',
  'build','built','stay','stayed','fall','fell','fallen','cut','reach','reached','remain','remained',
  // common short nouns/adjs
  'thing','things','time','times','way','ways','day','days','year','years','man','men','woman','women',
  'child','children','boy','girl','people','person','group','groups','part','parts','place','places',
  'case','cases','work','works','week','weeks','month','months','point','points','home','houses','house',
  'school','schools','student','students','college','university','class','classes','course','courses',
  'question','questions','problem','problems','word','words','number','numbers','fact','facts','reason','reasons',
  'idea','ideas','area','areas','money','service','services','result','results','example','examples',
  'line','lines','side','side','book','books','room','rooms','end','ends','beginning','story','stories','job','jobs',
  'lot','kind','kinds','sort','sorts','type','types','form','forms','field','fields','level','levels',
  'good','new','old','great','little','own','big','high','small','large','next','early','young','important',
  'few','public','bad','same','able','long','different','common','whole','best','low','simple','main',
  'full','real','low','open','short','easy','free','true','final','whole','single','past','late','recent',
  // etc
  'yes','no','ok','okay','oh','ah','wow','hey','hi','hello','bye','please','thank','thanks',
]);

// ─── 단어 난이도 분류 (수능/토플/토익) ─────────────────────────────────────────
// 휴리스틱: 단어 길이 + 일반성
export type VocabLevel = '수능' | '토플' | '토익';

export function classifyLevel(word: string): VocabLevel {
  const w = word.toLowerCase();
  const len = w.length;
  // 수능 기출/토플 고난도 키워드 (간단 휴리스틱 — 실제 단어장과 매칭 시 정확도 향상 가능)
  const toeflHints = /(tion|sion|ment|ness|ity|ible|able|ous|ive|al|ish|ify|ize|ise|ate|struct|scrib|ject|ject|spect|vert|mit|ceive|tain|duct|sume|sume|ject|fer|port|pos|fig|medi|graph|logy|ism|ist)/;
  const suneungHints = /(ify|ize|ise|ative|ative|ition|ction|ement|ance|ence|able|ible|ous|ful|less|ness|ment|ship|hood|ity|ism|ist|ize|ise|ate|en|ish|ive|al|ic|ical|ory|ary|ine|ate|ity)/;

  if (len >= 9 && toeflHints.test(w)) return '토플';
  if (len >= 7 && (toeflHints.test(w) || suneungHints.test(w))) return '수능';
  if (len >= 5) return '토익';
  return '토익'; // 기본값
}

// ─── 텍스트 정제 및 토큰화 ──────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  if (!text) return [];
  // 소문자화, 알파벳만 추출 ( apostrophe, hyphen 포함 )
  const cleaned = text.toLowerCase().replace(/[^a-z\s\-']/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return tokens;
}

function isTestableWord(word: string): boolean {
  // 알파벳만, 최소 4글자, 최대 20글자, stopword 아님
  if (!word || word.length < 4 || word.length > 20) return false;
  if (!/^[a-z]+$/.test(word)) return false;
  if (STOPWORDS.has(word)) return false;
  // -ing/-ed/-s 등 단순 어미 변형은 그대로 두되, 공통 어근은 단순화하지 않음 (사용자가 CSV로 정제)
  return true;
}

// ─── 단어 추출 핵심 ────────────────────────────────────────────────────────────
export interface ExtractedVocab {
  word: string;            // 영단어 (소문자)
  frequency: number;        // 등장 횟수
  sourceSections: string[]; // ['Reading', 'Listening', ...]
  level: VocabLevel;       // 수능/토플/토익
  korean?: string;         // 기존 단어장과 매칭 시 한국어 뜻
  definition?: string;     // 영영 정의
  synonyms?: string;       // 동의어
}

/**
 * TPO/Test의 모든 섹션 question에서 단어를 추출합니다.
 * @param testData  전체 TPOTest
 * @param options    { maxWords, minFrequency, includeSections, existingVocab }
 */
export function extractVocabFromTest(
  testData: TPOTest,
  options: {
    maxWords?: number;
    minFrequency?: number;
    includeSections?: TPOSection['sectionType'][];
    existingVocab?: SATWord[]; // 기존 단어장 (뜻 매칭용)
  } = {}
): ExtractedVocab[] {
  const maxWords = options.maxWords ?? 50;
  const minFrequency = options.minFrequency ?? 2;
  const includeSections = options.includeSections;
  const existingVocab = options.existingVocab ?? [];

  // 기존 단어장 인덱스 (영단어 → SATWord)
  const vocabMap = new Map<string, SATWord>();
  for (const v of existingVocab) {
    if (v.english) vocabMap.set(v.english.toLowerCase().trim(), v);
  }

  // 빈도 + 출처 섹션 수집
  const frequency = new Map<string, number>();
  const sources = new Map<string, Set<string>>();

  const collectFromText = (text: string | undefined, section: string) => {
    if (!text) return;
    const tokens = tokenize(text);
    for (const tok of tokens) {
      if (!isTestableWord(tok)) continue;
      frequency.set(tok, (frequency.get(tok) ?? 0) + 1);
      if (!sources.has(tok)) sources.set(tok, new Set());
      sources.get(tok)!.add(section);
    }
  };

  for (const section of testData.sections) {
    if (includeSections && !includeSections.includes(section.sectionType)) continue;
    for (const q of section.questions) {
      const question = q as TPOQuestion & Record<string, unknown>;
      const secName = section.sectionType;
      collectFromText(question.passageText as string | undefined, secName);
      collectFromText(question.questionText as string | undefined, secName);
      collectFromText(question.scriptText as string | undefined, secName);
      collectFromText(question.passageTitle as string | undefined, secName);
      collectFromText(question.explanation as string | undefined, secName);
      // options 배열
      if (Array.isArray(question.options)) {
        for (const opt of question.options as string[]) collectFromText(opt, secName);
      }
      // correctAnswer (문자열 또는 문자열 배열)
      const ans = question.correctAnswer;
      if (typeof ans === 'string') collectFromText(ans, secName);
      else if (Array.isArray(ans)) for (const a of ans) if (typeof a === 'string') collectFromText(a, secName);
      // context (Writing)
      collectFromText((question as any).context as string | undefined, secName);
      // emailScenario, professorMessage 등 Writing 추가 필드
      const w = question as any;
      collectFromText(w.emailScenario as string | undefined, secName);
      collectFromText(w.emailInstruction as string | undefined, secName);
      collectFromText(w.professorMessage as string | undefined, secName);
      collectFromText(w.student1Message as string | undefined, secName);
      collectFromText(w.student2Message as string | undefined, secName);
    }
  }

  // 빈도순 정렬, minFrequency 이상만
  const candidates = [...frequency.entries()]
    .filter(([, freq]) => freq >= minFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([word, freq]) => {
      const matched = vocabMap.get(word);
      return {
        word,
        frequency: freq,
        sourceSections: [...(sources.get(word) ?? [])].sort(),
        level: classifyLevel(word),
        korean: matched?.korean,
        definition: matched?.definition,
        synonyms: matched?.synonyms,
      } as ExtractedVocab;
    });

  return candidates;
}

/**
 * 추출된 단어를 SATWord 형식으로 변환 (CSV 업로드용)
 */
export function toSATWords(vocab: ExtractedVocab[]): SATWord[] {
  return vocab.map(v => ({
    english: v.word,
    korean: v.korean || '',
    definition: v.definition || '',
    synonyms: v.synonyms || '',
  }));
}

/**
 * 추출된 단어를 CSV 문자열로 변환 (영단어, 한국어뜻, 영영정의, 동의어, 수준, 빈도, 출처)
 */
export function vocabToCSV(vocab: ExtractedVocab[]): string {
  const header = 'english,korean,definition,synonyms,level,frequency,sourceSections\n';
  const rows = vocab.map(v => {
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    return [
      escape(v.word),
      escape(v.korean || ''),
      escape(v.definition || ''),
      escape(v.synonyms || ''),
      v.level,
      String(v.frequency),
      escape(v.sourceSections.join(';')),
    ].join(',');
  });
  return header + rows.join('\n');
}
