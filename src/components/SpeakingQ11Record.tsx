import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Volume2, ChevronRight, Pause, Play } from 'lucide-react';
import { VolumeControl } from './VolumeControl';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';
import { useAudioRecorder } from './useAudioRecorder';
import { playBeep } from '../utils/beep';
import { uploadRecording } from '../utils/uploadRecording';

interface SpeakingQ11RecordProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
  questionText?: string;
  responseDelay?: number;
  stopDuration?: number;
  duration?: number;
  isReviewMode?: boolean;
  existingRecordingUrl?: string;
}

export function SpeakingQ11Record({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, responseDelay, stopDuration, duration, isReviewMode = false, existingRecordingUrl }: SpeakingQ11RecordProps) {

  const [timeRemaining, setTimeRemaining] = useState(45);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  const recorder = useAudioRecorder();
  const [reviewPhase, setReviewPhase] = useState<"idle" | "listening" | "buttons" | "recording" | "done">('idle');
  const uploadedRef = useRef(false);
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isReviewPlaying, setIsReviewPlaying] = useState(false);

  // Review mode: play existing recording first when available, otherwise show choice buttons
  useEffect(() => {
    if (isReviewMode) {
      if (existingRecordingUrl) {
        setReviewPhase('listening');
        const audio = new Audio(existingRecordingUrl);
        reviewAudioRef.current = audio;
        audio.onplay = () => setIsReviewPlaying(true);
        audio.onpause = () => setIsReviewPlaying(false);
        audio.onended = () => { setIsReviewPlaying(false); setReviewPhase('buttons'); };
        audio.onerror = () => { setIsReviewPlaying(false); setReviewPhase('buttons'); };
        audio.play().catch(() => setReviewPhase('buttons'));
        return () => { audio.pause(); audio.src = ''; };
      }

      setReviewPhase('buttons');
      return;
    }

    const delay = responseDelay ? responseDelay * 1000 : 2000;
    const startTimer = setTimeout(async () => {
      await playBeep();
      setIsRecording(true);
      recorder.startRecording();
    }, delay);
    return () => clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleReviewPlay = () => {
    if (!reviewAudioRef.current) return;
    if (isReviewPlaying) {
      reviewAudioRef.current.pause();
    } else {
      reviewAudioRef.current.play().catch(() => {});
    }
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
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
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



  useEffect(() => {
    if (showStopOverlay && recorder.audioBlob && !uploadedRef.current) {
      uploadedRef.current = true;
      uploadRecording(recorder.audioBlob, 11).catch(() => {});
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
          <p className="text-xs text-gray-500 leading-tight">Question 11 of 11</p>
        </div>
        {onVolumeClick && <button ref={volumeButtonRef} onClick={onVolumeClick} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"><Volume2 size={18} /></button>}
        {isReviewMode && (
          <button onClick={onNext} className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0">
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-3 py-2 sm:px-4 sm:py-4 space-y-2 sm:space-y-4">
        {/* Question Card - compact on mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 sm:p-4">
          <p className="text-[10px] sm:text-xs text-teal-600 font-semibold mb-1 uppercase tracking-wider">Question</p>
          <p className="text-xs sm:text-sm text-gray-800 leading-snug line-clamp-2">{questionText || 'Listen and repeat only once.'}</p>
        </div>

        {/* Image Card - square, constrained on mobile */}
        <div className="speaking-picture-card mx-auto" style={{ maxWidth: 'min(100%, 20rem)' }}>
          {imageUrl ? (
              <img src={imageUrl} alt="Question" className="speaking-picture-media" />
            ) : (
              <div className="speaking-picture-placeholder">
                <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
            )}
        </div>

        {/* Record / Skip buttons (review mode) */}
        {isReviewMode && reviewPhase === 'buttons' && (
          <div className="flex gap-3">
            <button onClick={handleReRecord} className="flex-1 bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition-colors text-sm">
              {existingRecordingUrl ? 'Re-record' : 'Record'}
            </button>
            <button onClick={() => { setReviewPhase('done'); onNext(); }} className="flex-1 bg-white text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors text-sm">
              {existingRecordingUrl ? 'Keep' : 'Skip'}
            </button>
          </div>
        )}

        {/* Listening indicator with Play/Pause control */}
        {isReviewMode && reviewPhase === 'listening' && (
          <div className="flex items-center justify-center gap-2 py-2">
            <button
              onClick={toggleReviewPlay}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              {isReviewPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <span className="text-teal-600 text-sm font-medium">
              {isReviewPlaying ? 'Playing your recording...' : 'Paused'}
            </span>
          </div>
        )}

        {/* Timer */}
        <div className="speaking-timer-wrap flex justify-center pt-2">
          <SpeakingResponseTimer timeRemaining={timeRemaining} totalDuration={duration || 45} isRecording={isRecording} />
        </div>
      </div>
      {isVolumeOpen && onVolumeClick && (
        <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
      )}

      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}