import { useState, useEffect, useRef } from 'react';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';
import { useAudioRecorder } from './useAudioRecorder';
import { playBeep } from '../utils/beep';
import { uploadRecording } from '../utils/uploadRecording';
import { MobileSectionHeader } from './MobileSectionHeader';
import { createCachedAudioSync } from '../utils/mediaCache';

interface SpeakingQ1RecordProps {
  onNext: () => void;
  onHome: () => void;
  imageUrl?: string; // CMS-managed image URL
  questionText?: string;  // text shown above the image
  responseDelay?: number; // seconds before recording starts (default 3)
  stopDuration?: number;  // seconds for stop overlay (default 2.5)
  audioUrl?: string;
  isReviewMode?: boolean;
}

export function SpeakingQ1Record({ onNext, onHome, imageUrl, audioUrl, questionText, responseDelay, stopDuration, duration, isReviewMode = false }: SpeakingQ1RecordProps) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const [timeRemaining, setTimeRemaining] = useState(duration || 8);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  const recorder = useAudioRecorder();
  const uploadedRef = useRef(false);
  const promptAudioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false); // 자동 녹음 시작을 한 번만 (beep/녹음 중복 방지)

  // Play the prompt audio first, THEN wait delay, THEN beep
  useEffect(() => {
    let startTimer: ReturnType<typeof setTimeout>;

    const startDelayAndBeep = () => {
      if (startedRef.current) return; // 이미 예약됨 — 중복 호출 무시
      startedRef.current = true;
      const delay = responseDelay ? responseDelay * 1000 : 2000;
      startTimer = setTimeout(async () => {
        await playBeep();
        setIsRecording(true);
        recorder.startRecording();
      }, delay);
    };

    if (audioUrl) {
      const audio = createCachedAudioSync(audioUrl);
      promptAudioRef.current = audio;
      audio.onended = () => { if (!isReviewMode) startDelayAndBeep(); };
      audio.onerror = () => { if (!isReviewMode) startDelayAndBeep(); };
      audio.play().catch(() => { if (!isReviewMode) startDelayAndBeep(); });
    } else if (!isReviewMode) {
      // No audio — just wait and beep
      startDelayAndBeep();
    }

    return () => {
      clearTimeout(startTimer);
      if (promptAudioRef.current) {
        promptAudioRef.current.pause();
        promptAudioRef.current.src = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Review mode only: manual record start on button press
  const handleManualRecord = async () => {
    uploadedRef.current = false;
    setShowStopOverlay(false);
    setTimeRemaining(duration || 8);
    await playBeep();
    setIsRecording(true);
    recorder.startRecording();
  };

  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRecording(false);
            recorder.stopRecording();
            setShowStopOverlay(true);
            if (!isReviewMode) {
              setTimeout(() => onNext(), stopDuration ? stopDuration * 1000 : 3000);
            } else {
              // Review mode: show briefly, then hide — do NOT auto-advance
              setTimeout(() => setShowStopOverlay(false), 1800);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, timeRemaining, onNext]);

  // Upload recording when blob is ready after stop
  useEffect(() => {
    if (showStopOverlay && recorder.audioBlob && !uploadedRef.current) {
      uploadedRef.current = true;
      uploadRecording(recorder.audioBlob, 1).catch(() => {});
    }
  }, [showStopOverlay, recorder.audioBlob]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <MobileSectionHeader
        sectionLabel="Speaking"
        questionLabel="Question 1 of 11"
        onBack={onHome}
        onNext={onNext}
        showNext={isReviewMode}
        showVolume={true}
        onVolumeClick={toggleVolume}
      />
      <div className="hidden md:block">
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
          
          {isReviewMode && (
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

      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="pt-6 md:pt-8 pb-3 md:pb-6 flex-shrink-0">
          <h1 className="text-[15px] md:text-lg font-bold text-gray-900 text-center">{questionText}</h1>
        </div>
        <div className="flex justify-center mb-4 md:mb-8 flex-shrink-0">
          <div className="w-80 h-80 md:w-[460px] md:h-[460px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50">
            <ImageWithFallback
              src={imageUrl}
              alt="Speaking scene"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {!isReviewMode ? (
          <div className="flex justify-center">
            <SpeakingResponseTimer timeRemaining={timeRemaining} totalDuration={duration || 8} isRecording={isRecording} />
          </div>
        ) : (
          <div className="flex justify-center">
            <SpeakingResponseTimer
              timeRemaining={timeRemaining}
              totalDuration={duration || 8}
              isRecording={isRecording}
              onRecordClick={!isRecording ? handleManualRecord : undefined}
              recordLabel={uploadedRef.current ? 'Re-record' : 'Record'}
            />
          </div>
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
