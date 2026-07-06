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
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all ${isLocked ? 'opacity-70' : ''}`}>
      {/* Single-line header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-[#334155] to-[#475569]">
        <p className="font-bold text-white text-[15px] whitespace-nowrap shrink-0">
          {customTitle || `TPO ${number}`}
        </p>
        {testData?.year && (
          <span className="text-[10px] px-2 py-0.5 bg-white/20 text-white rounded-full font-bold shrink-0">
            {testData.year}
          </span>
        )}
        {testData?.month && (
          <span className="text-[10px] px-2 py-0.5 bg-[#e67e22] text-white rounded-full font-bold shrink-0">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][testData.month - 1]}
          </span>
        )}

        {isLocked && (
          <button onClick={onUnlockClick} className="ml-auto flex items-center gap-1 bg-white/90 text-[#334155] text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0">
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
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                    !hasContent
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : isActive
                      ? 'bg-white text-[#334155] shadow-md scale-110'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {hasProgress && hasContent && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#e67e22] border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {dateMemo && !/demonstration/i.test(dateMemo) && (
        <div className="px-3 py-1 bg-[#f8f9fa] text-[10px] text-[#475569] font-medium truncate">
          {dateMemo}
        </div>
      )}

      {/* Expandable action strip — only for the tapped section */}
      {openSection && !isLocked && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-t border-gray-100 animate-[expandDown_0.15s_ease-out]">
          <span className="text-xs font-bold text-gray-600 shrink-0">{openSection}</span>
          <div className="flex-1 flex items-center gap-1.5 justify-end">
            {hasSavedProgress(openSection) && (
              <button
                onClick={() => handleContinue(openSection)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0D9488] text-white text-xs font-bold shadow-sm active:scale-95 transition-transform"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                Continue
              </button>
            )}
            <button
              onClick={() => handleStart(openSection)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#334155] text-white text-xs font-bold shadow-sm active:scale-95 transition-transform"
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </button>
            <button
              onClick={() => handleReview(openSection)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f4efe6] text-[#8b5e1a] text-xs font-bold shadow-sm active:scale-95 transition-transform"
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
