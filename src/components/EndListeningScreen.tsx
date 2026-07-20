import React, { useState } from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';
import { generateTestPdf } from '../utils/generateTestPdf';
import { extractVocabFromTest } from '../utils/extractVocab';
import { generateVocabPdf } from '../utils/generateVocabPdf';
import type { TPOTest } from './ContentManagement';

interface ScoreData {
  correct: number;
  total: number;
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

interface EndListeningScreenProps {
  setShowEndListening: React.Dispatch<React.SetStateAction<boolean>>;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setActiveWritingScreen: React.Dispatch<React.SetStateAction<any>>;
  listeningScore?: ScoreData | null;
  testData?: TPOTest | null;
}

const EndListeningScreen: React.FC<EndListeningScreenProps> = ({
  setShowEndListening,
  testBankType,
  handleTabChange,
  setActiveTab,
  setActiveWritingScreen,
  listeningScore,
  testData
}) => {
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [vocabMenuOpen, setVocabMenuOpen] = useState(false);
  const [vocabLevel, setVocabLevel] = useState<'ALL' | '수능' | '토플' | '토익'>('ALL');
  const score = listeningScore || null;
  const percentage = score ? Math.round((score.correct / score.total) * 100) : 0;

  const handleDownload = (mode: 'standard' | 'annotated', section?: 'Reading' | 'Listening' | 'Speaking' | 'Writing') => {
    if (!testData) { alert('Test data was not found.'); return; }
    generateTestPdf(testData, mode, section);
    setPdfMenuOpen(false);
  };

  const handleVocabDownload = (mode: 'question' | 'answer' | 'multiple-choice' | 'multiple-choice-answer') => {
    if (!testData) { alert('Test data was not found.'); return; }
    const vocab = extractVocabFromTest(testData, { maxWords: 60, minFrequency: 1 });
    if (vocab.length === 0) {
      alert('추출된 단어가 없습니다.\n\n이 TPO에 업로드된 문제 데이터가 없거나, 문제 텍스트가 비어 있을 수 있습니다.\nCMS에서 해당 TPO에 문제를 먼저 업로드해주세요.');
      return;
    }
    generateVocabPdf(vocab, mode, {
      testData: { testType: testData.testType, testNumber: testData.testNumber },
      level: vocabLevel,
    });
    setVocabMenuOpen(false);
  };

  // TOEFL Listening 환산 점수 (0-30 raw) → convert to Band Score
  const toeflEstimate = score ? Math.max(0, Math.min(30, Math.round((score.correct / score.total) * 28 + 1))) : 0;
  const bandScore = convertToBand(toeflEstimate);

  // CEFR Level badge
  const getCEFRLevel = (band: number) => {
    if (band >= 5.5) return { cefr: 'C2', label: 'Expert', color: 'bg-purple-100 text-purple-700' };
    if (band >= 4.5) return { cefr: 'C1', label: 'Advanced', color: 'bg-green-100 text-green-700' };
    if (band >= 3.5) return { cefr: 'B2', label: 'Upper-Int', color: 'bg-blue-100 text-blue-700' };
    if (band >= 2.5) return { cefr: 'B1', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' };
    return { cefr: 'A2', label: 'Elementary', color: 'bg-red-100 text-red-700' };
  };
  const cefrLevel = getCEFRLevel(bandScore);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#2d5f8a] h-16 flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center">
          <div 
            className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setShowEndListening(false);
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
          {/* Continue to Writing Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#2d5f8a] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowEndListening(false);
              setActiveWritingScreen('intro');
            }}
          >
            <span className="text-[#2d5f8a] font-['Inter',_sans-serif] font-semibold text-base">Continue to Writing</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#2d5f8a">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Listening — Complete
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-blue-50/30 to-white flex items-center justify-center py-8">
        <div className="max-w-xl mx-auto text-center px-6 w-full">
          {/* Headphone Icon */}
          <div className={`w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg ring-4 ${
            score && percentage >= 70 ? 'bg-gradient-to-br from-green-400 to-green-600 ring-green-200' :
            score && percentage >= 40 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 ring-yellow-200' :
            score ? 'bg-gradient-to-br from-red-400 to-red-600 ring-red-200' : 'bg-gray-200 ring-gray-200'
          }`}>
            {score ? (
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{percentage}</p>
                <p className="text-xs text-white/80">%</p>
              </div>
            ) : (
              <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0118 0v6"/>
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
              </svg>
            )}
          </div>

          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-2">Listening Section Complete!</h1>
          
          {/* CEFR Level Badge - 2026 */}
          <div className="mb-6">
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${cefrLevel.color}`}>
              CEFR {cefrLevel.cefr} — {cefrLevel.label}
            </span>
          </div>

          {/* Detailed Score Card - 2026 Band Score Format */}
          {score && (
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Listening Band Score (2026)</h3>

              <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase mb-1">Correct</p>
                  <p className="text-xl font-bold text-green-600">{score.correct}</p>
                  <p className="text-xs text-gray-400">/ {score.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase mb-1">Accuracy</p>
                  <p className={`text-xl font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {percentage}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase mb-1">Band Score</p>
                  <p className="text-xl font-bold text-[#2d5f8a]">{bandScore}</p>
                  <p className="text-xs text-gray-400">/ 6.0</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 uppercase mb-1">Legacy Est.</p>
                  <p className="text-lg font-bold text-gray-500">{toeflEstimate}</p>
                  <p className="text-xs text-gray-300">/ 30</p>
                </div>
              </div>

              {/* Score Bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 70 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${Math.max(percentage, 3)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="flex items-center justify-center gap-2 bg-[#2d5f8a] text-white rounded-lg px-6 py-3 hover:bg-[#234a6b] transition-colors font-['Inter',_sans-serif] font-semibold shadow-md"
              onClick={() => {
                setShowEndListening(false);
                setActiveWritingScreen('intro');
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
              Continue to Writing Section
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-white border-2 border-[#2d5f8a] text-[#2d5f8a] rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-['Inter',_sans-serif] font-semibold shadow-sm"
              onClick={() => {
                setShowEndListening(false);
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

          {/* PDF Download Section */}
          {testData && (
            <div className="mt-8">
              <div className="relative inline-block">
                <button
                  className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-['Inter',_sans-serif] font-semibold shadow-sm w-full sm:w-auto"
                  onClick={() => setPdfMenuOpen(!pdfMenuOpen)}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download PDF
                  <svg className={`w-4 h-4 transition-transform ${pdfMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {pdfMenuOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-10 overflow-hidden">
                    {/* 문제만 다운로드 */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">문제만 다운로드</p>
                    </div>
                    <button
                      onClick={() => handleDownload('standard')}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-50"
                    >
                      <span className="text-blue-600 font-semibold text-sm w-32 shrink-0">Full Test</span>
                      <span className="text-xs text-gray-500">전체 영역 (R/L/S/W)</span>
                    </button>
                    <button
                      onClick={() => handleDownload('standard', 'Listening')}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100"
                    >
                      <span className="text-blue-600 font-semibold text-sm w-32 shrink-0">Listening Only</span>
                      <span className="text-xs text-gray-500">리스닝 영역만</span>
                    </button>

                    {/* 정답/해설 포함 다운로드 */}
                    <div className="px-4 py-3 bg-green-50 border-b border-gray-100">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide">정답/해설 포함</p>
                    </div>
                    <button
                      onClick={() => handleDownload('annotated')}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3 border-b border-gray-50"
                    >
                      <span className="text-green-700 font-semibold text-sm w-32 shrink-0">Full Test</span>
                      <span className="text-xs text-gray-500">전체 영역 + 정답/해설</span>
                    </button>
                    <button
                      onClick={() => handleDownload('annotated', 'Listening')}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3"
                    >
                      <span className="text-green-700 font-semibold text-sm w-32 shrink-0">Listening Only</span>
                      <span className="text-xs text-gray-500">리스닝 영역만 + 정답/해설</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vocab PDF Download Section */}
          {testData && (
            <div className="mt-4">
              <div className="relative inline-block">
                <button
                  className="flex items-center justify-center gap-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg px-6 py-3 hover:bg-purple-50 transition-colors font-['Inter',_sans-serif] font-semibold shadow-sm w-full sm:w-auto"
                  onClick={() => { setVocabMenuOpen(!vocabMenuOpen); setPdfMenuOpen(false); }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                  Download Vocab PDF
                  <svg className={`w-4 h-4 transition-transform ${vocabMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {vocabMenuOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 sm:w-96 bg-white border border-purple-200 rounded-xl shadow-xl z-10 overflow-hidden">
                    {/* 수준 선택 */}
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                      <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2">단어 수준 선택</p>
                      <div className="flex gap-1 flex-wrap">
                        {(['ALL', '수능', '토플', '토익'] as const).map(lv => (
                          <button
                            key={lv}
                            onClick={() => setVocabLevel(lv)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              vocabLevel === lv
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                            }`}
                          >
                            {lv === 'ALL' ? '전체' : lv}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-purple-600 mt-2">
                        이 TPO의 모든 섹션(Reading/Listening/Speaking/Writing)에서 자주 나오는 단어를 추출해 시험지로 만듭니다.
                      </p>
                    </div>

                    {/* 주관식 */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">주관식 (영단어 → 뜻 쓰기)</p>
                    </div>
                    <button
                      onClick={() => handleVocabDownload('question')}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 border-b border-gray-50"
                    >
                      <span className="text-purple-700 font-semibold text-sm w-32 shrink-0">Question</span>
                      <span className="text-xs text-gray-500">빈칸에 한국어 뜻 쓰기</span>
                    </button>
                    <button
                      onClick={() => handleVocabDownload('answer')}
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center gap-3 border-b border-gray-100"
                    >
                      <span className="text-purple-700 font-semibold text-sm w-32 shrink-0">Answer</span>
                      <span className="text-xs text-gray-500">정답 (영단어 + 뜻 + 정의)</span>
                    </button>

                    {/* 객관식 */}
                    <div className="px-4 py-3 bg-green-50 border-b border-gray-100">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide">객관식 (4지선다)</p>
                    </div>
                    <button
                      onClick={() => handleVocabDownload('multiple-choice')}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3 border-b border-gray-50"
                    >
                      <span className="text-green-700 font-semibold text-sm w-32 shrink-0">Question</span>
                      <span className="text-xs text-gray-500">4개 보기 중 정답 선택</span>
                    </button>
                    <button
                      onClick={() => handleVocabDownload('multiple-choice-answer')}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3"
                    >
                      <span className="text-green-700 font-semibold text-sm w-32 shrink-0">Answer</span>
                      <span className="text-xs text-gray-500">객관식 정답지</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <MobileQuestionNav 
        onBack={() => {
          setShowEndListening(false);
        }}
        onHome={() => {
          setShowEndListening(false);
          if (testBankType === 'tpo') {
            handleTabChange('TPO');
          } else {
            handleTabChange('Test');
          }
        }}
        onNext={() => {
          setShowEndListening(false);
          setActiveWritingScreen('intro');
        }}
      />
    </div>
  );
};

export default EndListeningScreen;
