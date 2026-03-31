import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MobileFooter } from './MobileFooter';

interface WritingBuildSentenceQ10Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
  avatar1ImageUrl?: string;
  avatar2ImageUrl?: string;
  questionText?: string;
  words?: string[];
}

export function WritingBuildSentenceQ10({ 
  onBack, 
  onNext, 
  onHome, 
  onVolumeClick,
  avatar1ImageUrl,
  avatar2ImageUrl,
  questionText = 'What did you think of the movie?',
  words
}: WritingBuildSentenceQ10Props) {
  const defaultWords = ['thought', 'I', 'was', 'it', 'excellent'];
  const availableWordsInitial = words || defaultWords;
  
  const [sentenceSlots, setSentenceSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [availableWords, setAvailableWords] = useState<string[]>(availableWordsInitial);

  const capitalizeFirst = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  const handleWordClick = (word: string) => {
    const emptyIndex = sentenceSlots.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      const newSlots = [...sentenceSlots];
      newSlots[emptyIndex] = emptyIndex === 0 ? capitalizeFirst(word) : word;
      setSentenceSlots(newSlots);
      setAvailableWords(availableWords.filter(w => w !== word));
    }
  };

  const handleSlotClick = (index: number) => {
    const word = sentenceSlots[index];
    if (word) {
      const newSlots = [...sentenceSlots];
      newSlots[index] = null;
      setSentenceSlots(newSlots);
      const originalWord = word.charAt(0).toLowerCase() + word.slice(1);
      setAvailableWords([...availableWords, originalWord]);
    }
  };
  
  const getSlotWidth = (word: string | null) => {
    if (!word) return '120px';
    const baseWidth = 30;
    const charWidth = 11;
    return `${baseWidth + (word.length * charWidth)}px`;
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
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          )}
          
          <button 
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          
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

      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing | Question 10 of 10
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-['Inter',_sans-serif] font-bold text-black mb-8 md:mb-16 text-center">
            Make an appropriate sentence.
          </h2>
          
          <div className="space-y-8 md:space-y-12 mt-8 md:mt-16 px-2 md:pl-24 md:pr-8">
            <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0">
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
                {questionText}
              </div>
            </div>

            <div className="flex items-end gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0">
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
              
              <div className="flex-1 overflow-x-auto pb-2">
                <div className="flex flex-wrap items-end gap-2">
                  {sentenceSlots.map((word, index) => (
                    <div
                      key={index}
                      onClick={() => handleSlotClick(index)}
                      className="relative inline-flex flex-col cursor-pointer"
                      style={{ 
                        minWidth: getSlotWidth(word), 
                        width: word ? 'auto' : getSlotWidth(word),
                        paddingBottom: '8px'
                      }}
                    >
                      <div className="px-2 py-1 text-center">
                        <span className="text-sm md:text-xl font-['Inter',_sans-serif] text-gray-800 whitespace-nowrap">
                          {word || ''}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 border-b-2 border-gray-800"></div>
                    </div>
                  ))}
                  <span className="text-lg md:text-xl font-['Inter',_sans-serif] text-gray-800 pb-2">.</span>
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-16 flex flex-wrap gap-3 md:gap-4 justify-center">
              {availableWords.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleWordClick(word)}
                  className="px-4 py-2 md:px-6 md:py-3 bg-transparent hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm md:text-lg font-['Inter',_sans-serif] text-gray-800">
                    {word}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileFooter onBack={onBack} onHome={onHome} onNext={onNext} />
    </div>
  );
}
