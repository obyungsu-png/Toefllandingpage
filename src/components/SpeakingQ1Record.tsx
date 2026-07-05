import { useState, useEffect, useRef } from 'react';
import zooMapImage from 'figma:asset/68cfb904670a085b88221992ab3b674e458ae5d2.png';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';
import { useAudioRecorder } from './useAudioRecorder';
import { playBeep } from '../utils/beep';
import { uploadRecording } from '../utils/uploadRecording';

interface SpeakingQ1RecordProps {
  onNext: () => void;
  onHome: () => void;
  imageUrl?: string; // CMS-managed image URL
  questionText?: string;  // text shown above the image
  responseDelay?: number; // seconds before recording starts (default 3)
  stopDuration?: number;  // seconds for stop overlay (default 2.5)
  audioUrl?: string;
  isReviewMode?: boolean;
  existingRecordingUrl?: string;
}

export function SpeakingQ1Record({ onNext, onHome, imageUrl, audioUrl, questionText, responseDelay, stopDuration, duration, isReviewMode = false, existingRecordingUrl }: SpeakingQ1RecordProps) {

  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const [timeRemaining, setTimeRemaining] = useState(duration || 8);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  const recorder = useAudioRecorder();
  const [reviewPhase, setReviewPhase] = useState<"idle" | "listening" | "buttons" | "recording" | "done">('idle');
  const uploadedRef = useRef(false);
  const promptAudioRef = useRef<HTMLAudioElement | null>(null);

  // Play the prompt audio first, THEN wait delay, THEN beep
  useEffect(() => {
    let startTimer: ReturnType<typeof setTimeout>;

    const startDelayAndBeep = () => {
      const delay = responseDelay ? responseDelay * 1000 : 2000;
      startTimer = setTimeout(async () => {
        await playBeep();
        setIsRecording(true);
        recorder.startRecording();
      }, delay);
    };

    if (isReviewMode && existingRecordingUrl) {
      // Review mode: play existing recording, then show buttons
      setReviewPhase('listening');
      const reviewAudio = new Audio(existingRecordingUrl);
      reviewAudio.onended = () => setReviewPhase('buttons');
      reviewAudio.onerror = () => setReviewPhase('buttons');
      reviewAudio.play().catch(() => setReviewPhase('buttons'));
    } else if (audioUrl) {
      const audio = new Audio(audioUrl);
      promptAudioRef.current = audio;
      audio.onended = () => startDelayAndBeep();
      audio.onerror = () => startDelayAndBeep();
      audio.play().catch(() => startDelayAndBeep());
    } else {
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

  const reRecordTimerRef = useRef<ReturnType<typeof setTimeout>>();
  
  const handleReRecord = () => {
    setReviewPhase('recording');
    clearTimeout(reRecordTimerRef.current);
    const delay = responseDelay ? responseDelay * 1000 : 2000;
    reRecordTimerRef.current = setTimeout(async () => {
      await playBeep();
      setIsRecording(true);
      recorder.startRecording();
    }, delay);
  };

  // Upload recording when blob is ready after stop
  useEffect(() => {
    if (showStopOverlay && recorder.audioBlob && !uploadedRef.current) {
      uploadedRef.current = true;
      uploadRecording(recorder.audioBlob, 1).catch(() => {});
    }
  }, [showStopOverlay, recorder.audioBlob]);

  
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Question 1 of 11</p>
        </div>
        <button ref={buttonRef} onClick={toggleVolume} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"><Volume2 size={18} /></button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-teal-600 font-semibold mb-1.5 uppercase tracking-wider">Question</p>
          <p className="text-base text-gray-800 leading-relaxed">{questionText || 'Listen and repeat only once.'}</p>
        </div>

        {/* Image Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ImageWithFallback src={imageUrl || speakingImage} alt="Speaking scene" className="w-full aspect-square object-cover" />
        </div>

        {/* Re-record / Keep buttons (review mode) */}
        {isReviewMode && reviewPhase === 'buttons' && (
          <div className="flex gap-3">
            <button onClick={handleReRecord} className="flex-1 bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition-colors text-sm">
              Re-record
            </button>
            <button onClick={() => setReviewPhase('done')} className="flex-1 bg-white text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors text-sm">
              Keep
            </button>
          </div>
        )}

        {/* Listening indicator */}
        {isReviewMode && reviewPhase === 'listening' && (
          <div className="flex items-center justify-center gap-2 py-2 text-teal-600 text-sm font-medium">
            <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            Playing your recording...
          </div>
        )}

        {/* Timer */}
        <div className="flex justify-center pt-2">
          <SpeakingResponseTimer timeRemaining={timeRemaining} totalDuration={duration || 8} isRecording={isRecording} />
        </div>
      </div>
      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />

      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}