// 모바일 Chrome에서 URL바(주소창)와 하단 툴바를 숨기는 유틸.
//
// 원리: Chrome Android는 페이지를 아래로 스크롤하면 상단 주소창과
// 하단 툴바를 자동으로 접어서 숨겨 준다. 테스트 화면은 fixed 레이아웃이라
// 문서 자체가 스크롤되지 않으므로, 문서를 살짝 스크롤 가능하게 만든 뒤
// 아래로 스크롤시켜 UI를 접는다. (상태바는 유지됨)
//
// 주의: URL바/툴바가 접히면 뷰포트가 ~100px 이상 늘어난다. 여백이 그
// 증가분보다 작으면 스크롤 위치가 0으로 clamp 되어 Chrome이 UI를 다시
// 펼쳐버린다. 그래서 여백을 충분히 크게 잡고, 뷰포트 변화 시에도 스크롤
// 위치를 다시 잡아 준다(keep-hidden).
//
// 안정성 강화 (사용자 보고: "맨처음에는 되었는데, 지금은 안돼네"):
//   - visualViewport 이벤트도 함께 감시 → URL바가 다시 펼쳐지면(뷰포트 축소)
//     즉시 아래로 스크롤.
//   - 사용자 터치 종료 시 스크롤 위치 재확인 (fixed 오버레이 위에서 발생한
//     터치는 body 스크롤을 건드리지 않지만, Chrome 이 touchend 를 신호로
//     URL바 토글을 할 때가 있어 그 직후 재보정).
//   - 짧은 간격 간헐 체크(최대 10초) — 섹션 전환 직후 React 가 레이아웃을
//     다시 그릴 때 scrollY 가 0 으로 reset 되는 경우 대응.

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

const SPACER_ID = 'browser-chrome-spacer';
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
  // 뷰포트보다 충분히 길게 만든다 → UI가 접혀 뷰포트가 늘어난 뒤에도
  // 스크롤 위치가 0으로 밀리지 않아 숨김 상태가 유지된다.
  const deficit = window.innerHeight + SPACER_EXTRA - doc.documentElement.scrollHeight;
  if (deficit > 0) spacer.style.height = deficit + 'px';
}

/** 아래로 스크롤해 URL바/툴바를 접는다. 숨김 유지에 필요한 최소량만. */
function scrollToHide(): void {
  if (typeof document === 'undefined') return;
  const target = Math.max(MIN_HIDDEN_SCROLL, document.documentElement.scrollHeight - window.innerHeight);
  try { window.scrollTo(0, target); } catch { /* noop */ }
}

let keepHiddenHandler: (() => void) | null = null;
let touchKeepHandler: (() => void) | null = null;
let vvKeepHandler: (() => void) | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let intervalEndsAt = 0;

function attachKeepHidden(): void {
  if (typeof window === 'undefined') return;
  if (keepHiddenHandler) return; // 이미 설치됨

  keepHiddenHandler = () => {
    if (!isMobileViewport()) return;
    ensureScrollableSpacer();
    if (window.scrollY < MIN_HIDDEN_SCROLL) scrollToHide();
  };
  window.addEventListener('resize', keepHiddenHandler);
  window.addEventListener('orientationchange', keepHiddenHandler);

  // visualViewport 는 URL바 토글 시 즉시 발생 → 가장 빠른 신호.
  if ('visualViewport' in window && window.visualViewport) {
    vvKeepHandler = () => {
      if (!isMobileViewport()) return;
      ensureScrollableSpacer();
      if (window.scrollY < MIN_HIDDEN_SCROLL) scrollToHide();
    };
    window.visualViewport.addEventListener('resize', vvKeepHandler);
    window.visualViewport.addEventListener('scroll', vvKeepHandler);
  }

  // 터치 끝날 때마다 확인 — fixed 오버레이 위 터치여도 Chrome 이 자체적으로
  // URL바를 토글할 때가 있어 한 번 더 보정.
  touchKeepHandler = () => {
    if (!isMobileViewport()) return;
    // 터치 직후 Chrome 애니메이션이 끝나기를 기다림
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
 * 테스트 진입 시 호출 — URL바/하단 툴바를 자동으로 접어 숨김.
 * 섹션 전환이나 화면 전환 시 다시 호출해도 안전 (idempotent) — 짧은
 * 간헐 체크(약 10초)로 숨김 상태를 재확인한다.
 */
export function hideMobileBrowserChrome(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // React 렌더 + 레이아웃 반영 이후 실행
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!isMobileViewport()) return;
      ensureScrollableSpacer();
      scrollToHide();
      attachKeepHidden();

      // 호출 후 ~10초간은 짧은 간격으로 스크롤 유지 체크 — React 가 섹션/
      // 화면을 다시 렌더하며 scrollY 를 reset 하는 경우를 캐치.
      intervalEndsAt = Date.now() + 10_000;
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (Date.now() > intervalEndsAt) {
            if (intervalId) { clearInterval(intervalId); intervalId = null; }
            return;
          }
          if (!isMobileViewport()) return;
          if (window.scrollY < MIN_HIDDEN_SCROLL) {
            ensureScrollableSpacer();
            scrollToHide();
          }
        }, 400);
      }
    });
  });
}

/** 홈/탭 이동 등 테스트 화면을 벗어날 때 호출 — 숨김 해제 후 최상단 복원 */
export function restoreBrowserChrome(): void {
  if (typeof document === 'undefined') return;
  detachKeepHidden();
  const spacer = document.getElementById(SPACER_ID);
  if (spacer) spacer.remove();
  try { window.scrollTo(0, 0); } catch { /* noop */ }
}
