import { useState, useEffect } from 'react';
import speakingImage from 'figma:asset/7a0cd411d1aa2aee86fbf4038fb67da2a409101c.png';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';

interface SpeakingQ2RecordProps {
  onNext: () => void;
  onHome: () => void;
  imageUrl?: string; // CMS-managed image URL
}

export function SpeakingQ2Record({ onNext, onHome, imageUrl }: SpeakingQ2RecordProps) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const [timeRemaining, setTimeRemaining] = useState(8);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);

  useEffect(() => {
    // Give a short buffer between prompt audio and recording.
    const startTimer = setTimeout(() => {
      setIsRecording(true);
    }, 2000);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRecording(false);
            setShowStopOverlay(true);
            setTimeout(() => {
              onNext();
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isRecording, timeRemaining, onNext]);

  const formatTime = (seconds: number) => {
    const secs = seconds % 60;
    return `00:00:${secs.toString().padStart(2, '0')}`;
  };

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
            ref={buttonRef}
            onClick={toggleVolume}
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          
          {/* Next Button */}
          {onNext && (
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
              Question 2 of 11
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Title at top center */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Listen and repeat only once.
          </h1>
        </div>
        
        {/* Image */}
        <div className="flex justify-center mb-8">
          <ImageWithFallback 
            src={imageUrl || speakingImage} 
            alt="Speaking scene" 
            className="border-2 border-black w-96 h-96 object-cover"
          />
        </div>
        
        {/* Response Time Box */}
        <div className="flex justify-center">
          <div className="w-80">
            <div className="bg-gray-600 text-white text-center py-2 rounded-t-lg">
              <span className="font-bold text-lg">RESPONSE TIME</span>
            </div>
            <div className="bg-white border-2 border-gray-600 rounded-b-lg py-4 flex items-center justify-center gap-3">
              {isRecording && (
                <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
              <span className="text-3xl font-bold text-gray-900">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}