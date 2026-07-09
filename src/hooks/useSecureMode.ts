import { useEffect } from 'react';

/**
 * 외부 구매자용 보안 모드
 * - 우클릭 금지
 * - F12 / Ctrl+Shift+I 개발자 도구 차단
 * - Ctrl+C 복사 금지
 *
 * 활성화되면 키보드/마우스 이벤트를 가로채 차단합니다.
 * 컴포넌트 언마운트 시 자동 해제됩니다.
 */
export function useSecureMode(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') { e.preventDefault(); return; }
      // Ctrl+Shift+I (Chrome DevTools)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) { e.preventDefault(); return; }
      // Ctrl+C (복사)
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); return; }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockKeyDown);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockKeyDown);
    };
  }, [enabled]);
}
