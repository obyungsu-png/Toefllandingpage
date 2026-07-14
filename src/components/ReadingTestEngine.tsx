import React, { useState } from 'react';
import FillBlanksTestScreen from './FillBlanksTestScreen';
import { AcademicPassageScreen } from './AcademicPassageScreen';
import { DailyLifeScreen } from './DailyLifeScreen';
import {
  isCompleteWordsType,
  isModule2Question,
  getCompleteWordsBlankCount,
} from '../utils/readingQuestionUtils';

interface ReadingTestEngineProps {
  sectionData: any; // result of getCurrentSectionData('Reading')
  module: 1 | 2;
  onModuleEnd: () => void;
  onExitBack: () => void;
  onHome: () => void;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  currentTest: any;
  /** Optional: a legacy screen key from saved progress (e.g. 'q18', 'readNotice2',
   *  'm2q13') to approximately resume at the right segment, instead of always
   *  restarting from the first question. */
  initialLegacyKey?: string;
  /** Called whenever the visible segment changes, with a legacy-compatible key,
   *  so existing progress-saving code keeps working unchanged. */
  onSegmentChange?: (legacyKey: string) => void;
  /** 리뷰 모드 — 하이라이트/밑줄/단어 해석 툴바 활성화 */
  isReviewMode?: boolean;
}

const isDailyLifeType = (t: string) =>
  t.includes('daily life') || t.includes('read in daily life') ||
  t.includes('notice') || t.includes('email') || t.includes('social media') ||
  t.includes('advertisement') || t.includes('article') || t.includes('form') ||
  t.includes('review') || t.includes('text_message') || t.includes('text-message') ||
  t.includes('실용문');

const isAcademicType = (t: string) =>
  t.includes('academic reading') || t.includes('academic') ||
  t.includes('reading passage') || t.includes('insert text');

const sortByNumber = (a: any, b: any) => {
  const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
  const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
  return na - nb;
};

/**
 * Flexible, data-driven Reading test engine. Replaces the old approach of
 * one hardcoded screen per fixed question number. Instead, it reads
 * whatever questions exist in CMS for this module, groups them by type
 * (Complete Words / Daily Life / Academic Passage), and walks through them
 * in order — however many there are.
 *
 * Visual rendering is NOT reinvented here: each question type reuses the
 * already-proven component for that type (FillBlanksTestScreen,
 * DailyLifeScreen's renderDailyLifePassage, AcademicPassageScreen's layout),
 * so the exam still looks exactly like it always has.
 */
