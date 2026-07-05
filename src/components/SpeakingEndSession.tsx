import { useEffect, useState } from 'react';
import type { TPOTest } from './ContentManagement';
import { generateTestPdf } from '../utils/generateTestPdf';
import { MobileFooter } from './MobileFooter';

interface SpeakingEndSessionProps {
  onHome: () => void;
  onFinish: () => void;
  testData: TPOTest | null;
}

export function SpeakingEndSession({ onHome, onFinish, testData }: SpeakingEndSessionProps) {
  const [recordings, setRecordings] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}');
      setRecordings(stored);
    } catch {}
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      {/* Compact Header */}
      <div className="flex items-center gap-2 bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm">
        <button onClick={onHome} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 flex-shrink-0 transition-colors" aria-label="Home">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Speaking</p>
          <p className="text-xs text-gray-500 leading-tight">Session Complete</p>
        </div>
        {!isMobile && (
          <button
            onClick={onFinish}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
          >
            View Results
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-auto px-4 py-6 ${isMobile ? 'pb-24' : ''}`}>
        <div className="mx-auto max-w-lg space-y-5">
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">End of Session</h1>
            <p className="text-sm text-gray-500 mt-1">Your Speaking practice is complete. Review your recordings below.</p>
          </div>

          {/* ── Recordings Card ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              </span>
              My Recordings
            </h2>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-3">Listen and Speak</p>
                {renderRecordingRows(listenAndSpeakNums)}
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-3">Interview</p>
                {renderRecordingRows(interviewNums)}
              </div>
            </div>
          </div>

          {!hasAnyRecording && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              No recordings saved yet. Make sure the Supabase Storage recordings bucket is configured.
            </div>
          )}

          {/* PDF Downloads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Download Materials</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleDownload('standard')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Full Test PDF</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
              <button
                onClick={() => handleDownload('annotated')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Annotated PDF (with answers)</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
            </div>
          </div>

          {/* Retention notice */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            Recordings are automatically deleted after <strong className="text-gray-700">30 days</strong> for privacy.
          </div>

          <p className="text-xs text-gray-400 text-center">You may now close this tab or select Finish.</p>
        </div>
      </div>

      {/* Mobile Footer with View Results */}
      {isMobile && (
        <MobileFooter
          onNext={onFinish}
          onHome={onHome}
          showBack={false}
          nextLabel="View Results"
        />
      )}
    </div>
  );
}
