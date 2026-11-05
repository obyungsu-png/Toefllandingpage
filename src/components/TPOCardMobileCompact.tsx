import { useState, useMemo } from 'react';
import { Lock, Play, ArrowRightCircle, ClipboardCheck } from 'lucide-react';
import { TPOTest } from './ContentManagement';
import { effectiveDay } from '../utils/testLabel';
import { TestResult } from '../types/testResult';

interface TPOCardMobileCompactProps {
  number: number;
  /** 카드 헤더에 보여줄 번호 — 시행 날짜 기준 자동 재배정된 번호.
   *  진행상황 저장/시작/복습 등 기능은 계속 실제 number를 사용하고, 화면 텍스트만 이 값으로 대체합니다.
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
  /** 이 TPO의 응시 결과 — 섹션별 점수/완료 표시 */
  results?: TestResult[];
}

type SectionKey = 'Reading' | 'Listening' | 'Speaking' | 'Writing';
const SECTION_ORDER: SectionKey[] = ['Reading', 'Listening', 'Speaking', 'Writing'];
const SECTION_SHORT: Record<SectionKey, string> = {
  Reading: 'R', Listening: 'L', Speaking: 'S', Writing: 'W',
};

const BRAND = '#005f61';  // 기존 teal 유지

/** 섹션 결과 요약 */
interface SectionSummary {
  completed: boolean;
  /** 원점수 또는 밴드 점수 (있는 값 우선). TOEFL 섹션은 보통 0~30. */
  score: number | null;
}

