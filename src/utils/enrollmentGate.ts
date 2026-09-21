/**
 * enrollmentGate.ts — 시험/게임 진입 시 "등록된 학원생" 검증 훅
 * -----------------------------------------------------------------------------
 * 로그인 + 활성화된 수강권 + 만료 이내 + 등록된 기기(1대)까지 licenseUtils 의
 * checkUserAccess() 로 한 번에 판정. 미통과 학생에게는 공통 안내 카드를 보여줌.
 *
 * 사용:
 *   const { checking, allowed, reason, retry } = useEnrollmentGate();
 *   if (checking) return <SpinnerCard />;
 *   if (!allowed) return <EnrollmentBlockedCard reason={reason} onRetry={retry} onExit={onExit} />;
 *   // 정상 렌더 …
 */
import { useCallback, useEffect, useState } from 'react';
import { checkUserAccess } from './licenseUtils';

export interface EnrollmentGate {
  checking: boolean;
  allowed: boolean;
  reason?: string;
  retry: () => void;
}

export function useEnrollmentGate(): EnrollmentGate {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    (async () => {
      try {
        const res = await checkUserAccess(true); // checkPaidOnly=true → 무료 콘텐츠도 등록 학원생만
        if (cancelled) return;
        setAllowed(!!res.allowed);
        setReason(res.reason);
      } catch (err: any) {
        if (cancelled) return;
        setAllowed(false);
        setReason(err?.message || '학원생 등록 확인 중 오류');
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tick]);

  const retry = useCallback(() => setTick(t => t + 1), []);
  return { checking, allowed, reason, retry };
}
