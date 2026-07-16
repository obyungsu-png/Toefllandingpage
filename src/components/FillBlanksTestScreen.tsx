import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { MobileQuestionNav } from './MobileQuestionNav';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { ReadingReviewPassage } from './ReadingReviewPassage';
import {
  getQuestionRangeLabel,
  isCompleteWordsType,
  isModule2Question,
  normalizeCompleteWordsPassage,
} from '../utils/readingQuestionUtils';

interface FillBlanksTestScreenProps {
  setShowFillBlanksTest: React.Dispatch<React.SetStateAction<boolean>>;
  setShowReadingSection: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToeflTest: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  setShowReadNoticeTest: React.Dispatch<React.SetStateAction<boolean>>;
  setShowModule1Details: React.Dispatch<React.SetStateAction<boolean>>;
  currentTest: any;
  getCurrentSectionData: (section: string) => any;
  /** Optional: render this specific question instead of auto-finding the first
   *  Complete Words question. Used by ReadingTestEngine to support multiple
   *  Complete Words groups (e.g. Q1-10 and Q11-20) in the same module. */
  questionOverride?: any;
  /** Optional: which module's Complete Words to search for when no override
   *  is given. Defaults to 1 (existing behavior — excludes Module 2). */
  module?: 1 | 2;
  /** Optional: override what "Next" does. Used by ReadingTestEngine to move
   *  to the next segment instead of the hardcoded ReadNoticeTest jump. */
  onNext?: () => void;
  /** Optional: override what "Back" does (e.g. go to a previous Complete
   *  Words group instead of the module intro). */
  onBack?: () => void;
  /** 리뷰 모드 — Tools(밑줄/하이라이트/사전) + 다크 모드 토글 활성화 */
  isReviewMode?: boolean;
  /** Supabase 하이라이트 저장용 테스트 ID */
  testId?: string;
  /** Supabase 하이라이트 저장용 지문 키 */
  passageKey?: string;
}

