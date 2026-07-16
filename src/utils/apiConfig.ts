import { projectId, publicAnonKey } from './supabase/info';

/**
 * Centralized server API configuration.
 *
 * Override with Vite environment variables when needed:
 *   VITE_SERVER_ORIGIN      – scheme + host up to (but not including) the function path.
 *                             Defaults to the project's Supabase Functions endpoint.
 *   VITE_SERVER_BASE_PATH   – path prefix that the edge-function router expects.
 *                             Defaults to '/make-server-e46cd33a'.
 */
const SERVER_ORIGIN: string =
  (import.meta.env.VITE_SERVER_ORIGIN as string | undefined) ??
  `https://${projectId}.supabase.co/functions/v1`;

export const SERVER_BASE_PATH: string =
  (import.meta.env.VITE_SERVER_BASE_PATH as string | undefined) ??
  '/make-server-e46cd33a';

/**
 * Full base URL for the edge function, e.g.
 *   https://xmdfbjfmiavuxlpzawan.supabase.co/functions/v1/make-server-e46cd33a
 */
export const SERVER_BASE_URL = `${SERVER_ORIGIN}${SERVER_BASE_PATH}`;

/** Authorization headers required by the Supabase edge function. */
export const getServerHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${publicAnonKey}`,
});

/** Convenience helper used by fetch utilities in App.tsx. */
export const getServerRequestContext = () => ({
  headers: getServerHeaders(),
  baseUrl: SERVER_BASE_URL,
});

/**
 * 타임아웃 + 재시도 적용된 Edge Function 호출용 fetch 헬퍼.
 *
 * Edge Function 호출 시 일시적 네트워크 에러(TypeError: Failed to fetch,
 * ERR_TIMED_OUT, ERR_NETWORK_CHANGED, CF-Ray 노드 문제 등)가 발생하면
 * 자동으로 재시도한다. CORS 자체는 서버에서 정상 반환하지만, 요청이
 * 타임아웃되면 브라우저가 "No Access-Control-Allow-Origin header" 에러로
 * 표시하기 때문에 재시도가 필요하다.
 *
 * @param timeoutMs  기본 30초 (Edge Function 콜드스타트 여유)
 * @param maxRetries 기본 2회 재시도 (총 3회 시도)
 */
export async function serverFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs = 30000,
  maxRetries = 2,
): Promise<Response> {
  // Authorization 헤더 자동 주입 (누락된 경우)
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }
  // JSON 바디가 있으면 Content-Type 자동 설정
  if (init.body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, {
        ...init,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      // 재시도 가능한 에러: 타임아웃(AbortError), 네트워크 끊김, CORS 타임아웃
      const isRetryable = err?.name === 'AbortError'
        || /Failed to fetch|ERR_TIMED_OUT|ERR_NETWORK_CHANGED|NetworkError|load failed/i.test(err?.message || '');
      if (!isRetryable || attempt === maxRetries) break;
      // 점진적 backoff (500ms, 1000ms)
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  // 모든 재시도 실패 시 더 친절한 에러 메시지로 변환
  const msg = lastError?.message || '';
  if (/Failed to fetch|NetworkError|load failed/i.test(msg) || lastError?.name === 'AbortError') {
    throw new Error(
      '서버에 연결할 수 없어요. 네트워크 상태를 확인하고 잠시 후 다시 시도해주세요. (일시적 네트워크 오류)'
    );
  }
  throw lastError || new Error('서버 요청 실패');
}
