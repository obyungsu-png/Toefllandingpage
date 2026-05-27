/**
 * ListeningM2QuestionScreen
 * 공통 Short Conversation / Announcement / Lecture 문제 화면
 * - 왼쪽: passageImageUrl (오디오 인트로와 동일한 이미지)
 * - 오른쪽: CMS questionText + options (없으면 fallback)
 * - 오디오 없음 (이미 인트로에서 들음)
 */
import React, { useState } from 'react';
import { MobileFooter } from './MobileFooter';
import { RadioOption } from './RadioOption';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ListeningM2QuestionScreenProps {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
  imageUrl?: string;
  questionText?: string;
  options?: string[];
  questionNumber: number;
  totalQuestions: number;
  fallbackQuestion?: string;
  fallbackOptions?: string[];
}

const PlayIcon = () => (
  <span style={{fontSize:'0px',width:0,height:0,borderStyle:'solid',
    borderWidth:'6px 0 6px 10px',borderColor:'transparent transparent transparent #1e293b',
    display:'inline-block'}} />
);

export function ListeningM2QuestionScreen({
  onBack, onNext, onHome, onVolumeClick,
  imageUrl, questionText, options,
  questionNumber, totalQuestions,
  fallbackQuestion = '', fallbackOptions = [],
}: ListeningM2QuestionScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showMustAnswer, setShowMustAnswer] = useState(false);

  const displayQuestion = questionText || fallbackQuestion;
  const displayOptions = (options && options.length > 0) ? options : fallbackOptions;

  const handleNext = () => {
    if (!selectedAnswer) { setShowMustAnswer(true); return; }
    setShowMustAnswer(false);
    onNext();
  };

  const ImagePlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center">
      <svg className="w-20 h-20 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg shrink-0">
        <div className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80" onClick={onHome}>
          *toefl ibt
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52]" onClick={onVolumeClick}>
            <span className="text-white font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <button className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52]" onClick={onBack}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            <span className="text-white font-semibold text-base">Back</span>
          </button>
          <button className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100" onClick={handleNext}>
            <span className="text-[#0A6068] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
          </button>
        </div>
      </div>

      {/* Tab */}
      <div className="bg-white border-b border-gray-300 shrink-0">
        <div className="px-8 py-3 flex items-center gap-6">
          <span className="text-gray-700 font-bold border-b-2 border-[#1e6b73] pb-1">Listening</span>
          <span className="text-gray-400 text-sm self-end pb-1">Question {questionNumber} of {totalQuestions}</span>
        </div>
      </div>

      {/* Must answer modal */}
      {showMustAnswer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <p className="text-lg font-bold text-gray-800 mb-2">답을 선택해주세요</p>
            <p className="text-gray-500 text-sm mb-6">다음으로 넘어가기 전에 답을 선택해야 합니다.</p>
            <button onClick={() => setShowMustAnswer(false)} className="bg-[#1e6b73] text-white px-8 py-2 rounded-full font-semibold hover:bg-[#155960]">
              확인
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-24 md:pb-8">
        {/* Mobile */}
        <div className="md:hidden flex flex-col items-center px-4 pt-6">
          <div className="w-48 h-48 bg-gray-100 rounded-xl overflow-hidden mb-6 shadow-sm">
            {imageUrl ? <ImageWithFallback src={imageUrl} alt="Listening" className="w-full h-full object-cover" /> : <ImagePlaceholder />}
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-center px-2">{displayQuestion}</h2>
          <div className="w-full max-w-xl space-y-4">
            {displayOptions.map((opt, i) => (
              <RadioOption key={i} id={`m2-q${questionNumber}-m-${i}`} name={`m2-q${questionNumber}-m`}
                value={opt} checked={selectedAnswer === opt} onChange={() => setSelectedAnswer(opt)} label={opt} labelClassName="text-base" />
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex flex-row gap-16 items-start justify-center px-12 pt-12 max-w-6xl mx-auto">
          <div className="shrink-0 w-80 h-80 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
            {imageUrl ? <ImageWithFallback src={imageUrl} alt="Listening" className="w-full h-full object-cover" /> : <ImagePlaceholder />}
          </div>
          <div className="flex-1 max-w-xl pt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-8">{displayQuestion}</h2>
            <div className="space-y-5">
              {displayOptions.map((opt, i) => (
                <RadioOption key={i} id={`m2-q${questionNumber}-d-${i}`} name={`m2-q${questionNumber}-d`}
                  value={opt} checked={selectedAnswer === opt} onChange={() => setSelectedAnswer(opt)} label={opt} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileFooter onBack={onBack} onHome={onHome} onNext={handleNext} />
    </div>
  );
}
