import { useState, useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { VolumeControl } from './VolumeControl';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MobileSectionHeader } from './MobileSectionHeader';
import { createCachedAudioSync } from '../utils/mediaCache';

interface SpeakingQ8PrepProps {
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  isVolumeOpen?: boolean;
  volumeButtonRef?: React.RefObject<HTMLButtonElement>;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  questionText?: string;
  audioPlayDuration?: number;
  isReviewMode?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

export function SpeakingQ8Prep({ onNext, onHome, onVolumeClick, isVolumeOpen, volumeButtonRef, imageUrl, questionText, audioPlayDuration, audioUrl, videoUrl, isReviewMode = false, questionNumber, totalQuestions}: SpeakingQ8PrepProps) {
  const questionLabel = `Question ${questionNumber ?? 8} of ${totalQuestions ?? 11}`;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // 영상이 있으면 영상을 재생해 완료 후 녹음 단계로 자동 전환.
  const hasVideo = !!videoUrl;

  useEffect(() => {
    let advanceTimer: ReturnType<typeof setTimeout>;

    // ── 영상이 있는 경우: <video> 요소에서 재생·종료를 처리 (아래 markup 참고) ──
    if (hasVideo) {
      // 안전망 — 영상이 로드되지 않거나 autoplay 가 막혀도 5분 뒤 강제 진행.
      advanceTimer = setTimeout(() => { onNext(); }, 300_000);
      return () => clearTimeout(advanceTimer);
    }

    const soundSrc = audioUrl;

    if (soundSrc) {
      const audio = createCachedAudioSync(soundSrc);
      audioRef.current = audio;
      let ended = false;

      audio.onloadedmetadata = () => setAudioDuration(audio.duration || 0);
      audio.ontimeupdate = () => setAudioElapsed(audio.currentTime || 0);

      audio.onended = () => {
        if (ended) return;
        ended = true;
        setIsAudioPlaying(false);
        onNext();
      };
      audio.onerror = () => {
        if (ended) return;
        ended = true;
        setIsAudioPlaying(false);
        onNext();
      };

      const startTimer = setTimeout(() => {
        setIsAudioPlaying(true);
        audio.play().catch(() => { if (!ended) { ended = true; onNext(); } });
      }, 400);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(advanceTimer);
        audio.pause();
        audio.src = '';
      };
    }

    const startTimer = setTimeout(() => setIsAudioPlaying(true), 400);
    advanceTimer = setTimeout(() => { onNext(); }, audioPlayDuration ? audioPlayDuration * 1000 : 5000);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(advanceTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- play once on mount

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsAudioPlaying(true);
    }
  };

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
            className="flex items-center gap-1.5 md:gap-3 bg-[#0A6068] border border-white rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-[#084d52] transition-colors"
            ref={volumeButtonRef}
            onClick={onVolumeClick}
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
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              {questionLabel}
            </div>
          </div>
        </div>
      </div>

      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        {/* 실제 TOEFL처럼: Start/Review 모두 동일한 고정 안내 문구를 사진 위에 표시.
            인터뷰 질문 스크립트(오디오로만 들려주는 내용)는 노출하지 않음. */}
        <div className="pt-6 md:pt-8 pb-3 md:pb-6 flex-shrink-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 text-center">Please answer the interviewer's questions.</h1>
        </div>
        <div className="flex justify-center mb-4 md:mb-8 flex-shrink-0">
          <div className="w-80 h-80 md:w-[460px] md:h-[460px] rounded-lg overflow-hidden border border-gray-300 bg-black flex items-center justify-center flex-shrink-0">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
                onPlay={() => setIsAudioPlaying(true)}
                onLoadedMetadata={(e) => setAudioDuration((e.currentTarget.duration || 0))}
                onTimeUpdate={(e) => setAudioElapsed(e.currentTarget.currentTime || 0)}
                onEnded={() => { setIsAudioPlaying(false); onNext(); }}
                onError={() => { setIsAudioPlaying(false); onNext(); }}
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
        {/* 질문 영상/음성 재생 중엔 RESPONSE TIME 카드 숨김 — 사용자 요청.
            카드와 녹음 흐름은 다음(SpeakingQ8Record) 화면에서 진행된다. */}
      </div>

      {/* Volume Control Dropdown */}
      {isVolumeOpen && onVolumeClick && (
        <VolumeControl isOpen={isVolumeOpen} onClose={onVolumeClick} buttonRef={volumeButtonRef} />
      )}
    </div>
  );
}
