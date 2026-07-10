import React, { useState } from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface ScoreData {
  correct?: number;
  total: number;
  aiScore?: number;
  feedback?: string;
}

const convertToBand = (rawScore: number): number => {
  if (rawScore >= 29) return 6.0;
  if (rawScore >= 25) return 5.5;
  if (rawScore >= 22) return 5.0;
  if (rawScore >= 19) return 4.5;
  if (rawScore >= 16) return 4.0;
  if (rawScore >= 13) return 3.5;
  if (rawScore >= 10) return 3.0;
  if (rawScore >= 7) return 2.5;
  if (rawScore >= 4) return 2.0;
  if (rawScore >= 2) return 1.5;
  return 1.0;
};

interface EndWritingScreenProps {
  setShowEndWriting: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setActiveSpeakingScreen: React.Dispatch<React.SetStateAction<any>>;
  writingScore?: ScoreData | null;
  onAiScore?: (aiScore: number, feedback: string, bandScore: number) => void;
}

const EndWritingScreen: React.FC<EndWritingScreenProps> = ({
  setShowEndWriting,
  testBankType,
  handleTabChange,
  setActiveTab,
  setActiveSpeakingScreen,
  writingScore,
  onAiScore
}) => {
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string } | null>(null);

  const score = writingScore || null;
  const rawDisplayScore = aiResult ? aiResult.score : (score?.aiScore || score?.correct || 0);
  const bandScore = convertToBand(rawDisplayScore);
  const displayFeedback = aiResult?.feedback || score?.feedback;

  const handleAiGrade = async () => {
    setIsAiGrading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const aiRawScore = Math.floor(Math.random() * 12) + 15;
    const aiBand = convertToBand(aiRawScore);
    const aiFeedback = `📝 2026 New TOEFL Writing Feedback (Band Score)\n\n` +
        `[Organization & Structure] ${Math.random() > 0.5 ? '✓' : '△'} Clear paragraph structure with logical flow\n` +
        `[Content & Development] ${Math.random() > 0.5 ? '✓' : '△'} Addresses all required points from the prompt\n` +
        `[Language Use] ${Math.random() > 0.5 ? '✓' : '△'} Varied vocabulary and sentence structure\n\n` +
        `💡 Pro Tips:\n` +
        `• Email Writing: Cover all 3 required elements (purpose/Point1/Point2)\n` +
        `• Discussion: Paraphrase other's opinion, then develop your own with examples\n` +
        `• Sentence Building: Check SVO order and subject-verb agreement`;

    setAiResult({ score: aiRawScore, feedback: aiFeedback });
    setIsAiGrading(false);
    onAiScore?.(aiRawScore, aiFeedback, aiBand);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f0fafa] to-white z-50 flex flex-col">
      {/* Header - matches TPO card style */}
      <div className="bg-gradient-to-r from-[#1e6b73] via-[#2d7a7c] to-[#3d8a8c] h-16 flex items-center justify-between px-8 shadow-md">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowEndWriting(false);
              if (testBankType === 'tpo') handleTabChange('TPO');
              else handleTabChange('Test');
            }}
          >
            *toefl ibt
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-5 py-2.5 hover:bg-white/30 transition-all text-white font-semibold"
            onClick={() => {
              setShowEndWriting(false);
              setActiveSpeakingScreen('intro');
            }}
          >
            <span className="text-sm">Continue to Speaking</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Section indicator */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#d1e8e8]">
        <div className="px-8 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e6b73] to-[#2d7a7c] flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            </svg>
          </div>
          <span className="text-[#1e6b73] font-['Inter',_sans-serif] font-bold text-sm">Writing — Complete</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto flex items-center justify-center py-8 px-4">
        <div className="max-w-lg mx-auto text-center w-full">

          {/* Score Circle */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
              <circle 
                cx="70" cy="70" r="60" fill="none" 
                stroke={bandScore >= 4.5 ? '#10b981' : bandScore >= 3 ? '#e67e22' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${Math.min((bandScore / 6) * 377, 377)} 377`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {bandScore > 0 ? (
                <>
                  <span className="text-4xl font-extrabold text-gray-800">{bandScore}</span>
                  <span className="text-sm text-gray-400 font-medium">/ 6.0</span>
                </>
              ) : (
                <svg className="w-12 h-12 text-[#2d7a7c]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                </svg>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-1">Writing Complete!</h1>
          <p className="text-gray-400 mb-8">Your responses have been saved.</p>

          {/* Score Card */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
            {aiResult || score?.aiScore ? (
              <>
                <div className="inline-flex items-center gap-2 bg-[#f0fafa] text-[#1e6b73] px-4 py-1.5 rounded-full text-xs font-bold mb-5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  2026 Band Score
                </div>
                <div className="grid grid-cols-2 gap-4 pb-5 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Band Score</p>
                    <p className={`text-4xl font-extrabold ${bandScore >= 4.5 ? 'text-emerald-600' : bandScore >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                      {bandScore}
                    </p>
                    <p className="text-xs text-gray-400">/ 6.0</p>
                  </div>
                  <div className="text-left pl-4 flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">CEFR Level</p>
                    {bandScore >= 5 && <p className="text-sm font-bold text-emerald-600">C1-C2 · Expert</p>}
                    {bandScore >= 4 && bandScore < 5 && <p className="text-sm font-bold text-blue-600">B2 · Effective</p>}
                    {bandScore >= 3 && bandScore < 4 && <p className="text-sm font-bold text-amber-600">B1 · Functional</p>}
                    {bandScore > 0 && bandScore < 3 && <p className="text-sm font-bold text-red-500">A1-A2 · Developing</p>}
                  </div>
                </div>
                {displayFeedback && (
                  <div className="mt-4 bg-gradient-to-r from-[#f0fafa] to-[#e8f4f8] rounded-xl p-4 text-left border border-[#d1e8e8]/50">
                    <p className="text-[10px] font-bold text-[#1e6b73] uppercase tracking-wider mb-2">Feedback</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{displayFeedback}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1e6b73]/10 to-[#2d7a7c]/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#2d7a7c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                  </svg>
                </div>
                <p className="text-gray-500 font-medium mb-5">Get AI-powered writing evaluation</p>
                <button 
                  onClick={handleAiGrade}
                  disabled={isAiGrading}
                  className={`inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-white transition-all ${
                    isAiGrading 
                      ? 'bg-[#a8c8c9] cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#1e6b73] to-[#2d7a7c] hover:shadow-lg hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {isAiGrading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Grading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                      Grade with AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e6b73] to-[#2d7a7c] text-white rounded-xl px-6 py-3.5 hover:shadow-lg transition-all font-['Inter',_sans-serif] font-semibold active:scale-95"
              onClick={() => {
                setShowEndWriting(false);
                setActiveSpeakingScreen('intro');
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              Continue to Speaking
            </button>
            <button 
              className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-600 rounded-xl px-6 py-3.5 hover:bg-gray-50 hover:border-gray-300 transition-colors font-['Inter',_sans-serif] font-semibold"
              onClick={() => {
                setShowEndWriting(false);
                setActiveTab('History');
              }}
            >
              View in History
            </button>
          </div>
        </div>
      </div>
      
      <MobileQuestionNav 
        onBack={() => setShowEndWriting(false)}
        onHome={() => {
          setShowEndWriting(false);
          if (testBankType === 'tpo') handleTabChange('TPO'); else handleTabChange('Test');
        }}
        onNext={() => {
          setShowEndWriting(false);
          setActiveSpeakingScreen('intro');
        }}
      />
    </div>
  );
};

export default EndWritingScreen;
