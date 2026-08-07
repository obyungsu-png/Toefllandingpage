/**
 * Free Dictionary API — 영어 단어 정의 조회
 * https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 *
 * 속도 개선:
 * - localStorage + 메모리 캐시: 한 번 조회한 단어는 즉시 반환
 * - prefetchWordDefinitions(): 드래그 선택 직후 미리 조회 시작
 * - 3초 타임아웃 — 응답 지연 시 빠르게 실패해 번역 폴백으로 넘어감
 * - 어근(lemma) 후보 자동 시도: running → run, studies → study, stopped → stop 등
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
    const keys = Object.keys(cache);
    if (keys.length > CACHE_LIMIT) {
      keys.slice(0, keys.length - CACHE_LIMIT).forEach((k) => delete cache[k]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

/* ---------------- 어근(lemma) 후보 생성 ---------------- */

/**
 * 굴절형(inflected form) 단어에 대한 어근 후보를 생성합니다.
 * 예: running → [running, runn, runne, run], studies → [studies, studie, study]
 * 사전에 원형이 없을 때 fallback으로 시도할 후보들.
 */
export function generateLemmaCandidates(word: string): string[] {
  const s = word.toLowerCase();
  const out: string[] = [s];
  const push = (v: string) => { if (v && v.length >= 2 && !out.includes(v)) out.push(v); };

  // -ies → -y (studies → study, tries → try)
  if (s.endsWith('ies') && s.length > 4) push(s.slice(0, -3) + 'y');
  // -ied → -y (studied → study, tried → try)
  if (s.endsWith('ied') && s.length > 4) push(s.slice(0, -3) + 'y');
  // -ying → -ie (dying → die, lying → lie)
  if (s.endsWith('ying') && s.length > 5) push(s.slice(0, -4) + 'ie');

  // -ing (running → run/runn/runne, making → mak/make)
  if (s.endsWith('ing') && s.length > 4) {
    const stem = s.slice(0, -3);
    push(stem);              // walk-ing → walk
    push(stem + 'e');        // mak-ing → make
    // 자음 중복 제거: runn-ing → run
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      push(stem.slice(0, -1));
    }
  }

  // -ed (played → play, raced → race, stopped → stop)
  if (s.endsWith('ed') && s.length > 3) {
    const stem = s.slice(0, -2);
    push(stem);              // play-ed → play
    push(s.slice(0, -1));    // race-d → race
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      push(stem.slice(0, -1)); // stopp-ed → stop
    }
  }

  // -es (goes → go, races → race, watches → watch)
  if (s.endsWith('es') && s.length > 3) {
    push(s.slice(0, -2));    // go-es → go
    push(s.slice(0, -1));    // rac-es → race
  }

  // -s (dogs → dog) — 단, -ss(글자 겹침)/-us(음절 끝) 등은 제외
  if (s.endsWith('s') && !s.endsWith('ss') && !s.endsWith('us') && !s.endsWith('is') && s.length > 2) {
    push(s.slice(0, -1));
  }

  // -er / -est (bigger → big, biggest → big; runner → run)
  if (s.endsWith('er') && s.length > 3) {
    const stem = s.slice(0, -2);
    push(stem);
    push(s.slice(0, -1));
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      push(stem.slice(0, -1));
    }
  }
  if (s.endsWith('est') && s.length > 4) {
    const stem = s.slice(0, -3);
    push(stem);
    push(s.slice(0, -2));
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      push(stem.slice(0, -1));
    }
  }

  // -ly (quickly → quick)
  if (s.endsWith('ly') && s.length > 3) push(s.slice(0, -2));

  // -ness (happiness → happi → happy)
  if (s.endsWith('ness') && s.length > 5) {
    const stem = s.slice(0, -4);
    push(stem);
    if (stem.endsWith('i')) push(stem.slice(0, -1) + 'y');
  }

  // -ment (movement → move)
  if (s.endsWith('ment') && s.length > 5) push(s.slice(0, -4));

  return out;
}

/* ---------------- API ---------------- */

const FETCH_TIMEOUT_MS = 3000;

async function fetchDefinitions(word: string, signal?: AbortSignal): Promise<WordDefinition[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onAbort);
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
              if (results.filter(r => r.partOfSpeech === partOfSpeech).length >= 2) break;
            }
          }
        }
      }
    }

    return results.slice(0, 5);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

/**
 * 여러 후보 단어를 병렬 조회 — 첫 성공(정의 있음)이 확정되는 순간 나머지는 abort.
 * 원형 실패 시 어근 후보로 fallback해서 굴절형도 자연스럽게 검색되도록 함.
 */
async function fetchDefinitionsRacing(candidates: string[]): Promise<WordDefinition[]> {
  if (candidates.length === 0) return [];
  if (candidates.length === 1) return fetchDefinitions(candidates[0]);

  const master = new AbortController();
  const promises = candidates.map(c => fetchDefinitions(c, master.signal));

  try {
    // 원형 먼저 시도 (300ms) — 원형이 존재하면 어근 fallback을 굳이 기다리지 않음
    const first = await Promise.race([
      promises[0],
      new Promise<null>(res => setTimeout(() => res(null), 300)),
    ]);
    if (first && first.length > 0) {
      master.abort();
      return first;
    }
    // 원형이 늦거나 비었으면 병렬 결과 중 첫 성공 채택
    for (const p of promises) {
      const r = await p;
      if (r.length > 0) {
        master.abort();
        return r;
      }
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * 영어 단어의 정의를 조회합니다.
 * 캐시 우선 → 진행 중 요청 재사용 → 원형+어근 후보 병렬 조회.
 */
export async function getWordDefinitions(word: string): Promise<WordDefinition[]> {
  const cleaned = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
  if (!cleaned) return [];

  const cached = readCache(cleaned);
  if (cached !== null) return cached;

  const existing = inflight.get(cleaned);
  if (existing) return existing;

  const candidates = generateLemmaCandidates(cleaned);
  const promise = fetchDefinitionsRacing(candidates).then((defs) => {
    writeCache(cleaned, defs);
    inflight.delete(cleaned);
    return defs;
  });
  inflight.set(cleaned, promise);
  return promise;
}

/**
 * 팝업이 열리기 전에 미리 조회를 시작합니다 (드래그 선택 직후 호출).
 */
export function prefetchWordDefinitions(word: string): void {
  const cleaned = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
  if (!cleaned || cleaned.includes(' ')) return;
  if (readCache(cleaned) !== null || inflight.has(cleaned)) return;
  getWordDefinitions(cleaned).catch(() => { /* ignore */ });
}
