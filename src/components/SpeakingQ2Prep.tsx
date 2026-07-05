import { useState, useEffect } from 'react';
import speakingImage from 'figma:asset/a71b28147ebac8a118893f23f167e5cc4828ff8d.png';
import { ChevronLeft } from 'lucide-react';
import { VolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SpeakingQ2PrepProps {
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

export function SpeakingQ2Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, audioPlayDuration, audioUrl, isReviewMode = false }: SpeakingQ2PrepProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  useEffect(() => {
    let advanceTimer: ReturnType<typeof setTimeout>;

    if (audioUrl) {
      const audio = new Audio(audioUrl);
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

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Question 2 of 11</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto px-4 py-6">
        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs text-teal-600 font-semibold mb-1.5 uppercase tracking-wider">Question</p>
          <p className="text-base text-gray-800 leading-relaxed">{questionText || 'Listen and repeat only once.'}</p>
        </div>

        {/* Image Card */}
        <div className="flex justify-center mb-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <ImageWithFallback
                src={imageUrl || speakingImage}
                alt="Speaking scene"
                className="w-full aspect-square object-cover"
              />
            </div>
        </div>

        {/* Audio playing indicator */}
        {isAudioPlaying && (
          <div className="flex items-center justify-center gap-3 text-teal-600">
            <svg className="w-7 h-7 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <span className="text-lg font-semibold">Playing audio...</span>
          </div>
        )}

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