const FillBlanksTestScreen: React.FC<FillBlanksTestScreenProps> = ({
  setShowFillBlanksTest,
  setShowReadingSection,
  setShowToeflTest,
  testBankType,
  handleTabChange,
  setShowReadNoticeTest,
  setShowModule1Details,
  currentTest,
  getCurrentSectionData,
  questionOverride,
  module = 1,
  onNext,
  onBack,
  isReviewMode = false,
  testId,
  passageKey,
}) => {
  const [inputValues, setInputValues] = React.useState<Record<number, string>>({});
  const [filledInputs, setFilledInputs] = React.useState<Record<number, boolean>>({});
  const [toolsOpen, setToolsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { isOpen: isFBVolumeOpen, buttonRef: fbVolumeButtonRef, toggleVolume: toggleFBVolume, closeVolume: closeFBVolume } = useVolumeControl();
  
  const CHAR_UNIT_WIDTH = 20; // CSS background-size의 가로 폭과 일치
  const isMobileFB = typeof window !== 'undefined' && window.innerWidth < 640;
  
  // Get dynamic question data from CMS
  const sectionData = getCurrentSectionData('Reading');
  // CMS PRIORITY: use override if given (ReadingTestEngine passes a specific
  // question when there are multiple Complete Words groups); otherwise find
  // by type, filtered by module.
  const fillBlanksQuestion = questionOverride || sectionData?.questions.find((q: any) => (
    isCompleteWordsType(q.questionType) && (module === 2 ? isModule2Question(q) : !isModule2Question(q))
  )) || sectionData?.questions.find((q: any) => (
    // Fallback: any fill-blanks question (backward compat)
    isCompleteWordsType(q.questionType)
  ));
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 FillBlanksTest Debug:', {
      currentTest,
      testBankType,
      sectionData,
      fillBlanksQuestion,
      hasPassageText: !!fillBlanksQuestion?.passageText,
      hasBlanks: !!fillBlanksQuestion?.blanks
    });
  }, []);
  
  // Determine inputs and passage: supports word[answer], word[answer:N], and word[0] + blanks.
  let inputs:{id:number;maxLength:number;answer:string}[];
  let normalizedPassage: string = '';

  const rawCmsPassage = fillBlanksQuestion?.passageText || '';
  const parsedCompleteWords = normalizeCompleteWordsPassage(rawCmsPassage, fillBlanksQuestion?.blanks);

  if (parsedCompleteWords.blanks.length > 0 && parsedCompleteWords.normalizedPassage) {
    inputs = parsedCompleteWords.blanks.map(blank => ({
      id: blank.id,
      maxLength: blank.maxLength,
      answer: blank.answer,
    }));
    normalizedPassage = parsedCompleteWords.normalizedPassage;
  } else {
    // CMS 데이터가 없으면 빈 상태 — 하드코딩 fallback 제거됨
    inputs = [];
  }

  const passageText = normalizedPassage;

  // FillBlanks 답을 window.__fillBlanksAnswers에 저장 (리뷰용)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__fillBlanksAnswers = inputValues;
      if (fillBlanksQuestion) {
        const questionKey = String(fillBlanksQuestion.id || fillBlanksQuestion.questionNumber || 'module1-complete-words');
        (window as any).__completeWordsAnswers = {
          ...((window as any).__completeWordsAnswers || {}),
          [questionKey]: inputValues,
        };
      }
    }
  }, [inputValues, fillBlanksQuestion]);

  const renderPassageWithInputs = () => {
    if (!passageText) return null;
    
    const parts: any[] = [];
    let key = 0;
    const regex = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(passageText)) !== null) {
      const inputId = parseInt(match[1]);
      const beforeText = passageText.substring(lastIndex, match.index);
      
      if (beforeText) {
        parts.push(<span key={`text-${key++}`}>{beforeText}</span>);
      }
      
      parts.push(
        <input
          key={`input-${inputId}`}
          type="text"
          data-input-id={inputId}
          className={`gap-input ${filledInputs[inputId] ? 'filled' : ''}`}
          maxLength={inputs[inputId]?.maxLength || 5}
          value={inputValues[inputId] || ''}
          onChange={(e) => handleInputChange(inputId, e.target.value)}
          onFocus={() => handleFocus(inputId)}
          onBlur={() => handleBlur(inputId)}
          onKeyPress={(e) => handleKeyPress(e, inputId)}
          style={{ width: getInputWidth(inputId) }}
        />
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < passageText.length) {
      parts.push(<span key={`text-${key++}`}>{passageText.substring(lastIndex)}</span>);
    }
    
    return parts;
  };

  const handleInputChange = (id: number, value: string) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
    
    if (value.length >= inputs[id].maxLength) {
      setFilledInputs(prev => ({ ...prev, [id]: true }));
    } else {
      setFilledInputs(prev => ({ ...prev, [id]: false }));
    }
    
    if (value.length === inputs[id].maxLength) {
      const nextId = id + 1;
      if (nextId < inputs.length) {
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-input-id="${nextId}"]`) as HTMLInputElement;
          if (nextInput) nextInput.focus();
        }, 0);
      }
    }
  };

  const handleFocus = (id: number) => {
    const value = inputValues[id] || '';
    if (value.length < inputs[id].maxLength) {
      setFilledInputs(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleBlur = (id: number) => {
    if (inputValues[id] && inputValues[id].length > 0) {
      setFilledInputs(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const getTextWidth = (text: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * 14;
    context.font = "1.25rem 'Inter', sans-serif";
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width) + 4;
  };

  const getInputWidth = (id: number): string => {
    const value = inputValues[id] || '';
    const maxLen = inputs[id].maxLength;
    if (value.length >= maxLen) {
      return `${getTextWidth(value)}px`;
    }
    const mobileOffset = isMobileFB ? CHAR_UNIT_WIDTH : 0;
    return `${maxLen * CHAR_UNIT_WIDTH - mobileOffset}px`;
  };

  return (
    <div className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Content layout */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="bg-[#1e6b73] h-12 sm:h-14 flex items-center justify-between px-3 sm:px-8 shrink-0 relative">
          <div className="flex items-center min-w-0 shrink">
            <div 
              className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity truncate"
              onClick={() => {
                setShowFillBlanksTest(false);
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') {
                  handleTabChange('TPO');
                } else {
                  handleTabChange('Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Volume Button */}
            <button 
              ref={fbVolumeButtonRef as React.RefObject<HTMLButtonElement>}
              className={`flex items-center gap-1.5 sm:gap-3 border rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 transition-colors ${
                isFBVolumeOpen 
                  ? 'bg-white border-white text-[#1e6b73]' 
                  : 'bg-[#0A6068] border-white text-white hover:bg-[#084d52]'
              }`}
              onClick={toggleFBVolume}
            >
              <span className="font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Volume</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill={isFBVolumeOpen ? '#1e6b73' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-1.5 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowFillBlanksTest(false);
                if (onNext) onNext(); else setShowReadNoticeTest(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 shrink-0">
          <div className="px-3 sm:px-8 py-2 sm:py-3">
            <div className="flex gap-4 sm:gap-8 items-end">
              <div className="text-gray-700 dark:text-gray-200 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                {fillBlanksQuestion ? getQuestionRangeLabel(fillBlanksQuestion, 1) : `Question 1-${inputs.length || 10}`}
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
        <div className="flex-1 bg-white dark:bg-gray-900 overflow-auto">
          <div className="p-4 sm:p-5 md:p-12 pt-8 sm:pt-16 md:pt-24 flex flex-col items-center">
            <h1 className="mb-10 sm:mb-12 md:mb-14 text-xl sm:text-2xl md:text-[1.75rem] text-black dark:text-gray-100 font-bold font-['Inter',_sans-serif] text-center px-2">
              Fill in the missing letters in the paragraph.
            </h1>

            {isReviewMode && testId && passageKey ? (
              <ReadingReviewPassage
                passageText={passageText}
                testId={testId}
                passageKey={passageKey}
                maxHeight="none"
                toolsOpen={toolsOpen}
                className="max-w-[900px] w-full"
              >
                <div
                  className="text-lg sm:text-lg md:text-[1.25rem] leading-[1.8] sm:leading-relaxed md:leading-[1.8] text-black dark:text-gray-100 font-['Inter',_sans-serif] px-1 sm:px-4"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                >
                  {renderPassageWithInputs() || (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-20">
                      <p className="text-lg font-semibold mb-2">이 문제는 아직 업로드되지 않았습니다.</p>
                      <p className="text-sm">CMS에서 Complete Words 문제를 업로드한 뒤 다시 시도해주세요.</p>
                    </div>
                  )}
                </div>
              </ReadingReviewPassage>
            ) : (
              <div className="max-w-[900px] w-full text-lg sm:text-lg md:text-[1.25rem] leading-[1.8] sm:leading-relaxed md:leading-[1.8] text-black dark:text-gray-100 font-['Inter',_sans-serif] px-1 sm:px-4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {renderPassageWithInputs() || (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-20">
                    <p className="text-lg font-semibold mb-2">이 문제는 아직 업로드되지 않았습니다.</p>
                    <p className="text-sm">CMS에서 Complete Words 문제를 업로드한 뒤 다시 시도해주세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isFBVolumeOpen} onClose={closeFBVolume} buttonRef={fbVolumeButtonRef} />
      
      <MobileQuestionNav 
        onBack={() => {
          setShowFillBlanksTest(false);
          if (onBack) onBack(); else setShowModule1Details(true);
        }}
        onHome={() => {
          setShowFillBlanksTest(false);
          setShowReadingSection(false);
          setShowToeflTest(false);
          if (testBankType === 'tpo') {
            handleTabChange('TPO');
          } else {
            handleTabChange('Test');
          }
        }}
        onNext={() => {
          setShowFillBlanksTest(false);
          if (onNext) onNext(); else setShowReadNoticeTest(true);
        }}
      />
    </div>
  );
};

export default FillBlanksTestScreen;
