import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileSectionHeaderProps {
  sectionLabel: string;
  questionLabel?: string;
  showVolume?: boolean;
  onVolumeClick?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  showNext?: boolean;
  onNext?: () => void;
  nextLabel?: string;
}

export function MobileSectionHeader({
  sectionLabel,
  questionLabel,
  showVolume,
  onVolumeClick,
  showBack,
  onBack,
  showNext,
  onNext,
  nextLabel = 'Next',
}: MobileSectionHeaderProps) {
  return (
    <div className="md:hidden">
      {/* Top teal bar */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onBack}
          >
            *toefl ibt
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showVolume && onVolumeClick && (
            <button
              onClick={onVolumeClick}
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          )}
          {showBack && onBack && (
            <button onClick={onBack}
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
          )}
          {showNext && onNext && (
            <button onClick={onNext}
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">{nextLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {/* Section tab bar */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              {sectionLabel}
            </div>
            {questionLabel && (
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                {questionLabel}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
