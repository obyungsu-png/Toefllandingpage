import { useState } from 'react';
import { Lock, BookOpen, Headphones, PencilLine, Mic, Play, ArrowRightCircle, ClipboardCheck } from 'lucide-react';
import { TPOTest } from './ContentManagement';
import { effectiveDay } from '../utils/testLabel';

interface TPOCardMobileCompactProps {
  number: number;
  /** 카드 헤더에 보여줄 번호 — 시행 날짜 기준 자동 재배정된 번호.
   *  진행상황 저장/시작/복습 등 기능은 계속 실제 number를 사용하고, 화면 텍스트만 이 값으로 대천합니다.
   *  없으면 기존처럼 number를 그대로 표시한다. */
  displayNumber?: number;
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

/** 섹션별 컬러 시스템 — 트렌디한 모바일 컬러 코딩 */
const SECTION_STYLE: Record<SectionKey, {
  label: string;
  icon: typeof BookOpen;
  /** 칩 활성/비활성 색 */
  chip: string;
  chipActive: string;
  /** 확장 스트립의 Start 버튼 */
  startBtn: string;
  dot: string;
}> = {
  Reading: {
    label: 'R',
    icon: BookOpen,
    chip: 'bg-emerald-50 text-emerald-600',
    chipActive: 'bg-emerald-500 text-white shadow-md shadow-emerald-200',
    startBtn: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  Listening: {
    label: 'L',
    icon: Headphones,
    chip: 'bg-violet-50 text-violet-600',
    chipActive: 'bg-violet-500 text-white shadow-md shadow-violet-200',
    startBtn: 'bg-violet-500',
    dot: 'bg-violet-500',
  },
  Speaking: {
    label: 'S',
    icon: Mic,
    chip: 'bg-orange-50 text-orange-600',
    chipActive: 'bg-orange-500 text-white shadow-md shadow-orange-200',
    startBtn: 'bg-orange-500',
    dot: 'bg-orange-500',
  },
  Writing: {
    label: 'W',
    icon: PencilLine,
    chip: 'bg-sky-50 text-sky-600',
    chipActive: 'bg-sky-500 text-white shadow-md shadow-sky-200',
    startBtn: 'bg-sky-500',
    dot: 'bg-sky-500',
  },
};

const SECTION_ORDER: SectionKey[] = ['Reading', 'Listening', 'Speaking', 'Writing'];

export function TPOCardMobileCompact({
  number,
  displayNumber,
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
  const openStyle = openSection ? SECTION_STYLE[openSection] : null;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${
      isLocked ? 'opacity-70' : ''
    } ${
      openSection
        ? 'border-2 border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
        : 'border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]'
    }`}>
      {/* 헤더 행 — 그라데이션 액센트 바 + 카드 내용 */}
      <div className="relative">
        {/* 좌측 그라데이션 액센트 바 */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#14b8a6] via-[#0d9488] to-[#0f766e]" />

        <div className="flex items-center gap-2 pl-4 pr-3 py-3">
          {/* TPO 번호 — 그라데이션 텍스트 */}
          <p className="font-extrabold text-lg tracking-tight whitespace-nowrap shrink-0 bg-gradient-to-r from-[#0f766e] to-[#14b8a6] bg-clip-text text-transparent">
            {customTitle || `TPO ${displayNumber ?? number}`}
          </p>

          <div className="flex items-center gap-1 min-w-0">
            {testData?.year && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-semibold shrink-0">
                {testData.year}
              </span>
            )}
            {testData?.month && (
              <span className="text-[10px] px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-md font-semibold shrink-0">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][testData.month - 1]}{effectiveDay(testData) ? ` ${effectiveDay(testData)}` : ''}
              </span>
            )}
          </div>

          {isLocked && (
            <button onClick={onUnlockClick} className="ml-auto flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 border border-gray-200">
              <Lock className="w-3 h-3" />
              Unlock
            </button>
          )}

          {!isLocked && (
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {SECTION_ORDER.map((key) => {
                const style = SECTION_STYLE[key];
                const Icon = style.icon;
                const hasContent = getSectionQuestionCount(key) > 0;
                const hasProgress = hasSavedProgress(key);
                const isActive = openSection === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleChipTap(key)}
                    disabled={!hasContent}
                    title={key}
                    className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${
                      !hasContent
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : isActive
                        ? `${style.chipActive} scale-105`
                        : `${style.chip} active:scale-95`
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                    {hasProgress && hasContent && !isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {dateMemo && !/demonstration/i.test(dateMemo) && (
        <div className="px-4 py-1.5 bg-gray-50 text-[10px] text-gray-500 font-medium truncate border-t border-gray-100">
          {dateMemo}
        </div>
      )}

      {/* 확장 액션 스트립 — 탭한 섹션의 컬러 테마 적용 */}
      {openSection && openStyle && !isLocked && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 animate-[expandDown_0.15s_ease-out]">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide shrink-0`}>
            <span className={`w-2 h-2 rounded-full ${openStyle.dot}`} />
            <span className="text-gray-600">{openSection}</span>
          </span>
          <div className="flex-1 flex items-center gap-1.5 justify-end">
            {hasSavedProgress(openSection) && (
              <button
                onClick={() => handleContinue(openSection)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-transform"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                Continue
              </button>
            )}
            <button
              onClick={() => handleStart(openSection)}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg ${openStyle.startBtn} text-white text-xs font-bold shadow-sm active:scale-95 transition-transform`}
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
