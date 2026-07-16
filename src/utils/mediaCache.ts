/**
 * Media Cache — IndexedDB 기반 미디어 파일 캐싱 시스템
 *
 * Electron exe에서 오프라인으로 이미지/오디오/비디오를 사용할 수 있도록
 * Supabase Storage URL의 파일을 로컬에 다운로드하여 캐싱합니다.
 *
 * 사용 흐름:
 * 1. App 시작 시 Supabase에서 JSON 데이터 로드 (이미 구현됨)
 * 2. preloadAllMedia(allTests) 호출 → 모든 미디어 URL을 IndexedDB에 캐싱
 * 3. ImageWithFallback / 오디오 재생 시 getCachedBlobUrl()로 캐시 확인
 * 4. 캐시된 blob URL이 있으면 사용, 없으면 원격 URL 사용
 */

const DB_NAME = 'toefl_media_cache';
const STORE_NAME = 'media';
const DB_VERSION = 1;

// Supabase Storage URL 패턴
const SUPABASE_URL_PATTERN = /supabase\.co\/storage\/v1\/object\/public\//;

// 캐시할 미디어 URL 필드 이름들
const MEDIA_URL_FIELDS = [
  'imageUrl',
  'audioUrl',
  'videoUrl',
  'introImageUrl',
  'introAudioUrl',
  'passageAudioUrl',
  'passageImageUrl',
  'avatar1ImageUrl',
  'avatar2ImageUrl',
  'professorImageUrl',
  'student1ImageUrl',
  'student2ImageUrl',
];

// ─────────────────────────────────────────────────────────────────
//  IndexedDB 헬퍼 — 연결 재사용 (매번 열지 않음)
// ─────────────────────────────────────────────────────────────────

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
  return dbPromise;
}

// ─────────────────────────────────────────────────────────────────
//  단일 URL 캐싱
// ─────────────────────────────────────────────────────────────────

// 이미 다운로드 중인 URL 추적 (중복 다운로드 방지)
const pendingDownloads = new Map<string, Promise<void>>();

