import { useState, useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { VolumeControl } from './VolumeControl';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';
import { MobileSectionHeader } from './MobileSectionHeader';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { createCachedAudioSync } from '../utils/mediaCache';

interface SpeakingQ5PrepProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  audioPlayDuration?: number;
  isReviewMode?: boolean;
}

export function SpeakingQ5Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, audioPlayDuration, audioUrl, isReviewMode = false}: SpeakingQ5PrepProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let advanceTimer: ReturnType<typeof setTimeout>;

    if (audioUrl) {
      const audio = createCachedAudioSync(audioUrl);
      audioRef.current = audio;
      let ended = false;

      audio.onloadedmetadata = () => setAudioDuration(audio.duration || 0);
      audio.ontimeupdate = () => setAudioElapsed(audio.currentTime || 0);

      audio.onended = () => {
        if (ended) return;
        ended = true;
        setIsAudioPlaying(false);
        onNext();
      };
      audio.onerror = () => {
        if (ended) return;
        ended = true;
        setIsAudioPlaying(false);
        onNext();
      };

      const startTimer = setTimeout(() => {
        setIsAudioPlaying(true);
        audio.play().catch(() => { if (!ended) { ended = true; onNext(); } });
      }, 400);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(advanceTimer);
        audio.pause();
        audio.src = '';
      };
    }

    const startTimer = setTimeout(() => setIsAudioPlaying(true), 400);
    advanceTimer = setTimeout(() => { onNext(); }, audioPlayDuration ? audioPlayDuration * 1000 : 5000);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(advanceTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- play once on mount

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsAudioPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <MobileSectionHeader
        sectionLabel="Speaking"
        questionLabel="Question 5 of 11"
        onBack={onHome}
        onNext={onNext}
        showNext={isReviewMode}
        showVolume={!!onVolumeClick}
        onVolumeClick={onVolumeClick}
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
            className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            ref={volumeButtonRef}
            onClick={onVolumeClick}
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>

          {isReviewMode && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Speaking
            </div>
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question 5 of 11
            </div>
          </div>
        </div>
      </div>

      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="pt-6 md:pt-8 pb-3 md:pb-6 flex-shrink-0">
          <h1 className="text-[15px] md:text-lg font-bold text-gray-900 text-center">{questionText}</h1>
        </div>
        <div className="flex justify-center mb-4 md:mb-8 flex-shrink-0">
          <div className="w-80 h-80 md:w-[460px] md:h-[460px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50 flex-shrink-0">
          <ImageWithFallback
            src={imageUrl}
            alt="Speaking scene"
            className="w-full h-full object-cover"
          />
        </div>
        </div>
        <div className="flex justify-center">
          <SpeakingResponseTimer
            timeRemaining={Math.max(0, Math.ceil((audioDuration || audioPlayDuration || 8) - audioElapsed))}
            totalDuration={Math.ceil(audioDuration || audioPlayDuration || 8)}
            isRecording={false}
          />
        </div>
      </div>

      {/* Volume Control Dropdown */}
      {isVolumeOpen && onVolumeClick && (
        <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
      )}
    </div>
  );
}