export function ReadingTestEngine({
  sectionData,
  module,
  onModuleEnd,
  onExitBack,
  onHome,
  testBankType,
  handleTabChange,
  currentTest,
  initialLegacyKey,
  onSegmentChange,
  isReviewMode = false,
}: ReadingTestEngineProps) {
  const allQuestions: any[] = sectionData?.questions || [];
  const moduleQuestions = allQuestions.filter(q => {
    const isM2 = isModule2Question(q);
    return module === 2 ? isM2 : !isM2;
  });

  // 디버깅 로그 — 문제 분류 문제 진단용 (production에서는 무시해도 됨)
  if (typeof console !== 'undefined' && (window as any).__DEBUG_READING) {
    console.log('[ReadingTestEngine] module:', module);
    console.log('[ReadingTestEngine] allQuestions:', allQuestions.map(q => ({
      num: q.questionNumber,
      type: q.questionType,
      module: q.module,
      hasImage: !!q.imageUrl,
      hasText: !!q.passageText,
      isM2: isModule2Question(q),
    })));
    console.log('[ReadingTestEngine] moduleQuestions:', moduleQuestions.length);
  }

  const completeWordsGroups = moduleQuestions
    .filter(q => isCompleteWordsType(q.questionType))
    .sort(sortByNumber);

  const dailyLifeQuestions = moduleQuestions
    .filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return !isCompleteWordsType(q.questionType) && isDailyLifeType(t);
    })
    .sort(sortByNumber);

  const academicQuestions = moduleQuestions
    .filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return !isCompleteWordsType(q.questionType) && !isDailyLifeType(t) && isAcademicType(t);
    })
    .sort(sortByNumber);

  type Segment = { kind: 'cw' | 'daily' | 'academic'; question: any; legacyKey: string };
  const segments: Segment[] = [
    ...completeWordsGroups.map((q, i) => ({ kind: 'cw' as const, question: q, legacyKey: i === 0 ? 'fillBlanks' : `fillBlanks${i + 1}` })),
    ...dailyLifeQuestions.map((q, i) => ({ kind: 'daily' as const, question: q, legacyKey: `daily${i + 1}` })),
    ...academicQuestions.map((q, i) => ({ kind: 'academic' as const, question: q, legacyKey: `academic${i + 1}` })),
  ];

  // Map an old fixed-slot legacy key to an approximate segment index in the
  // new flexible layout, so resuming saved progress doesn't show a blank
  // screen — it lands on the right TYPE of question even if the exact
  // sub-position shifted slightly due to a different question count.
  const resolveLegacyKey = (key: string | undefined): number => {
    if (!key) return 0;
    const cwCount = completeWordsGroups.length;
    const dailyCount = dailyLifeQuestions.length;
    if (key === 'fillBlanks') return 0;
    if (key === 'readNotice1' || key === 'socialMedia1') return cwCount;
    if (key === 'readNotice2' || key === 'socialMedia2') return Math.min(cwCount + 1, cwCount + dailyCount - 1);
    if (key === 'socialMedia3') return Math.min(cwCount + 2, cwCount + dailyCount - 1);
    const q1Match = key.match(/^q(\d+)$/); // Module 1 academic slots q16-q20
    if (q1Match) {
      const idx = parseInt(q1Match[1]) - 16; // q16 -> 0
      return Math.min(cwCount + dailyCount + Math.max(0, idx), segments.length - 1);
    }
    if (key === 'm2FillBlanks') return 0;
    const m2Match = key.match(/^m2q(\d+)$/); // Module 2 academic slots m2q11-m2q20
    if (m2Match) {
      const idx = parseInt(m2Match[1]) - 11; // m2q11 -> 0
      return Math.min(cwCount + dailyCount + Math.max(0, idx), segments.length - 1);
    }
    return 0;
  };

  const [segmentIndex, setSegmentIndex] = useState(() => resolveLegacyKey(initialLegacyKey));

  React.useEffect(() => {
    if (onSegmentChange && segments[segmentIndex]) {
      onSegmentChange(segments[segmentIndex].legacyKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentIndex]);


  // Nothing uploaded yet for this module — show an honest empty state
  // instead of any hardcoded demo content.
  if (segments.length === 0) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-gray-700">
          이 섹션에는 아직 업로드된 문제가 없습니다.
        </p>
        <p className="text-sm text-gray-500">CMS에서 문제를 업로드한 뒤 다시 시도해주세요.</p>
        <button
          onClick={onExitBack}
          className="mt-2 bg-[#1e6b73] text-white rounded-lg px-5 py-2 font-medium hover:bg-[#155158]"
        >
          돌아가기
        </button>
      </div>
    );
  }

  // Total display count across the whole module, matching the classic
  // "Question X of Y" numbering (Complete Words counts as multiple).
  const totalDisplayCount = segments.reduce((sum, seg) => {
    if (seg.kind === 'cw') return sum + Math.max(1, getCompleteWordsBlankCount(seg.question));
    return sum + 1;
  }, 0);

  // Display index (0-based) of the CURRENT segment's first sub-question.
  let displayIndexBeforeCurrent = 0;
  for (let i = 0; i < segmentIndex; i++) {
    const seg = segments[i];
    displayIndexBeforeCurrent += seg.kind === 'cw' ? Math.max(1, getCompleteWordsBlankCount(seg.question)) : 1;
  }

  const goNext = () => {
    if (segmentIndex + 1 < segments.length) setSegmentIndex(segmentIndex + 1);
    else onModuleEnd();
  };
  const goBack = () => {
    if (segmentIndex > 0) setSegmentIndex(segmentIndex - 1);
    else onExitBack();
  };

  const current = segments[segmentIndex];

  if (current.kind === 'cw') {
    return (
      <FillBlanksTestScreen
        questionOverride={current.question}
        module={module}
        onNext={goNext}
        onBack={goBack}
        setShowFillBlanksTest={() => {}}
        setShowReadingSection={(v: any) => { if (!v) onHome(); }}
        setShowToeflTest={() => {}}
        setShowReadNoticeTest={() => {}}
        setShowModule1Details={() => {}}
        currentTest={currentTest}
        getCurrentSectionData={() => sectionData}
        testBankType={testBankType}
        handleTabChange={handleTabChange}
      />
    );
  }

  if (current.kind === 'daily') {
    let parsedTitle: any = null;
    try { parsedTitle = JSON.parse(current.question.passageText || ''); } catch { /* plain text, ignore */ }
    const passageTitle = current.question.passageTitle || parsedTitle?.title || '';
    return (
      <DailyLifeScreen
        question={current.question}
        passageTitle={passageTitle}
        questionIndex={displayIndexBeforeCurrent}
        totalQuestions={totalDisplayCount}
        onHome={onHome}
        onBack={goBack}
        onNext={goNext}
        isReviewMode={isReviewMode}
        testId={`${testBankType}-${currentTest?.tpoNumber ?? 'unknown'}-reading`}
        passageKey={`reading-m${module}-q${current.question.questionNumber}`}
      />
    );
  }

  // Academic Passage / Insert Text
  let parsedAcademic: any = null;
  if (current.question.passageText) {
    try { parsedAcademic = JSON.parse(current.question.passageText); }
    catch { parsedAcademic = { passage: current.question.passageText }; }
  }
  const passageTitle = current.question.passageTitle || parsedAcademic?.title || '';
  const passageText = parsedAcademic?.passage || current.question.passageText || '';

  return (
    <AcademicPassageScreen
      question={current.question}
      passageTitle={passageTitle}
      passageText={passageText}
      questionIndex={displayIndexBeforeCurrent}
      totalQuestions={totalDisplayCount}
      onHome={onHome}
      onBack={goBack}
      onNext={goNext}
      testBankType={testBankType}
      handleTabChange={handleTabChange}
      isReviewMode={isReviewMode}
      testId={`${testBankType}-${currentTest?.tpoNumber ?? 'unknown'}-reading`}
      passageKey={`reading-m${module}-q${current.question.questionNumber}`}
    />
  );
}
