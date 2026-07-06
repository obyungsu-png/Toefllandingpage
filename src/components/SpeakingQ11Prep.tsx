import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const soundSrc = audioUrl || videoUrl;
    if (soundSrc) {
      const audio = new Audio(soundSrc);
      audioRef.current = audio;
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
          <p className="text-xs text-gray-500 leading-tight">Question 11 of 11</p>
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
              {imageUrl ? (
                <img src={imageUrl} alt="Question" className="speaking-picture-media" />
              ) : (
                <div className="speaking-picture-placeholder">
                  <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
              )}
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