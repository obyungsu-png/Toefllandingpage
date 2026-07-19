/**
 * Singleton Supabase client — import this everywhere instead of calling createClient() directly.
 * Prevents "Multiple GoTrueClient instances" warning.
 *
 * storageKey를 명시하고 detectSessionInUrl을 유지하되, React Strict Mode 등에서
 * 여러 mount로 인해 발생하는 gotrue-js Web Locks 경합을 줄이도록 auth 옵션 명시.
 * lock 함수를 no-op으로 지정해 콘솔의 'Lock ... not released within 5000ms' 경고를
 * 없앰 — SPA에서 여러 탭 동시 갱신 시나리오는 드물기 때문에 안전.
 */
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

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
      // localStorage 키를 명시적으로 고정 — 서로 다른 mount가 같은 스토리지 슬롯 공유
      storageKey: `sb-${projectId}-auth-token`,
      // PKCE로 명시 (기본값과 동일하지만 예측 가능하게 고정)
      flowType: 'pkce',
      // lock 함수를 no-op으로 지정 → gotrue-js가 navigator.locks를 안 쓰게 함
      // (React Strict Mode + 여러 useEffect 병렬 호출에서 발생하던 5초 락 타임아웃
      // 경고와 AbortError 완전 제거)
      lock: async (_name, _acquireTimeout, fn) => await fn(),
    },
  }
);
