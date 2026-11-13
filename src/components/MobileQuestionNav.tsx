import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeNavigation } from '../utils/useSwipeNavigation';

interface MobileQuestionNavProps {
  onBack?: () => void;
  onHome: () => void;
  onNext?: () => void;
  nextLabel?: string;
  hideBack?: boolean;
  hideNext?: boolean;
  /** 하단 바 전체를 렌더링할지. 기본 false — 손가락 좌우 스와이프로만 이동.
   *  Back/Home/Next 버튼을 노출하고 싶을 때만 true 로 바꾼다. */
  showFooter?: boolean;
  /** 스와이프 네비 비활성 */
  disableSwipe?: boolean;
}

/**
 * MobileQuestionNav — 기본 완전 숨김 + 가로 스와이프 네비
 * -----------------------------------------------------------------------------
 *  - 기본은 하단 Back/Home/Next 바 전체 숨김 (더 넓은 콘텐츠 영역 확보).
 *  - onBack / onNext 가 전달되면 모든 화면에서 자동 가로 스와이프 이동 가능.
 *  - 상단 타이틀(*toefl ibt) 클릭으로 홈 이동. Back/Next 는 상단 바에 이미 있음.
 *  - 레거시 호환: showFooter=true 를 넘기면 예전 하단 바가 다시 렌더링된다.
 */
export function MobileQuestionNav({
  onBack,
  onHome,
  onNext,
  nextLabel = 'Next',
  hideBack = false,
  hideNext = false,
  showFooter = false,
  disableSwipe = false,
}: MobileQuestionNavProps) {
  // 전역 가로 스와이프 — Back/Next 핸들러가 있으면 자동 작동
  useSwipeNavigation(
    hideBack ? undefined : onBack,
    hideNext ? undefined : onNext,
    { disabled: disableSwipe },
  );

  if (!showFooter) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-3 h-12 px-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={hideBack || !onBack}
          className={`flex items-center justify-start gap-2 transition-all ${
            hideBack || !onBack
              ? 'opacity-30 cursor-not-allowed'
              : 'text-gray-700 hover:text-[#005f61] active:scale-95'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Home Button */}
        <button
          onClick={onHome}
          className="flex flex-col items-center justify-center gap-0.5 text-gray-700 hover:text-[#005f61] active:scale-95 transition-all"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={hideNext || !onNext}
          className={`flex items-center justify-end gap-2 transition-all ${
            hideNext || !onNext
              ? 'opacity-30 cursor-not-allowed'
              : 'text-gray-700 hover:text-[#005f61] active:scale-95'
          }`}
        >
          <span className="text-sm font-medium">{nextLabel}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
