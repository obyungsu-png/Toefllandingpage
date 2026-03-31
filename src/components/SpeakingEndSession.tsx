import type { TPOTest } from './ContentManagement';
import { generateTestPdf } from '../utils/generateTestPdf';

interface SpeakingEndSessionProps {
  onHome: () => void;
  onFinish: () => void;
  testData: TPOTest | null;
}

export function SpeakingEndSession({ onHome, onFinish, testData }: SpeakingEndSessionProps) {
  const handleDownload = (mode: 'standard' | 'annotated') => {
    if (!testData) {
      alert('Test data was not found.');
      return;
    }
    generateTestPdf(testData, mode);
  };

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
            <h1 className="text-4xl font-semibold text-gray-700">End of session</h1>
            <div className="mt-4 h-px bg-gray-200" />

            <div className="mt-8 space-y-6 text-[18px] leading-8 text-gray-700">
              <p>You can download the full test materials created from the CMS content for this test.</p>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
                <p className="text-xl font-semibold text-gray-800">Full Test PDF</p>
                <p className="mt-1 text-base text-gray-600">Downloads all sections with the questions as entered in CMS.</p>
                <button
                  onClick={() => handleDownload('standard')}
                  className="mt-4 inline-flex rounded-lg border border-[#1e6b73] bg-white px-4 py-2 text-base font-semibold text-[#1e6b73] hover:bg-[#ecf8f8]"
                >
                  Download PDF
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
                <p className="text-xl font-semibold text-gray-800">Annotated PDF</p>
                <p className="mt-1 text-base text-gray-600">Downloads all sections with correct answers and CMS notes/explanations.</p>
                <button
                  onClick={() => handleDownload('annotated')}
                  className="mt-4 inline-flex rounded-lg border border-[#1e6b73] bg-white px-4 py-2 text-base font-semibold text-[#1e6b73] hover:bg-[#ecf8f8]"
                >
                  Download Annotated PDF
                </button>
              </div>

              <p>You may now close this browser tab or select Finish.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}