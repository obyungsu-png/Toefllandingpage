import React from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface ReadingSectionScreenProps {
  testBankType: 'tpo' | 'test' | 'training';
  onBackToHome: () => void;
  onBegin: () => void;
}

export const ReadingSectionScreen: React.FC<ReadingSectionScreenProps> = ({
  testBankType,
  onBackToHome,
  onBegin
}) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onBackToHome}
          >
            *toefl ibt
          </div>
        </div>
        {/* Begin Button */}
        <button 
          className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
          onClick={onBegin}
        >
          <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Begin</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-4 sm:px-8 py-2 sm:py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold text-sm sm:text-base">
            Reading
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-white flex items-start sm:items-center justify-center">
        <div className="max-w-4xl px-4 sm:px-8 py-6 sm:py-12">
          <h2 className="hidden sm:block text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Reading Section</h2>
          <div className="hidden sm:block w-24 h-1 bg-gray-300 mb-8"></div>
          
          <div className="space-y-4 sm:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed text-sm sm:text-base">
            <p>
              In the reading section, you will answer 35–48 questions to demonstrate how well you 
              understand academic and non-academic texts in English. There are three types of tasks.
            </p>

            <div className="my-4 sm:my-8">
              <table className="w-full border border-black text-sm sm:text-base">
                <thead>
                  <tr className="bg-[#2d7a7c] text-white">
                    <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">Type of Task</th>
                    <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Complete the Words</td>
                    <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Fill in the missing letters in a paragraph.</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Read in Daily Life</td>
                    <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Answer questions about everyday reading material.</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Read an Academic Passage</td>
                    <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Answer questions about academic passages.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <MobileQuestionNav 
        onHome={onBackToHome}
        onNext={onBegin}
        hideBack={true}
      />
    </div>
  );
};
