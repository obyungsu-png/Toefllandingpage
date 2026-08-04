/**
 * Free Dictionary API — 영어 단어 정의 조회
 * https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 *
 * 속도 개선:
 * - localStorage + 메모리 캐시: 한 번 조회한 단어는 즉시 반환
 * - prefetchWordDefinitions(): 드래그 선택 직후 미리 조회 시작 (팝업 열 때 이미 완료/진행 중)
 * - 6초 타임아웃: 공개 API 지연 시 무한 대기 방지
 */

export interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
}

/* ---------------- 캐시 ---------------- */

const CACHE_KEY = 'toefl_en_dict_cache_v1';
const CACHE_LIMIT = 800;

type CacheMap = Record<string, WordDefinition[]>;

let memCache: CacheMap | null = null;
/** 동일 단어 동시 요청 합치기 + prefetch 결과 공유 */
const inflight = new Map<string, Promise<WordDefinition[]>>();

function loadCache(): CacheMap {
  if (memCache) return memCache;
  try {
    memCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as CacheMap;
  } catch {
    memCache = {};
  }
  return memCache;
}

function readCache(key: string): WordDefinition[] | null {
  const hit = loadCache()[key];
  return hit !== undefined ? hit : null;
}

function writeCache(key: string, entry: WordDefinition[]) {
  try {
    const cache = loadCache();
    cache[key] = entry;
    // 용량 관리 — 한계 넘으면 오래된 것(앞쪽 키)부터 정리
    const keys = Object.keys(cache);
    if (keys.length > CACHE_LIMIT) {
      keys.slice(0, keys.length - CACHE_LIMIT).forEach((k) => delete cache[k]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage full 등 무시 */ }
}

/* ---------------- API ---------------- */

const FETCH_TIMEOUT_MS = 6000;

async function fetchDefinitions(word: string): Promise<WordDefinition[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: controller.signal }
    );
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const results: WordDefinition[] = [];
    for (const entry of data) {
      const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text;
      if (entry.meanings && Array.isArray(entry.meanings)) {
        for (const meaning of entry.meanings) {
          const partOfSpeech = meaning.partOfSpeech || '';
          if (meaning.definitions && Array.isArray(meaning.definitions)) {
            for (const def of meaning.definitions) {
              results.push({
                word: entry.word || word,
                phonetic,
                partOfSpeech,
                definition: def.definition || '',
                example: def.example,
              });
              // 각 품사당 최대 2개 정의만
              if (results.filter(r => r.partOfSpeech === partOfSpeech).length >= 2) break;
            }
          }
        }
      }
    }

    // 최대 5개까지만 반환
    return results.slice(0, 5);
  } catch (err) {
    console.warn('[dictionaryApi] Error fetching definition:', err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 영어 단어의 정의를 조회합니다.
 * 캐시 우선 → 동일 단어 진행 중 요청 재사용 → 네트워크 조회 후 캐시 저장.
 * @param word 조회할 단어
 * @returns 정의 배열 (빈 배열이면 단어를 찾지 못함)
 */
export async function getWordDefinitions(word: string): Promise<WordDefinition[]> {
  const cleaned = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
  if (!cleaned) return [];

  const cached = readCache(cleaned);
  if (cached !== null) return cached;

  const existing = inflight.get(cleaned);
  if (existing) return existing;

  const promise = fetchDefinitions(cleaned).then((defs) => {
    writeCache(cleaned, defs);
    inflight.delete(cleaned);
    return defs;
  });
  inflight.set(cleaned, promise);
  return promise;
}

/**
 * 팝업이 열리기 전에 미리 조회를 시작합니다 (드래그 선택 직후 호출).
 * 결과는 캐시/진행 중 맵에 저장되어 getWordDefinitions가 즉시 재사용합니다.
 */
export function prefetchWordDefinitions(word: string): void {
  const cleaned = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
  if (!cleaned || cleaned.includes(' ')) return;
  if (readCache(cleaned) !== null || inflight.has(cleaned)) return;
  // 결과는 버리고 캐시 워밍만 — 에러도 무시
  getWordDefinitions(cleaned).catch(() => { /* prefetch 실패 무시 */ });
}
