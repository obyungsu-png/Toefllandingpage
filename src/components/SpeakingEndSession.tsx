import { useEffect, useState } from 'react';
import type { TPOTest } from './ContentManagement';
import { generateTestPdf } from '../utils/generateTestPdf';
import { extractVocabFromTest } from '../utils/extractVocab';
import { generateVocabPdf } from '../utils/generateVocabPdf';

interface SpeakingEndSessionProps {
  onHome: () => void;
  onFinish: () => void;
  testData: TPOTest | null;
}

export function SpeakingEndSession({ onHome, onFinish, testData }: SpeakingEndSessionProps) {
  const [recordings, setRecordings] = useState<Record<string, string>>({});
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [vocabMenuOpen, setVocabMenuOpen] = useState(false);
  const [vocabLevel, setVocabLevel] = useState<'ALL' | '수능' | '토플' | '토익'>('ALL');
  const [activePdfTab, setActivePdfTab] = useState<'test' | 'section' | 'vocab'>('test');

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}');
      setRecordings(stored);
    } catch {}
  }, []);

  const handleDownload = (
    mode: 'standard' | 'annotated',
    section?: 'Reading' | 'Listening' | 'Speaking' | 'Writing'
  ) => {
    if (!testData) { alert('Test data was not found.'); return; }
    generateTestPdf(testData, mode, section);
    setPdfMenuOpen(false);
  };

  const handleVocabDownload = (
    mode: 'question' | 'answer' | 'multiple-choice' | 'multiple-choice-answer'
  ) => {
    if (!testData) { alert('Test data was not found.'); return; }
    const vocab = extractVocabFromTest(testData, { maxWords: 60, minFrequency: 1 });
    if (vocab.length === 0) {
      alert(
        '추출된 단어가 없습니다.\n\n이 TPO에 업로드된 문제 데이터가 없거나, 문제 텍스트가 비어 있을 수 있습니다.\nCMS에서 해당 TPO에 문제를 먼저 업로드해주세요.'
      );
      return;
    }
    generateVocabPdf(vocab, mode, {
      testData: { testType: testData.testType, testNumber: testData.displayNumber ?? testData.testNumber },
      level: vocabLevel,
    });
    setVocabMenuOpen(false);
  };

  const listenAndSpeakNums = Array.from({ length: 7 }, (_, i) => i + 1);
  const interviewNums = Array.from({ length: 4 }, (_, i) => i + 8);
  const hasAnyRecording = Object.keys(recordings).length > 0;
  const renderRecordingRows = (nums: number[]) => (
    <div className="space-y-3">
      {nums.map(n => {
        const src = recordings[String(n)];
        return (
          <div key={n} className="flex items-center gap-4 rounded-xl bg-white border border-gray-200 px-4 py-3">
            <span className="text-sm font-bold text-[#1e6b73] w-8 shrink-0">Q{n}</span>
            {src ? (
              <audio
                controls
                src={src}
                className="flex-1 h-9"
              />
            ) : (
              <div className="flex-1 h-9 rounded-full bg-gray-100 px-4 flex items-center text-sm text-gray-400">
                No recording saved
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="bg-[#1e6b73] h-14 flex items-center justify-between px-8 shadow-lg">
        <div
          className="text-white text-base md:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHome}
        >
          *toefl ibt
        </div>
        <button
          onClick={onFinish}
          className="flex items-center gap-1 md:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2.5 py-1.5 md:px-5 md:py-2 hover:bg-gray-100 transition-colors"
        >
          <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs md:text-base">Finish</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white px-6 py-10 md:px-12 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="h-6 w-full bg-[#12757a]" />
          <div className="border border-gray-200 border-t-0 px-8 py-10 md:px-12 md:py-12">
            <h1 className="text-2xl md:text-4xl font-semibold text-gray-700">End of session</h1>
            <div className="mt-4 h-px bg-gray-200" />

            <div className="mt-8 space-y-6 text-[18px] leading-8 text-gray-700">

              {/* ── 녹음 재생 섹션 ── */}
              <div className="rounded-2xl border border-[#1e6b73]/30 bg-[#f0fafa] px-5 py-5">
                <p className="text-sm md:text-xl font-semibold text-[#1e6b73] mb-4">🎙️ 내 녹음 듣기</p>
                <div className="space-y-6">
                  <div>
                    <p className="text-base font-semibold text-[#1e6b73] mb-3">Listen and Speak</p>
                    {renderRecordingRows(listenAndSpeakNums)}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#1e6b73] mb-3">Interview</p>
                    {renderRecordingRows(interviewNums)}
                  </div>
                </div>
              </div>

              {!hasAnyRecording && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-base text-gray-500">
                  ℹ️ 저장된 녹음 파일이 아직 없습니다. Supabase Storage에 <strong>recordings</strong> 버킷이 생성되어 있는지 확인해 주세요.
                </div>
              )}

              <p>You can download the full test materials created from the CMS content for this test.</p>

              {/* PDF Download Section — 탭 형태 */}
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5">
                {/* 탭 버튼 그룹 */}
                <div className="flex gap-1 border-b-2 border-gray-200 mb-4">
                  <button
                    onClick={() => { setActivePdfTab('test'); setPdfMenuOpen(false); setVocabMenuOpen(false); }}
                    className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-0.5 ${
                      activePdfTab === 'test'
                        ? 'border-[#1e6b73] text-[#1e6b73] bg-[#1e6b73]/5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Full PDF
                  </button>
                  <button
                    onClick={() => { setActivePdfTab('section'); setPdfMenuOpen(false); setVocabMenuOpen(false); }}
                    className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-0.5 ${
                      activePdfTab === 'section'
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                      <line x1="15" y1="3" x2="15" y2="21"/>
                    </svg>
                    영역별 PDF
                  </button>
                  <button
                    onClick={() => { setActivePdfTab('vocab'); setPdfMenuOpen(false); setVocabMenuOpen(false); }}
                    className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-0.5 ${
                      activePdfTab === 'vocab'
                        ? 'border-purple-600 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                    </svg>
                    단어 시험지
                  </button>
                </div>

                {/* ─── Full PDF 탭 내용 ─── */}
                {activePdfTab === 'test' && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleDownload('standard')}
                        className="flex flex-col items-center gap-1 bg-white border-2 border-gray-300 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                      >
                        <span className="text-2xl">📝</span>
                        <span className="text-sm font-semibold text-gray-700">문제만</span>
                        <span className="text-xs text-gray-500">전체 영역 (R/L/S/W)</span>
                      </button>
                      <button
                        onClick={() => handleDownload('annotated')}
                        className="flex flex-col items-center gap-1 bg-white border-2 border-green-300 rounded-lg p-4 hover:bg-green-50 hover:border-green-500 transition-colors"
                      >
                        <span className="text-2xl">✅</span>
                        <span className="text-sm font-semibold text-gray-700">정답/해설 포함</span>
                        <span className="text-xs text-gray-500">전체 영역 + 정답</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── 영역별 PDF 탭 내용 ─── */}
                {activePdfTab === 'section' && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-blue-700 mb-3 font-medium">
                      각 영역별로 개별 PDF를 다운로드할 수 있습니다. 정답/해설 포함 여부를 선택하세요.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Reading', 'Listening', 'Speaking', 'Writing'] as const).map(sec => (
                        <div key={sec} className="bg-white rounded-lg p-3 border border-blue-200">
                          <p className="text-xs font-bold text-blue-800 mb-2">{sec}</p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleDownload('standard', sec)}
                              className="flex-1 text-xs px-2 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-blue-100 transition-colors font-medium"
                            >
                              문제만
                            </button>
                            <button
                              onClick={() => handleDownload('annotated', sec)}
                              className="flex-1 text-xs px-2 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium"
                            >
                              정답 포함
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── 단어 시험지 탭 내용 ─── */}
                {activePdfTab === 'vocab' && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    {/* 수준 선택 */}
                    <div className="mb-3">
                      <p className="text-xs font-bold text-purple-700 mb-1.5">단어 수준 선택</p>
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
                      <p className="text-[10px] text-purple-600 mt-1.5">
                        이 TPO의 모든 섹션에서 자주 나오는 단어를 추출해 시험지로 만듭니다.
                      </p>
                    </div>

                    {/* 주관식 */}
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-600 mb-1.5">주관식 (영단어 → 뜻 쓰기)</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVocabDownload('question')}
                          className="flex items-center gap-2 bg-white border-2 border-purple-300 rounded-lg p-3 hover:bg-purple-50 transition-colors text-left"
                        >
                          <span className="text-lg">✍️</span>
                          <div>
                            <p className="text-sm font-semibold text-purple-700">문제</p>
                            <p className="text-[10px] text-gray-500">빈칸에 한국어 뜻 쓰기</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleVocabDownload('answer')}
                          className="flex items-center gap-2 bg-white border-2 border-purple-300 rounded-lg p-3 hover:bg-purple-50 transition-colors text-left"
                        >
                          <span className="text-lg">📋</span>
                          <div>
                            <p className="text-sm font-semibold text-purple-700">정답</p>
                            <p className="text-[10px] text-gray-500">영단어 + 뜻 + 정의</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 객관식 */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1.5">객관식 (4지선다)</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVocabDownload('multiple-choice')}
                          className="flex items-center gap-2 bg-white border-2 border-green-300 rounded-lg p-3 hover:bg-green-50 transition-colors text-left"
                        >
                          <span className="text-lg">🔤</span>
                          <div>
                            <p className="text-sm font-semibold text-green-700">문제</p>
                            <p className="text-[10px] text-gray-500">4개 보기 중 정답 선택</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleVocabDownload('multiple-choice-answer')}
                          className="flex items-center gap-2 bg-white border-2 border-green-300 rounded-lg p-3 hover:bg-green-50 transition-colors text-left"
                        >
                          <span className="text-lg">✅</span>
                          <div>
                            <p className="text-sm font-semibold text-green-700">정답</p>
                            <p className="text-[10px] text-gray-500">객관식 정답지</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500">
                🔒 녹음 파일은 서비스 운영 및 개인정보 보호를 위해 <strong className="text-gray-600">10일 후 자동 파기</strong>됩니다.
              </div>
              <p>You may now close this browser tab or select Finish.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
