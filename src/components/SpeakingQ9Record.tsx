import { useState, useEffect } from 'react';
import interviewerImage from 'figma:asset/ed9fdb8833f8c1eb612bf8b6d17cb69d75bb755f.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';

interface SpeakingQ9RecordProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
}

export function SpeakingQ9Record({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl }: SpeakingQ9RecordProps) {
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);

  useEffect(() => {
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          {onVolumeClick && (
            <button 
              ref={volumeButtonRef}
              className="flex items-center gap-3 rounded-lg px-5 py-2 border border-white bg-[#0A6068] hover:bg-[#084d52] transition-colors"
              onClick={onVolumeClick}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
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
              Question 9 of 11
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
          Please answer the interviewer's questions.
        </h1>
        
        {/* Interviewer Image */}
        <div className="flex justify-center mb-12">
          <ImageWithFallback
            src={imageUrl || interviewerImage}
            alt="Interviewer"
            className="border-4 border-gray-400 max-w-md"
          />
        </div>
        
        {/* Response Time Box */}
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
      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}