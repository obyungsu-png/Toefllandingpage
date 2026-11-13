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

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

const SPACER_ID = 'browser-chrome-spacer';
// URL바+하단 툴바 접힘으로 늘어나는 뷰포트보다 충분히 큰 여유
const SPACER_EXTRA = 260;

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

let keepHiddenHandler: (() => void) | null = null;

function attachKeepHidden(): void {
  if (keepHiddenHandler || typeof window === 'undefined') return;
  keepHiddenHandler = () => {
    if (!isMobileViewport()) return;
    ensureScrollableSpacer();
    // 뷰포트 변화로 스크롤이 맨 위로 밀렸으면 다시 아래로 스크롤해 숨김 유지
    if (window.scrollY < 20) {
      window.scrollTo(0, document.documentElement.scrollHeight);
    }
  };
  window.addEventListener('resize', keepHiddenHandler);
  window.addEventListener('orientationchange', keepHiddenHandler);
}

function detachKeepHidden(): void {
  if (!keepHiddenHandler) return;
  window.removeEventListener('resize', keepHiddenHandler);
  window.removeEventListener('orientationchange', keepHiddenHandler);
  keepHiddenHandler = null;
}

/** 테스트 진입 시 호출 — URL바/하단 툴바를 자동으로 접어 숨김 */
export function hideMobileBrowserChrome(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  // React 렌더 + 레이아웃 반영 이후 실행
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!isMobileViewport()) return;
      ensureScrollableSpacer();
      window.scrollTo(0, document.documentElement.scrollHeight);
      attachKeepHidden();
    });
  });
}

/** 홈/탭 이동 등 테스트 화면을 벗어날 때 호출 — 숨김 해제 후 최상단 복원 */
export function restoreBrowserChrome(): void {
  if (typeof document === 'undefined') return;
  detachKeepHidden();
  const spacer = document.getElementById(SPACER_ID);
  if (spacer) spacer.remove();
  window.scrollTo(0, 0);
}
