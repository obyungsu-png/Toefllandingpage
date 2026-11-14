// 모바일 전체 화면 모드 — TPO 등 문제 풀이 섹션에서 URL바·하단 툴바를 숨긴다.
//
// 전략 (3중):
//   1) 즉시 스크롤 트릭 — body 를 길게 만들고 아래로 스크롤해 Chrome 이
//      URL바와 하단 툴바를 자동으로 접게 한다. 상태바는 유지됨.
//   2) Fullscreen API — 스크롤 트릭이 안 먹히는 경우(최신 Chrome, Samsung
//      Internet 등 일부 브라우저)를 위해, 사용자 제스처(터치/클릭) 안에서
//      document.documentElement.requestFullscreen() 호출. 완전 immersive 로
//      URL·하단 툴바 모두 제거.
//   3) safe-area 패딩 — Fullscreen 모드일 때는 상태바/카메라 노치 영역이
//      브라우저에 의해 가려지지 않으므로, #root 에 env(safe-area-inset-top)
//      만큼 padding 을 주어 콘텐츠가 카메라 아래에서 시작되도록 한다.

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

const SPACER_ID = 'browser-chrome-spacer';
const SAFE_AREA_STYLE_ID = 'tpo-fullscreen-safe-area-style';
// URL바+하단 툴바 접힘으로 늘어나는 뷰포트보다 충분히 큰 여유
const SPACER_EXTRA = 260;
// Chrome UI 가 다시 펼쳐지는 것을 복구하기 위한 최소 스크롤 위치
const MIN_HIDDEN_SCROLL = 60;

function ensureScrollableSpacer(): void {
  const doc = document;
  let spacer = doc.getElementById(SPACER_ID);
  if (!spacer) {
    spacer = doc.createElement('div');
    spacer.id = SPACER_ID;
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.cssText = 'height:1px;width:100%;pointer-events:none;';
    doc.body.appendChild(spacer);
  }
  const deficit = window.innerHeight + SPACER_EXTRA - doc.documentElement.scrollHeight;
  if (deficit > 0) spacer.style.height = deficit + 'px';
}

function scrollToHide(): void {
  if (typeof document === 'undefined') return;
  const target = Math.max(MIN_HIDDEN_SCROLL, document.documentElement.scrollHeight - window.innerHeight);
  try { window.scrollTo(0, target); } catch { /* noop */ }
}

// ────── Fullscreen API helpers ──────
function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

function canRequestFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as any;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen);
}

function requestFullscreenNow(): void {
  if (typeof document === 'undefined') return;
  if (isFullscreen()) return;
  const el = document.documentElement as any;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el);
    if (p && typeof p.then === 'function') p.catch(() => { /* ignored — user may have denied */ });
  } catch { /* noop */ }
}

/** Fullscreen 모드에서 카메라/상태바 영역을 피하도록 #root 에 상단 padding 주입. */
function installSafeAreaStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SAFE_AREA_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SAFE_AREA_STYLE_ID;
  // :fullscreen 셀렉터로 fullscreen 활성 시에만 safe-area 패딩 적용.
  // 카메라/상태바 노치 영역만큼 콘텐츠를 아래로 밀어, "카메라 바로 아래"
  // 부터 UI 가 시작되도록 한다. (viewport-fit=cover + Chrome fullscreen 조합)
  style.textContent = `
    html:fullscreen, html:-webkit-full-screen {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      box-sizing: border-box;
      background: #ffffff;
    }
    html:fullscreen body, html:-webkit-full-screen body {
      min-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
    }
  `;
  document.head.appendChild(style);
}

function removeSafeAreaStyle(): void {
  const el = document.getElementById(SAFE_AREA_STYLE_ID);
  if (el) el.remove();
}

// ────── 트리거: 사용자 제스처에서 한 번만 requestFullscreen 시도 ──────
let gestureListenersInstalled = false;
let gestureHandler: ((e: Event) => void) | null = null;

function installFullscreenGestureTrigger(): void {
  if (gestureListenersInstalled) return;
  if (typeof document === 'undefined') return;
  if (!canRequestFullscreen()) return;
  if (isFullscreen()) return;

  gestureHandler = () => {
    if (!isFullscreen()) requestFullscreenNow();
    cleanupGestureTrigger();
    // Fullscreen 상태라도 스크롤 트릭을 한 번 더 — URL바가 혹시 남아 있으면 접기.
    scrollToHide();
  };
  gestureListenersInstalled = true;
  // 사용자 제스처 안에서 실행되어야 함 → capture 단계로 가장 먼저 잡는다.
  document.addEventListener('touchend', gestureHandler, { capture: true, passive: true });
  document.addEventListener('click', gestureHandler, { capture: true });
}

