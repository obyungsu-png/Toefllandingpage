import { useState } from 'react';
import { Lock, BookOpen, Headphones, PencilLine, Mic, Play, ArrowRightCircle, ClipboardCheck } from 'lucide-react';
import { TPOTest } from './ContentManagement';

interface TPOCardMobileCompactProps {
  number: number;
  onStartTest: (section: string) => void;
  onReviewTest?: (section: string) => void;
  onContinueTest?: (section: string) => void;
  isLocked?: boolean;
  onUnlockClick?: () => void;
  testData?: TPOTest;
  customTitle?: string;
  bankType?: string;
}

type SectionKey = 'Reading' | 'Listening' | 'Writing' | 'Speaking';

const SECTIONS: { key: SectionKey; label: string; icon: typeof BookOpen }[] = [
  { key: 'Reading', label: 'R', icon: BookOpen },
  { key: 'Listening', label: 'L', icon: Headphones },
  { key: 'Speaking', label: 'S', icon: Mic },
  { key: 'Writing', label: 'W', icon: PencilLine },
];

export function TPOCardMobileCompact({
  number,
  onStartTest,
  onReviewTest,
  onContinueTest,
  isLocked = false,
  onUnlockClick,
  testData,
  customTitle,
  bankType = 'tpo',
}: TPOCardMobileCompactProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const getSectionQuestionCount = (sectionType: string): number => {
    if (!testData) return 0;
    const section = testData.sections.find(s => s.sectionType === sectionType);
    return section ? section.questions.length : 0;
  };

  const hasSavedProgress = (section: string) => !!localStorage.getItem(`tpo_progress_${bankType}_${number}_${section}`);

  const handleChipTap = (section: SectionKey) => {
    if (isLocked) {
      onUnlockClick?.();
      return;
    }
    setOpenSection(prev => (prev === section ? null : section));
  };

  const handleStart = (section: SectionKey) => {
    localStorage.removeItem(`tpo_progress_${bankType}_${number}_${section}`);
    setOpenSection(null);
    onStartTest(section);
  };

  const handleContinue = (section: SectionKey) => {
    const saved = localStorage.getItem(`tpo_progress_${bankType}_${number}_${section}`);
    if (!saved) {
      alert('저장된 진행 상황이 없습니다. Start를 눌러 새로 시작하세요.');
      return;
    }
    setOpenSection(null);
    (onContinueTest || onStartTest)(section);
  };

  const handleReview = (section: SectionKey) => {
    localStorage.removeItem(`tpo_progress_${bankType}_${number}_${section}`);
    setOpenSection(null);
    (onReviewTest || onStartTest)(section);
  };

  const dateMemo = testData?.dateMemo;

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all ${isLocked ? 'opacity-70' : ''} ${openSection ? 'border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : ''}`}>
      {/* Single-line header row — clean white/gray */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-white">
        <p className="font-bold text-gray-900 text-base tracking-tight whitespace-nowrap shrink-0">
          {customTitle || `TPO ${number}`}
        </p>
        {testData?.year && (
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md font-semibold shrink-0">
            {testData.year}
          </span>
        )}
        {testData?.month && (
          <span className="text-[10px] px-2 py-0.5 bg-[#f0fafa] text-[#1e6b73] rounded-md font-semibold shrink-0">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][testData.month - 1]}
          </span>
        )}

        {isLocked && (
          <button onClick={onUnlockClick} className="ml-auto flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 border border-gray-200">
            <Lock className="w-3 h-3" />
            Unlock
          </button>
        )}

        {!isLocked && (
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {SECTIONS.map(({ key, label, icon: Icon }) => {
              const hasContent = getSectionQuestionCount(key) > 0;
              const hasProgress = hasSavedProgress(key);
              const isActive = openSection === key;
              return (
                <button
                  key={key}
                  onClick={() => handleChipTap(key)}
                  disabled={!hasContent}
                  title={label}
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${
                    !hasContent
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : isActive
                      ? 'bg-[#1e6b73] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                  {hasProgress && hasContent && !isActive && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#e67e22]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {dateMemo && !/demonstration/i.test(dateMemo) && (
        <div className="px-4 py-1.5 bg-gray-50 text-[10px] text-gray-500 font-medium truncate border-t border-gray-100">
          {dateMemo}
        </div>
      )}

      {/* Expandable action strip — only for the tapped section */}
      {openSection && !isLocked && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100 animate-[expandDown_0.15s_ease-out]">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide shrink-0">{openSection}</span>
          <div className="flex-1 flex items-center gap-1.5 justify-end">
            {hasSavedProgress(openSection) && (
              <button
                onClick={() => handleContinue(openSection)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold shadow-sm active:scale-95 transition-transform"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                Continue
              </button>
            )}
            <button
              onClick={() => handleStart(openSection)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#1e6b73] text-white text-xs font-bold shadow-sm active:scale-95 transition-transform"
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </button>
            <button
              onClick={() => handleReview(openSection)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-white text-gray-600 border border-gray-200 text-xs font-bold shadow-sm active:scale-95 transition-transform"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Review
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
