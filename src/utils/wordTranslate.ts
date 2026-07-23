/**
 * 단어 번역 유틸리티
 * - 1차: Google Translate gtx API (빠름, 번역 품질 좋음, API 키 불필요)
 * - 2차: MyMemory Translation API (fallback)
 * - localStorage 캐시로 반복 조회는 즉시 반환
 */

export interface WordTranslation {
  koreanMeaning: string;
  partOfSpeech: string;
  englishExplanation: string;
}

/** 텍스트가 한글을 포함하는지 판별 */
function isKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

/* ---------------- 캐시 ---------------- */

const CACHE_KEY = 'toefl_word_translate_cache_v1';
const CACHE_LIMIT = 500;

type CacheEntry = WordTranslation;
type CacheMap = Record<string, CacheEntry>;

let memCache: CacheMap | null = null;

function loadCache(): CacheMap {
  if (memCache) return memCache;
  try {
    memCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as CacheMap;
  } catch {
    memCache = {};
  }
  return memCache;
}

function readCache(key: string): CacheEntry | null {
  return loadCache()[key] || null;
}

function writeCache(key: string, entry: CacheEntry) {
  try {
    const cache = loadCache();
    cache[key] = entry;
    // 용량 관리 — 500개 넘으면 오래된 것(앞쪽 키)부터 정리
    const keys = Object.keys(cache);
    if (keys.length > CACHE_LIMIT) {
      keys.slice(0, keys.length - CACHE_LIMIT).forEach((k) => delete cache[k]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage full 등 무시 */ }
}

/* ---------------- 번역 API ---------------- */

interface TranslateResult {
  translation: string;
  pos?: string;
}

/**
 * Google Translate gtx 엔드포인트 — free, API 키 불필요, CORS 허용.
 * dt=t(번역) + dt=bd(사전 항목, 품사 포함) 함께 요청.
 */
async function translateWithGoogle(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const segments = data?.[0];
    if (!Array.isArray(segments)) return null;

    const translation = segments.map((seg: unknown[]) => seg?.[0]).filter(Boolean).join('').trim();
    if (!translation || translation === text) return null;

    // dt=bd 결과의 첫 사전 항목에서 품사 추출 (예: 'noun', 'verb')
    let pos: string | undefined;
    const dict = data?.[1];
    if (Array.isArray(dict) && typeof dict[0]?.[0] === 'string') {
      pos = dict[0][0];
    }

    return { translation, pos };
  } catch (err) {
    console.warn('[wordTranslate] Google gtx API error:', err);
    return null;
  }
}

/**
 * MyMemory Translation API (fallback)
 * free, API 키 불필요, CORS 지원, 하루 5000자
 */
async function translateWithMyMemory(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || translated === text) return null;

    const status = data?.responseStatus;
    if (status && status !== 200) return null;

    return translated;
  } catch (err) {
    console.warn('[wordTranslate] MyMemory API error:', err);
    return null;
  }
}

/** Google gtx 우선, 실패 시 MyMemory fallback */
async function translate(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult | null> {
  const google = await translateWithGoogle(text, sourceLang, targetLang);
  if (google) return google;

  const fallback = await translateWithMyMemory(text, sourceLang, targetLang);
  return fallback ? { translation: fallback } : null;
}

/**
 * 단어/구문의 번역을 조회합니다.
 * 한글 단어 → 영어 번역 + 한국어 의미
 * 영어 단어 → 한국어 번역 + 영어 설명
 * @param word 조회할 단어
 * @param context 지문 내 문맥 (선택)
 * @returns 한국어 뜻, 품사, 영어 설명
 */
export async function translateWord(word: string, context?: string): Promise<WordTranslation | null> {
  const cleaned = word.trim();
  if (!cleaned) return null;

  const isPhrase = cleaned.includes(' ');
  const korean = isKorean(cleaned);

  // 캐시 조회 — 동일 단어 반복 조회 시 즉시 반환
  const cacheKey = `${korean ? 'ko' : 'en'}:${cleaned.toLowerCase()}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  try {
    let koreanMeaning = '';
    let englishExplanation = '';
    let partOfSpeech = isPhrase ? 'phrase' : 'word';

    if (korean) {
      // 한글 → 영어 번역
      const result = await translate(cleaned, 'ko', 'en');
      if (!result) return null;
      englishExplanation = result.translation;
      koreanMeaning = cleaned; // 원본 한글 단어가 곧 한국어 의미
      if (result.pos) partOfSpeech = result.pos;
    } else {
      // 영어 → 한국어 번역
      const result = await translate(cleaned, 'en', 'ko');
      if (!result) return null;
      koreanMeaning = result.translation;
      englishExplanation = cleaned; // 원본 영어 단어가 곧 영어 설명

      if (result.pos) {
        partOfSpeech = result.pos;
      } else if (!isPhrase) {
        // 품사 추정 (간단한 휴리스틱)
        const lower = cleaned.toLowerCase();
        if (lower.endsWith('ly')) partOfSpeech = 'adverb';
        else if (lower.endsWith('ing') || lower.endsWith('ed')) partOfSpeech = 'verb';
        else if (lower.endsWith('tion') || lower.endsWith('ness') || lower.endsWith('ment')) partOfSpeech = 'noun';
        else if (lower.endsWith('ful') || lower.endsWith('ous') || lower.endsWith('ive') || lower.endsWith('able')) partOfSpeech = 'adjective';
      }
    }

    const entry: WordTranslation = { koreanMeaning, partOfSpeech, englishExplanation };
    writeCache(cacheKey, entry);
    return entry;
  } catch (err) {
    console.warn('[wordTranslate] Error translating word:', err);
    return null;
  }
}
