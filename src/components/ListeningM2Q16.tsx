import { useState } from 'react';

interface ListeningM2Q16Props {
  onBack: () => void;
  onNext: () => void;
  onHome: () => void;
  onVolumeClick: () => void;
}

export function ListeningM2Q16({ onBack, onNext, onHome, onVolumeClick }: ListeningM2Q16Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const answerOptions = [
    "How information about ecological footprints has been used in creating policies",
    "How data about ecological footprints has been collected",
    "Why the idea of ecological footprint is often misunderstood",
    "Why sustainable development can be difficult to achieve"
  ];

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
          <button 
            className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onVolumeClick}
          >
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

      {/* Tab with Question number */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Listening
            </div>
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question 16 of 16
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto bg-white border border-black">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex gap-16 items-start justify-center pl-12 mt-12">
            {/* Left side - Image */}
            <div className="flex-shrink-0">
              <div className="w-96 h-96 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                <svg className="w-24 h-24 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            </div>

            {/* Right side - Options */}
            <div className="flex-1 max-w-xl mt-8">
              <h2 className="font-['Inter',_sans-serif] font-bold text-gray-800 mb-6 text-lg">What will the speaker most likely discuss next?</h2>
              <div className="space-y-6">
                {answerOptions.map((option, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <input
                        type="radio"
                        id={`m2-q16-option-${index}`}
                        name="m2-q16"
                        value={option}
                        checked={selectedAnswer === option}
                        onChange={() => setSelectedAnswer(option)}
                        className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] ${
                          selectedAnswer === option
                            ? 'border-[#0d9488]'
                            : 'border-black'
                        }`}
                      />
                      {selectedAnswer === option && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                      )}
                    </div>
                    <label htmlFor={`m2-q16-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}