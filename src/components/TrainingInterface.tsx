import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, ClipboardCheck, Play, RotateCcw, Sparkles, Wrench, X } from 'lucide-react';
import type { TPOQuestion } from './ContentManagement';
import { ReadingTestEngine } from './ReadingTestEngine';
import { ListeningTestEngine } from './ListeningTestEngine';
import { ReviewAssistantPanel, type ReviewSection, type ReviewVariant, type ReviewDifficulty } from './ReviewAssistantPanel';
import { ToeflAiWidget } from './ToeflAiWidget';
import { isCompleteWordsType, getCompleteWordsBlankCount } from '../utils/readingQuestionUtils';
// Writing — 실전 TPO와 동일한 화면 컴포넌트 재사용
import { WritingBuildSentenceIntro } from './WritingBuildSentenceIntro';
import { WritingBuildSentenceQ1 } from './WritingBuildSentenceQ1';
import { WritingEmailIntro } from './WritingEmailIntro';
import { WritingEmailQ1 } from './WritingEmailQ1';
import { WritingAcademicDiscussionIntro } from './WritingAcademicDiscussionIntro';
import { WritingAcademicDiscussionQ2 } from './WritingAcademicDiscussionQ2';
import { WritingEnd } from './WritingEnd';
import { buildEmailWritingQuestion, buildAcademicDiscussionProps } from './WritingSectionWrapper';
// Speaking — 실전 TPO와 동일한 화면 컴포넌트 재사용
import { SpeakingListenRepeatIntro } from './SpeakingListenRepeatIntro';
import { SpeakingQ1 } from './SpeakingQ1';
import { SpeakingQ1Record } from './SpeakingQ1Record';
import { SpeakingTakeInterviewIntro } from './SpeakingTakeInterviewIntro';
import { SpeakingInterviewIntro } from './SpeakingInterviewIntro';
import { SpeakingQ8Prep } from './SpeakingQ8Prep';
import { SpeakingQ8Record } from './SpeakingQ8Record';
import { useVolumeControl, VolumeControl } from './VolumeControl';

type TrainingSubject = 'Reading' | 'Listening' | 'Writing' | 'Speaking' | 'Vocabulary';
type TrainingDifficulty = '쉬움' | '보통' | '어려움';
type TrainingStep = 'intro' | 'test' | 'result';
type TrainingRunMode = 'start' | 'review';

export interface TrainingProgress {
  subject: TrainingSubject;
  questionType: string;
  difficulty: TrainingDifficulty;
  questions: TPOQuestion[];
  currentIndex: number;
  correctCount: number;
  answers: Record<number, string>;
  startTime: number;
  sessionTitle: string;
}

interface TrainingInterfaceProps {
  subject: TrainingSubject;
  questionType: string;
  difficulty: TrainingDifficulty;
  questions: TPOQuestion[];
  onClose: (saved?: TrainingProgress) => void;
  onComplete?: (result: { correctCount: number; totalQuestions: number }) => void;
  resumeIndex?: number;
  resumeCorrectCount?: number;
  resumeAnswers?: Record<number, string>;
}

const SUBJECT_THEME: Record<TrainingSubject, { bg: string; card: string; accent: string; soft: string; border: string }> = {
  Reading: { bg: 'from-[#eef9f8] via-[#e6f6f4] to-[#d8efec]', card: '#1d6f73', accent: '#164e52', soft: '#eef8f7', border: '#b9dedd' },
  Listening: { bg: 'from-[#eef4ff] via-[#e4eeff] to-[#d7e6ff]', card: '#2563eb', accent: '#1d4ed8', soft: '#eef4ff', border: '#c7d8ff' },
  Writing: { bg: 'from-[#fff7ed] via-[#fff1df] to-[#ffe4bf]', card: '#d97706', accent: '#b45309', soft: '#fff6e7', border: '#f5d7aa' },
  Speaking: { bg: 'from-[#f8f3ff] via-[#f2ecff] to-[#e4d8ff]', card: '#7c3aed', accent: '#6d28d9', soft: '#f4efff', border: '#d9c9ff' },
  Vocabulary: { bg: 'from-[#f6fbef] via-[#eef9e5] to-[#e3f4d1]', card: '#4d7c0f', accent: '#3f6212', soft: '#f4fbe8', border: '#d5ebb3' },
};

// ─── 공통 헬퍼 ───────────────────────────────────────────────────────────────

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
}

function normalizeDifficulty(difficulty?: string): TrainingDifficulty {
  const d = (difficulty || '').trim();
  if (d === '쉬움' || d === '어려움') return d;
  return '보통';
}

function getDifficultyLabel(difficulty: TrainingDifficulty) {
  if (difficulty === '쉬움') return 'Easy';
  if (difficulty === '어려움') return 'Hard';
  return 'Normal';
}

