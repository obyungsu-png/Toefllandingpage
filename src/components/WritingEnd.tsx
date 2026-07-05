import { useState, useEffect } from 'react';
import { MobileFooter } from './MobileFooter';

interface WritingEndProps {
  onNext: () => void;
  onHome: () => void;
}

export function WritingEnd({ onNext, onHome }: WritingEndProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Top Header (desktop only) */}
      {!isMobile && (
        <div className="bg-[#1e6b73] h-16 flex items-center justify-end px-8 shadow-lg">
          <button
            className="flex items-center gap-2 bg-white border-2 border-white rounded-lg px-6 py-2 hover:bg-gray-100 transition-colors"
            onClick={onNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">View Results</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Tab (desktop only) */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Writing
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex items-center justify-center overflow-auto bg-white ${isMobile ? 'p-4 pt-6' : 'p-8'}`}>
        <div className="max-w-2xl w-full">
          <h2 className={`font-bold text-gray-800 mb-8 text-center pb-4 border-b-2 border-gray-300 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            End of Writing Section
          </h2>

          <div className="text-gray-700 text-center">
            <p className="leading-relaxed">
              Thank you for completing the writing section.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      {isMobile && (
        <MobileFooter
          onNext={onNext}
          onHome={onHome}
          showBack={false}
          nextLabel="View Results"
        />
      )}
    </div>
  );
}