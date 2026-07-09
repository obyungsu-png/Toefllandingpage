import React, { useState } from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface ScoreData {
  correct?: number;
  total: number;
  aiScore?: number; // AI 채점 점수 (0-30 raw, will be converted to band)
  feedback?: string;
}

// Convert 0-30 raw score to 2026 Band Score (1-6)
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
}

const EndWritingScreen: React.FC<EndWritingScreenProps> = ({
  setShowEndWriting,
  testBankType,
  handleTabChange,
  setActiveTab,
  setActiveSpeakingScreen,
  writingScore
}) => {
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string } | null>(null);

  const score = writingScore || null;
  const rawDisplayScore = aiResult ? aiResult.score : (score?.aiScore || score?.correct || 0);
  const bandScore = convertToBand(rawDisplayScore);
  const displayFeedback = aiResult?.feedback || score?.feedback;

  // AI 채점 - 2026 신토플 공식 기준 (ETS TestReady / Arno 스타일)
  // Writing 영역: Write an Email (7min) + Academic Discussion (10min) + Build a Sentence
  const handleAiGrade = async () => {
    setIsAiGrading(true);
    // TODO: 실제 Claude/GLM API 연동
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2026 New TOEFL Writing Rubric (Band Score 기준)
    setAiResult({
      score: Math.floor(Math.random() * 12) + 15, // 15-27 raw → Band 2.5-5.0
      feedback: `📝 2026 신토플 Writing AI Feedback (Band Score 기반)\n\n` +
        `[Organization & Structure] ${Math.random() > 0.5 ? '✓' : '△'} Clear paragraph structure with logical flow\n` +
        `[Content & Development] ${Math.random() > 0.5 ? '✓' : '△'} Addresses all required points from the prompt\n` +
        `[Language Use] ${Math.random() > 0.5 ? '✓' : '△'} Varied vocabulary and sentence structure\n\n` +
        `💡 고득점 팁 (TST Prep/Arno 참고):\n` +
        `• Email Writing: 3개 필수 요소(목적/Point1/Point2)를 빠짐없이 다룰 것\n` +
        `• Discussion: 상대방 의견을 paraphrase한 후 자신의 근거+예시로 전개할 것\n` +
        `• Sentence Building: SVO 어순과 수 일치(subject-verb agreement) 확인할 thing`
    });
    setIsAiGrading(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#5b4a9d] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowEndWriting(false);
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
          {/* Continue to Speaking Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#5b4a9d] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowEndWriting(false);
              setActiveSpeakingScreen('intro');
            }}
          >
            <span className="text-[#5b4a9d] font-['Inter',_sans-serif] font-semibold text-base">Continue to Speaking</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#5b4a9d">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Writing — Complete
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-purple-50/30 to-white flex items-center justify-center py-8">
        <div className="max-w-xl mx-auto text-center px-6 w-full">
          {/* Pen Icon / Score Circle - 2026 Band Score */}
          <div className={`w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg ${
            !aiResult && !score?.aiScore ? 'bg-gradient-to-br from-purple-100 to-purple-200' :
            bandScore >= 4.5 ? 'bg-gradient-to-br from-green-400 to-green-600' :
            bandScore >= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
            'bg-gradient-to-br from-red-400 to-red-600'
          }`}>
            {bandScore > 0 ? (
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{bandScore}</p>
                <p className="text-xs text-white/80">/ 6.0</p>
              </div>
            ) : (
              <svg className="w-12 h-12 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
            )}
          </div>

          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-2">Writing Section Complete!</h1>
          <p className="text-base font-['Inter',_sans-serif] text-gray-500 mb-6">Your essay has been saved.</p>

          {/* Score Card or AI Grading CTA */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
            {aiResult || score?.aiScore ? (
              <>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Writing Band Score (2026)</h3>
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase mb-1">Band Score</p>
                    <p className={`text-3xl font-bold ${bandScore >= 4.5 ? 'text-green-600' : bandScore >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {bandScore}
                    </p>
                    <p className="text-xs text-gray-400">/ 6.0</p>
                  </div>
                  <div className="text-left pl-4 pt-2">
                    <p className="text-xs text-gray-400 uppercase mb-1">CEFR Level</p>
                    {bandScore >= 5 && <p className="text-sm font-semibold text-green-600">C1-C2 — Expert writing</p>}
                    {bandScore >= 4 && bandScore < 5 && <p className="text-sm font-semibold text-blue-600">B2 — Effective communication</p>}
                    {bandScore >= 3 && bandScore < 4 && <p className="text-sm font-semibold text-yellow-600">B1 — Functional writing</p>}
                    {bandScore > 0 && bandScore < 3 && <p className="text-sm font-semibold text-red-600">A1-A2 — Developing skills</p>}
                  </div>
                </div>
                {displayFeedback && (
                  <div className="bg-blue-50 rounded-lg p-4 text-left">
                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">AI Feedback</p>
                    <p className="text-sm text-gray-700">{displayFeedback}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                </svg>
                <p className="text-gray-500 font-medium mb-4">Get your writing evaluated by AI</p>
                <button 
                  onClick={handleAiGrade}
                  disabled={isAiGrading}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                    isAiGrading 
                      ? 'bg-purple-300 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg'
                  }`}
                >
                  {isAiGrading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      AI Grading...
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="flex items-center justify-center gap-2 bg-[#5b4a9d] text-white rounded-lg px-6 py-3 hover:bg-[#46387d] transition-colors font-['Inter',_sans-serif] font-semibold shadow-md"
              onClick={() => {
                setShowEndWriting(false);
                setActiveSpeakingScreen('intro');
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              Continue to Speaking Section
            </button>
            <button 
              className="flex items-center justify-center gap-2 bg-white border-2 border-[#5b4a9d] text-[#5b4a9d] rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-['Inter',_sans-serif] font-semibold shadow-sm"
              onClick={() => {
                setShowEndWriting(false);
                setActiveTab('History');
              }}
            >
              View Results in History
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
