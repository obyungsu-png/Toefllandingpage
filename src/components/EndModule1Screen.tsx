import React from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface ScoreData {
  correct: number;
  total: number;
}

// 2026 New TOEFL: Raw score (0-30) → Band Score (1-6) conversion
const convertToBand = (rawScore30: number): number => {
  if (rawScore30 >= 29) return 6.0;
  if (rawScore30 >= 25) return 5.5;
  if (rawScore30 >= 22) return 5.0;
  if (rawScore30 >= 19) return 4.5;
  if (rawScore30 >= 16) return 4.0;
  if (rawScore30 >= 13) return 3.5;
  if (rawScore30 >= 10) return 3.0;
  if (rawScore30 >= 7) return 2.5;
  if (rawScore30 >= 4) return 2.0;
  if (rawScore30 >= 2) return 1.5;
  return 1.0;
};

// CEFR Level based on band score
const getCEFRLevel = (band: number) => {
  if (band >= 5.5) return { cefr: 'C2', label: 'Expert', color: 'text-purple-600', bg: 'bg-purple-50' };
  if (band >= 4.5) return { cefr: 'C1', label: 'Advanced', color: 'text-green-600', bg: 'bg-green-50' };
  if (band >= 3.5) return { cefr: 'B2', label: 'Upper-Int', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (band >= 2.5) return { cefr: 'B1', label: 'Intermediate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  if (band >= 1.5) return { cefr: 'A2', label: 'Elementary', color: 'text-orange-600', bg: 'bg-orange-50' };
  return { cefr: 'A1', label: 'Beginner', color: 'text-red-600', bg: 'bg-red-50' };
};

interface EndModule1ScreenProps {
  setShowEndModule1: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  saveSectionResultToHistory: (
    category: 'Reading' | 'Listening' | 'Writing' | 'Speaking',
    totalQuestions: number,
    module?: number
  ) => { correct: number; total: number };
  setShowModule2: React.Dispatch<React.SetStateAction<boolean>>;
  setShowModule1Question20: React.Dispatch<React.SetStateAction<boolean>>;
  initialScore?: ScoreData | null;
}

const EndModule1Screen: React.FC<EndModule1ScreenProps> = ({
  setShowEndModule1,
  testBankType,
  handleTabChange,
  saveSectionResultToHistory,
  setShowModule2,
  setShowModule1Question20,
  initialScore
}) => {
  const score = initialScore || null;
  const percentage = score ? Math.round((score.correct / score.total) * 100) : 0;

  // TOEFL Reading 환산 점수 (간략화)
  const toeflEstimate = score ? Math.max(0, Math.min(30, Math.round((score.correct / score.total) * 28 + 1))) : 0;

  // 2026 New TOEFL Band Score
  const bandScore = convertToBand(toeflEstimate);
  const cefrLevel = getCEFRLevel(bandScore);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowEndModule1(false);
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
        <div className="flex items-center gap-3">
          {/* Next Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowEndModule1(false);
              const result = saveSectionResultToHistory('Reading', 20, 1);
              setShowModule2(true);
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Reading — Module 1 (Complete Words)
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-12 overflow-auto bg-white flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center px-6">
          {/* Check icon */}
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            score && percentage >= 70 ? 'bg-green-100' : score && percentage >= 40 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <span className={`text-5xl font-bold ${
              score && percentage >= 70 ? 'text-green-600' : score && percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {score ? `${percentage}%` : '-'}
            </span>
          </div>

          <h1 className="text-2xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-3">Module 1 Complete!</h1>
          <p className="text-base font-['Inter',_sans-serif] text-gray-600 mb-8">
            Complete Words section finished. Continue to Module 2.
          </p>

          {/* Score Card - 2026 Band Score Format */}
          {score && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
              {/* Main Score Circle (Band) */}
              <div className="flex justify-center mb-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-md ${
                  bandScore >= 4.5 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                  bandScore >= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                  'bg-gradient-to-br from-red-400 to-red-600'
                }`}>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{bandScore}</p>
                    <p className="text-xs text-white/80">/ 6.0</p>
                  </div>
                </div>
              </div>

              {/* CEFR Badge */}
              <div className="flex justify-center mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${cefrLevel.bg} ${cefrLevel.color}`}>
                  CEFR {cefrLevel.cefr} — {cefrLevel.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Correct</p>
                  <p className="text-2xl font-bold text-green-600">{score.correct}</p>
                  <p className="text-xs text-gray-400">/ {score.total}</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Accuracy</p>
                  <p className={`text-2xl font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {percentage}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Legacy Est.</p>
                  <p className="text-xl font-bold text-[#1e6b73]">{toeflEstimate}</p>
                  <p className="text-[10px] text-gray-400">/ 30</p>
                </div>
              </div>

              {/* 2026 New TOEFL Note */}
              <p className="mt-3 pt-3 border-t border-gray-200 text-[10px] text-gray-400 text-center">
                * 2026 신토플: Reading Band Score (Module 1 of 2)
              </p>
            </div>
          )}
        </div>
      </div>
      
      <MobileQuestionNav 
        onBack={() => {
          setShowEndModule1(false);
          setShowModule1Question20(true);
        }}
        onHome={() => {
          setShowEndModule1(false);
          if (testBankType === 'tpo') {
            handleTabChange('TPO');
          } else {
            handleTabChange('Test');
          }
        }}
        onNext={() => {
          setShowEndModule1(false);
          setShowModule2(true);
        }}
      />
    </div>
  );
};

export default EndModule1Screen;
