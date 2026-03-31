import { useEffect, useRef, useState } from 'react';
import zooMapImage from 'figma:asset/68cfb904670a085b88221992ab3b674e458ae5d2.png';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { MobileQuestionNav } from './MobileQuestionNav';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';

interface SpeakingQ1Props {
  onNext?: () => void;
  onHome?: () => void;
  imageUrl?: string; // CMS-managed image URL
}

export function SpeakingQ1({ onNext, onHome, imageUrl }: SpeakingQ1Props) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(8);
  const hasStartedRecording = useRef(false);

  useEffect(() => {
    const textToRead = "You are learning to welcome visitors to the zoo. Listen to your manager and repeat what she says. Repeat only once.";
    let fallbackStartTimer: ReturnType<typeof setTimeout> | null = null;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-GB';

      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = [
          'Google UK English Female',
          'Microsoft Susan - English (United Kingdom)',
          'Kate',
          'Serena',
          'Stephanie'
        ];

        let selectedVoice = voices.find(voice => 
          preferredVoices.some(preferred => voice.name.includes(preferred))
        );

        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en-GB') && 
            (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
          );
        }

        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.includes('en-GB'));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoice();
      }

      window.speechSynthesis.onvoiceschanged = setVoice;
      utterance.onstart = () => setIsAudioPlaying(true);

      utterance.onend = () => {
        setIsAudioPlaying(false);
        if (!hasStartedRecording.current) {
          fallbackStartTimer = setTimeout(() => {
            hasStartedRecording.current = true;
            setIsRecording(true);
          }, 1500);
        }
      };

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 500);

      return () => {
        if (fallbackStartTimer) {
          clearTimeout(fallbackStartTimer);
        }
        window.speechSynthesis.cancel();
      };
    }

    setIsAudioPlaying(true);
    fallbackStartTimer = setTimeout(() => {
      setIsAudioPlaying(false);
      hasStartedRecording.current = true;
      setIsRecording(true);
    }, 4500);

    return () => {
      if (fallbackStartTimer) {
        clearTimeout(fallbackStartTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRecording(false);
          setShowStopOverlay(true);
          setTimeout(() => {
            onNext?.();
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
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
            ref={buttonRef}
            onClick={toggleVolume}
            className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
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
              Question 1 of 11
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white p-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            You are learning to welcome visitors to the zoo. Listen to your manager and repeat what she says. Repeat only once.
          </h1>
          
          {/* Zoo Map Image */}
          <div className="flex justify-center my-8">
            <ImageWithFallback 
              src={imageUrl || zooMapImage} 
              alt="Zoo Map" 
              className="border-2 border-gray-400 w-96 h-96 object-cover"
            />
          </div>

          <div className="mt-10 flex flex-col items-center gap-5">
            {isAudioPlaying && (
              <div className="flex items-center gap-3 text-[#148b8f]">
                <svg className="h-8 w-8 animate-pulse" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
                <span className="text-xl font-semibold">Playing audio...</span>
              </div>
            )}

            <SpeakingResponseTimer timeRemaining={timeRemaining} totalDuration={8} isRecording={isRecording} />
          </div>
        </div>
      </div>

      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
      <SpeakingStopOverlay isOpen={showStopOverlay} />
      <MobileQuestionNav onNext={onNext} onHome={onHome} />
    </div>
  );
}