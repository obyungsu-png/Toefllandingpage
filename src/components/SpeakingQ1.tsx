import { useEffect, useRef, useState } from 'react';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MobileSectionHeader } from './MobileSectionHeader';
import { speakWithBritishFemaleVoice } from '../utils/tts';
import { createCachedAudioSync } from '../utils/mediaCache';

interface SpeakingQ1Props {
  onNext?: () => void;
  onHome?: () => void;
  imageUrl?: string;
  introAudioUrl?: string; // CMS-managed intro audio (replaces TTS)
  introText?: string;     // CMS-managed intro text (shown above image; falls back to questionText)
  questionText?: string;  // CMS-managed heading text
  isReviewMode?: boolean;
  questionLabel?: string; // e.g. "Question 2 of 11"
}

export function SpeakingQ1({ onNext, onHome, imageUrl, introAudioUrl, introText, questionText, isReviewMode = false, questionLabel }: SpeakingQ1Props) {
  const { isOpen, buttonRef, toggleVolume, closeVolume } = useVolumeControl();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // onNext를 ref에 저장 — effect 재실행 없이 항상 최신 참조 사용 (스턱 방지)
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let advanced = false;
    const advance = (delay = 500) => {
      if (advanced || isReviewMode) return;
      advanced = true;
      fallbackTimer = setTimeout(() => onNextRef.current?.(), delay);
    };

    // ── Real audio from CMS ──────────────────────────────────────────────────
    if (introAudioUrl) {
      const audio = createCachedAudioSync(introAudioUrl);
      audioRef.current = audio;

      audio.onplay  = () => setIsAudioPlaying(true);
      audio.onended = () => {
        setIsAudioPlaying(false);
        advance(500);
      };
      audio.onerror = () => {
        setIsAudioPlaying(false);
        advance(300);
      };

      // 리뷰 모드에서는 지연 없이 즉시 재생 — "다음 문제로 넘어가면 바로 음성이 안나옴" 대응
      const playDelay = isReviewMode ? 0 : 500;
      const t = setTimeout(() => audio.play().catch(() => advance(300)), playDelay);
      // 안전망 — 오디오가 60초 안에 끝나지 않으면 강제 진행
      const safety = setTimeout(() => advance(0), 60_000);
      return () => {
        clearTimeout(t);
        clearTimeout(safety);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        audio.pause();
        audio.src = '';
      };
    }

    // ── TTS fallback (no CMS audio) ──────────────────────────────────────────
    const textToRead = introText || questionText;
    if (!textToRead) {
      // CMS 데이터가 비어도 사용자가 멈추지 않도록 짧게 기다렸다가 다음으로.
      advance(800);
      return () => { if (fallbackTimer) clearTimeout(fallbackTimer); };
    }

    setIsAudioPlaying(true);
    const ttsCleanup = speakWithBritishFemaleVoice({
      text: textToRead,
      onstart: () => setIsAudioPlaying(true),
      onend: () => {
        setIsAudioPlaying(false);
        advance(500);
      },
    });
    // TTS 안전망 — 20초 안에 끝나지 않으면 진행
    const ttsSafety = setTimeout(() => advance(0), 20_000);
    return () => {
      clearTimeout(ttsSafety);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (typeof ttsCleanup === 'function') ttsCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introAudioUrl, introText, questionText]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <MobileSectionHeader
        sectionLabel="Speaking"
        questionLabel={questionLabel}
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
            className="text-white text-base md:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            *toefl ibt
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            ref={buttonRef}
            onClick={toggleVolume}
            className="flex items-center gap-1.5 md:gap-3 bg-[#0A6068] border border-white rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-[#084d52] transition-colors"
          >
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-xs md:text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          {isReviewMode && (
            <button
              onClick={onNext}
              className="flex items-center gap-1 md:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs md:text-base">Next</span>
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
            {questionLabel && (
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                {questionLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white p-4 md:p-12">
        <div className="max-w-5xl mx-auto">
          {/* 문장 텍스트는 시험 모드에서 숨김 — 오디오로만 듣고 리듬을 익히도록.
              Review 모드에서는 어떤 문장인지 확인할 수 있게 표시. */}
          {isReviewMode && (
            <h1 className="text-[15px] md:text-lg font-bold text-gray-900 mb-4 md:mb-8 text-center whitespace-pre-wrap">
              {introText || questionText}
            </h1>
          )}

          <div className="flex justify-center my-6 md:my-8">
            <div className="w-80 h-80 md:w-[460px] md:h-[460px] rounded-lg overflow-hidden border border-gray-300 bg-gray-50 flex-shrink-0">
              <ImageWithFallback
                src={imageUrl}
                alt="Zoo Map"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <VolumeControl isOpen={isOpen} onClose={closeVolume} buttonRef={buttonRef} />
    </div>
  );
}