/** MC 문제의 정답 옵션 인덱스 (correctAnswer가 인덱스 또는 옵션 텍스트) */
function getCorrectOptionIndex(question: TPOQuestion) {
  if (!question.options || question.options.length === 0) return -1;
  if (typeof question.correctAnswer === 'string') {
    const numericIndex = Number(question.correctAnswer);
    if (!Number.isNaN(numericIndex) && question.options[numericIndex] !== undefined) {
      return numericIndex;
    }
    return question.options.findIndex((option) => normalizeAnswer(option) === normalizeAnswer((question.correctAnswer as string) || ''));
  }
  if (Array.isArray(question.correctAnswer) && question.correctAnswer.length > 0) {
    return question.options.findIndex((option) => normalizeAnswer(option) === normalizeAnswer(question.correctAnswer?.[0] || ''));
  }
  return -1;
}

const isDailyLifeType = (t: string) =>
  t.includes('daily life') || t.includes('read in daily life') ||
  t.includes('notice') || t.includes('email') || t.includes('social media') ||
  t.includes('advertisement') || t.includes('article') || t.includes('form') ||
  t.includes('review') || t.includes('text_message') || t.includes('text-message') ||
  t.includes('실용문');

const sortByNumber = (a: any, b: any) => {
  const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
  const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
  return na - nb;
};

function getWritingQuestionKind(q: TPOQuestion): 'bs' | 'email' | 'ad' {
  const t = (q.questionType || '').toLowerCase();
  if (t.includes('discussion')) return 'ad';
  if (t.includes('email')) return 'email';
  return 'bs';
}

function getSpeakingQuestionKind(q: TPOQuestion): 'repeat' | 'interview' {
  const t = (q.questionType || '').toLowerCase();
  if (t.includes('interview') || t.includes('integrated')) return 'interview';
  return 'repeat';
}

// ─── 결과 채점 (실전 엔진이 window 전역에 기록한 답안 수집) ────────────────────

interface TrainingScoreResult {
  correctCount: number;
  totalCount: number;
  answers: Record<number, string>;
  correctIndexes: number[];
  wrongIndexes: number[];
}

function collectTrainingScore(questions: TPOQuestion[]): TrainingScoreResult {
  const moduleAnswers = (typeof window !== 'undefined' && (window as any).__moduleAnswers) || {};
  const completeWordsAnswers = (typeof window !== 'undefined' && (window as any).__completeWordsAnswers) || {};

  let correctCount = 0;
  let totalCount = 0;
  const answers: Record<number, string> = {};
  const correctIndexes: number[] = [];
  const wrongIndexes: number[] = [];

  questions.forEach((q, index) => {
    if (isCompleteWordsType(q.questionType)) {
      // Complete Words — 빈칸 단위 채점
      const key = String(q.id || q.questionNumber || `cw-${index}`);
      const userBlanks = completeWordsAnswers[key] || {};
      const blanks = q.blanks && q.blanks.length > 0
        ? q.blanks
        : Array.from({ length: getCompleteWordsBlankCount(q) }, (_, i) => ({ id: i, answer: '' }));
      let groupCorrect = 0;
      let groupTotal = 0;
      blanks.forEach((blank: any, blankIdx: number) => {
        const expected = blank?.answer || '';
        if (!expected) return;
        groupTotal += 1;
        const userValue = userBlanks[blank?.id ?? blankIdx] ?? userBlanks[blankIdx] ?? '';
        if (normalizeAnswer(String(userValue)) === normalizeAnswer(String(expected))) {
          groupCorrect += 1;
        }
      });
      if (groupTotal > 0) {
        totalCount += groupTotal;
        correctCount += groupCorrect;
        answers[index] = Object.values(userBlanks).join('|');
        if (groupCorrect === groupTotal) correctIndexes.push(index);
        else wrongIndexes.push(index);
      }
      return;
    }

    if (q.options && q.options.length > 0) {
      const userAns = moduleAnswers[q.questionNumber as any];
      const correctIdx = getCorrectOptionIndex(q);
      if (correctIdx >= 0) {
        totalCount += 1;
        const isCorrect = userAns !== undefined && normalizeAnswer(String(userAns)) === normalizeAnswer(String(q.options[correctIdx]));
        if (userAns !== undefined) answers[index] = String(userAns);
        if (isCorrect) {
          correctCount += 1;
          correctIndexes.push(index);
        } else {
          wrongIndexes.push(index);
        }
      }
    }
  });

  return { correctCount, totalCount, answers, correctIndexes, wrongIndexes };
}

