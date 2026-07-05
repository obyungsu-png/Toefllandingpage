import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { VolumeControl } from './VolumeControl';

interface SpeakingQ11PrepProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
  questionText?: string;
  audioPlayDuration?: number;
  audioUrl?: string;
  videoUrl?: string;
  isReviewMode?: boolean;
}

export function SpeakingQ11Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, audioPlayDuration, audioUrl, videoUrl, isReviewMode = false}: SpeakingQ11PrepProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const soundSrc = audioUrl || videoUrl;
    if (soundSrc) {
      const audio = new Audio(soundSrc);
      const startTimer = setTimeout(() => {
        setIsAudioPlaying(true);
        audio.play().catch(() => { if (!isReviewMode) onNext(); });
      }, 800);
      // Let audio play fully — no forced cutoff
      audio.onended = () => {
        setIsAudioPlaying(false);
        setTimeout(() => { if (!isReviewMode) onNext(); }, 400);
      };
      audio.onerror = () => { if (!isReviewMode) onNext(); };
      return () => {
        clearTimeout(startTimer);
        audio.pause();
        audio.src = '';
      };
    }
  }, [audioUrl, videoUrl, isReviewMode, onNext]);

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Question 11 of 11</p>
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
              {imageUrl ? (
                <img src={imageUrl} alt="Question" className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
                  <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
              )}
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