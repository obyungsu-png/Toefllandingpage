import { useState, useEffect, useRef } from 'react';
import { VolumeControl } from './VolumeControl';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';
import { useAudioRecorder } from './useAudioRecorder';
import { playBeep } from '../utils/beep';
import { uploadRecording } from '../utils/uploadRecording';
import { MobileSectionHeader } from './MobileSectionHeader';

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
  isReviewMode?: boolean;
}

export function SpeakingQ11Record({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, responseDelay, stopDuration, isReviewMode = false}: SpeakingQ11RecordProps) {
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  const recorder = useAudioRecorder();
  const uploadedRef = useRef(false);

  useEffect(() => {
    if (isReviewMode) return; // Review mode: wait for manual Record button click
    const delay = responseDelay ? responseDelay * 1000 : 2000;
    const startTimer = setTimeout(async () => {
      await playBeep();
      setIsRecording(true);
      recorder.startRecording();
    }, delay);
    return () => clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Review mode only: manual record start on button press
  const handleManualRecord = async () => {
    uploadedRef.current = false;
    setShowStopOverlay(false);
    setTimeRemaining(45);
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
  }, [isRecording, timeRemaining, onNext]);

  useEffect(() => {
    if (showStopOverlay && recorder.audioBlob && !uploadedRef.current) {
      uploadedRef.current = true;
      uploadRecording(recorder.audioBlob, 11).catch(() => {});
    }
  }, [showStopOverlay, recorder.audioBlob]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <MobileSectionHeader
        sectionLabel="Speaking"
        questionLabel="Question 11 of 11"
        onBack={onHome}
        onNext={onNext}
        showNext={isReviewMode}
        showVolume={!!onVolumeClick}
        onVolumeClick={onVolumeClick}
      />
      <div className="hidden md:block">
      {/* Header */}
      <div className="bg-[#1e6b73] h-14 flex items-center justify-between px-8 shadow-lg">
        <div
          className="text-white text-2xl font-[\'Inter\',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHome}
        >
          *toefl ibt
        </div>
        <div className="flex items-center gap-3">
          <button
            ref={volumeButtonRef}
            className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onVolumeClick}
          >
            <span className="text-white font-[\'Inter\',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          {isReviewMode && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-[#0A6068] font-[\'Inter\',_sans-serif] font-semibold text-base">Next</span>
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
            <div className="text-gray-700 font-[\'Inter\',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">Speaking</div>
            <div className="text-gray-500 text-sm font-[\'Inter\',_sans-serif] font-medium self-end pb-2">Question 11 of 11</div>
          </div>
        </div>
      </div>

      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white pt-6 md:pt-8 overflow-y-auto">
        <div className="pb-4 md:pb-6 flex-shrink-0">
          <h1 className="text-[15px] md:text-lg font-bold text-gray-900 text-center">{questionText || "Please answer the interviewer's questions."}</h1>
        </div>
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="w-72 h-72 md:w-[420px] md:h-[420px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50 flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Interviewer"
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <svg className="w-24 h-24 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            )}
          </div>
        </div>
        {!isReviewMode ? (
          <div className="flex justify-center">
            <SpeakingResponseTimer timeRemaining={timeRemaining} totalDuration={45} isRecording={isRecording} />
          </div>
        ) : (
          <div className="flex justify-center">
            <SpeakingResponseTimer
              timeRemaining={timeRemaining}
              totalDuration={45}
              isRecording={isRecording}
              onRecordClick={!isRecording ? handleManualRecord : undefined}
              recordLabel={uploadedRef.current ? 'Re-record' : 'Record'}
            />
          </div>
        )}
      </div>

      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}
