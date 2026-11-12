import React from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useSwipeNavigation } from '../utils/useSwipeNavigation';

interface MobileFooterProps {
  onBack?: () => void;
  onHome?: () => void;
  onNext?: () => void;
  onVolumeClick?: () => void;
  /** 하단 Back 버튼 표시 — 기본 false (사용자 요청: 스와이프로 넘김) */
  showBack?: boolean;
  /** 하단 Home 버튼 표시 — 기본 false (상단 타이틀 클릭으로 홈 이동) */
  showHome?: boolean;
  /** 하단 Next 버튼 표시 — 기본 false */
  showNext?: boolean;
  backLabel?: string;
  nextLabel?: string;
  /** 스와이프 네비 비활성 — 특정 화면에서만 끄고 싶을 때 */
  disableSwipe?: boolean;
}

/**
 * MobileFooter — 기본 완전 숨김 + 가로 스와이프 네비
 * -----------------------------------------------------------------------------
 * 2026-11 개편:
 *  - Back/Next/Home 버튼 모두 기본 숨김 (opt-in)
 *  - onBack / onNext 가 전달되면 **모든 화면에서 자동으로 가로 스와이프**
 *    이전/다음 이동 가능 (useSwipeNavigation 훅 내장).
 *  - 버튼은 안 보여도 훅은 돌아가므로 null 리턴해도 OK.
 *
 *  28개 화면에서 MobileFooter 가 쓰이고 있으므로, 여기에 스와이프를
 *  심는 것만으로 전 화면 자동 적용.
 */
export function MobileFooter({
  onBack,
  onHome,
  onNext,
  showBack = false,
  showHome = false,
  showNext = false,
  backLabel = 'Back',
  nextLabel = 'Next',
  disableSwipe = false,
}: MobileFooterProps) {
  // 전역 가로 스와이프 — Back/Next 함수가 있을 때 자동 작동
  useSwipeNavigation(onBack, onNext, { disabled: disableSwipe });

  // Back/Next/Home 모두 숨김이면 아예 렌더링 X (훅은 이미 돌아감)
  if (!showBack && !showNext && !(showHome && onHome)) return null;

  const colCount = (showBack ? 1 : 0) + (showHome && onHome ? 1 : 0) + (showNext ? 1 : 0);
  const gridClass =
    colCount === 1 ? 'grid grid-cols-1 justify-items-center'
    : colCount === 2 ? 'grid grid-cols-2'
    : 'grid grid-cols-3';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className={`${gridClass} h-12 px-4`}>
        {showBack && (
          <button
            onClick={onBack}
            disabled={!onBack}
            className={`flex items-center justify-start gap-2 transition-all ${
              onBack ? 'text-[#2d7a7c] hover:bg-[#2d7a7c]/10' : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{backLabel}</span>
          </button>
        )}

        {showHome && onHome && (
          <button
            onClick={onHome}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-[#2d7a7c] active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] font-semibold tracking-wide">Home</span>
          </button>
        )}

        {showNext && (
          <button
            onClick={onNext}
            disabled={!onNext}
            className={`flex items-center justify-end gap-2 transition-all ${
              onNext ? 'text-[#e67e22] hover:bg-[#e67e22]/10' : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <span className="text-sm font-medium">{nextLabel}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
