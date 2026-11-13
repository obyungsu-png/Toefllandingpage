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
  /** Prep 화면에서 재생된 질문 영상 URL — 녹음 화면에선 영상의 첫 프레임을
   *  poster 로 사용해 "인터뷰어가 가만히 있는" 모양을 유지한다. */
  videoUrl?: string;
  questionText?: string;
  responseDelay?: number;
  stopDuration?: number;
  duration?: number; // seconds for recording countdown (currently hardcoded to 45)
  isReviewMode?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

export function SpeakingQ8Record({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, videoUrl, questionText, responseDelay, stopDuration, isReviewMode = false, questionNumber, totalQuestions}: SpeakingQ8RecordProps) {
  const questionLabel = `Question ${questionNumber ?? 8} of ${totalQuestions ?? 11}`;
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [isRecording, setIsRecording] = useState(false);
  const [showStopOverlay, setShowStopOverlay] = useState(false);
  // 녹음 섹션(RESPONSE TIME 카드)을 처음엔 숨기고, 1초 뒤 삐 소리와 함께 등장시킨다.
  // 사용자 요청: "음성이 끝나고 1초 뒤에 녹음 버튼이 나타나며 삐 소리와 함께 녹음 시작".
  const [showTimerCard, setShowTimerCard] = useState(isReviewMode);
  const recorder = useAudioRecorder();
  const uploadedRef = useRef(false);
  const startedRef = useRef(false); // 자동 녹음 시작을 한 번만 (beep 중복 방지)

  useEffect(() => {
    if (isReviewMode) return; // Review mode: wait for manual Record button click
    if (startedRef.current) return; // 이미 시작됨 — 중복 beep 방지
    // Take an Interview 는 질문 오디오/영상이 이전 Prep 화면에서 이미 재생되고 종료됨.
    // 녹음 화면 진입 → 1초 대기(RESPONSE TIME 카드 숨김) → 카드 등장 + 삐 + 녹음 시작.
    // CMS 가 responseDelay 를 지정했으면 그 값을 쓰고, 아니면 1000ms.
    const delay = responseDelay ? responseDelay * 1000 : 1000;
    const startTimer = setTimeout(async () => {
      if (startedRef.current) return;
      startedRef.current = true;
      setShowTimerCard(true);   // 카드 등장
      await playBeep();         // 삐 소리
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
    setShowTimerCard(true);
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
      uploadRecording(recorder.audioBlob, questionNumber ?? 8).catch(() => {});
    }
  }, [showStopOverlay, recorder.audioBlob]);

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
          className="text-white text-2xl font-[\'Inter\',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1.5"
          onClick={onHome}
         title="홈으로 이동" role="button" aria-label="홈으로 이동"><svg className="w-4 h-4 md:w-5 md:h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5.5h4V20"/></svg><span>*toefl ibt</span></div>
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
        {/* 실제 TOEFL처럼: Start/Review 모두 동일한 고정 안내 문구를 사진 위에 표시.
            인터뷰 질문 스크립트는 노출하지 않음. */}
        <div className="pt-6 md:pt-8 pb-3 md:pb-6 flex-shrink-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 text-center">Please answer the interviewer's questions.</h1>
        </div>
        <div className="flex justify-center mb-4 md:mb-8 flex-shrink-0">
          {/* 녹음 중 사각 프레임 — 영상이 있으면 영상의 "첫 프레임(poster)"만
              정지 화면처럼 보여주고(=소리 X, 재생 X), 영상이 없으면 imageUrl 노출. */}
          <div className="w-80 h-80 md:w-[460px] md:h-[460px] rounded-lg overflow-hidden border border-gray-300 bg-black flex-shrink-0">
            {videoUrl ? (
              <video
                src={videoUrl}
                preload="metadata"
                muted
                playsInline
                className="w-full h-full object-cover bg-gray-50 pointer-events-none"
                onLoadedMetadata={(e) => {
                  // 첫 프레임을 확실히 보여주기 위해 currentTime 을 0.01 로 세팅.
                  // 일부 브라우저는 metadata 만 로드하면 썸네일이 안 생길 수 있어서.
                  try { e.currentTarget.currentTime = 0.01; } catch { /* noop */ }
                }}
              />
            ) : (
              <ImageWithFallback
                src={imageUrl}
                alt="Interviewer"
                className="w-full h-full object-cover bg-gray-50"
              />
            )}
          </div>
        </div>
        {/* 카드 등장은 showTimerCard 로 게이팅 — 1초 대기 뒤 삐 소리와 함께 표시. */}
        {showTimerCard && (
          !isReviewMode ? (
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
          )
        )}
      </div>

      <SpeakingStopOverlay isOpen={showStopOverlay} />
    </div>
  );
}
