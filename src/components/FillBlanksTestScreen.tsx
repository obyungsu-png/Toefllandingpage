import React, { useState } from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';
import { VolumeControl, useVolumeControl } from './VolumeControl';

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
}) => {
  const [inputValues, setInputValues] = React.useState<Record<number, string>>({});
  const [filledInputs, setFilledInputs] = React.useState<Record<number, boolean>>({});

  // FillBlanks 답을 window.__fillBlanksAnswers에 저장 (리뷰용)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__fillBlanksAnswers = inputValues;
    }
  }, [inputValues]);
  
  const { isOpen: isFBVolumeOpen, buttonRef: fbVolumeButtonRef, toggleVolume: toggleFBVolume, closeVolume: closeFBVolume } = useVolumeControl();
  
  const CHAR_UNIT_WIDTH = 20; // CSS background-size의 가로 폭과 일치
  const isMobileFB = typeof window !== 'undefined' && window.innerWidth < 640;
  
  // Get dynamic question data from CMS
  const sectionData = getCurrentSectionData('Reading');
  // CMS PRIORITY: flexible type matching — Module 1 only (exclude Module 2 tagged questions)
  const fillBlanksQuestion = sectionData?.questions.find((q: any) => {
    const t = (q.questionType || '').toLowerCase();
    const isModule2 = t.includes('module 2');
    const isFillBlanks = (
      t.includes('complete words') ||
      t.includes('fill in the blank') ||
      t.includes('cloze test') ||
      t.includes('빈칸') ||
      t.includes('fillblanks') ||
      t.includes('fill-in')
    );
    return isFillBlanks && !isModule2;
  }) || sectionData?.questions.find((q: any) => {
    // Fallback: any fill-blanks question (backward compat)
    const t = (q.questionType || '').toLowerCase();
    return (
      t.includes('complete words') ||
      t.includes('fill in the blank') ||
      t.includes('cloze test') ||
      t.includes('빈칸') ||
      t.includes('fillblanks') ||
      t.includes('fill-in')
    );
  });
  
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
  
  // CMS PRIORITY: Parse CMS passageText format "word[answer:maxLength]" e.g. "sh[ow:2]"
  const parseCmsPassage = (raw: string): { inputs:{id:number;maxLength:number;answer:string}[]; normalizedPassage: string } => {
    const parsedInputs:{id:number;maxLength:number;answer:string}[] = [];
    let idx = 0;
    // Match pattern: [answer:maxLength]  e.g. [ow:2] or [tion:4]
    const normalized = raw.replace(/\[([^\]]+):(\d+)\]/g, (_match, answer, maxLen) => {
      parsedInputs.push({ id: idx, maxLength: parseInt(maxLen), answer });
      return `[${idx++}]`;
    });
    return { inputs: parsedInputs, normalizedPassage: normalized };
  };

  // Determine inputs and passage: CMS passageText (word[answer:N] format) > CMS blanks array > hardcoded
  let inputs:{id:number;maxLength:number;answer:string}[];
  let normalizedPassage: string = '';

  const rawCmsPassage = fillBlanksQuestion?.passageText || '';
  const hasCmsFormat = rawCmsPassage.includes(':[') || /\[[^\]]+:\d+\]/.test(rawCmsPassage);
  const hasNormalizedFormat = /\[\d+\]/.test(rawCmsPassage) && !hasCmsFormat;

  if (hasCmsFormat) {
    const parsed = parseCmsPassage(rawCmsPassage);
    inputs = parsed.inputs;
    normalizedPassage = parsed.normalizedPassage;
  } else if (hasNormalizedFormat) {
    const blanks:{id:number;maxLength:number;answer:string}[] = [];
    let idx = 0;
    rawCmsPassage.replace(/\[(\d+)\]/g, () => { blanks.push({ id: idx, maxLength: 5, answer: '' }); idx++; return ''; });
    inputs = blanks.length > 0 ? blanks : Array.from({length:10}, (_, i) => ({ id: i, maxLength: 5, answer: '' }));
    normalizedPassage = rawCmsPassage;
  } else if (fillBlanksQuestion?.blanks && fillBlanksQuestion.blanks.length > 0) {
    inputs = fillBlanksQuestion.blanks.map((blank: any, i: number) => ({ id: i, maxLength: blank.maxLength, answer: blank.answer }));
    normalizedPassage = rawCmsPassage;
  } else {
    inputs = [
      { id: 0, maxLength: 3, answer: 'ght' },
      { id: 1, maxLength: 2, answer: 'at' },
      { id: 2, maxLength: 3, answer: 'ple' },
      { id: 3, maxLength: 2, answer: 'ly' },
      { id: 4, maxLength: 3, answer: 'sic' },
      { id: 5, maxLength: 4, answer: 'ever' },
      { id: 6, maxLength: 1, answer: 's' },
      { id: 7, maxLength: 2, answer: 'om' },
      { id: 8, maxLength: 3, answer: 'ord' },
      { id: 9, maxLength: 4, answer: 'nces' },
    ];
  }

  const passageText = normalizedPassage;

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
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
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
                setShowReadNoticeTest(true);
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
        <div className="bg-white border-b border-gray-300 shrink-0">
          <div className="px-3 sm:px-8 py-2 sm:py-3">
            <div className="flex gap-4 sm:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 1-10
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-white overflow-auto">
          <div className="p-4 sm:p-5 md:p-12 pt-8 sm:pt-16 md:pt-24 flex flex-col items-center">
            <h1 className="mb-10 sm:mb-12 md:mb-14 text-xl sm:text-2xl md:text-[1.75rem] text-black font-bold font-['Inter',_sans-serif] text-center px-2">
              Fill in the missing letters in the paragraph.
            </h1>

            <div className="max-w-[900px] w-full text-lg sm:text-lg md:text-[1.25rem] leading-[1.8] sm:leading-relaxed md:leading-[1.8] text-black font-['Inter',_sans-serif] px-1 sm:px-4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {renderPassageWithInputs() || (
                <>
                  We know from drawings that have been preserved in caves for over 10,000 years that early humans performed dances as a group activity. We mi<input
                    type="text"
                    data-input-id="0"
                    className={`gap-input ${filledInputs[0] ? 'filled' : ''}`}
                    maxLength={inputs[0].maxLength}
                    value={inputValues[0] || ''}
                    onChange={(e) => handleInputChange(0, e.target.value)}
                    onFocus={() => handleFocus(0)}
                    onBlur={() => handleBlur(0)}
                    onKeyPress={(e) => handleKeyPress(e, 0)}
                    style={{ width: getInputWidth(0) }}
                  />{' '}think th
                  <input
                    type="text"
                    data-input-id="1"
                    className={`gap-input ${filledInputs[1] ? 'filled' : ''}`}
                    maxLength={inputs[1].maxLength}
                    value={inputValues[1] || ''}
                    onChange={(e) => handleInputChange(1, e.target.value)}
                    onFocus={() => handleFocus(1)}
                    onBlur={() => handleBlur(1)}
                    onKeyPress={(e) => handleKeyPress(e, 1)}
                    style={{ width: getInputWidth(1) }}
                  />{' '}prehistoric peo
                  <input
                    type="text"
                    data-input-id="2"
                    className={`gap-input ${filledInputs[2] ? 'filled' : ''}`}
                    maxLength={inputs[2].maxLength}
                    value={inputValues[2] || ''}
                    onChange={(e) => handleInputChange(2, e.target.value)}
                    onFocus={() => handleFocus(2)}
                    onBlur={() => handleBlur(2)}
                    onKeyPress={(e) => handleKeyPress(e, 2)}
                    style={{ width: getInputWidth(2) }}
                  />{' '}concentrated on
                  <input
                    type="text"
                    data-input-id="3"
                    className={`gap-input ${filledInputs[3] ? 'filled' : ''}`}
                    maxLength={inputs[3].maxLength}
                    value={inputValues[3] || ''}
                    onChange={(e) => handleInputChange(3, e.target.value)}
                    onFocus={() => handleFocus(3)}
                    onBlur={() => handleBlur(3)}
                    onKeyPress={(e) => handleKeyPress(e, 3)}
                    style={{ width: getInputWidth(3) }}
                  />{' '}on ly
                  <input
                    type="text"
                    data-input-id="4"
                    className={`gap-input ${filledInputs[4] ? 'filled' : ''}`}
                    maxLength={inputs[4].maxLength}
                    value={inputValues[4] || ''}
                    onChange={(e) => handleInputChange(4, e.target.value)}
                    onFocus={() => handleFocus(4)}
                    onBlur={() => handleBlur(4)}
                    onKeyPress={(e) => handleKeyPress(e, 4)}
                    style={{ width: getInputWidth(4) }}
                  />{' '}survival. How
                  <input
                    type="text"
                    data-input-id="5"
                    className={`gap-input ${filledInputs[5] ? 'filled' : ''}`}
                    maxLength={inputs[5].maxLength}
                    value={inputValues[5] || ''}
                    onChange={(e) => handleInputChange(5, e.target.value)}
                    onFocus={() => handleFocus(5)}
                    onBlur={() => handleBlur(5)}
                    onKeyPress={(e) => handleKeyPress(e, 5)}
                    style={{ width: getInputWidth(5) }}
                  />
                  <input
                    type="text"
                    data-input-id="6"
                    className={`gap-input ${filledInputs[6] ? 'filled' : ''}`}
                    maxLength={inputs[6].maxLength}
                    value={inputValues[6] || ''}
                    onChange={(e) => handleInputChange(6, e.target.value)}
                    onFocus={() => handleFocus(6)}
                    onBlur={() => handleBlur(6)}
                    onKeyPress={(e) => handleKeyPress(e, 6)}
                    style={{ width: getInputWidth(6) }}
                  />
                  <input
                    type="text"
                    data-input-id="7"
                    className={`gap-input ${filledInputs[7] ? 'filled' : ''}`}
                    maxLength={inputs[7].maxLength}
                    value={inputValues[7] || ''}
                    onChange={(e) => handleInputChange(7, e.target.value)}
                    onFocus={() => handleFocus(7)}
                    onBlur={() => handleBlur(7)}
                    onKeyPress={(e) => handleKeyPress(e, 7)}
                    style={{ width: getInputWidth(7) }}
                  />{' '}the rec
                  <input
                    type="text"
                    data-input-id="8"
                    className={`gap-input ${filledInputs[8] ? 'filled' : ''}`}
                    maxLength={inputs[8].maxLength}
                    value={inputValues[8] || ''}
                    onChange={(e) => handleInputChange(8, e.target.value)}
                    onFocus={() => handleFocus(8)}
                    onBlur={() => handleBlur(8)}
                    onKeyPress={(e) => handleKeyPress(e, 8)}
                    style={{ width: getInputWidth(8) }}
                  />{' '}that dan
                  <input
                    type="text"
                    data-input-id="9"
                    className={`gap-input ${filledInputs[9] ? 'filled' : ''}`}
                    maxLength={inputs[9].maxLength}
                    value={inputValues[9] || ''}
                    onChange={(e) => handleInputChange(9, e.target.value)}
                    onFocus={() => handleFocus(9)}
                    onBlur={() => handleBlur(9)}
                    onKeyPress={(e) => handleKeyPress(e, 9)}
                    style={{ width: getInputWidth(9) }}
                  /> was important to them.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Volume Control Dropdown */}
      <VolumeControl isOpen={isFBVolumeOpen} onClose={closeFBVolume} buttonRef={fbVolumeButtonRef} />
      
      <MobileQuestionNav 
        onBack={() => {
          setShowFillBlanksTest(false);
          setShowModule1Details(true);
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
          setShowReadNoticeTest(true);
        }}
      />
    </div>
  );
};

export default FillBlanksTestScreen;
