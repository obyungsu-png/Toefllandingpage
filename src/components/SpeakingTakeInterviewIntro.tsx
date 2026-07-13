import { useEffect, useRef, useState } from 'react';
import { VolumeControl } from './VolumeControl';
import { MobileSectionHeader } from './MobileSectionHeader';
import { speakWithBritishFemaleVoice } from '../utils/tts';

interface SpeakingTakeInterviewIntroProps {
  onNext: () => void;
  onHome?: () => void;
  onVolumeClick?: () => void;
  isReviewMode?: boolean;
}

export function SpeakingTakeInterviewIntro({ onNext, onHome, isReviewMode = false }: SpeakingTakeInterviewIntroProps) {
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const stopTtsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const textToRead = `Take an Interview. An interviewer will ask you questions. Answer the questions and be sure to say as much as you can in the time allowed. No time for preparation will be provided.`;

    const stop = speakWithBritishFemaleVoice({
      text: textToRead,
      onstart: () => setIsAudioPlaying(true),
      onend: () => {
        setIsAudioPlaying(false);
        if (!isReviewMode) setTimeout(() => onNext(), 500);
      },
    });
    stopTtsRef.current = stop;
    return stop;
  }, [onNext]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <MobileSectionHeader
        sectionLabel="Speaking"
        onBack={onHome}
        onNext={() => { stopTtsRef.current?.(); onNext(); }}
        showNext
        showVolume={true}
        onVolumeClick={() => setShowVolumeControl(true)}
      />
      <div className="hidden md:block">
      {/* Header */}
      <div className="bg-[#1e6b73] h-14 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            *toefl ibt
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-3 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={() => setShowVolumeControl(true)}
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={() => { stopTtsRef.current?.(); onNext(); }}
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
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
      <div className="flex-1 flex items-center justify-center bg-white p-4 md:p-12">
        <div className="max-w-2xl w-full">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-12">
            Take an Interview
          </h1>
          
          <div className="border-t-2 border-gray-300 pt-6 md:pt-8">
            <p className="text-gray-700 text-sm md:text-xl mb-4 md:mb-6 leading-relaxed">
              An interviewer will ask you questions. Answer the questions and be sure to say as much as you can in the time allowed.
            </p>
            
            <p className="text-gray-700 text-sm md:text-xl leading-relaxed">
              No time for preparation will be provided.
            </p>
          </div>
        </div>
      </div>

      {/* Volume Control Modal */}
      {showVolumeControl && (
        <VolumeControl onClose={() => setShowVolumeControl(false)} />
      )}
    </div>
  );
}