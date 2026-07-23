import React from 'react';

interface ToeflTestScreenProps {
  testBankType: 'tpo' | 'test' | 'training';
  currentTest?: { section: string } | null | undefined;
  onBackToHome: () => void;
  onContinue: () => void;
}

export const ToeflTestScreen: React.FC<ToeflTestScreenProps> = ({
  testBankType,
  currentTest,
  onBackToHome,
  onContinue
}) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#2d7a7c] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onBackToHome}
          >
            *toefl ibt
          </div>
        </div>
        {/* Continue Button */}
        <button 
          className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
          onClick={() => {
            if (currentTest?.section === 'Reading') {
              onContinue();
            }
          }}
        >
          <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Continue</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Reading
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-auto bg-white border border-black">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 pb-4 border-b-2 border-gray-300">Reading Section</h1>
          
          <div className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed mb-8 mt-6">
            <p>
              In the reading section, you will answer 35–48 questions to demonstrate how well you 
              understand academic and non-academic texts in English. There are three types of tasks.
            </p>
          </div>

          {/* Task table */}
          <div className="border border-black overflow-hidden inline-block">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2d7a7c] text-white">
                  <th className="px-6 py-3 text-left font-['Inter',_sans-serif] border-r-2 border-black">Type of Task</th>
                  <th className="px-6 py-3 text-left font-['Inter',_sans-serif]">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b-2 border-black">
                  <td className="px-6 py-3 font-['Inter',_sans-serif] border-r-2 border-black">Complete the Words</td>
                  <td className="px-6 py-3 font-['Inter',_sans-serif]">
                    Fill in the missing letters in a paragraph.
                  </td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="px-6 py-3 font-['Inter',_sans-serif] border-r-2 border-black">Read in Daily Life</td>
                  <td className="px-6 py-3 font-['Inter',_sans-serif]">
                    Answer questions about everyday reading material.
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-['Inter',_sans-serif] border-r-2 border-black">Read an Academic Passage</td>
                  <td className="px-6 py-3 font-['Inter',_sans-serif]">
                    Answer questions about academic passages.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
