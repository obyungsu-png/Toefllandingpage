import React, { useState } from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface Module1IntroScreenProps {
  setShowModule1Intro: React.Dispatch<React.SetStateAction<boolean>>;
  setShowReadingSection: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToeflTest: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  setShowFillBlanksTest: React.Dispatch<React.SetStateAction<boolean>>;
  setShowReadingIntro: React.Dispatch<React.SetStateAction<boolean>>;
}

const Module1IntroScreen: React.FC<Module1IntroScreenProps> = ({
  setShowModule1Intro,
  setShowReadingSection,
  setShowToeflTest,
  testBankType,
  handleTabChange,
  setShowFillBlanksTest,
  setShowReadingIntro,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowModule1Intro(false);
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
        {/* Begin Button */}
        <button 
          className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
          onClick={() => {
            setShowModule1Intro(false);
            setShowFillBlanksTest(true);
          }}
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

      {/* Main content - Centered */}
      <div className="flex-1 flex items-start sm:items-center justify-center bg-white p-6 sm:p-12 pt-8 sm:pt-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-['Inter',_sans-serif] font-bold text-black mb-4 sm:mb-8">Module 1</h1>
          
          <div className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed space-y-4 sm:space-y-6">
            <p className="text-base sm:text-lg">
              The clock will show you how much time you have to complete Module 1.
            </p>
            
            <p className="text-base sm:text-lg">
              You can use <strong>Next</strong> and <strong>Back</strong> to move to the next question or return to previous questions within the same module.
            </p>

            <p className="text-base sm:text-lg">
              You WILL NOT be able to return to Module 1 once you have begun Module 2.
            </p>
          </div>
        </div>
      </div>
      
      <MobileQuestionNav 
        onBack={() => {
          setShowModule1Intro(false);
          setShowReadingIntro(true);
        }}
        onHome={() => {
          setShowModule1Intro(false);
          setShowReadingSection(false);
          setShowToeflTest(false);
          if (testBankType === 'tpo') {
            handleTabChange('TPO');
          } else {
            handleTabChange('Test');
          }
        }}
        onNext={() => {
          setShowModule1Intro(false);
          setShowFillBlanksTest(true);
        }}
      />
    </div>
  );
};

export default Module1IntroScreen;
