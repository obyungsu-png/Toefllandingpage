import React from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

interface MobileFooterProps {
  onBack?: () => void;
  onHome?: () => void;
  onNext?: () => void;
  showBack?: boolean;
  showHome?: boolean;
  showNext?: boolean;
  backLabel?: string;
  nextLabel?: string;
}

export function MobileFooter({
  onBack,
  onHome,
  onNext,
  showBack = true,
  showHome = true,
  showNext = true,
  backLabel = 'Back',
  nextLabel = 'Next'
}: MobileFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="grid grid-cols-3 h-16 px-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={!showBack || !onBack}
          className={`flex items-center justify-start gap-2 transition-all ${
            showBack && onBack
              ? 'text-[#2d7a7c] hover:bg-[#2d7a7c]/10'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{backLabel}</span>
        </button>

        {/* Home Button */}
        {showHome && onHome && (
          <button
            onClick={onHome}
            className="flex flex-col items-center justify-center gap-0.5 text-gray-700 hover:text-[#2d7a7c] active:scale-95 transition-all"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
        )}

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!showNext || !onNext}
          className={`flex items-center justify-end gap-2 transition-all ${
            showNext && onNext
              ? 'text-[#e67e22] hover:bg-[#e67e22]/10'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="text-sm font-medium">{nextLabel}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}