/**
 * 단어 번역 유틸리티
 * - 1차: Google Translate gtx API (~200-500ms, CORS 허용, API 키 불필요)
 * - 2차: MyMemory Translation API (fallback)
 * - localStorage 캐시 — 반복 조회는 즉시 반환
 * - prefetchWordTranslation(): 드래그 선택 직후 미리 조회 시작
 * - 2.5초 타임아웃 — 응답 지연 시 폴백으로 넘어감
 */

export interface WordTranslation {
  koreanMeaning: string;
  partOfSpeech: string;
  englishExplanation: string;
}

function isKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

/* ---------------- 캐시 ---------------- */

const CACHE_KEY = 'toefl_word_translate_cache_v1';
const CACHE_LIMIT = 500;

type CacheEntry = WordTranslation;
type CacheMap = Record<string, CacheEntry>;

let memCache: CacheMap | null = null;
const inflight = new Map<string, Promise<WordTranslation | null>>();

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
    const keys = Object.keys(cache);
    if (keys.length > CACHE_LIMIT) {
      keys.slice(0, keys.length - CACHE_LIMIT).forEach((k) => delete cache[k]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

/* ---------------- 번역 API ---------------- */

interface TranslateResult {
  translation: string;
  pos?: string;
}

const TRANSLATE_TIMEOUT_MS = 2500;

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, { ...(init || {}), signal: controller.signal });
    return resp;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Google Translate gtx 엔드포인트 — free, API 키 불필요, CORS 허용.
 * dt=t(번역) + dt=bd(사전 항목, 품사 포함) 함께 요청.
 */
async function translateWithGoogle(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult | null> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&q=${encodeURIComponent(text)}`;
  const response = await fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS);
  if (!response || !response.ok) return null;

  try {
    const data = await response.json();
    const segments = data?.[0];
    if (!Array.isArray(segments)) return null;

    const translation = segments.map((seg: unknown[]) => seg?.[0]).filter(Boolean).join('').trim();
    if (!translation || translation === text) return null;

    let pos: string | undefined;
    const dict = data?.[1];
    if (Array.isArray(dict) && typeof dict[0]?.[0] === 'string') {
      pos = dict[0][0];
    }

    return { translation, pos };
  } catch {
    return null;
  }
}

/**
 * MyMemory Translation API (fallback) — free, API 키 불필요, CORS 지원.
 */
async function translateWithMyMemory(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
  const response = await fetchWithTimeout(url, TRANSLATE_TIMEOUT_MS);
  if (!response || !response.ok) return null;

  try {
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || translated === text) return null;

    const status = data?.responseStatus;
    if (status && status !== 200) return null;

    return translated;
  } catch {
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
 */
export async function translateWord(word: string, _context?: string): Promise<WordTranslation | null> {
  const cleaned = word.trim();
  if (!cleaned) return null;

  const isPhrase = cleaned.includes(' ');
  const korean = isKorean(cleaned);

  const cacheKey = `${korean ? 'ko' : 'en'}:${cleaned.toLowerCase()}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const existing = inflight.get(cacheKey);
  if (existing) return existing;

  const promise = (async (): Promise<WordTranslation | null> => {
    try {
      let koreanMeaning = '';
      let englishExplanation = '';
      let partOfSpeech = isPhrase ? 'phrase' : 'word';

      if (korean) {
        const result = await translate(cleaned, 'ko', 'en');
        if (!result) return null;
        englishExplanation = result.translation;
        koreanMeaning = cleaned;
        if (result.pos) partOfSpeech = result.pos;
      } else {
        const result = await translate(cleaned, 'en', 'ko');
        if (!result) return null;
        koreanMeaning = result.translation;
        englishExplanation = cleaned;

        if (result.pos) {
          partOfSpeech = result.pos;
        } else if (!isPhrase) {
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
    } catch {
      return null;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, promise);
  return promise;
}

/**
 * 팝업이 열리기 전에 번역을 미리 조회합니다 (드래그 선택 직후 호출).
 * 결과는 캐시/진행 중 맵에 저장되어 translateWord가 즉시 재사용합니다.
 */
export function prefetchWordTranslation(word: string): void {
  const cleaned = word.trim();
  if (!cleaned) return;
  const korean = isKorean(cleaned);
  const cacheKey = `${korean ? 'ko' : 'en'}:${cleaned.toLowerCase()}`;
  if (readCache(cacheKey) || inflight.has(cacheKey)) return;
  translateWord(cleaned).catch(() => { /* ignore */ });
}
