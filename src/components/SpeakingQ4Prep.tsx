import { useState, useEffect } from 'react';
import { VolumeControl } from './VolumeControl';

interface SpeakingQ4PrepProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
  audioUrl?: string;
  questionText?: string;
  audioPlayDuration?: number;
}

export function SpeakingQ4Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, audioPlayDuration, audioUrl }: SpeakingQ4PrepProps) {
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
        onNext(); // audio finished — move to record screen (beep waits there)
      };
      audio.onerror = () => {
        if (ended) return;
        ended = true;
        setIsAudioPlaying(false);
        onNext();
      };

      // Start playing shortly after mount
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

    // No CMS audio — simulate then advance
    const startTimer = setTimeout(() => setIsAudioPlaying(true), 400);
    advanceTimer = setTimeout(() => onNext(), audioPlayDuration ? audioPlayDuration * 1000 : 5000);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(advanceTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- play once on mount

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
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
              Question 4 of 11
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white pt-12 px-12">
        {/* Title at top center */}
        <div className="pb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">{questionText || 'Listen and repeat only once.'}</h1>
        </div>
        
        {/* Image - Square */}
        <div className="flex justify-center mb-8">
          <div className="border-2 border-black w-96 h-96 flex items-center justify-center bg-gray-50 overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Speaking scene" className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
            ) : (
              <svg className="w-24 h-24 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            )}
          </div>
        </div>
        
        {/* Audio playing indicator */}
        {isAudioPlaying && (
          <div className="flex items-center justify-center gap-3 text-[#1e6b73]">
            <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <span className="text-xl font-semibold">Playing audio...</span>
          </div>
        )}
      </div>

      {/* Volume Control Dropdown */}
      {isVolumeOpen && onVolumeClick && (
        <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
      )}
    </div>
  );
}