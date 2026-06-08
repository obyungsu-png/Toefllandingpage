import { useState, useEffect, useRef } from 'react';
import zooMapImage from 'figma:asset/68cfb904670a085b88221992ab3b674e458ae5d2.png';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';
import { useAudioRecorder } from './useAudioRecorder';

interface SpeakingQ1RecordProps {
  onNext: () => void;
  onHome: () => void;
  imageUrl?: string; // CMS-managed image URL
  questionText?: string;  // text shown above the image
  responseDelay?: number; // seconds before recording starts (default 3)
  stopDuration?: number;  // seconds for stop overlay (default 2.5)
  audioUrl?: string;
}

export function SpeakingQ1Record({ onNext, onHome, imageUrl, audioUrl }: SpeakingQ1RecordProps) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const [timeRemaining, setTimeRemaining] = useState(8);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  const recorder = useAudioRecorder();
  const promptAudioRef = useRef<HTMLAudioElement | null>(null);

  // Play the prompt audio first, then start recording
  useEffect(() => {
    if (audioUrl && promptAudioRef.current) {
      promptAudioRef.current.play().catch(() => {});
    }
    const startTimer = setTimeout(() => {
      setIsRecording(true);
      recorder.startRecording();
    }, audioUrl ? (responseDelay ? responseDelay * 1000 + 1000 : 4000) : (responseDelay ? responseDelay * 1000 : 3000));

    return () => clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRecording(false);
            recorder.stopRecording();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              Question 1 of 11
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">{questionText || 'Listen and repeat only once.'}</h1>
        </div>
          <div className="flex justify-center mb-8">
          <ImageWithFallback 
            src={imageUrl ?? zooMapImage} 
            alt="Speaking scene" 
            className="border-2 border-black w-96 h-96 object-cover"
          />
        </div>
        
        <div className="flex justify-center">
          <SpeakingResponseTimer timeRemaining={timeRemaining} totalDuration={8} isRecording={isRecording} />
        </div>

        {/* Recording indicator */}
        {recorder.isRecording && (
          <div className="flex justify-center mt-3">
            <span className="flex items-center gap-2 text-red-600 font-semibold text-sm">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> 녹음 중...
            </span>
          </div>
        )}
        {recorder.status === 'denied' && (
          <p className="text-center text-xs text-red-500 mt-2">{recorder.error}</p>
        )}
      </div>

      {/* Hidden prompt audio (the voice student listens to) */}
      {audioUrl && <audio ref={promptAudioRef} src={audioUrl} preload="auto" />}

      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}
