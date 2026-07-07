import React, { useState, useEffect } from 'react';
import { ResizableReadingLayout } from './ResizableReadingLayout';
import { RadioOption } from './RadioOption';
import { MobileQuestionNav } from './MobileQuestionNav';
import { VolumeControl, useVolumeControl } from './VolumeControl';

export type ReadingScreen =
  | 'intro' | 'm1-intro' | 'm1-details'
  | 'fill-blanks'
  | 'notice-1' | 'notice-2'
  | 'social-1' | 'social-2' | 'social-3'
  | 'q16' | 'q17' | 'q18' | 'q19' | 'q20'
  | 'end-m1'
  | 'm2-intro' | 'm2-fill-blanks'
  | 'm2-q11' | 'm2-q12' | 'm2-q13' | 'm2-q14' | 'm2-q15'
  | 'm2-q16' | 'm2-q17' | 'm2-q18' | 'm2-q19' | 'm2-q20'
  | 'complete';

interface ReadingSectionWrapperProps {
  initialScreen: ReadingScreen;
  testBankType: 'tpo' | 'test';
  onHome: () => void;
  onComplete: () => void;
}

export function ReadingSectionWrapper({
  initialScreen,
  testBankType,
  onHome,
  onComplete,
}: ReadingSectionWrapperProps) {
  const [currentScreen, setCurrentScreen] = useState<ReadingScreen>(initialScreen);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAnswer2, setSelectedAnswer2] = useState<string | null>(null);
  const [selectedAnswer3, setSelectedAnswer3] = useState<string | null>(null);
  const [selectedAnswer4, setSelectedAnswer4] = useState<string | null>(null);
  const [selectedAnswer5, setSelectedAnswer5] = useState<string | null>(null);
  const [selectedAnswer16, setSelectedAnswer16] = useState<string | null>(null);
  const [selectedAnswer17, setSelectedAnswer17] = useState<string | null>(null);
  const [selectedAnswer18, setSelectedAnswer18] = useState<string | null>(null);
  const [selectedAnswer19, setSelectedAnswer19] = useState<string | null>(null);
  const [selectedAnswer20, setSelectedAnswer20] = useState<string | null>(null);
  
  const [zoom16, setZoom16] = useState(1);
  const [zoom17, setZoom17] = useState(1);
  const [zoom18, setZoom18] = useState(1);
  const [zoom19, setZoom19] = useState(1);
  const [zoom20, setZoom20] = useState(1);

  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  const goToScreen = (screen: ReadingScreen) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    const screens: ReadingScreen[] = [
      'intro', 'm1-intro', 'fill-blanks',
      'notice-1', 'notice-2',
      'social-1', 'social-2', 'social-3',
      'q16', 'q17', 'q18', 'q19', 'q20',
      'end-m1',
      'm2-intro', 'm2-fill-blanks',
      'm2-q11', 'm2-q12', 'm2-q13', 'm2-q14', 'm2-q15',
      'm2-q16', 'm2-q17', 'm2-q18', 'm2-q19', 'm2-q20',
      'complete'
    ];
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex > 0) {
      setCurrentScreen(screens[currentIndex - 1]);
    }
  };

  // Hardware/browser Back button (dispatched from App.tsx) reuses this same goBack
  useEffect(() => {
    const handler = () => goBack();
    window.addEventListener('toefl:hardware-back', handler);
    return () => window.removeEventListener('toefl:hardware-back', handler);
  }, [currentScreen]);

  const goNext = () => {
    const screens: ReadingScreen[] = [
      'intro', 'm1-intro', 'fill-blanks',
      'notice-1', 'notice-2',
      'social-1', 'social-2', 'social-3',
      'q16', 'q17', 'q18', 'q19', 'q20',
      'end-m1',
      'm2-intro', 'm2-fill-blanks',
      'm2-q11', 'm2-q12', 'm2-q13', 'm2-q14', 'm2-q15',
      'm2-q16', 'm2-q17', 'm2-q18', 'm2-q19', 'm2-q20',
      'complete'
    ];
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex < screens.length - 1) {
      setCurrentScreen(screens[currentIndex + 1]);
    } else {
      onComplete();
    }
  };

  // Render current screen
  switch (currentScreen) {
    case 'intro':
      return (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
          {/* Top Header */}
          <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
            <div className="flex items-center">
              <div 
                className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onHome}
              >
                *toefl ibt
              </div>
            </div>
            
            {/* Begin Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
              onClick={() => goToScreen('m1-intro')}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Begin</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>

          {/* Tab */}
          <div className="bg-white border-b border-gray-300">
            <div className="px-4 sm:px-8 py-2 sm:py-3">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block text-sm sm:text-base">
                Reading
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto bg-white flex items-start sm:items-center justify-center pb-20 sm:pb-0">
            <div className="max-w-4xl px-4 sm:px-8 py-6 sm:py-12">
              <h2 className="hidden sm:block text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Reading Section</h2>
              <div className="hidden sm:block w-24 h-1 bg-gray-300 mb-8"></div>
              
              <div className="space-y-4 sm:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed text-sm sm:text-base">
                <p>
                  In the reading section, you will answer 35–48 questions to demonstrate how well you understand academic and non-academic texts in English. There are three types of tasks.
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
            onHome={onHome}
            onNext={goNext}
            hideBack={true}
          />
        </div>
      );

    case 'm1-intro':
      return (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
          <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
            <div className="flex items-center">
              <div 
                className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onHome}
              >
                *toefl ibt
              </div>
            </div>
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
              onClick={goNext}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Begin</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>

          <div className="bg-white border-b border-gray-300">
            <div className="px-4 sm:px-8 py-2 sm:py-3">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold text-sm sm:text-base">
                Reading
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-start sm:items-center justify-center bg-white p-6 sm:p-12 pt-8 sm:pt-12 pb-20 sm:pb-12">
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
            onBack={goBack}
            onHome={onHome}
            onNext={goNext}
          />
        </div>
      );

    case 'complete':
      return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
            <div className="flex items-center">
              <div 
                className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onHome}
              >
                *toefl ibt
              </div>
            </div>
          </div>

          <div className="bg-white border-b border-gray-300">
            <div className="px-8 py-3">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
                Reading
              </div>
            </div>
          </div>

          <div className="flex-1 p-12 overflow-auto bg-white flex items-center justify-center pb-20 sm:pb-12">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-6 flex justify-center">
                <svg className="w-10 h-10 text-[#1e6b73]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-4">Reading Section Complete!</h1>
              <p className="text-lg font-['Inter',_sans-serif] text-gray-600 mb-8">
                You have completed all 20 reading questions. Your results have been saved and can be reviewed in the History tab.
              </p>
            </div>
          </div>
          
          <MobileQuestionNav 
            onBack={goBack}
            onHome={onHome}
            onNext={onComplete}
            nextLabel="Listening"
          />
        </div>
      );

    default:
      return (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <p>Screen: {currentScreen}</p>
        </div>
      );
  }
}
