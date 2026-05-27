/**
 * ListeningM2AudioIntro
 * 
 * Short Conversation / Announcement / Lecture 공통 오디오 인트로 화면.
 * - 진입 즉시 1초 후 passageAudioUrl 자동 재생 (1회)
 * - 오디오 끝나면 Next 버튼 활성화
 * - 이미지 있으면 표시, 없으면 placeholder
 * - "Listen to a conversation." 텍스트
 */
import React, { useEffect, useRef, useState } from 'react';
import { MobileFooter } from './MobileFooter';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ListeningM2AudioIntroProps {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  audioUrl?: string;
  imageUrl?: string;
  title?: string;        // e.g. "Listen to a conversation."
  questionRange?: string; // e.g. "Questions 9-10"
}

export function ListeningM2AudioIntro({
  onBack,
  onNext,
  onHome,
  onVolumeClick,
  audioUrl,
  imageUrl,
  title = 'Listen to a conversation.',
  questionRange,
}: ListeningM2AudioIntroProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);

  // Reset on audioUrl change
  useEffect(() => {
    playedRef.current = false;
    setIsPlaying(false);
    setAudioEnded(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, [audioUrl]);

  // Auto-play after 1s
  useEffect(() => {
    if (!audioUrl || playedRef.current) return;
    playedRef.current = true;
    const timer = setTimeout(() => {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      audio.onended = () => { setIsPlaying(false); setAudioEnded(true); };
    }, 1000);
    return () => { clearTimeout(timer); audioRef.current?.pause(); };
  }, [audioUrl]);

  const handleReplay = () => {
    if (!audioUrl || isPlaying) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    audio.onended = () => { setIsPlaying(false); setAudioEnded(true); };
  };

  const canGoNext = !audioUrl || audioEnded;

  const Header = () => (
    <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg shrink-0">
      <div className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80" onClick={onHome}>
        *toefl ibt
      </div>
      <div className="flex items-center gap-3 hidden md:flex">
        <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52]" onClick={onVolumeClick}>
          <span className="text-white font-semibold text-base">Volume</span>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        </button>
        <button className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52]" onClick={onBack}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          <span className="text-white font-semibold text-base">Back</span>
        </button>
        <button
          className={`flex items-center gap-2 border-2 rounded-lg px-5 py-2 transition-colors ${canGoNext ? 'bg-white border-[#0A6068] hover:bg-gray-100 cursor-pointer' : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'}`}
          onClick={canGoNext ? onNext : undefined}
        >
          <span className={`font-semibold text-base ${canGoNext ? 'text-[#0A6068]' : 'text-gray-400'}`}>Next</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={canGoNext ? '#0A6068' : '#9ca3af'}><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <Header />

      {/* Section label */}
      <div className="bg-white border-b border-gray-300 shrink-0">
        <div className="px-8 py-3 flex items-center gap-6">
          <span className="text-gray-700 font-bold font-['Inter',_sans-serif]">Listening</span>
          {questionRange && <span className="text-gray-400 text-sm">{questionRange}</span>}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-start overflow-auto pt-8 pb-24 md:pb-8 px-4">
        <h2 className="text-2xl md:text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">
          {title}
        </h2>

        {/* Image — 실전 시험과 동일하게 크게 */}
        <div className="w-[340px] h-[340px] md:w-[520px] md:h-[520px] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center shadow-sm mb-6">
          {imageUrl ? (
            <ImageWithFallback src={imageUrl} alt="Listening" className="w-full h-full object-contain" />
          ) : (
            <svg className="w-28 h-28 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          )}
        </div>

        {/* Audio status */}
        {audioUrl ? (
          <div className="flex flex-col items-center gap-2">
            {isPlaying && (
              <div className="flex items-center gap-2 text-[#0d9488] font-semibold text-sm">
                <span className="w-2 h-2 bg-[#0d9488] rounded-full animate-pulse" />
                재생 중...
              </div>
            )}
            {!isPlaying && !audioEnded && (
              <button
                onClick={handleReplay}
                className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]"
              >
                <span style={{fontSize:'0px',width:0,height:0,borderStyle:'solid',borderWidth:'5px 0 5px 9px',borderColor:'transparent transparent transparent #1e293b',display:'inline-block'}} />
                Play Audio
              </button>
            )}
            {audioEnded && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-[#0d9488] font-medium">✓ 재생 완료 — Next를 눌러 문제로 이동하세요</p>
                <button
                  onClick={handleReplay}
                  className="flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium bg-[#f0f0f0] text-gray-500 hover:bg-[#e2e8f0]"
                >
                  다시 듣기
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">CMS에서 오디오를 업로드하면 자동 재생됩니다</p>
        )}
      </div>

      <MobileFooter onBack={onBack} onHome={onHome} onNext={canGoNext ? onNext : () => {}} />
    </div>
  );
}