/** 이 TPO의 섹션별 요약 산출 */
function computeSectionSummaries(number: number, results: TestResult[] | undefined): Record<SectionKey, SectionSummary> {
  const empty: Record<SectionKey, SectionSummary> = {
    Reading:   { completed: false, score: null },
    Listening: { completed: false, score: null },
    Speaking:  { completed: false, score: null },
    Writing:   { completed: false, score: null },
  };
  if (!results || results.length === 0) return empty;

  for (const r of results) {
    if (r.type !== 'TPO') continue;
    if (r.testNumber !== number) continue;
    const cat = (r.category || '') as SectionKey;
    if (!SECTION_ORDER.includes(cat)) continue;

    // 섹션 "완료" 판단: status='completed' 또는 1문항이라도 응답이 있으면 완료로 처리
    const completed =
      r.status === 'completed'
      || (r.answeredCount ?? 0) > 0
      || (r.correctAnswers ?? 0) > 0;

    // 점수 — Reading/Listening은 score(원점수), Speaking/Writing은 aiBandScore 또는 score
    let score: number | null = null;
    if (cat === 'Speaking' || cat === 'Writing') {
      score = r.aiBandScore ?? r.aiScore ?? (Number.isFinite(r.score) ? r.score : null);
    } else {
      score = Number.isFinite(r.score) ? r.score : null;
    }

    // 같은 섹션의 가장 최신(이미 저장된 더 좋은 결과) 유지
    const prev = empty[cat];
    if (!prev.completed && completed) empty[cat] = { completed: true, score };
    else if (completed && score !== null && (prev.score === null || score > prev.score)) {
      empty[cat] = { completed: true, score };
    } else if (completed) {
      empty[cat] = { completed: true, score: prev.score };
    }
  }
  return empty;
}

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
  results,
}: TPOCardMobileCompactProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const getSectionQuestionCount = (sectionType: string): number => {
    if (!testData) return 0;
    const section = testData.sections.find(s => s.sectionType === sectionType);
    return section ? section.questions.length : 0;
  };

  const hasSavedProgress = (section: string) => !!localStorage.getItem(`tpo_progress_${bankType}_${number}_${section}`);

  const summaries = useMemo(() => computeSectionSummaries(number, results), [number, results]);
  const completedCount = SECTION_ORDER.filter(s => summaries[s].completed).length;
  const availableSections = SECTION_ORDER.filter(s => getSectionQuestionCount(s) > 0);
  const availableCount = availableSections.length || 4;
  const progress = Math.min(1, completedCount / availableCount);
  const isDone = completedCount === availableCount && availableCount > 0;
  const isNew  = completedCount === 0 && !SECTION_ORDER.some(s => hasSavedProgress(s));

  // 평균 밴드 — 섹션 점수 평균 (완료된 섹션만)
  const avgBand = useMemo(() => {
    const scored = SECTION_ORDER.map(s => summaries[s].score).filter((s): s is number => s !== null);
    if (scored.length === 0) return null;
    const mean = scored.reduce((a, b) => a + b, 0) / scored.length;
    return Math.round(mean);
  }, [summaries]);

  const handleChipTap = (section: SectionKey) => {
    if (isLocked) { onUnlockClick?.(); return; }
    setOpenSection(prev => (prev === section ? null : section));
  };

  const handleStart = (section: SectionKey) => {
    localStorage.removeItem(`tpo_progress_${bankType}_${number}_${section}`);
    setOpenSection(null);
    onStartTest(section);
  };
  const handleContinue = (section: SectionKey) => {
    const saved = localStorage.getItem(`tpo_progress_${bankType}_${number}_${section}`);
    if (!saved) { alert('저장된 진행 상황이 없습니다. Start를 눌러 새로 시작하세요.'); return; }
    setOpenSection(null);
    (onContinueTest || onStartTest)(section);
  };
  const handleReview = (section: SectionKey) => {
    localStorage.removeItem(`tpo_progress_${bankType}_${number}_${section}`);
    setOpenSection(null);
    (onReviewTest || onStartTest)(section);
  };

  const dateMemo = testData?.dateMemo;

  // 진도 링 — SVG stroke-dasharray
  const R = 22;
  const C = 2 * Math.PI * R;
  const ringOffset = C * (1 - progress);

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${
      isLocked ? 'opacity-70' : ''
    } ${
      openSection
        ? 'border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
        : 'border border-gray-150 bg-white shadow-[0_1px_3px_rgba(15,20,25,0.04)]'
    }`}
    style={{ borderColor: openSection ? '#e5e7eb' : '#eceeed' }}
    >
      {/* 메인 카드 행 */}
      <div className="flex items-center gap-3 px-3.5 py-3">

        {/* 좌측 — 진도 링 + 번호 */}
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 50 50" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="25" cy="25" r={R} fill="none" stroke="#edeeec" strokeWidth="3.5" />
            {progress > 0 && (
              <circle
                cx="25" cy="25" r={R} fill="none"
                stroke={isDone ? BRAND : '#f59e0b'}
                strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={ringOffset}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-extrabold text-[15px] tabular-nums tracking-tight"
                  style={{ color: isNew ? '#b2b6b4' : BRAND }}>
              {displayNumber ?? number}
            </span>
          </div>
        </div>

        {/* 가운데 — 타이틀 + 메타 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[15px] tracking-tight text-gray-900 truncate">
              {customTitle || `TPO ${displayNumber ?? number}`}
            </span>
            {isDone && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${BRAND}15`, color: BRAND }}>
                완료
              </span>
            )}
            {!isDone && !isNew && completedCount > 0 && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                진행중
              </span>
            )}
            {isNew && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-500 min-w-0">
            {testData?.month && (
              <span className="shrink-0">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][testData.month - 1]}
                {effectiveDay(testData) ? ` ${effectiveDay(testData)}` : ''}
              </span>
            )}
            {testData?.year && (<><span className="text-gray-300">·</span><span className="shrink-0">{testData.year}</span></>)}
            {!isNew && !isDone && (<><span className="text-gray-300">·</span><span className="shrink-0 font-medium">{completedCount}/{availableCount} 섹션</span></>)}
          </div>
        </div>

        {/* 우측 — Lock / 밴드 pill */}
        {isLocked ? (
          <button onClick={onUnlockClick}
                  className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-1.5 rounded-full shrink-0 border border-gray-200">
            <Lock className="w-3 h-3" />
            Unlock
          </button>
        ) : avgBand !== null && isDone ? (
          <div className="shrink-0 text-right">
            <div className="font-extrabold text-[20px] leading-none tabular-nums tracking-tight" style={{ color: BRAND }}>
              {avgBand}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">band</div>
          </div>
        ) : null}
      </div>

      {/* 섹션 점수 그리드 — R / L / S / W */}
      {!isLocked && (
        <div className="grid grid-cols-4 gap-1 px-3.5 pb-3">
          {SECTION_ORDER.map((key) => {
            const style = SECTION_STYLE[key];
            const hasContent = getSectionQuestionCount(key) > 0;
            const summary = summaries[key];
            const hasProgress = hasSavedProgress(key);
            const isActive = openSection === key;
            return (
              <button
                key={key}
                onClick={() => handleChipTap(key)}
                disabled={!hasContent}
                title={key}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
                  !hasContent
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : isActive
                    ? 'scale-[1.02] shadow-sm'
                    : 'active:scale-95'
                }`}
                style={{
                  background: !hasContent
                    ? undefined
                    : isActive
                    ? style.activeBg
                    : summary.completed
                    ? style.doneBg
                    : style.restBg,
                  color: !hasContent
                    ? undefined
                    : isActive
                    ? '#fff'
                    : summary.completed
                    ? style.doneText
                    : style.restText,
                }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-widest leading-none opacity-80">
                  {SECTION_SHORT[key]}
                </span>
                <span className="text-[13px] font-bold tabular-nums leading-none">
                  {summary.completed && summary.score !== null ? summary.score : summary.completed ? '✓' : '—'}
                </span>
                {hasProgress && hasContent && !isActive && !summary.completed && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* dateMemo — 안내 메모만 노출 (년/월/일 중복 숨김) */}
      {(() => {
        if (!dateMemo) return null;
        if (/demonstration/i.test(dateMemo)) return null;
        const trimmed = dateMemo.trim();
        const looksLikeDateOnly =
          /^\d{1,4}[\/\-.]\d{1,2}([\/\-.]\d{1,4})?$/.test(trimmed) ||
          /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*\d{1,2}(,?\s*\d{2,4})?$/i.test(trimmed);
        if (looksLikeDateOnly) return null;
        return (
          <div className="px-3.5 py-1.5 bg-gray-50 text-[10px] text-gray-500 font-medium truncate border-t border-gray-100">
            {trimmed}
          </div>
        );
      })()}

      {/* 확장 액션 스트립 */}
      {openSection && !isLocked && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-gray-100 animate-[expandDown_0.15s_ease-out]"
             style={{ backgroundColor: `${SECTION_STYLE[openSection].doneBg}` }}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider shrink-0"
                style={{ color: SECTION_STYLE[openSection].doneText }}>
            {openSection}
          </span>
          <div className="flex-1 flex items-center gap-1.5 justify-end">
            {hasSavedProgress(openSection) && (
              <button
                onClick={() => handleContinue(openSection)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
              >
                <ArrowRightCircle className="w-3.5 h-3.5" />
                Continue
              </button>
            )}
            <button
              onClick={() => handleStart(openSection)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
              style={{ backgroundColor: BRAND }}
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </button>
            <button
              onClick={() => handleReview(openSection)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-gray-600 border border-gray-200 text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
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

// ── 섹션별 색 — 완료/미완료/활성/배경 ─────────────────────────────────
const SECTION_STYLE: Record<SectionKey, {
  restBg: string;  restText: string;
  doneBg: string;  doneText: string;
  activeBg: string;
}> = {
  Reading: {
    restBg: '#ecfdf5', restText: '#047857',
    doneBg: '#d1fae5', doneText: '#065f46',
    activeBg: '#059669',
  },
  Listening: {
    restBg: '#f5f3ff', restText: '#6d28d9',
    doneBg: '#ede9fe', doneText: '#5b21b6',
    activeBg: '#7c3aed',
  },
  Speaking: {
    restBg: '#fff7ed', restText: '#c2410c',
    doneBg: '#ffedd5', doneText: '#9a3412',
    activeBg: '#ea580c',
  },
  Writing: {
    restBg: '#eff6ff', restText: '#1d4ed8',
    doneBg: '#dbeafe', doneText: '#1e40af',
    activeBg: '#2563eb',
  },
};
