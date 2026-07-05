import { useState, useEffect } from 'react';
import speakingImage from 'figma:asset/624a6b7dc8cfb75f631c120b5cf434ca61f8cecd.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SpeakingQ6PrepProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string; // CMS-managed image URL
  questionText?: string;     // text shown above the image
  audioPlayDuration?: number; // seconds (overrides default 5s)
  audioUrl?: string;         // CMS audio to play on this screen
}

export function SpeakingQ6Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, audioPlayDuration, audioUrl }: SpeakingQ6PrepProps) {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  useEffect(() => {
    // If a real audio URL is provided from CMS, play it
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      const audioTimer = setTimeout(() => {
        setIsAudioPlaying(true);
        audio.play().catch(() => {});
      }, 500);

      audio.onended = () => {
        setIsAudioPlaying(false);
        setTimeout(() => onNext(), 300);
      };
      audio.onerror = () => {
        // Fallback to timer if audio fails
        const fallback = setTimeout(() => onNext(), audioPlayDuration ? audioPlayDuration * 1000 : 5000);
        return () => clearTimeout(fallback);
      };
      return () => {
        clearTimeout(audioTimer);
        audio.pause();
        audio.src = '';
      };
    }

    // No CMS audio — simulate with timer
    const audioTimer = setTimeout(() => {
      setIsAudioPlaying(true);
    }, 1000);
    const nextTimer = setTimeout(() => {
      onNext();
    }, (audioPlayDuration ? audioPlayDuration * 1000 : 5000));
    return () => {
      clearTimeout(audioTimer);
      clearTimeout(nextTimer);
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
          {onVolumeClick && (
            <button 
              ref={volumeButtonRef}
              className={`flex items-center gap-3 rounded-3xl px-6 py-2 border-4 transition-colors ${
                isVolumeOpen
                  ? 'bg-white border-[#1e6b73]'
                  : 'bg-[#0A6068] border-[#0A6068] hover:bg-[#084d52]'
              }`}
              onClick={onVolumeClick}
            >
              <span className={`font-['Inter',_sans-serif] font-semibold text-base ${isVolumeOpen ? 'text-[#1e6b73]' : 'text-white'}`}>
                Volume
              </span>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isVolumeOpen ? '#1e6b73' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
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
              Question 6 of 11
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
          <ImageWithFallback
            src={imageUrl || speakingImage}
            alt="Speaking scene"
            className="border-2 border-black w-96 h-96 object-cover"
          />
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
    </div>
  );
}