function countAnsweredQuestions(questions: TPOQuestion[]): Record<number, string> {
  const moduleAnswers = (typeof window !== 'undefined' && (window as any).__moduleAnswers) || {};
  const completeWordsAnswers = (typeof window !== 'undefined' && (window as any).__completeWordsAnswers) || {};
  const answers: Record<number, string> = {};
  questions.forEach((q, index) => {
    if (isCompleteWordsType(q.questionType)) {
      const key = String(q.id || q.questionNumber || `cw-${index}`);
      const userBlanks = completeWordsAnswers[key];
      if (userBlanks && Object.values(userBlanks).some((v: any) => String(v || '').trim())) {
        answers[index] = Object.values(userBlanks).join('|');
      }
    } else if (q.options && q.options.length > 0) {
      const userAns = moduleAnswers[q.questionNumber as any];
      if (userAns !== undefined) answers[index] = String(userAns);
    }
  });
  return answers;
}

// ─── Writing 훈련 플로우 — 실전 WritingSectionWrapper 화면을 그대로 재사용 ──────

interface TrainingWritingFlowProps {
  questions: TPOQuestion[];
  isReviewMode: boolean;
  onComplete: () => void;
  onHome: () => void;
  onCurrentChange: (question: TPOQuestion | null, kind: 'bs' | 'email' | 'ad' | null) => void;
}

