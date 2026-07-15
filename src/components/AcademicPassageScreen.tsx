import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { ResizableReadingLayout } from './ResizableReadingLayout';
import { RadioOption } from './RadioOption';
import { MobileQuestionNav } from './MobileQuestionNav';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ReadingReviewPassage } from './ReadingReviewPassage';

interface AcademicPassageScreenProps {
  question: any; // TPOQuestion
  passageTitle: string;
  passageText: string;
  questionIndex: number; // 0-indexed position within this passage's question group
  totalQuestions: number; // how many questions share this passage
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  /** 리뷰 모드 — 하이라이트/밑줄/단어 해석 툴바 활성화 */
  isReviewMode?: boolean;
  /** Supabase 하이라이트 저장용 테스트 ID */
  testId?: string;
  /** Supabase 하이라이트 저장용 지문 키 */
  passageKey?: string;
}

/**
 * Renders one Academic Passage (or Insert Text) question, reusing the exact
 * visual layout that was previously hardcoded per fixed question number
 * (Module1Question16-20Screen etc). Data comes entirely from the CMS
 * question object passed in — no hardcoded fallback text.
 */
export function AcademicPassageScreen({
  question,
  passageTitle,
  passageText,
  questionIndex,
  totalQuestions,
  onHome,
  onBack,
  onNext,
  testBankType,
  handleTabChange,
  isReviewMode = false,
  testId,
  passageKey,
}: AcademicPassageScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
    }
  };

  const options: string[] = (question?.options && question.options.length > 0) ? question.options : [];
  const questionNumber = question?.questionNumber ?? '';

  return (
    <div className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col ${darkMode ? 'dark' : ''}`}>
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
          {/* Volume Button */}
          <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>

          {/* Back Button */}
          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>

          {/* Next Button */}
          <button
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={onNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="px-8 py-3">
          <div className="flex gap-8 items-end">
            <div className="text-gray-700 dark:text-gray-200 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Reading
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question {questionIndex + 1} of {totalQuestions}
            </div>
            {isReviewMode && (
              <>
                <button
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    toolsOpen
                      ? 'bg-[#1e6b73] text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Tools
                </button>
                <div id="academic-reading-review-toolbar-slot" className="mb-1 shrink-0" />
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-1.5 rounded-lg transition-colors mb-1 ${
                    darkMode
                      ? 'bg-gray-700 text-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={darkMode ? '라이트 모드' : '다크 모드'}
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-2 md:p-4 lg:p-4 overflow-auto bg-white dark:bg-gray-900 border border-black dark:border-gray-700">
        <div className="max-w-screen-2xl mx-auto pl-0">
          <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center text-gray-900 dark:text-gray-100 mb-2 md:mb-4 lg:mb-8">{passageTitle}</h2>
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
                  maxHeight="none"
                  toolsOpen={toolsOpen}
                  toolbarPortalId="academic-reading-review-toolbar-slot"
                />
              ) : (
                <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black dark:text-gray-100 font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                  {passageText}
                </div>
              )
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black dark:text-gray-100 mb-4 md:mb-6 lg:mb-8 mt-3">{question?.questionText}</h3>
                <div className="space-y-3 md:space-y-4 lg:space-y-5">
                  {options.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`academic-q${questionNumber}-option-${index}`}
                      name={`academic-q${questionNumber}`}
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

      <MobileQuestionNav
        onBack={onBack}
        onHome={onHome}
        onNext={onNext}
      />
    </div>
  );
}
