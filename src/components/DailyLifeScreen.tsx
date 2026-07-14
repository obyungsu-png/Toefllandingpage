import React, { useState } from 'react';
import { ResizableReadingLayout } from './ResizableReadingLayout';
import { RadioOption } from './RadioOption';
import { MobileQuestionNav } from './MobileQuestionNav';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { renderDailyLifePassage } from './ReadDailyLifeTemplates';
import { ReadingReviewPassage } from './ReadingReviewPassage';

interface DailyLifeScreenProps {
  question: any; // TPOQuestion
  passageTitle: string;
  questionIndex: number;
  totalQuestions: number;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  /** 리뷰 모드 — 하이라이트/밑줄/단어 해석 툴바 활성화 */
  isReviewMode?: boolean;
  /** Supabase 하이라이트 저장용 테스트 ID */
  testId?: string;
  /** Supabase 하이라이트 저장용 지문 키 */
  passageKey?: string;
}

/**
 * Renders one "Read in Daily Life" question (email/notice/review/text_message/
 * social_media/advertisement/article/form/custom), reusing the already-proven
 * renderDailyLifePassage() renderer for structured (필드:) content, and falling
 * back to plain paragraph text for freeform (지문:) content like reviews.
 */
export function DailyLifeScreen({
  question,
  passageTitle,
  questionIndex,
  totalQuestions,
  onHome,
  onBack,
  onNext,
  isReviewMode = false,
  testId,
  passageKey,
}: DailyLifeScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [toolsOpen, setToolsOpen] = useState(false);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
    }
  };

  const passageText: string = question?.passageText || '';
  const structured = renderDailyLifePassage(passageText);
  const options: string[] = (question?.options && question.options.length > 0) ? question.options : [];
  const questionNumber = question?.questionNumber ?? '';
  const imageUrl: string | undefined = question?.imageUrl;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            *toefl ibt
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <button className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors" onClick={onBack}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          <button className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors" onClick={onNext}>
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8 items-end">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">Reading</div>
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question {questionIndex + 1} of {totalQuestions}
            </div>
            {isReviewMode && (
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`ml-auto px-4 py-1.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  toolsOpen
                    ? 'bg-[#1e6b73] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tools
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-2 md:p-4 lg:p-4 overflow-auto bg-white border border-black">
        <div className="max-w-screen-2xl mx-auto pl-0">
          {passageTitle && (
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">{passageTitle}</h2>
          )}
          <ResizableReadingLayout
            zoom={zoom}
            onWheel={handleWheel}
            initialLeftWidth={680}
            leftContent={
              isReviewMode && testId && passageKey ? (
                <ReadingReviewPassage
                  passageText={passageText}
                  testId={testId}
                  passageKey={passageKey}
                  maxHeight="65vh"
                  toolsOpen={toolsOpen}
                >
                  <div className="space-y-3">
                    {imageUrl && (
                      <img src={imageUrl} alt="" className="w-full rounded-lg border border-gray-200 mb-3" />
                    )}
                    {structured ? (
                      structured
                    ) : (
                      <div className="text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                        {passageText}
                      </div>
                    )}
                  </div>
                </ReadingReviewPassage>
              ) : (
                <div className="space-y-3">
                  {imageUrl && (
                    <img src={imageUrl} alt="" className="w-full rounded-lg border border-gray-200 mb-3" />
                  )}
                  {structured ? (
                    structured
                  ) : (
                    <div className="text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                      {passageText}
                    </div>
                  )}
                </div>
              )
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-6 lg:mb-8 mt-3">{question?.questionText}</h3>
                <div className="space-y-3 md:space-y-4 lg:space-y-5">
                  {options.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`daily-q${questionNumber}-option-${index}`}
                      name={`daily-q${questionNumber}`}
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => {
                        setSelectedAnswer(option);
                        if (typeof window !== 'undefined') {
                          (window as any).__moduleAnswers = { ...((window as any).__moduleAnswers || {}), [questionNumber]: option };
                        }
                      }}
                      label={option.replace(/^[A-D]\.\s*/, '')}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
      </div>

      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={onNext} />
    </div>
  );
}
