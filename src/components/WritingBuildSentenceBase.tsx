import React, { useEffect, useRef, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MobileFooter } from './MobileFooter';

export interface WritingBuildSentenceProps {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  avatar1ImageUrl?: string;
  avatar2ImageUrl?: string;
  questionText?: string;
  words?: string[];
  sentenceEnding?: '.' | '?';
  context?: string;
}

interface WritingBuildSentenceBaseProps extends WritingBuildSentenceProps {
  questionNumber: number;
  slotCount: number;
}

export function WritingBuildSentenceBase({
  onBack,
  onNext,
  onHome,
  onVolumeClick,
  avatar1ImageUrl,
  avatar2ImageUrl,
  questionText,
  words,
  sentenceEnding = '.',
  context,
  questionNumber,
  slotCount,
}: WritingBuildSentenceBaseProps) {
  const sourceWords = words || [];
  
  // Parse words: [word] = prefilled (shown in sentence, not draggable), others = draggable blanks
  const parsedWords = sourceWords.map(w => ({
    text: w.replace(/^\[|\]$/g, ''),
    prefilled: w.startsWith('[') && w.endsWith(']'),
  }));
  const draggableWords = parsedWords.filter(w => !w.prefilled).map(w => w.text);
  const effectiveSlotCount = draggableWords.length; // blanks = draggable words only

  // Shuffle the Word Bank display order so it doesn't just show the words
  // in the already-correct sentence order (which would give the answer away).
  // Computed once per question (stable while dragging/answering) via a
  // Fisher-Yates shuffle seeded by the word list itself.
  const shuffledDraggableWords = React.useMemo(() => {
    const arr = draggableWords.map((text, originalIndex) => ({ text, originalIndex }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggableWords.join('|')]);
  const [sentenceSlots, setSentenceSlots] = useState<(string | null)[]>(() => Array(effectiveSlotCount).fill(null));
  const [timeRemaining, setTimeRemaining] = useState<number>(420);
  const [showTime, setShowTime] = useState<boolean>(true);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const draggedWordRef = useRef<string | null>(null);

  useEffect(() => {
    setSentenceSlots(Array(effectiveSlotCount).fill(null));
  }, [effectiveSlotCount, draggableWords.join(',')]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isComplete = sentenceSlots.every(slot => slot !== null);

  // Save answer to window.__writingBsAnswers for review
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isComplete) {
      const assembled = sentenceSlots.filter(Boolean).join(' ') + (sentenceEnding || '.');
      const existing = (window as any).__writingBsAnswers || {};
      (window as any).__writingBsAnswers = { ...existing, [questionNumber]: assembled };
    }
  }, [sentenceSlots, isComplete, questionNumber, sentenceEnding]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const capitalizeFirst = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

  const normalizeWord = (word: string | null) => (word || '').trim().toLowerCase();

  const getUsedCount = (word: string) => {
    const normalizedWord = normalizeWord(word);
    return sentenceSlots.filter(slot => normalizeWord(slot) === normalizedWord).length;
  };

  const getOccurrenceIndex = (index: number) => {
    const word = draggableWords[index];
    return draggableWords.slice(0, index + 1).filter(candidate => normalizeWord(candidate) === normalizeWord(word)).length;
  };

  const canUseWord = (word: string) => getUsedCount(word) < draggableWords.filter(candidate => normalizeWord(candidate) === normalizeWord(word)).length;

  const handleSlotClick = (index: number) => {
    if (!sentenceSlots[index]) {
      return;
    }

    const newSlots = [...sentenceSlots];
    newSlots[index] = null;
    setSentenceSlots(newSlots);
  };

  const getEmptySlotWidth = () => '120px';

  const handleDragStart = (e: React.DragEvent, word: string) => {
    if (!canUseWord(word)) {
      e.preventDefault();
      return;
    }
    draggedWordRef.current = word;
    setDraggedWord(word);
    setDragOverSlotIndex(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', word);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (sentenceSlots[index] === null) {
      setDragOverSlotIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (sentenceSlots[index] === null) {
      setDragOverSlotIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverSlotIndex(null);

    const droppedWord = draggedWordRef.current || draggedWord || e.dataTransfer.getData('text/plain');
    if (!droppedWord || sentenceSlots[index] !== null || !canUseWord(droppedWord)) {
      draggedWordRef.current = null;
      setDraggedWord(null);
      return;
    }

    const newSlots = [...sentenceSlots];
    newSlots[index] = index === 0 ? capitalizeFirst(droppedWord) : droppedWord;
    setSentenceSlots(newSlots);
    draggedWordRef.current = null;
    setDraggedWord(null);
  };

  const handleDragEnd = () => {
    draggedWordRef.current = null;
    setDraggedWord(null);
    setDragOverSlotIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
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
          {onVolumeClick && (
            <button
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
              onClick={onVolumeClick}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
          )}

          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>

          <button
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={onNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing | Question {questionNumber} of 10
          </div>

          <div className="flex items-center gap-4">
            {showTime && (
              <div className="text-gray-700 font-['Inter',_sans-serif] font-semibold">
                {formatTime(timeRemaining)}
              </div>
            )}
            <button
              onClick={() => setShowTime(!showTime)}
              className="flex items-center gap-2 text-[#1e6b73] hover:text-[#0A6068] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                {showTime ? (
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                ) : (
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                )}
              </svg>
              <span className="font-['Inter',_sans-serif] font-semibold">{showTime ? 'Hide Time' : 'Show Time'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-6 text-center">
            Make an appropriate sentence.
          </h2>

          {/* 상황 설명 (context) — 질문 위에 표시되는 맥락 */}
          {context && (
            <div className="mb-6 md:mb-10 mx-auto max-w-3xl bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 md:px-6 md:py-4">
              <p className="text-sm md:text-base text-gray-700 leading-relaxed font-['Inter',_sans-serif]">
                {context}
              </p>
            </div>
          )}

          <div className="space-y-6 md:space-y-10 mt-10 md:mt-20 px-2 md:pl-12 md:pr-8">
            {/* 질문 영역 (avatar1) */}
            <div>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0">
                  {avatar1ImageUrl ? (
                    <ImageWithFallback src={avatar1ImageUrl} alt="Question person" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 md:w-12 md:h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-base md:text-xl font-['Inter',_sans-serif] text-gray-800">
                  {questionText || ''}
                </div>
              </div>
            </div>

            {/* 답변 영역 (avatar2) */}
            <div>
              <div className="flex items-end gap-4 md:gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0 mb-[-4px]">
                  {avatar2ImageUrl ? (
                    <ImageWithFallback src={avatar2ImageUrl} alt="Answer person" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 md:w-12 md:h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-x-auto">
                  <div className={`flex flex-wrap items-end ${isComplete ? 'gap-0.5 md:gap-1' : 'gap-1.5 md:gap-2'}`}>
                    {(() => {
                      let slotIdx = 0;
                      return parsedWords.map((pw, i) => {
                        if (pw.prefilled) {
                          // Fixed text — not draggable
                          return (
                            <span key={`pre-${i}`} className="text-sm md:text-xl font-['Inter',_sans-serif] text-[#1f2937] pb-2 whitespace-nowrap">
                              {pw.text}
                            </span>
                          );
                        }
                        const si = slotIdx++;
                        const word = sentenceSlots[si];
                        return (
                          <div
                            key={`slot-${si}`}
                            onClick={() => word ? handleSlotClick(si) : undefined}
                            onDragEnter={(e) => handleDragEnter(e, si)}
                            onDragOver={(e) => handleDragOver(e, si)}
                            onDragLeave={() => { if (dragOverSlotIndex === si) setDragOverSlotIndex(null); }}
                            onDrop={(e) => handleDrop(e, si)}
                            className={`relative inline-flex min-h-[48px] flex-col justify-end transition-colors ${word ? 'cursor-pointer' : ''}`}
                            style={{ minWidth: word ? '0px' : getEmptySlotWidth(), width: word ? 'fit-content' : getEmptySlotWidth(), paddingBottom: '4px' }}
                          >
                            <div className={`rounded-sm py-1 text-center ${isComplete ? 'px-1 md:px-1.5' : 'px-2'} ${dragOverSlotIndex === si && !word ? 'bg-[#eef4f3]' : ''}`}>
                              <span className="text-sm md:text-xl font-['Inter',_sans-serif] text-[#1f2937] whitespace-nowrap">{word || ''}</span>
                            </div>
                            <div className={`absolute bottom-0 left-0 right-0 border-b-2 ${dragOverSlotIndex === si && !word ? 'border-[#2a8a8d]' : 'border-gray-800'}`}></div>
                          </div>
                        );
                      });
                    })()}
                    <span className="text-lg md:text-xl font-['Inter',_sans-serif] text-gray-800 pb-2">{sentenceEnding}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Word Bank — 드래그할 단어들 (라벨 없이 단어만 표시) */}
            <div className="mt-8 md:mt-12">
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                {shuffledDraggableWords.map(({ text: word, originalIndex }) => {
                  const usedCount = getUsedCount(word);
                  const isSelected = getOccurrenceIndex(originalIndex) <= usedCount;

                  return (
                    <button
                      key={`${word}-${originalIndex}`}
                      type="button"
                      draggable={!isSelected}
                      onDragStart={(e) => handleDragStart(e, word)}
                      onDragEnd={handleDragEnd}
                      className={`px-3 py-1 text-left transition-colors md:px-4 md:py-1.5 ${
                        isSelected
                          ? 'bg-[#e5e7eb] text-[#6b7280] cursor-default'
                          : 'bg-transparent text-[#343434] cursor-grab active:cursor-grabbing hover:bg-[#faf7f0]'
                      }`}
                    >
                      <span className="text-sm md:text-lg font-['Inter',_sans-serif]">
                        {word}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileFooter onBack={onBack} onHome={onHome} onNext={onNext} />
    </div>
  );
}