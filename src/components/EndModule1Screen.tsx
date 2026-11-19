import React from 'react';
import { SectionCompletionScreen } from './SectionCompletionScreen';
import { readingRawToBand, scaleRawScore } from '../utils/bandScore';

interface ScoreData {
  correct: number;
  total: number;
}

// 2026 Reading 밴드 — utils/bandScore 공식 표 (raw 0-22). M1 단독은 참고용 부분점수.
const convertToBand = (rawScore: number): number => readingRawToBand(rawScore);

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
  handleTabChange: (tab: any) => void;
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

  // 2026 표: correct/total → Reading raw(0-22) 선형 스케일 → 밴드 (M1 단독은 참고용)
  const toeflEstimate = score ? scaleRawScore('Reading', score.correct, score.total) : 0;
  const bandScore = convertToBand(toeflEstimate);
  const cefrLevel = getCEFRLevel(bandScore);

  const handleHome = () => {
    setShowEndModule1(false);
    handleTabChange(testBankType === 'tpo' ? 'TPO' : 'Test');
  };
  const handleNext = () => {
    setShowEndModule1(false);
    saveSectionResultToHistory('Reading', 20, 1);
    setShowModule2(true);
  };
  const handleBack = () => {
    setShowEndModule1(false);
    setShowModule1Question20(true);
  };

  return (
    <SectionCompletionScreen section="Reading — Module 1" onHome={handleHome} onBack={handleBack} onNext={handleNext}>
      <div className="min-h-full p-6 md:p-12 bg-white flex items-center justify-center">
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
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Raw Score</p>
                  <p className="text-xl font-bold text-[#1e6b73]">{toeflEstimate}</p>
                  <p className="text-[10px] text-gray-400">/ 22</p>
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
    </SectionCompletionScreen>
  );
};

export default EndModule1Screen;