function cleanupGestureTrigger(): void {
  if (!gestureListenersInstalled || !gestureHandler) return;
  document.removeEventListener('touchend', gestureHandler, true);
  document.removeEventListener('click', gestureHandler, true);
  gestureHandler = null;
  gestureListenersInstalled = false;
}

// ────── keep-hidden 핸들러 ──────
let keepHiddenHandler: (() => void) | null = null;
let touchKeepHandler: (() => void) | null = null;
let vvKeepHandler: (() => void) | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let intervalEndsAt = 0;

function attachKeepHidden(): void {
  if (typeof window === 'undefined') return;
  if (keepHiddenHandler) return;

  keepHiddenHandler = () => {
    if (!isMobileViewport()) return;
    ensureScrollableSpacer();
    if (window.scrollY < MIN_HIDDEN_SCROLL) scrollToHide();
  };
  window.addEventListener('resize', keepHiddenHandler);
  window.addEventListener('orientationchange', keepHiddenHandler);

  if ('visualViewport' in window && window.visualViewport) {
    vvKeepHandler = () => {
      if (!isMobileViewport()) return;
      ensureScrollableSpacer();
      if (window.scrollY < MIN_HIDDEN_SCROLL) scrollToHide();
    };
    window.visualViewport.addEventListener('resize', vvKeepHandler);
    window.visualViewport.addEventListener('scroll', vvKeepHandler);
  }

  touchKeepHandler = () => {
    if (!isMobileViewport()) return;
    setTimeout(() => {
      if (window.scrollY < MIN_HIDDEN_SCROLL) scrollToHide();
    }, 120);
  };
  document.addEventListener('touchend', touchKeepHandler, { passive: true, capture: true });
}

function detachKeepHidden(): void {
  if (keepHiddenHandler) {
    window.removeEventListener('resize', keepHiddenHandler);
    window.removeEventListener('orientationchange', keepHiddenHandler);
    keepHiddenHandler = null;
  }
  if (vvKeepHandler && 'visualViewport' in window && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', vvKeepHandler);
    window.visualViewport.removeEventListener('scroll', vvKeepHandler);
    vvKeepHandler = null;
  }
  if (touchKeepHandler) {
    document.removeEventListener('touchend', touchKeepHandler, true);
    touchKeepHandler = null;
  }
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    intervalEndsAt = 0;
  }
}

/**
 * 테스트 진입 시 호출. 2단계로 작동:
 *   (a) 즉시 스크롤 트릭으로 URL바/하단 툴바 접기 (상태바 유지).
 *   (b) 사용자의 다음 터치/클릭에서 Fullscreen API 로 완전 immersive 전환
 *       (스크롤 트릭이 안 먹히는 브라우저의 fallback).
 */
export function hideMobileBrowserChrome(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!isMobileViewport()) return;

  installSafeAreaStyle();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!isMobileViewport()) return;
      // (a) 스크롤 트릭 — 상태바는 유지한 채 URL바/툴바만 접기 시도
      ensureScrollableSpacer();
      scrollToHide();
      attachKeepHidden();

      // (b) 다음 사용자 제스처에서 Fullscreen API 폴백
      installFullscreenGestureTrigger();

      // 호출 후 ~10초간은 짧은 간격으로 스크롤 유지 체크
      intervalEndsAt = Date.now() + 10_000;
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (Date.now() > intervalEndsAt) {
            if (intervalId) { clearInterval(intervalId); intervalId = null; }
            return;
          }
          if (!isMobileViewport()) return;
          if (!isFullscreen() && window.scrollY < MIN_HIDDEN_SCROLL) {
            ensureScrollableSpacer();
            scrollToHide();
          }
        }, 400);
      }
    });
  });
}

/** 홈/탭 이동 등 테스트 화면을 벗어날 때 호출 — 숨김 해제 후 복원. */
export function restoreBrowserChrome(): void {
  if (typeof document === 'undefined') return;
  detachKeepHidden();
  cleanupGestureTrigger();
  const spacer = document.getElementById(SPACER_ID);
  if (spacer) spacer.remove();
  removeSafeAreaStyle();
  // Fullscreen 상태였으면 명시적으로 종료.
  if (isFullscreen()) {
    const exit =
      document.exitFullscreen ||
      (document as any).webkitExitFullscreen ||
      (document as any).mozCancelFullScreen ||
      (document as any).msExitFullscreen;
    if (exit) {
      try {
        const p = exit.call(document);
        if (p && typeof p.then === 'function') p.catch(() => {});
      } catch { /* noop */ }
    }
  }
  try { window.scrollTo(0, 0); } catch { /* noop */ }
}
