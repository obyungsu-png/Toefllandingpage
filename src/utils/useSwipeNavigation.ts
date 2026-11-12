/**
 * useSwipeNavigation — 가로 스와이프로 이전/다음 문제 이동
 * ---------------------------------------------------------------
 * 화면 터치 왼쪽 스와이프 → onNext
 * 화면 터치 오른쪽 스와이프 → onBack
 *
 * - 세로 스크롤과 충돌 방지 (가로/세로 이동량 비교)
 * - 작은 움직임 무시 (threshold)
 * - 특정 요소에서는 스와이프 무시 (ignoreSelector) — 꼭 필요한 경우에만.
 *   영역이 너무 크면 스와이프가 전혀 안 걸리므로 보수적으로 사용.
 */
import { useEffect, useRef } from 'react';

interface SwipeOptions {
  /** 최소 스와이프 거리 (px). 기본 50px */
  threshold?: number;
  /** 가로/세로 각도 허용치 — (|dx| / (|dy|+1)) >= ratio 여야 수평 스와이프로 간주. 기본 1.0 */
  horizontalRatio?: number;
  /** 스와이프 무시할 요소 셀렉터 (예: 가로 스크롤 있는 캐러셀) */
  ignoreSelector?: string;
  /** 비활성화 */
  disabled?: boolean;
}

export function useSwipeNavigation(
  onBack?: () => void,
  onNext?: () => void,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    horizontalRatio = 1.0,
    ignoreSelector,
    disabled = false,
  } = options;

  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { startRef.current = null; return; }
      // 무시할 영역에서 시작하면 스와이프 비활성
      if (ignoreSelector && e.target instanceof Element) {
        if (e.target.closest(ignoreSelector)) { startRef.current = null; return; }
      }
      const t = e.touches[0];
      startRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!startRef.current) return;
      const changed = e.changedTouches[0];
      if (!changed) { startRef.current = null; return; }
      const dx = changed.clientX - startRef.current.x;
      const dy = changed.clientY - startRef.current.y;
      const dt = Date.now() - startRef.current.time;
      startRef.current = null;

      // 매우 느린 스와이프(1.5초+) 무시
      if (dt > 1500) return;

      // 수평 지배적인 움직임만
      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dx) / (Math.abs(dy) + 1) < horizontalRatio) return;

      if (dx < 0 && onNext) onNext();
      else if (dx > 0 && onBack) onBack();
    };

    const onTouchCancel = () => { startRef.current = null; };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [onBack, onNext, threshold, horizontalRatio, ignoreSelector, disabled]);
}
