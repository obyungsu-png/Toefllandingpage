import { useState, useEffect } from 'react';
import interviewerImage from 'figma:asset/8b2a5cc0865044f065ee7287b66832b84e1696db.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SpeakingQ11PrepProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
}

export function SpeakingQ11Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl }: SpeakingQ11PrepProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  useEffect(() => {
    const videoTimer = setTimeout(() => {
      setIsVideoPlaying(true);

      const nextTimer = setTimeout(() => {
        onNext();
      }, 3000);

      return () => clearTimeout(nextTimer);
    }, 1000);
    
    return () => clearTimeout(videoTimer);
  }, [onNext]);

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
              className={`flex items-center gap-3 rounded-lg px-5 py-2 border transition-colors ${
                isVolumeOpen
                  ? 'bg-white border-[#0A6068]'
                  : 'bg-[#0A6068] border-white hover:bg-[#084d52]'
              }`}
              onClick={onVolumeClick}
            >
              <span className={`font-['Inter',_sans-serif] font-semibold text-base ${isVolumeOpen ? 'text-[#0A6068]' : 'text-white'}`}>
                Volume
              </span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
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
              Question 11 of 11
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
          Please answer the interviewer's questions.
        </h1>
        
        {/* Interviewer Video */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <ImageWithFallback
              src={imageUrl || interviewerImage}
              alt="Interviewer"
              className="border-4 border-gray-400 max-w-md"
            />
            {isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-4">
                  <svg className="w-12 h-12 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {isVideoPlaying && <div className="text-xl font-semibold text-[#1e6b73]">Playing audio...</div>}
      </div>
    </div>
  );
}