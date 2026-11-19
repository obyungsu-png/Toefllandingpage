import React from 'react';
import { MobileQuestionNav } from './MobileQuestionNav';

interface SectionCompletionScreenProps {
  section: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  children: React.ReactNode;
  backgroundClassName?: string;
}

export function SectionCompletionScreen({
  section,
  onHome,
  onBack,
  onNext,
  children,
  backgroundClassName = 'bg-white',
}: SectionCompletionScreenProps) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${backgroundClassName}`}>
      <div className="bg-gradient-to-r from-[#1e6b73] via-[#2d7a7c] to-[#3d8a8c] h-16 flex items-center justify-between px-3 md:px-8 shadow-md">
        <button
          type="button"
          className="text-white text-base md:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide hover:opacity-80 transition-opacity flex items-center gap-1.5"
          onClick={onHome}
          aria-label="홈으로 이동"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M10 20v-5.5h4V20"/>
          </svg>
          <span>*toefl ibt</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" className="px-4 py-2 border border-white rounded-lg text-white font-semibold" onClick={onBack}>Back</button>
          <button type="button" className="px-4 py-2 bg-white rounded-lg text-[#1e6b73] font-semibold" onClick={onNext}>Next</button>
        </div>
      </div>
      <div className="bg-white border-b border-gray-300">
        <div className="px-4 md:px-8 py-3 text-gray-700 font-['Inter',_sans-serif] font-bold">{section} <span className="ml-6 text-gray-500 font-normal">Complete</span></div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
      <MobileQuestionNav onHome={onHome} onBack={onBack} onNext={onNext} />
    </div>
  );
}

export default SectionCompletionScreen;
