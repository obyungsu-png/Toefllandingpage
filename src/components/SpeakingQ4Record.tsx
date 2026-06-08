import { useState, useEffect } from 'react';
import speakingImage from 'figma:asset/8b35efa9f817161ac6e1896bb66d8010374d8d93.png';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';

interface SpeakingQ4RecordProps {
  onNext: () => void;
  onHome: () => void;
  imageUrl?: string; // CMS-managed image URL
  questionText?: string;  // text shown above the image
  responseDelay?: number; // seconds before recording starts (default 3)
  stopDuration?: number;  // seconds for stop overlay (default 2.5)
}

export function SpeakingQ4Record({ onNext, onHome, imageUrl }: SpeakingQ4RecordProps) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const [timeRemaining, setTimeRemaining] = useState(8);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);

  useEffect(() => {
    // Give a short buffer between prompt audio and recording.
    const startTimer = setTimeout(() => {
      setIsRecording(true);
    }, (responseDelay ? responseDelay * 1000 : 3000));

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
            }, (stopDuration ? stopDuration * 1000 : 2500));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isRecording, timeRemaining, onNext]);

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
      <div className="flex-1 flex flex-col bg-white">
        {/* Title at top center */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">{questionText || 'Listen and repeat only once.'}</h1>
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
          <SpeakingResponseTimer timeRemaining={timeRemaining} totalDuration={8} isRecording={isRecording} />
        </div>
      </div>
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}