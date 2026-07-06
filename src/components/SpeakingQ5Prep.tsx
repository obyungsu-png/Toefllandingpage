import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import speakingImage from 'figma:asset/2a387faeacd632f6736d88d2369b0263c8a292d4.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SpeakingQ5PrepProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string; // CMS-managed image URL
  questionText?: string;     // text shown above the image
  audioPlayDuration?: number; // seconds (overrides default 5s)
  audioUrl?: string;         // CMS audio to play on this screen
  isReviewMode?: boolean;
}

export function SpeakingQ5Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, audioPlayDuration, audioUrl, isReviewMode = false}: SpeakingQ5PrepProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    let advanceTimer: ReturnType<typeof setTimeout>;

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      let ended = false;

      audio.onended = () => {
        if (ended) return;
        ended = true;
        setIsAudioPlaying(false);
        if (!isReviewMode) onNext(); // audio finished — move to record screen (beep waits there)
      };
      audio.onerror = () => {
        if (ended) return;
        ended = true;
        setIsAudioPlaying(false);
        if (!isReviewMode) onNext();
      };

      // Start playing shortly after mount
      const startTimer = setTimeout(() => {
        setIsAudioPlaying(true);
        audio.play().catch(() => { if (!ended) { ended = true; if (!isReviewMode) onNext(); } });
      }, 400);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(advanceTimer);
        if (!ended) {
          ended = true;
          audio.pause();
          audio.src = '';
        }
      };
    }
  }, [audioUrl, isReviewMode, onNext]);

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
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Question 5 of 11</p>
        </div>
        {isReviewMode && (
          <button onClick={onNext} className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0">
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="speaking-question-content flex-1 flex flex-col overflow-auto px-4 py-6">
        {/* Question Card */}
        <div className="speaking-question-card bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="speaking-question-label text-xs text-teal-600 font-semibold mb-1.5 uppercase tracking-wider">Question</p>
          <p className="speaking-question-text text-base text-gray-800 leading-relaxed">{questionText || 'Listen and repeat only once.'}</p>
        </div>

        {/* Image Card */}
        <div className="flex justify-center mb-4">
          <div className="speaking-picture-card">
              <ImageWithFallback
                src={imageUrl || speakingImage}
                alt="Speaking scene"
                className="speaking-picture-media"
              />
            </div>
        </div>
        {/* Spacer */}
        <div className="flex-1" />

        {/* Volume Control Dropdown */}
        {isVolumeOpen && onVolumeClick && (
          <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
        )}
      </div>
    </div>
  );
}