import { Home, ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileQuestionNavProps {
  onBack?: () => void;
  onHome: () => void;
  onNext?: () => void;
  nextLabel?: string;
  hideBack?: boolean;
  hideNext?: boolean;
}

export function MobileQuestionNav({
  onBack,
  onHome,
  onNext,
  nextLabel = 'Next',
  hideBack = false,
  hideNext = false,
}: MobileQuestionNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="grid grid-cols-3 h-16 px-4">
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
