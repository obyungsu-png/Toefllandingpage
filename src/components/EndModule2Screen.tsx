import React from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface ScoreData {
  correct: number;
  total: number;
  module1Correct?: number;
  module1Total?: number;
  module2Correct?: number;
  module2Total?: number;
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

interface EndModule2ScreenProps {
  setShowEndModule2: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: any) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  setActiveListeningM1Screen: React.Dispatch<React.SetStateAction<any>>;
  setShowModule2Question20: React.Dispatch<React.SetStateAction<boolean>>;
  readingScore?: ScoreData | null;
}

const EndModule2Screen: React.FC<EndModule2ScreenProps> = ({
  setShowEndModule2,
  testBankType,
  handleTabChange,
  setActiveTab,
  setActiveListeningM1Screen,
  setShowModule2Question20,
  readingScore
}) => {
  const score = readingScore || null;
  const percentage = score ? Math.round((score.correct / score.total) * 100) : 0;

  // TOEFL Reading 환산 점수 (0-30 scale)
  const toeflEstimate = score ? Math.max(0, Math.min(30, Math.round((score.correct / score.total) * 28 + 1))) : 0;

  // 2026 New TOEFL Band Score & CEFR
  const bandScore = convertToBand(toeflEstimate);
  const cefrLevel = getCEFRLevel(bandScore);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-14 md:h-16 flex items-center justify-between px-3 md:px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-base md:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowEndModule2(false);
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
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* View Results Button */}
          <button 
            className="flex items-center gap-1 md:gap-2 bg-[#0A6068] border border-white rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-[#084d52] transition-colors"
            onClick={() => {
              setShowEndModule2(false);
              setActiveTab('History');
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zM5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0 1.1.9-2 2-2z"/>
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-xs md:text-base">View Results</span>
          </button>
          {/* Continue to Listening Button */}
          <button 
            className="flex items-center gap-1 md:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowEndModule2(false);
              setActiveListeningM1Screen('intro');
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs md:text-base">Continue to Listening</span>
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
            Reading — Complete
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-white flex items-center justify-center py-8">
        <div className="max-w-xl mx-auto text-center px-6 w-full">
          {/* Big Score Circle */}
          <div className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg ${
            score && percentage >= 70 ? 'bg-gradient-to-br from-green-400 to-green-600' :
            score && percentage >= 40 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
            score ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gray-200'
          }`}>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{score ? percentage : '-'}</p>
              <p className="text-xs text-white/80">%</p>
            </div>
          </div>

          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-2">Reading Section Complete!</h1>
          
          {/* CEFR Badge - 2026 New TOEFL */}
          <div className="mb-4">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${cefrLevel.bg} ${cefrLevel.color}`}>
              CEFR {cefrLevel.cefr} — {cefrLevel.label} | Band Score: {bandScore}/6.0
            </span>
          </div>

          {/* Detailed Score Card - 2026 Band Score Format */}
          {score && (() => {
            const m1c = score.module1Correct ?? 0;
            const m1t = score.module1Total ?? 0;
            const m2c = score.module2Correct ?? Math.max(0, score.correct - m1c);
            const m2t = score.module2Total ?? Math.max(0, score.total - m1t);
            const m1pct = m1t > 0 ? Math.round((m1c / m1t) * 100) : 0;
            const m2pct = m2t > 0 ? Math.round((m2c / m2t) * 100) : 0;
            const hasM1 = m1t > 0;
            return (
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">2026 TOEFL Reading — 전체 점수</h3>

              {/* ── M1 / M2 / Total 나란히 카드 ── */}
              <div className={`grid ${hasM1 ? 'grid-cols-3' : 'grid-cols-1'} gap-3 mb-5`}>
                {hasM1 && (
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2">Module 1</p>
                    <p className="text-3xl font-bold text-blue-700">{m1c}<span className="text-base text-blue-400"> / {m1t}</span></p>
                    <p className="text-xs text-blue-500 mt-1 font-medium">{m1pct}%</p>
                    <p className="text-[10px] text-blue-400 mt-1">Complete Words</p>
                  </div>
                )}
                {hasM1 && (
                  <div className="bg-purple-50 border-2 border-purple-100 rounded-xl p-4 text-center">
                    <p className="text-[11px] font-bold text-purple-500 uppercase tracking-wider mb-2">Module 2</p>
                    <p className="text-3xl font-bold text-purple-700">{m2c}<span className="text-base text-purple-400"> / {m2t}</span></p>
                    <p className="text-xs text-purple-500 mt-1 font-medium">{m2pct}%</p>
                    <p className="text-[10px] text-purple-400 mt-1">Passage</p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-[#1e6b73] to-teal-600 rounded-xl p-4 text-center text-white shadow-md">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-2">Total</p>
                  <p className="text-3xl font-bold">{score.correct}<span className="text-base opacity-70"> / {score.total}</span></p>
                  <p className="text-xs opacity-80 mt-1 font-medium">{percentage}%</p>
                  <p className="text-[10px] opacity-70 mt-1">Band {bandScore} / 6.0</p>
                </div>
              </div>

              {/* Legacy / CEFR summary */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Accuracy</p>
                  <p className={`text-lg font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{percentage}%</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Legacy Est.</p>
                  <p className="text-lg font-bold text-[#1e6b73]">{toeflEstimate}<span className="text-xs text-gray-400"> / 30</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Wrong</p>
                  <p className="text-lg font-bold text-red-500">{score.total - score.correct}</p>
                </div>
              </div>

              <div className="mt-4 bg-teal-50 rounded-lg p-3 border border-teal-100">
                <p className="text-[11px] text-teal-700 font-medium text-center">
                  * 2026 신토플 Reading 영역: Band Score 기반 평가 | CEFR {cefrLevel.cefr} ({cefrLevel.label})
                </p>
              </div>
            </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="flex items-center justify-center gap-2 bg-[#1e6b73] text-white rounded-lg px-6 py-3 hover:bg-[#165b62] transition-colors font-['Inter',_sans-serif] font-semibold shadow-md"
              onClick={() => {
                setShowEndModule2(false);
                setActiveListeningM1Screen('intro');
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 12h.01M8 12a4 4 0 014-4"/>
              </svg>
              Continue to Listening Section
            </button>
            <button 
              className="flex items-center justify-center gap-2 bg-white border-2 border-[#1e6b73] text-[#1e6b73] rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-['Inter',_sans-serif] font-semibold shadow-sm"
              onClick={() => {
                setShowEndModule2(false);
                setActiveTab('History');
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              View Results in History
            </button>
          </div>
        </div>
      </div>
      
      <MobileQuestionNav 
        onBack={() => {
          setShowEndModule2(false);
          setShowModule2Question20(true);
        }}
        onHome={() => {
          setShowEndModule2(false);
          if (testBankType === 'tpo') {
            handleTabChange('TPO');
          } else {
            handleTabChange('Test');
          }
        }}
        onNext={() => {
          setShowEndModule2(false);
          setActiveListeningM1Screen('intro');
        }}
      />
    </div>
  );
};

export default EndModule2Screen;
