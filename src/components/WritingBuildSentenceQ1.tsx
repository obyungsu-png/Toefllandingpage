import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface WritingBuildSentenceQ1Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick?: () => void;
}

export function WritingBuildSentenceQ1({ onBack, onNext, onHome, onVolumeClick }: WritingBuildSentenceQ1Props) {
  const [sentenceSlots, setSentenceSlots] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [availableWords, setAvailableWords] = useState<string[]>([
    'were', 'the', 'was', 'old city', 'showed us around', 'who', 'tour guides'
  ]);

  const handleWordClick = (word: string) => {
    // Add word to first empty slot
    const emptyIndex = sentenceSlots.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      const newSlots = [...sentenceSlots];
      newSlots[emptyIndex] = word;
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
      setAvailableWords([...availableWords, word]);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Top Header */}
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
          
          {/* Back Button */}
          <button 
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-md px-5 py-1.5 hover:bg-[#084d52] transition-colors"
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

      {/* Tab with Question number */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing | Question 1 of 10
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto bg-white border border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-black mb-16 text-center">
            Make an appropriate sentence.
          </h2>
          
          <div className="space-y-12 mt-16 pl-24 pr-8">
            {/* Woman avatar and question */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-xl font-['Inter',_sans-serif] text-gray-800">
                What was the highlight of your trip?
              </div>
            </div>

            {/* Man avatar and sentence building area */}
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#1e6b73] flex-shrink-0">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Sentence construction area */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex flex-nowrap items-center gap-1 mb-4">
                  {sentenceSlots.map((word, index) => (
                    <div
                      key={index}
                      onClick={() => handleSlotClick(index)}
                      className={`inline-flex items-center justify-center h-10 px-3 border-b-2 border-gray-800 cursor-pointer flex-shrink-0 transition-all duration-200 ${
                        word ? 'bg-white' : 'bg-gray-300'
                      }`}
                      style={{ minWidth: word ? `${word.length * 10 + 24}px` : '100px', width: word ? `${word.length * 10 + 24}px` : '100px' }}
                    >
                      <span className="text-xl font-['Inter',_sans-serif] text-gray-800 whitespace-nowrap">
                        {word || ''}
                      </span>
                    </div>
                  ))}
                  
                  <span className="text-xl font-['Inter',_sans-serif] text-gray-800 flex-shrink-0">.</span>
                </div>
              </div>
            </div>

            {/* Available words */}
            <div className="mt-16 flex flex-wrap gap-4 justify-center">
              {availableWords.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleWordClick(word)}
                  className="px-6 py-3 bg-white hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg font-['Inter',_sans-serif] text-gray-800">
                    {word}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}