function TrainingWritingFlow({ questions, isReviewMode, onComplete, onHome, onCurrentChange }: TrainingWritingFlowProps) {
  const sorted = useMemo(() => [...questions].sort(sortByNumber), [questions]);

  type WSegment =
    | { kind: 'intro'; wtype: 'bs' | 'email' | 'ad' }
    | { kind: 'question'; question: TPOQuestion; wtype: 'bs' | 'email' | 'ad' }
    | { kind: 'end' };

  const segments = useMemo<WSegment[]>(() => {
    const segs: WSegment[] = [];
    const seen = new Set<string>();
    sorted.forEach((q) => {
      const wtype = getWritingQuestionKind(q);
      if (!seen.has(wtype)) {
        seen.add(wtype);
        segs.push({ kind: 'intro', wtype });
      }
      segs.push({ kind: 'question', question: q, wtype });
    });
    segs.push({ kind: 'end' });
    return segs;
  }, [sorted]);

  const [index, setIndex] = useState(0);
  const current = segments[index];

  useEffect(() => {
    if (current.kind === 'question') onCurrentChange(current.question, current.wtype);
    else onCurrentChange(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const goNext = () => {
    if (index + 1 < segments.length) setIndex(index + 1);
    else onComplete();
  };
  const goBack = () => {
    if (index > 0) setIndex(index - 1);
    else onHome();
  };

  if (current.kind === 'intro') {
    if (current.wtype === 'bs') return <WritingBuildSentenceIntro onBack={goBack} onNext={goNext} onHome={onHome} />;
    if (current.wtype === 'email') return <WritingEmailIntro onNext={goNext} onHome={onHome} />;
    return <WritingAcademicDiscussionIntro onBegin={goNext} onHome={onHome} />;
  }

  if (current.kind === 'question') {
    const q = current.question;
    if (current.wtype === 'bs') {
      return (
        <WritingBuildSentenceQ1
          key={q.id || String(q.questionNumber)}
          onBack={goBack}
          onNext={goNext}
          onHome={onHome}
          avatar1ImageUrl={(q as any).avatar1ImageUrl}
          avatar2ImageUrl={(q as any).avatar2ImageUrl}
          questionText={q.questionText}
          words={q.words}
          sentenceEnding={(q as any).sentenceEnding}
          context={(q as any).context}
        />
      );
    }
    if (current.wtype === 'email') {
      return (
        <WritingEmailQ1
          key={q.id || String(q.questionNumber)}
          onBack={goBack}
          onNext={goNext}
          onHome={onHome}
          writingQuestion={buildEmailWritingQuestion(q)}
          isReviewMode={isReviewMode}
        />
      );
    }
    const adProps = buildAcademicDiscussionProps(q);
    return (
      <WritingAcademicDiscussionQ2
        key={q.id || String(q.questionNumber)}
        onBack={goBack}
        onNext={goNext}
        onHome={onHome}
        professorImageUrl={(q as any).avatar1ImageUrl}
        professorName={adProps.professorName}
        professorMessage={adProps.professorMessage}
        student1ImageUrl={(q as any).avatar2ImageUrl}
        student1Name={adProps.student1Name}
        student1Message={adProps.student1Message}
        student2ImageUrl={(q as any).avatar2ImageUrl}
        student2Name={adProps.student2Name}
        student2Message={adProps.student2Message}
        promptTitle={adProps.promptTitle}
        promptInstructions={adProps.promptInstructions}
        isReviewMode={isReviewMode}
      />
    );
  }

  return <WritingEnd onNext={onComplete} onHome={onHome} />;
}

// ─── Speaking 훈련 플로우 — 실전 SpeakingSectionWrapper 화면을 그대로 재사용 ────

interface TrainingSpeakingFlowProps {
  questions: TPOQuestion[];
  isReviewMode: boolean;
  onComplete: () => void;
  onHome: () => void;
  onCurrentChange: (question: TPOQuestion | null, kind: 'repeat' | 'interview' | null) => void;
}

function TrainingSpeakingFlow({ questions, isReviewMode, onComplete, onHome, onCurrentChange }: TrainingSpeakingFlowProps) {
  const sorted = useMemo(() => [...questions].sort(sortByNumber), [questions]);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();
  const volumeProps = { onVolumeClick: toggleVolume, isVolumeOpen, volumeButtonRef };

  type SSegment =
    | { kind: 'repeat-intro' }
    | { kind: 'repeat-listen'; question: TPOQuestion }
    | { kind: 'repeat-record'; question: TPOQuestion }
    | { kind: 'interview-intro' }
    | { kind: 'interview-scenario'; question: TPOQuestion }
    | { kind: 'interview-prep'; question: TPOQuestion }
    | { kind: 'interview-record'; question: TPOQuestion };

  const segments = useMemo<SSegment[]>(() => {
    const segs: SSegment[] = [];
    const firstKind = sorted.length > 0 ? getSpeakingQuestionKind(sorted[0]) : null;
    let repeatIntroDone = false;
    let interviewIntroDone = false;
    sorted.forEach((q) => {
      const skind = getSpeakingQuestionKind(q);
      if (skind === 'repeat') {
        if (!repeatIntroDone) {
          repeatIntroDone = true;
          segs.push({ kind: 'repeat-intro' });
        }
        segs.push({ kind: 'repeat-listen', question: q });
        segs.push({ kind: 'repeat-record', question: q });
      } else {
        if (!interviewIntroDone) {
          interviewIntroDone = true;
          segs.push({ kind: 'interview-intro' });
          segs.push({ kind: 'interview-scenario', question: q });
        }
        segs.push({ kind: 'interview-prep', question: q });
        segs.push({ kind: 'interview-record', question: q });
      }
    });
    void firstKind;
    return segs;
  }, [sorted]);

  const [index, setIndex] = useState(0);
  const current = segments[index];

  useEffect(() => {
    if (current.kind === 'repeat-listen' || current.kind === 'repeat-record') {
      onCurrentChange(current.question, 'repeat');
    } else if (current.kind === 'interview-prep' || current.kind === 'interview-record' || current.kind === 'interview-scenario') {
      onCurrentChange(current.question, 'interview');
    } else {
      onCurrentChange(null, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const goNext = () => {
    if (index + 1 < segments.length) setIndex(index + 1);
    else onComplete();
  };
  const goBack = () => {
    if (index > 0) setIndex(index - 1);
    else onHome();
  };

  const renderSegment = () => {
    switch (current.kind) {
      case 'repeat-intro':
        return <SpeakingListenRepeatIntro onNext={goNext} onLogoClick={onHome} isReviewMode={isReviewMode} {...(volumeProps as any)} />;
      case 'repeat-listen': {
        const q = current.question as any;
        return (
          <SpeakingQ1
            key={`listen-${q.id || q.questionNumber}`}
            onNext={goNext}
            onHome={onHome}
            isReviewMode={isReviewMode}
            imageUrl={q.introImageUrl || q.imageUrl}
            introAudioUrl={q.introAudioUrl}
            questionText={q.questionText}
          />
        );
      }
      case 'repeat-record': {
        const q = current.question as any;
        return (
          <SpeakingQ1Record
            key={`record-${q.id || q.questionNumber}`}
            onNext={goNext}
            onHome={onHome}
            isReviewMode={isReviewMode}
            imageUrl={q.imageUrl}
            audioUrl={q.audioUrl}
            questionText={q.questionText}
            responseDelay={q.responseDelay}
            stopDuration={q.stopDuration}
            {...({ duration: q.duration } as any)}
          />
        );
      }
      case 'interview-intro':
        return <SpeakingTakeInterviewIntro onNext={goNext} onHome={onHome} isReviewMode={isReviewMode} />;
      case 'interview-scenario': {
        const q = current.question as any;
        return (
          <SpeakingInterviewIntro
            key={`scenario-${q.id || q.questionNumber}`}
            onNext={goNext}
            onHome={onHome}
            isReviewMode={isReviewMode}
            imageUrl={q.introImageUrl || q.imageUrl}
            introAudioUrl={q.introAudioUrl}
            questionText={q.questionText}
          />
        );
      }
      case 'interview-prep': {
        const q = current.question as any;
        return (
          <SpeakingQ8Prep
            key={`prep-${q.id || q.questionNumber}`}
            onNext={goNext}
            onHome={onHome}
            isReviewMode={isReviewMode}
            {...(volumeProps as any)}
            imageUrl={q.imageUrl}
            audioUrl={q.audioUrl}
            videoUrl={q.videoUrl}
            questionText={q.questionText}
            audioPlayDuration={q.audioPlayDuration}
          />
        );
      }
      case 'interview-record': {
        const q = current.question as any;
        return (
          <SpeakingQ8Record
            key={`record-${q.id || q.questionNumber}`}
            onNext={goNext}
            onHome={onHome}
            isReviewMode={isReviewMode}
            {...(volumeProps as any)}
            imageUrl={q.imageUrl}
            questionText={q.questionText}
            responseDelay={q.responseDelay}
            stopDuration={q.stopDuration}
            {...({ duration: q.duration } as any)}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      {renderSegment()}
      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef as any} />
    </>
  );
}

// ─── Vocabulary 훈련 플로우 (TPO 실전 엔진 없음 — 심플 카드 UI 유지) ────────────

interface TrainingVocabularyFlowProps {
  questions: TPOQuestion[];
  theme: { card: string; accent: string; soft: string; border: string };
  onComplete: (correctCount: number) => void;
  onExit: () => void;
}

function TrainingVocabularyFlow({ questions, theme, onComplete, onExit }: TrainingVocabularyFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion?.options || [];
  const correctOptionIndex = currentQuestion ? getCorrectOptionIndex(currentQuestion) : -1;
  const isLast = currentIndex === questions.length - 1;

  useEffect(() => {
    setSelectedOptionIndex(null);
    setChecked(false);
  }, [currentIndex]);

  if (!currentQuestion) return null;

  const handleCheck = () => {
    if (selectedOptionIndex === null || checked) return;
    if (selectedOptionIndex === correctOptionIndex) setCorrectCount((prev) => prev + 1);
    setChecked(true);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete(correctCount);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-gradient-to-br from-[#f6fbef] via-[#eef9e5] to-[#e3f4d1] px-4">
      <div className="w-full max-w-3xl rounded-[32px] border bg-white/95 p-6 shadow-2xl sm:p-8" style={{ borderColor: theme.border }}>
        <div className="flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme.card }}>
            Question {currentIndex + 1} / {questions.length}
          </span>
          <button type="button" onClick={onExit} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500">
            닫기
          </button>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">{currentQuestion.questionText || '문제를 확인하세요.'}</h2>
        <div className="mt-6 space-y-3">
          {options.map((option, index) => {
            const isCorrect = checked && index === correctOptionIndex;
            const isWrong = checked && selectedOptionIndex === index && index !== correctOptionIndex;
            return (
              <button
                key={`${currentQuestion.id}-opt-${index}`}
                type="button"
                onClick={() => !checked && setSelectedOptionIndex(index)}
                className={`w-full rounded-[20px] border px-5 py-4 text-left text-sm font-medium transition-all ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : isWrong
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : selectedOptionIndex === index
                        ? 'border-slate-400 bg-slate-50 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {option.replace(/^[A-D]\.\s*/, '')}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          {!checked ? (
            <button
              type="button"
              disabled={selectedOptionIndex === null}
              onClick={handleCheck}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300"
              style={{ backgroundColor: selectedOptionIndex !== null ? theme.card : '#cbd5e1' }}
            >
              정답 확인
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: theme.card }}
            >
              {isLast ? '훈련 종료' : '다음 문제'}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 TrainingInterface ─────────────────────────────────────────────────

export function TrainingInterface({
  subject,
  questionType,
  difficulty,
  questions,
  onClose,
  onComplete,
}: TrainingInterfaceProps) {
  const theme = SUBJECT_THEME[subject];
  const [step, setStep] = useState<TrainingStep>('intro');
  const [mode, setMode] = useState<TrainingRunMode>('start');
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [reviewQuestion, setReviewQuestion] = useState<TPOQuestion | null>(null);
  const [reviewKind, setReviewKind] = useState<string | null>(null);
  const [result, setResult] = useState<TrainingScoreResult | null>(null);
  const startTimeRef = useRef(Date.now());

  const isReview = mode === 'review';

  // 실전 엔진들이 기록하는 답안 전역 상태 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__moduleAnswers = {};
      (window as any).__completeWordsAnswers = {};
      (window as any).__fillBlanksAnswers = {};
    }
    startTimeRef.current = Date.now();
  }, []);

  // Reading 엔진 세그먼트 키 → 현재 문제 매핑 (엔진의 분류/정렬과 동일한 로직)
  const readingSegmentGroups = useMemo(() => {
    const cw = questions.filter((q) => isCompleteWordsType(q.questionType)).sort(sortByNumber);
    const daily = questions.filter((q) => {
      const t = (q.questionType || '').toLowerCase();
      return !isCompleteWordsType(q.questionType) && isDailyLifeType(t);
    }).sort(sortByNumber);
    const academic = questions.filter((q) => {
      const t = (q.questionType || '').toLowerCase();
      return !isCompleteWordsType(q.questionType) && !isDailyLifeType(t);
    }).sort(sortByNumber);
    return { cw, daily, academic };
  }, [questions]);

  const listeningSorted = useMemo(() => [...questions].sort(sortByNumber), [questions]);

  const handleReadingSegmentChange = (legacyKey: string) => {
    const { cw, daily, academic } = readingSegmentGroups;
    let q: TPOQuestion | null = null;
    if (legacyKey.startsWith('fillBlanks')) {
      const idx = legacyKey === 'fillBlanks' ? 0 : parseInt(legacyKey.replace('fillBlanks', ''), 10) - 1;
      q = cw[idx] || null;
    } else if (legacyKey.startsWith('daily')) {
      const idx = parseInt(legacyKey.replace('daily', ''), 10) - 1;
      q = daily[idx] || null;
    } else if (legacyKey.startsWith('academic')) {
      const idx = parseInt(legacyKey.replace('academic', ''), 10) - 1;
      q = academic[idx] || null;
    }
    setReviewQuestion(q);
    setReviewKind(q ? (isCompleteWordsType(q.questionType) ? 'cw' : isDailyLifeType((q.questionType || '').toLowerCase()) ? 'daily' : 'academic') : null);
  };

  const handleListeningSegmentChange = (legacyKey: string) => {
    const match = legacyKey.match(/^q(\d+)$/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      setReviewQuestion(listeningSorted[idx] || null);
      setReviewKind('listening');
    } else {
      setReviewQuestion(null);
      setReviewKind(null);
    }
  };

  const handleWritingCurrentChange = (q: TPOQuestion | null, kind: 'bs' | 'email' | 'ad' | null) => {
    setReviewQuestion(q);
    setReviewKind(kind);
  };

  const handleSpeakingCurrentChange = (q: TPOQuestion | null, kind: 'repeat' | 'interview' | null) => {
    setReviewQuestion(q);
    setReviewKind(kind);
  };

  // 훈련 종료 — 채점 후 결과 화면
  const handleTestComplete = () => {
    const score = collectTrainingScore(questions);
    setResult(score);
    setStep('result');
  };

  const handleVocabularyComplete = (correctCount: number) => {
    setResult({
      correctCount,
      totalCount: questions.length,
      answers: {},
      correctIndexes: [],
      wrongIndexes: [],
    });
    setStep('result');
  };

  // 중간 종료 — 진행률 저장 (기존 TrainingSection 계약 유지)
  const handleExit = () => {
    const answers = countAnsweredQuestions(questions);
    const progress: TrainingProgress = {
      subject,
      questionType,
      difficulty,
      questions,
      currentIndex: 0,
      correctCount: 0,
      answers,
      startTime: startTimeRef.current,
      sessionTitle: `${subject} ${questionType} 훈련`,
    };
    onClose(progress);
  };

  const handleResultClose = () => {
    const finalResult = result || { correctCount: 0, totalCount: questions.length };
    onComplete?.({ correctCount: finalResult.correctCount, totalQuestions: finalResult.totalCount });
    onClose();
  };

  const handleRestart = () => {
    if (typeof window !== 'undefined') {
      (window as any).__moduleAnswers = {};
      (window as any).__completeWordsAnswers = {};
      (window as any).__fillBlanksAnswers = {};
    }
    setResult(null);
    setReviewQuestion(null);
    setReviewKind(null);
    startTimeRef.current = Date.now();
    setStep('intro');
  };

  // ── 리뷰 패널 설정 ──
  const reviewPanelConfig = (() => {
    if (!isReview || step !== 'test' || subject === 'Vocabulary') return null;
    let variant: ReviewVariant = 'reading';
    if (subject === 'Reading') variant = 'reading';
    else if (subject === 'Listening') variant = 'listening';
    else if (subject === 'Writing') variant = reviewKind === 'bs' ? 'writing-basic' : 'writing-guided';
    else if (subject === 'Speaking') variant = reviewKind === 'interview' ? 'speaking-interview' : 'speaking-repeat';

    return {
      section: subject as ReviewSection,
      variant,
      contentKey: `training-${subject}-${reviewQuestion?.id || reviewQuestion?.questionNumber || 'intro'}`,
      questionType,
      currentDifficulty: normalizeDifficulty(reviewQuestion?.difficulty as string | undefined) as ReviewDifficulty,
      translationNote: reviewQuestion?.translationNote,
      analysisNote: (reviewQuestion as any)?.analysisNote,
      vocabularyNote: reviewQuestion?.vocabularyNote,
      audioUrl: reviewQuestion?.audioUrl || (reviewQuestion as any)?.passageAudioUrl || undefined,
      scriptText: reviewQuestion?.scriptText || reviewQuestion?.passageText || undefined,
    };
  })();

  // ── 빈 문제 ──
  if (!questions.length) {
    return (
      <div className={`fixed inset-0 z-[95] overflow-y-auto bg-gradient-to-br ${theme.bg}`}>
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
            <h2 className="text-2xl font-bold text-slate-900">연동된 훈련 문제가 없습니다</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">현재 선택한 과목, 유형, 난이도 조합에 맞는 문제가 아직 등록되지 않았습니다.</p>
            <button
              type="button"
              onClick={() => onClose()}
              className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: theme.card }}
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 1: 인트로 — Start / Review 선택 (실전 TPO 카드와 동일한 개념) ──
  if (step === 'intro') {
    return (
      <div className="fixed inset-0 z-[95] bg-gray-50 flex flex-col">
        {/* 실전 TPO와 동일한 틸 헤더 */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg shrink-0">
          <div className="flex items-center">
            <div
              className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleExit}
            >
              *toefl ibt
            </div>
          </div>
          <button
            type="button"
            onClick={handleExit}
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-4 py-2 hover:bg-[#084d52] transition-colors"
          >
            <X className="w-4 h-4 text-white" />
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-sm">Exit</span>
          </button>
        </div>

        {/* Navigation tab */}
        <div className="bg-white border-b border-gray-300 shrink-0">
          <div className="px-4 sm:px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
              {subject} Training
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-10">
          <div className="w-full max-w-3xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ borderColor: theme.border, color: theme.accent, backgroundColor: '#ffffffcc' }}>
                <Sparkles className="h-3.5 w-3.5" />
                {subject} Training
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-['Inter',_sans-serif] font-bold text-gray-900">{questionType}</h1>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: theme.border, color: theme.accent }}>{subject}</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{getDifficultyLabel(difficulty)} · {difficulty}</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">{questions.length}문제</span>
              </div>
              <p className="mt-4 text-sm md:text-base text-gray-500">
                실전 TPO/Test와 동일한 화면과 흐름으로 훈련합니다. 모드를 선택하세요.
              </p>
            </div>

            {/* Start / Review 선택 카드 — 실전 TPO의 Start/Review와 동일 개념 */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setMode('start'); setStep('test'); }}
                className="group rounded-[20px] border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-[#1e6b73] hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e6b73] text-white shadow-md transition-transform group-hover:scale-105">
                  <Play className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Start</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  실전 시험과 완전히 동일한 환경에서 원본 그대로 문제를 풉니다.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#1e6b73]">
                  시험 시작 <ArrowRight className="h-4 w-4" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('review'); setStep('test'); }}
                className="group rounded-[20px] border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-[#7c3aed] hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#667eea] to-[#8fd6ee] text-white shadow-md transition-transform group-hover:scale-105">
                  <Wrench className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900">Review</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  동일한 시험 화면에서 Tools(하이라이트/밑줄/사전)와 AI 튜터를 함께 사용합니다.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#667eea]">
                  <Bot className="h-4 w-4" /> 복습 모드로 시작 <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 3: 결과 ──
  if (step === 'result') {
    const finalResult = result || { correctCount: 0, totalCount: 0, answers: {}, correctIndexes: [], wrongIndexes: [] };
    const hasScoredQuestions = finalResult.totalCount > 0;
    const accuracy = hasScoredQuestions ? Math.round((finalResult.correctCount / finalResult.totalCount) * 100) : 0;
    const elapsedSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const elapsedMin = Math.floor(elapsedSec / 60);
    const elapsedRest = elapsedSec % 60;

    return (
      <div className={`fixed inset-0 z-[95] overflow-y-auto bg-gradient-to-br ${theme.bg}`}>
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/95 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: theme.soft }}>
                <ClipboardCheck className="h-8 w-8" style={{ color: theme.card }} />
              </div>
              <h2 className="mt-5 text-3xl font-bold text-slate-900">훈련 완료</h2>
              <p className="mt-2 text-sm text-slate-500">{subject} · {questionType} · {mode === 'review' ? 'Review 모드' : 'Start 모드'}</p>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
              <div className="rounded-[20px] border bg-white px-4 py-4 text-center" style={{ borderColor: theme.border }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">문제 수</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{questions.length}</p>
              </div>
              <div className="rounded-[20px] border bg-white px-4 py-4 text-center" style={{ borderColor: theme.border }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">정답</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: theme.card }}>
                  {hasScoredQuestions ? `${finalResult.correctCount}/${finalResult.totalCount}` : '-'}
                </p>
              </div>
              <div className="rounded-[20px] border bg-white px-4 py-4 text-center" style={{ borderColor: theme.border }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">소요 시간</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{elapsedMin}:{String(elapsedRest).padStart(2, '0')}</p>
              </div>
            </div>

            {hasScoredQuestions && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>정답률</span>
                  <span>{accuracy}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${accuracy}%`, background: `linear-gradient(90deg, ${theme.card} 0%, ${theme.accent} 100%)` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {questions.map((q, index) => {
                    const isCorrect = finalResult.correctIndexes.includes(index);
                    const isWrong = finalResult.wrongIndexes.includes(index);
                    if (!isCorrect && !isWrong) return null;
                    return (
                      <span
                        key={q.id || index}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
                          isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasScoredQuestions && (
              <p className="mt-6 rounded-[20px] border px-4 py-4 text-center text-sm leading-6 text-slate-500" style={{ borderColor: theme.border, backgroundColor: theme.soft }}>
                서술형/말하기 훈련은 자동 채점되지 않습니다. 작성한 답변을 다시 검토핵보세요.
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-semibold transition-colors"
                style={{ borderColor: theme.card, color: theme.card }}
              >
                <RotateCcw className="h-4 w-4" />
                다시 풀기
              </button>
              <button
                type="button"
                onClick={handleResultClose}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.card }}
              >
                <CheckCircle2 className="h-4 w-4" />
                훈련 종료
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: 시험 — 실전 TPO/Test와 동일한 엔진/화면 사용 ──
  return (
    <>
      {subject === 'Reading' && (
        <ReadingTestEngine
          sectionData={{ questions }}
          module={1}
          currentTest={{ tpoNumber: 0, section: 'Reading' }}
          testBankType="training"
          handleTabChange={() => {}}
          isReviewMode={isReview}
          onSegmentChange={handleReadingSegmentChange}
          onModuleEnd={handleTestComplete}
          onExitBack={handleExit}
          onHome={handleExit}
        />
      )}

      {subject === 'Listening' && (
        <ListeningTestEngine
          sectionData={{ questions }}
          module={1}
          currentTest={{ tpoNumber: 0, section: 'Listening' }}
          testBankType="training"
          handleTabChange={() => {}}
          onSegmentChange={handleListeningSegmentChange}
          onModuleEnd={handleTestComplete}
          onExitBack={handleExit}
          onHome={handleExit}
        />
      )}

      {subject === 'Writing' && (
        <TrainingWritingFlow
          questions={questions}
          isReviewMode={isReview}
          onComplete={handleTestComplete}
          onHome={handleExit}
          onCurrentChange={handleWritingCurrentChange}
        />
      )}

      {subject === 'Speaking' && (
        <TrainingSpeakingFlow
          questions={questions}
          isReviewMode={isReview}
          onComplete={handleTestComplete}
          onHome={handleExit}
          onCurrentChange={handleSpeakingCurrentChange}
        />
      )}

      {subject === 'Vocabulary' && (
        <TrainingVocabularyFlow
          questions={questions}
          theme={theme}
          onComplete={handleVocabularyComplete}
          onExit={handleExit}
        />
      )}

      {/* Review 모드 — 실전 TPO Review와 동일한 오른쪽 통합 아이콘 바 + AI 튜터 */}
      {reviewPanelConfig && (
        <ReviewAssistantPanel
          section={reviewPanelConfig.section}
          variant={reviewPanelConfig.variant}
          contentKey={reviewPanelConfig.contentKey}
          questionType={reviewPanelConfig.questionType}
          currentDifficulty={reviewPanelConfig.currentDifficulty}
          onStartTraining={() => {}}
          onOpenAiTutor={() => setIsAiTutorOpen(true)}
          translationNote={reviewPanelConfig.translationNote}
          analysisNote={reviewPanelConfig.analysisNote}
          vocabularyNote={reviewPanelConfig.vocabularyNote}
          audioUrl={reviewPanelConfig.audioUrl}
          scriptText={reviewPanelConfig.scriptText}
        />
      )}

      {reviewPanelConfig && (
        <ToeflAiWidget
          position="right"
          zIndex={86}
          showFab={false}
          open={isAiTutorOpen}
          onOpenChange={setIsAiTutorOpen}
          pinnable
          contextLabel={`${subject} Training${questionType ? ' · ' + questionType : ''}`}
          questionData={reviewQuestion || undefined}
        />
      )}
    </>
  );
}
