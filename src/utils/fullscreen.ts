// 모바일 Chrome에서 URL바(주소창)와 하단 툴바를 숨기는 유틸.
//
// 원리: Chrome Android는 페이지를 아래로 스크롤하면 상단 주소창과
// 하단 툴바를 자동으로 접어서 숨겨 준다. 테스트 화면은 fixed 레이아웃이라
// 문서 자체가 스크롤되지 않으므로, 문서를 살짝 스크롤 가능하게 만든 뒤
// 아래로 스크롤시켜 UI를 접는다. (상태바는 유지됨)

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

const SPACER_ID = 'browser-chrome-spacer';

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
  // 문서 높이가 뷰포트보다 짧으면 스크롤이 생기지 않으므로
  // 뷰포트보다 살짝 길게 만들어 준다 (여유 60px).
  const deficit = window.innerHeight - doc.documentElement.scrollHeight + 60;
  if (deficit > 0) spacer.style.height = deficit + 'px';
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
    });
  });
}

/** 홈/탭 이동 등 테스트 화면을 벗어날 때 호출 — 숨김용 스페이서 제거 후 최상단 복원 */
export function restoreBrowserChrome(): void {
  if (typeof document === 'undefined') return;
  const spacer = document.getElementById(SPACER_ID);
  if (spacer) spacer.remove();
  window.scrollTo(0, 0);
}
