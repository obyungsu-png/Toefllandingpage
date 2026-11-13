// 모바일에서 문제 풀기 진입 시 주소창(URL)을 숨긴 전체 화면으로 전환하는 헬퍼.
// - Android Chrome: Fullscreen API 로 브라우저 UI/주소창 숨김
// - iOS Safari: 웹 Fullscreen API 미지원 → 무해한 no-op (홈 화면 PWA 설치로만 숨김)

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function requestFullscreen(): void {
  if (typeof document === 'undefined') return;

  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  if (document.fullscreenElement || doc.webkitFullscreenElement) return; // 이미 전체 화면

  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => void;
  };

  try {
    if (el.requestFullscreen) {
      const p = el.requestFullscreen();
      if (p && typeof p.catch === 'function') p.catch(() => { /* 사용자 제스처 부재 등 실패 시 무시 */ });
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } catch {
    /* ignore */
  }
}