export async function cacheMediaUrl(url: string): Promise<void> {
  if (!url || typeof url !== 'string') return;

  // Supabase Storage URL이 아니면 스킵 (로컬 경로, data: URL 등)
  if (!SUPABASE_URL_PATTERN.test(url) && !url.startsWith('http')) return;

  // 이미 다운로드 중이면 대기
  if (pendingDownloads.has(url)) {
    return pendingDownloads.get(url)!;
  }

  const downloadPromise = (async () => {
    try {
      const db = await openDB();

      // 이미 캐시되어 있는지 확인
      const existing = await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(url);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (existing) return; // 이미 캐시됨

      // 다운로드
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[mediaCache] Failed to fetch: ${url} (${response.status})`);
        return;
      }

      const blob = await response.blob();

      // IndexedDB에 저장 (배치 처리 중에는 close하지 않음)
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(blob, url);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      // db.close() 제거 - 배치 처리 중 연결 유지 위해
    } catch (err) {
      console.warn(`[mediaCache] Error caching ${url}:`, err);
    } finally {
      pendingDownloads.delete(url);
    }
  })();

  pendingDownloads.set(url, downloadPromise);
  return downloadPromise;
}

// ─────────────────────────────────────────────────────────────────
//  캐시에서 blob URL 가져오기
// ─────────────────────────────────────────────────────────────────

// blob URL 추적 (메모리 누수 방지)
const blobUrlMap = new Map<string, string>();

export async function getCachedBlobUrl(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;

  // Supabase Storage URL이 아니면 그대로 반환
  if (!SUPABASE_URL_PATTERN.test(url)) return null;

  // 이미 생성된 blob URL이 있으면 재사용
  if (blobUrlMap.has(url)) {
    return blobUrlMap.get(url)!;
  }

    try {
      const db = await openDB();
      const blob = await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(url);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      // db.close() 제거 - 연결 재사용을 위해 유지 (dbInstance 싱글톤 패턴)

      if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      blobUrlMap.set(url, blobUrl);
      return blobUrl;
    }
  } catch (err) {
    console.warn(`[mediaCache] Error reading cache for ${url}:`, err);
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
//  캐시되지 않은 URL을 위한 동적 캐싱 + blob URL 반환
//  (이미지 로드 실패 시 폴백으로 사용)
// ─────────────────────────────────────────────────────────────────

export async function getMediaUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return url;

  // Supabase Storage URL이 아니면 그대로 반환
  if (!SUPABASE_URL_PATTERN.test(url)) return url;

  // 캐시 확인
  const cached = await getCachedBlobUrl(url);
  if (cached) return cached;

  // 캐시에 없으면 백그라운드에서 다운로드 시도 (다음 로드 때 캐시됨)
  void cacheMediaUrl(url);

  // 이번에는 원래 URL 반환
  return url;
}

// ─────────────────────────────────────────────────────────────────
//  전체 미디어 프리로드
// ─────────────────────────────────────────────────────────────────

// 객체에서 모든 미디어 URL 추출
function extractMediaUrls(obj: any, urls: Set<string>): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractMediaUrls(item, urls);
    }
    return;
  }

  for (const key of MEDIA_URL_FIELDS) {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('http') && SUPABASE_URL_PATTERN.test(value)) {
      urls.add(value);
    }
  }

  // 중첩 객체 재귀 탐색
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      extractMediaUrls(obj[key], urls);
    }
  }
}

export async function preloadAllMedia(
  testData: any[],
  onProgress?: (cached: number, total: number) => void
): Promise<void> {
  // 모든 미디어 URL 수집
  const urlSet = new Set<string>();
  extractMediaUrls(testData, urlSet);
  const urls = Array.from(urlSet);

  if (urls.length === 0) {
    console.log('[mediaCache] No media URLs found to cache');
    return;
  }

  console.log(`[mediaCache] Preloading ${urls.length} media files...`);

  let cached = 0;
  const CONCURRENCY = 5; // 동시 다운로드 수 제한

  // 배치 단위로 처리
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (url) => {
        await cacheMediaUrl(url);
        cached++;
        onProgress?.(cached, urls.length);
      })
    );
  }

  console.log(`[mediaCache] ✅ Preloaded ${cached}/${urls.length} media files`);
}

// ─────────────────────────────────────────────────────────────────
//  캐시된 Audio 객체 생성 (new Audio() 대체)
//  Supabase Storage URL이면 캐시된 blob URL을 사용하고,
//  캐시가 없으면 원래 URL로 폴백합니다.
// ─────────────────────────────────────────────────────────────────

export async function createCachedAudio(url?: string): Promise<HTMLAudioElement> {
  const audio = new Audio();
  if (url) {
    const resolvedUrl = await getMediaUrl(url);
    audio.src = resolvedUrl;
  }
  // 오디오 종료 시 잔여 노이즈(측/틱/팝 소리) 방지 — volume=0으로 뮤트
  // (onended property와 별도로 동작하므로 컴포넌트에서 onended 덮어써도 OK)
  audio.addEventListener('ended', () => {
    try { audio.volume = 0; } catch {}
  });
  return audio;
}

/**
 * 동기식 캐시된 Audio 객체 생성 (useEffect 등 async 불가능한 컨텍스트용)
 *
 * 즉시 Audio 객체를 반환하고, src를 원래 URL로 설정합니다.
 * 캐시된 버전이 있으면 "재생이 아직 시작되지 않은 경우에만" 교체합니다.
 * (재생 도중 src를 바꾸면 onended가 조기 발동해 삐소리/흐름이 꼬이므로 금지)
 */
export function createCachedAudioSync(url?: string): HTMLAudioElement {
  const audio = new Audio();
  if (url) {
    // 즉시 원래 URL로 설정 (폴백)
    audio.src = url;

    // 백그라운드에서 캐시된 버전으로 교체 시도
    // (단, 아직 재생이 시작되지 않았을 때만 — 재생 중 교체는 흐름을 깨뜨림)
    if (SUPABASE_URL_PATTERN.test(url)) {
      getCachedBlobUrl(url).then(cachedUrl => {
        const notStartedYet = audio.paused && audio.currentTime === 0;
        if (cachedUrl && audio.src !== cachedUrl && notStartedYet) {
          audio.src = cachedUrl;
        }
      }).catch(() => {});
    }
  }
  // 오디오 종료 시 잔여 노이즈(측/틱/팝 소리) 방지 — volume=0으로 뮤트
  audio.addEventListener('ended', () => {
    try { audio.volume = 0; } catch {}
  });
  return audio;
}

// ─────────────────────────────────────────────────────────────────
//  캐시 상태 확인
// ─────────────────────────────────────────────────────────────────

export async function getCacheStats(): Promise<{ count: number; sizeBytes: number }> {
  try {
    const db = await openDB();
    const result = await new Promise<{ count: number; sizeBytes: number }>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const blobs = req.result as Blob[];
        const sizeBytes = blobs.reduce((sum, b) => sum + b.size, 0);
        resolve({ count: blobs.length, sizeBytes });
      };
      req.onerror = () => resolve({ count: 0, sizeBytes: 0 });
    });
    // db.close() 제거 - 연결 재사용을 위해 유지
    return result;
  } catch {
    return { count: 0, sizeBytes: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────
//  캐시 전체 삭제
// ─────────────────────────────────────────────────────────────────

export async function clearMediaCache(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    // db.close() 제거 - 연결 재사용을 위해 유지

    // blob URL 정리
    for (const blobUrl of blobUrlMap.values()) {
      URL.revokeObjectURL(blobUrl);
    }
    blobUrlMap.clear();

    console.log('[mediaCache] Cache cleared');
  } catch (err) {
    console.warn('[mediaCache] Error clearing cache:', err);
  }
}
