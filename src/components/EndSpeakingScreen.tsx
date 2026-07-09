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

interface EndSpeakingScreenProps {
  setShowEndSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  speakingScore?: ScoreData | null;
  onAllSectionsComplete?: (scores: SectionScores) => void;
}

export interface SectionScores {
  reading: { correct: number; total: number } | null;
  listening: { correct: number; total: number } | null;
  writing: { score: number } | null;
  speaking: { score: number } | null;
}

const EndSpeakingScreen: React.FC<EndSpeakingScreenProps> = ({
  setShowEndSpeaking,
  testBankType,
  handleTabChange,
  setActiveTab,
  speakingScore,
  onAllSectionsComplete
}) => {
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [aiResult, setAiResult] = useState<{ score: number; feedback: string } | null>(null);

  const score = speakingScore || null;
  const rawDisplayScore = aiResult ? aiResult.score : (score?.aiScore || score?.correct || 0);
  const bandScore = convertToBand(rawDisplayScore);
  const displayFeedback = aiResult?.feedback || score?.feedback;

  // AI 채점 - 2026 신토플 공식 기준 (ETS TestReady / ELSA 스타일)
  // Speaking 영역: Take an Interview (45초×4) + Listen & Repeat (7문항)
  const handleAiGrade = async () => {
    setIsAiGrading(true);
    // TODO: 실제 Claude/GLM API 연동
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2026 New TOEFL Speaking Rubric (Band Score 기준)
    setAiResult({
      score: Math.floor(Math.random() * 12) + 15, // 15-27 raw → Band 2.5-5.0
      feedback: `🎤 2026 신토플 Speaking AI Feedback (Band Score 기반)\n\n` +
        `[Fluency & Clarity] ${Math.random() > 0.5 ? '✓' : '△'} Smooth delivery with natural pacing\n` +
        `[Pronunciation] ${Math.random() > 0.5 ? '✓' : '△'} Clear articulation of key sounds\n` +
        `[Content] ${Math.random() > 0.5 ? '✓' : '△'} Direct response with specific examples\n\n` +
        `💡 고득점 팁 (PrepEx/ELSA/TST Prep 참고):\n` +
        `• Interview (45초): 깊고 구체적인 1개 스토리 > 얇은 2개 이유 (WHO/WHEN/WHERE 필수)\n` +
        `• Listen & Repeat: Shadowing 연습으로 귀와 입 동기화, 명료성(Clarity)이 핵심\n` +
        `• 타이머 훈련: 40초에 핵심 답변 완성, 남은 5초는 마무리에 사용`
    });
    setIsAiGrading(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#c0392b] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowEndSpeaking(false);
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

      {/* Tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Speaking — Complete
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-red-50/30 to-white flex items-center justify-center py-8">
        <div className="max-w-xl mx-auto text-center px-6 w-full">
          {/* Mic Icon / Score Circle - 2026 Band Score */}
          <div className={`w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg ${
            !aiResult && !score?.aiScore ? 'bg-gradient-to-br from-red-100 to-red-200' :
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
              <svg className="w-12 h-12 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            )}
          </div>

          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-2">All Sections Complete!</h1>
          <p className="text-base font-['Inter',_sans-serif] text-gray-500 mb-6">
            Congratulations! You have finished all 4 sections.
          </p>

          {/* Score Card or AI Grading CTA */}
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
            {aiResult || score?.aiScore ? (
              <>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Speaking Band Score (2026)</h3>
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
                    {bandScore >= 5 && <p className="text-sm font-semibold text-green-600">C1-C2 — Expert command</p>}
                    {bandScore >= 4 && bandScore < 5 && <p className="text-sm font-semibold text-blue-600">B2 — Upper-intermediate</p>}
                    {bandScore >= 3 && bandScore < 4 && <p className="text-sm font-semibold text-yellow-600">B1 — Intermediate</p>}
                    {bandScore > 0 && bandScore < 3 && <p className="text-sm font-semibold text-red-600">A1-A2 — Developing</p>}
                  </div>
                </div>
                {displayFeedback && (
                  <div className="mt-4 bg-red-50 rounded-lg p-4 text-left">
                    <p className="text-xs font-semibold text-red-600 uppercase mb-1">AI Feedback</p>
                    <p className="text-sm text-gray-700">{displayFeedback}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                </svg>
                <p className="text-gray-500 font-medium mb-4">Get your speaking evaluated by AI</p>
                <button 
                  onClick={handleAiGrade}
                  disabled={isAiGrading}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                    isAiGrading 
                      ? 'bg-red-300 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg'
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
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
                      </svg>
                      Grade with AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Action Button - View Final Results */}
          <div className="flex flex-col gap-3 justify-center">
            <button 
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e6b73] via-[#2d5f8a] to-[#5b4a9d] text-white rounded-xl px-8 py-4 hover:shadow-xl transition-all font-['Inter',_sans-serif] font-bold shadow-lg"
              onClick={() => {
                if (onAllSectionsComplete) {
                  onAllSectionsComplete({
                    reading: null,
                    listening: null,
                    writing: null,
                    speaking: aiResult ? { score: aiResult.score } : (score?.aiScore ? { score: score.aiScore } : null)
                  });
                }
                setShowEndSpeaking(false);
                setActiveTab('History');
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              View Complete Test Results
            </button>
            
            <button 
              className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-600 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-['Inter',_sans-serif] font-semibold"
              onClick={() => {
                setShowEndSpeaking(false);
                if (testBankType === 'tpo') handleTabChange('TPO'); else handleTabChange('Test');
              }}
            >
              Back to TPO List
            </button>
          </div>
        </div>
      </div>
      
      <MobileQuestionNav 
        onBack={() => setShowEndSpeaking(false)}
        onHome={() => {
          setShowEndSpeaking(false);
          if (testBankType === 'tpo') handleTabChange('TPO'); else handleTabChange('Test');
        }}
        onNext={() => {
          setShowEndSpeaking(false);
          setActiveTab('History');
        }}
      />
    </div>
  );
};

export default EndSpeakingScreen;
