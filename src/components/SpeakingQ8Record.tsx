import { useState, useEffect, useRef } from 'react';
import { VolumeControl } from './VolumeControl';
import { SpeakingStopOverlay } from './SpeakingStopOverlay';
import { SpeakingResponseTimer } from './SpeakingResponseTimer';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAudioRecorder } from './useAudioRecorder';
import { playBeep } from '../utils/beep';
import { uploadRecording } from '../utils/uploadRecording';
import { MobileSectionHeader } from './MobileSectionHeader';

interface SpeakingQ8RecordProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
  questionText?: string;
  responseDelay?: number;
  stopDuration?: number;
  duration?: number; // seconds for recording countdown (default 45)
  isReviewMode?: boolean;
  questionLabel?: string;
  /** 녹음 업로드 시 사용될 실제 질문 번호 — 과거엔 8로 하드코딩되어 모든
   *  Interview 문제의 녹음이 Q8 로 덮어쓰이는 버그가 있었음. */
  questionNumber?: number;
}

export function SpeakingQ8Record({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, responseDelay, stopDuration, duration, isReviewMode = false, questionLabel = 'Question 8 of 11', questionNumber = 8 }: SpeakingQ8RecordProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration || 45);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  const recorder = useAudioRecorder();
  const uploadedRef = useRef(false);
  const startedRef = useRef(false); // 자동 녹음 시작을 한 번만 (beep 중복 방지)
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  useEffect(() => {
    if (isReviewMode) return; // Review mode: wait for manual Record button click
    if (startedRef.current) return; // 이미 시작됨 — 중복 beep 방지
    const delay = responseDelay ? responseDelay * 1000 : 2000;
    const startTimer = setTimeout(async () => {
      if (startedRef.current) return;
      startedRef.current = true;
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
    setTimeRemaining(duration || 45);
    await playBeep();
    setIsRecording(true);
    recorder.startRecording();
  };

  function resolveStopDelayMs(v: unknown): number {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return 3000;
    return Math.max(500, Math.min(10_000, n * 1000));
  }

  useEffect(() => {
    if (!isRecording) return;
    if (timeRemaining <= 0) {
      // 녹음 종료 사이드이펙트를 effect 본문에서 실행 — setState 업데이터 재실행
      // 에도 중복되지 않고 showStopOverlay 커밋이 안정적으로 이뤄진다.
      setIsRecording(false);
      recorder.stopRecording();
      setShowStopOverlay(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, timeRemaining]);

  // Stop 오버레이가 뜨면 → 안전한 지연 후 자동 다음 화면 (리뷰 모드에선 숨기기만).
  // 과거엔 이 setTimeout 이 setInterval tick callback 안에 있어서 조건에 따라
  // 영원히 발동되지 않을 수 있었다. 독립 effect 로 뽑아 안정화 + 2단 안전망.
  useEffect(() => {
    if (!showStopOverlay) return;
    if (!isReviewMode) {
      const delay = resolveStopDelayMs(stopDuration);
      const t = setTimeout(() => onNextRef.current(), delay);
      const safety = setTimeout(() => onNextRef.current(), Math.max(delay + 2000, 12_000));
      return () => { clearTimeout(t); clearTimeout(safety); };
    }
    const hide = setTimeout(() => setShowStopOverlay(false), 1800);
    return () => clearTimeout(hide);
  }, [showStopOverlay, isReviewMode, stopDuration]);

  useEffect(() => {
    if (showStopOverlay && recorder.audioBlob && !uploadedRef.current) {
      uploadedRef.current = true;
      uploadRecording(recorder.audioBlob, questionNumber).catch(() => {});
    }
  }, [showStopOverlay, recorder.audioBlob, questionNumber]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <MobileSectionHeader
        sectionLabel="Speaking"
        questionLabel={questionLabel}
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
        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            ref={volumeButtonRef}
            className="flex items-center gap-1.5 md:gap-3 bg-[#0A6068] border border-white rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-[#084d52] transition-colors"
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
              className="flex items-center gap-1 md:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-gray-100 transition-colors"
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
            <div className="text-gray-500 text-sm font-[\'Inter\',_sans-serif] font-medium self-end pb-2">{questionLabel}</div>
          </div>
        </div>
      </div>

      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="pt-6 md:pt-8 pb-3 md:pb-6 flex-shrink-0">
          <h1 className="text-[15px] md:text-lg font-bold text-gray-900 text-center">{questionText || "Please answer the interviewer's questions."}</h1>
        </div>
        <div className="flex justify-center mb-4 md:mb-8 flex-shrink-0">
          <div className="w-80 h-80 md:w-[460px] md:h-[460px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50 flex-shrink-0">
            <ImageWithFallback
              src={imageUrl}
              alt="Interviewer"
              className="w-full h-full object-cover"
            />
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
