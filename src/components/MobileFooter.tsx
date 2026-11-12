import React from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface MobileFooterProps {
  onBack?: () => void;
  onHome?: () => void;
  onNext?: () => void;
  onVolumeClick?: () => void;
  /** 하단 Back 버튼 표시 — 기본 false (사용자 요청: 손가락 스와이프로 넘김) */
  showBack?: boolean;
  showHome?: boolean;
  /** 하단 Next 버튼 표시 — 기본 false */
  showNext?: boolean;
  backLabel?: string;
  nextLabel?: string;
}

/**
 * MobileFooter — 하단 홈 버튼만 노출 (슬림)
 * -----------------------------------------------------------------------------
 * 2026-11 개편: 사용자 피드백에 따라 Back/Next 버튼 기본 숨김.
 * 이전/다음 이동은 화면 가로 스와이프(useSwipeNavigation) 또는 상단 네비로.
 * 과거 코드 호환을 위해 showBack/showNext 프롭은 유지되지만 기본값 false.
 */
export function MobileFooter({
  onBack,
  onHome,
  onNext,
  showBack = false,
  showHome = true,
  showNext = false,
  backLabel = 'Back',
  nextLabel = 'Next',
}: MobileFooterProps) {
  // Back/Next 둘 다 숨김이고 Home 도 없으면 아예 렌더링하지 않음
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
        {/* Back — 기본 숨김, legacy 호환 */}
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

        {/* Home — 유지 */}
        {showHome && onHome && (
          <button
            onClick={onHome}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-[#2d7a7c] active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] font-semibold tracking-wide">Home</span>
          </button>
        )}

        {/* Next — 기본 숨김, legacy 호환 */}
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
