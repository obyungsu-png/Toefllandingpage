import { useEffect } from 'react';
import { VolumeControl } from './VolumeControl';
import { MobileSectionHeader } from './MobileSectionHeader';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { speakWithBritishFemaleVoice } from '../utils/tts';

interface SpeakingListenRepeatIntroProps {
  onNext: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  onLogoClick?: () => void;
  isReviewMode?: boolean;
  introText?: string;      // CMS 편집 가능한 인트로 안내 문구 (없으면 기본 문구)
  introImageUrl?: string;  // 인트로 화면 이미지 (없으면 표시 안 함)
}

const DEFAULT_INTRO_TEXT = 'Listen to the speaker and repeat what she says. Repeat only once.';

export function SpeakingListenRepeatIntro({ onNext, onVolumeClick, isVolumeOpen, volumeButtonRef, onLogoClick, isReviewMode = false, introText, introImageUrl }: SpeakingListenRepeatIntroProps) {
  const textToRead = introText || DEFAULT_INTRO_TEXT;

  useEffect(() => {
    // 인트로 내용을 기존 기계음성(TTS)으로 읽어주고, 끝나면 다음 화면(문제 1번)으로 자동 이동
    return speakWithBritishFemaleVoice({
      text: textToRead,
      onend: () => {
        if (!isReviewMode) setTimeout(() => onNext(), 500);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNext]);

  return (
    <div className="fixed inset-0 bg-[#F5F5F5] z-50 flex flex-col">
      <MobileSectionHeader
        sectionLabel="Speaking"
        onBack={onLogoClick}
        onNext={onNext}
        showNext
        showVolume={!!onVolumeClick}
        onVolumeClick={onVolumeClick}
      />
      <div className="hidden md:block">
      {/* Header */}
      <div className="bg-[#1e6b73] h-14 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div
            className="text-white text-base md:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onLogoClick}
          >
            *toefl ibt
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Volume Button */}
          <button
            onClick={onVolumeClick}
            className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
              isVolumeOpen
                ? 'bg-white border border-[#0A6068] hover:bg-gray-50'
                : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
            }`}
            ref={volumeButtonRef}
          >
            <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
              isVolumeOpen ? 'text-[#0A6068]' : 'text-white'
            }`}>Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="flex items-center gap-1 md:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-gray-100 transition-colors"
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs md:text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Speaking
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#F5F5F5] p-4 md:p-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-['Inter',_sans-serif] text-gray-800 mb-4 md:mb-8 pb-4 border-b-2 border-gray-300">Listen and Repeat</h1>

          {/* CMS에서 수정 가능한 인트로 안내 문구 — 이미지 위에 표시 */}
          <p className="text-sm md:text-lg text-gray-800 font-['Inter',_sans-serif] leading-relaxed mb-6 md:mb-8">
            {textToRead}
          </p>

          {introImageUrl && (
            <div className="flex justify-center mb-8">
              <div className="w-80 h-80 md:w-[460px] md:h-[460px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50">
                <ImageWithFallback src={introImageUrl} alt="Listen and Repeat" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Volume Control Modal */}
      {isVolumeOpen && onVolumeClick && (
        <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
      )}
    </div>
  );
}