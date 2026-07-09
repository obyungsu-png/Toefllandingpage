import React, { useState } from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface Module1DetailsScreenProps {
  setShowModule1Details: React.Dispatch<React.SetStateAction<boolean>>;
  setShowModule1Intro: React.Dispatch<React.SetStateAction<boolean>>;
  setShowReadingSection: React.Dispatch<React.SetStateAction<boolean>>;
  setShowToeflTest: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  setShowFillBlanksTest: React.Dispatch<React.SetStateAction<boolean>>;
}

const Module1DetailsScreen: React.FC<Module1DetailsScreenProps> = ({
  setShowModule1Details,
  setShowModule1Intro,
  setShowReadingSection,
  setShowToeflTest,
  testBankType,
  handleTabChange,
  setShowFillBlanksTest,
}) => {
  const [hideTime, setHideTime] = useState(false);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowModule1Details(false);
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
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300 flex items-center justify-between px-8 py-3">
        <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
          Reading
        </div>
        <div className="flex items-center gap-4">
          {!hideTime && (
            <div className="text-gray-700 font-['Inter',_sans-serif]">
              00:11:30
            </div>
          )}
          <button 
            className="flex items-center gap-2 text-[#1e6b73] hover:underline"
            onClick={() => setHideTime(!hideTime)}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            <span className="font-['Inter',_sans-serif]">{hideTime ? 'Show' : 'Hide'} Time</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-12 overflow-auto bg-white border border-black">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 pb-4 border-b-2 border-gray-300">
            Module 1
          </h1>
          
          <div className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed space-y-6 mt-6">
            <p>
              The clock will show you how much time you have to complete Module 1.
            </p>
            
            <p>
              You can use <span className="font-semibold">Next</span> and <span className="font-semibold">Back</span> to move to the next question or return to previous questions within the same module.
            </p>
            
            <p>
              You WILL NOT be able to return to Module 1 once you have begun Module 2.
            </p>
          </div>
        </div>
      </div>
      
      <MobileQuestionNav 
        onHome={() => {
          setShowModule1Details(false);
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
          setShowModule1Details(false);
          setShowFillBlanksTest(true);
        }}
        hideBack
      />
    </div>
  );
};

export default Module1DetailsScreen;
