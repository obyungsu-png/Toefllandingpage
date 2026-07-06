import { useEffect, useState } from 'react';
import type { TPOTest } from './ContentManagement';
import { generateTestPdf } from '../utils/generateTestPdf';

interface SpeakingEndSessionProps {
  onHome: () => void;
  onFinish: () => void;
  testData: TPOTest | null;
}

export function SpeakingEndSession({ onHome, onFinish, testData }: SpeakingEndSessionProps) {
  const [recordings, setRecordings] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}');
      setRecordings(stored);
    } catch {}
  }, []);

  const handleDownload = (mode: 'standard' | 'annotated') => {
    if (!testData) { alert('Test data was not found.'); return; }
    generateTestPdf(testData, mode);
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
          className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onHome}
        >
          *toefl ibt
        </div>
        <button
          onClick={onFinish}
          className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
        >
          <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Finish</span>
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

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
                <p className="text-sm md:text-xl font-semibold text-gray-800">Full Test PDF</p>
                <p className="mt-1 text-base text-gray-600">Downloads all sections with the questions as entered in CMS.</p>
                <button
                  onClick={() => handleDownload('standard')}
                  className="mt-4 inline-flex rounded-lg border border-[#1e6b73] bg-white px-4 py-2 text-base font-semibold text-[#1e6b73] hover:bg-[#ecf8f8]"
                >
                  Download PDF
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
                <p className="text-sm md:text-xl font-semibold text-gray-800">Annotated PDF</p>
                <p className="mt-1 text-base text-gray-600">Downloads all sections with correct answers and CMS notes/explanations.</p>
                <button
                  onClick={() => handleDownload('annotated')}
                  className="mt-4 inline-flex rounded-lg border border-[#1e6b73] bg-white px-4 py-2 text-base font-semibold text-[#1e6b73] hover:bg-[#ecf8f8]"
                >
                  Download Annotated PDF
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500">
                🔒 녹음 파일은 서비스 운영 및 개인정보 보호를 위해 <strong className="text-gray-600">30일 후 자동 파기</strong>됩니다.
              </div>
              <p>You may now close this browser tab or select Finish.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
