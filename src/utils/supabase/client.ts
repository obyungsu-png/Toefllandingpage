/**
 * Singleton Supabase client — import this everywhere instead of calling createClient() directly.
 * Prevents "Multiple GoTrueClient instances" warning.
 *
 * 네트워크 타임아웃/에러 대응:
 * - 커스텀 fetch로 타임아웃(30초) + 재시도(최대 2회) 적용
 * - 토큰 리프레시 실패 시 세션 유지 (자동 로그아웃 방지)
 */
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

/** 타임아웃 + 재시도 적용된 커스텀 fetch */
function createRetryFetch(timeoutMs = 30000, maxRetries = 2) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        clearTimeout(timer);
        return response;
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        // ERR_NETWORK_CHANGED, ERR_TIMED_OUT, AbortError 등은 재시도
        const isRetryable = err?.name === 'AbortError'
          || err?.name === 'AuthRetryableFetchError'
          || /Failed to fetch|ERR_TIMED_OUT|ERR_NETWORK_CHANGED/i.test(err?.message || '');
        if (!isRetryable || attempt === maxRetries) break;
        // 점진적 backoff (500ms, 1000ms)
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastError || new Error('Network request failed');
  };
}

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      // 브라우저 로컬 세션 자동 유지
      persistSession: true,
      // 백그라운드에서 토큰 자동 갱신
      autoRefreshToken: true,
      // OAuth 등 URL 콜백에서 세션 감지
      detectSessionInUrl: true,
      // localStorage 키를 명시적으로 고정
      storageKey: `sb-${projectId}-auth-token`,
      // PKCE로 명시
      flowType: 'pkce',
      // lock 함수를 no-op으로 지정 → gotrue-js가 navigator.locks를 안 쓰게 함
      lock: async (_name, _acquireTimeout, fn) => await fn(),
    },
    // 커스텀 fetch로 네트워크 타임아웃/재시도 적용
    global: {
      fetch: createRetryFetch(),
    },
  }
);
