import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, X, Headphones, RotateCcw } from 'lucide-react';
import type { TPOQuestion } from './ContentManagement';
import { RadioOption } from './RadioOption';

type TrainingSubject = 'Reading' | 'Listening' | 'Writing' | 'Speaking' | 'Vocabulary';
type TrainingDifficulty = '쉬움' | '보통' | '어려움';
type TrainingMode = 'multiple-choice' | 'fill-blanks' | 'build-sentence' | 'open-response';
type Phase = 'start' | 'question' | 'review';

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

function getTrainingMode(question: TPOQuestion): TrainingMode {
  if (question.options && question.options.length > 0) return 'multiple-choice';
  if (question.blanks && question.blanks.length > 0) return 'fill-blanks';
  if (question.words && question.words.length > 0) return 'build-sentence';
  return 'open-response';
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
}

function getDisplayAnswer(question: TPOQuestion) {
  if (Array.isArray(question.correctAnswer)) return question.correctAnswer.join(', ');
  if (typeof question.correctAnswer === 'string') return question.correctAnswer;
  if (question.blanks && question.blanks.length > 0) return question.blanks.map((b) => b.answer).join(', ');
  return '';
}

function getCorrectOptionIndex(question: TPOQuestion) {
  if (!question.options || question.options.length === 0) return -1;
  if (typeof question.correctAnswer === 'string') {
    const numericIndex = Number(question.correctAnswer);
    if (!Number.isNaN(numericIndex) && question.options[numericIndex] !== undefined) return numericIndex;
    return question.options.findIndex((o) => normalizeAnswer(o) === normalizeAnswer(question.correctAnswer || ''));
  }
  if (Array.isArray(question.correctAnswer) && question.correctAnswer.length > 0) {
    return question.options.findIndex((o) => normalizeAnswer(o) === normalizeAnswer(question.correctAnswer?.[0] || ''));
  }
  return -1;
}

function getDifficultyLabel(difficulty: TrainingDifficulty) {
  if (difficulty === '쉬움') return 'Easy';
  if (difficulty === '어려움') return 'Hard';
  return 'Normal';
}

// Compact TPO-style header shared by intro/question/review phases.
function TpoHeader({
  onHome,
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  showBack = false,
  showNext = false,
  nextDisabled = false,
}: {
  onHome: () => void;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
      <div
        className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onHome}
      >
        *toefl ibt
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 sm:gap-2 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-[#084d52] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">{backLabel}</span>
          </button>
        )}
        {showNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className={`flex items-center gap-1 sm:gap-2 rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 border-2 transition-colors ${
              nextDisabled
                ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white border-[#0A6068] text-[#0A6068] hover:bg-gray-100'
            }`}
          >
            <span className="font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">{nextLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function TrainingInterface({
  subject,
  questionType,
  difficulty,
  questions,
  onClose,
  onComplete,
  resumeIndex = 0,
  resumeCorrectCount = 0,
  resumeAnswers = {},
}: TrainingInterfaceProps) {
  // If the user is resuming mid-session, skip the intro and drop them straight
  // into the question they left off on.
  const [phase, setPhase] = useState<Phase>(resumeIndex > 0 ? 'question' : 'start');
  const [currentIndex, setCurrentIndex] = useState(resumeIndex);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  const [sentenceAnswer, setSentenceAnswer] = useState('');
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(resumeCorrectCount);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>(resumeAnswers);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const mode = useMemo(() => (currentQuestion ? getTrainingMode(currentQuestion) : 'open-response'), [currentQuestion]);
  const correctOptionIndex = getCorrectOptionIndex(currentQuestion);
  const totalQuestions = questions.length;
  const progressPct = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isLast = currentIndex === totalQuestions - 1;
  const answeredCount = checked ? currentIndex + 1 : currentIndex;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  useEffect(() => {
    setSelectedOptionIndex(null);
    setBlankInputs(currentQuestion?.blanks ? Array(currentQuestion.blanks.length).fill('') : []);
    setSentenceAnswer('');
    setWrittenAnswer('');
    setChecked(false);
  }, [currentIndex, currentQuestion]);

  // Empty state — no questions available for this bucket.
  if (!questions.length) {
    return (
      <div className="fixed inset-0 z-[95] bg-white flex flex-col">
        <TpoHeader onHome={() => onClose()} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">연동된 훈련 문제가 없습니다</h2>
            <p className="text-sm text-gray-500 mb-6">
              현재 선택한 과목, 유형, 난이도 조합에 맞는 문제가 아직 등록되지 않았습니다.
            </p>
            <button
              type="button"
              onClick={() => onClose()}
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-[#1e6b73] hover:bg-[#155056]"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const objectiveResult = (() => {
    if (mode === 'multiple-choice') return selectedOptionIndex === correctOptionIndex;
    if (mode === 'fill-blanks')
      return blankInputs.every((input, index) => normalizeAnswer(input) === normalizeAnswer(currentQuestion.blanks?.[index]?.answer || ''));
    if (mode === 'build-sentence') return normalizeAnswer(sentenceAnswer) === normalizeAnswer(getDisplayAnswer(currentQuestion));
    return false;
  })();

  const canCheck = (() => {
    if (mode === 'multiple-choice') return selectedOptionIndex !== null;
    if (mode === 'fill-blanks') return blankInputs.every((i) => i.trim().length > 0);
    if (mode === 'build-sentence') return sentenceAnswer.trim().length > 0;
    return writtenAnswer.trim().length > 0;
  })();

  const handleCheck = () => {
    if (!canCheck || checked) return;
    let currentAnswer = '';
    if (mode === 'multiple-choice') currentAnswer = String(selectedOptionIndex);
    else if (mode === 'fill-blanks') currentAnswer = blankInputs.join('|');
    else if (mode === 'build-sentence') currentAnswer = sentenceAnswer;
    else currentAnswer = writtenAnswer;

    setUserAnswers((prev) => ({ ...prev, [currentIndex]: currentAnswer }));
    if (mode !== 'open-response' && objectiveResult) {
      setCorrectCount((prev) => prev + 1);
    }
    setChecked(true);
  };

  const handleNext = () => {
    if (isLast) {
      // Trigger completion save then land on the review screen (not the exit).
      onComplete?.({ correctCount, totalQuestions });
      setPhase('review');
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleExit = () => {
    const progress: TrainingProgress = {
      subject,
      questionType,
      difficulty,
      questions,
      currentIndex,
      correctCount,
      answers: { ...userAnswers },
      startTime: Date.now(),
      sessionTitle: `${subject} ${questionType} 훈련`,
    };
    onClose(progress);
  };

  // ── Start / Intro phase ─────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="fixed inset-0 z-[95] bg-gray-50 flex flex-col">
        <TpoHeader
          onHome={() => onClose()}
          showNext
          nextLabel="Begin"
          onNext={() => setPhase('question')}
        />
        <div className="bg-white border-b border-gray-300">
          <div className="px-4 sm:px-8 py-2 sm:py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block text-sm sm:text-base">
              {subject} Training
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white flex items-start sm:items-center justify-center pb-20 sm:pb-0">
          <div className="max-w-3xl w-full px-4 sm:px-8 py-6 sm:py-12">
            <h1 className="text-2xl sm:text-4xl font-['Inter',_sans-serif] font-bold text-gray-900 mb-3">
              {questionType}
            </h1>
            <div className="w-24 h-1 bg-gray-300 mb-6" />

            <div className="space-y-4 text-gray-700 font-['Inter',_sans-serif] leading-relaxed text-sm sm:text-base">
              <p>
                실전 TPO와 동일한 흐름으로 <strong>{questionType}</strong> 유형 문제를 풀어보세요.
                각 문항을 풀고 정답을 확인한 뒤 다음으로 넘어가며, 마지막 문항 이후에는 결과와
                오답 리뷰를 확인할 수 있습니다.
              </p>

              <div className="my-4 sm:my-6">
                <table className="w-full border border-black text-sm sm:text-base">
                  <thead>
                    <tr className="bg-[#2d7a7c] text-white">
                      <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">항목</th>
                      <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">내용</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Subject</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">{subject}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Question Type</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">{questionType}</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Difficulty</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">
                        {getDifficultyLabel(difficulty)} · {difficulty}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Total Questions</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">{totalQuestions}문항</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-500">
                우측 상단의 <strong>Begin</strong> 버튼을 눌러 훈련을 시작하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Review phase ────────────────────────────────────────────────────────
  if (phase === 'review') {
    // Deep review of a single question inside the review screen.
    if (reviewIndex !== null) {
      const q = questions[reviewIndex];
      const savedAnswer = userAnswers[reviewIndex] || '';
      const qMode = getTrainingMode(q);
      const qCorrectIndex = getCorrectOptionIndex(q);
      const wasCorrect = (() => {
        if (qMode === 'multiple-choice') return Number(savedAnswer) === qCorrectIndex;
        if (qMode === 'fill-blanks') {
          const parts = savedAnswer.split('|');
          return q.blanks?.every((b, i) => normalizeAnswer(parts[i] || '') === normalizeAnswer(b.answer)) ?? false;
        }
        if (qMode === 'build-sentence') return normalizeAnswer(savedAnswer) === normalizeAnswer(getDisplayAnswer(q));
        return null; // open-response — no auto grade
      })();

      return (
        <div className="fixed inset-0 z-[95] bg-white flex flex-col">
          <TpoHeader
            onHome={() => onClose()}
            showBack
            backLabel="Back to Review"
            onBack={() => setReviewIndex(null)}
          />
          <div className="bg-white border-b border-gray-300">
            <div className="px-4 sm:px-8 py-2 sm:py-3">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold text-sm sm:text-base">
                {subject} · Review · Q{reviewIndex + 1}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
              <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                <span>Question {reviewIndex + 1} of {totalQuestions}</span>
                {wasCorrect === true && <span className="text-green-600">· 정답</span>}
                {wasCorrect === false && <span className="text-red-600">· 오답</span>}
              </div>

              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-6 font-['Inter',_sans-serif]">
                {q.questionText || '문제를 확인하세요.'}
              </h2>

              {q.passageText && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm text-gray-700 leading-6">
                  {q.passageText}
                </div>
              )}

              {q.audioUrl && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Headphones className="h-4 w-4" /> Audio
                  </div>
                  <audio controls className="w-full" src={q.audioUrl} />
                </div>
              )}

              {qMode === 'multiple-choice' && (
                <div className="space-y-3">
                  {q.options?.map((option, index) => {
                    const isCorrect = index === qCorrectIndex;
                    const isPicked = Number(savedAnswer) === index;
                    return (
                      <div
                        key={`review-${q.id}-${index}`}
                        className={`w-full rounded-lg border px-4 py-3 text-sm font-medium ${
                          isCorrect
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : isPicked
                              ? 'border-red-400 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-white text-gray-700'
                        }`}
                      >
                        {option.replace(/^[A-D]\.\s*/, '')}
                        {isCorrect && <span className="ml-2 text-xs font-bold">✓ 정답</span>}
                        {isPicked && !isCorrect && <span className="ml-2 text-xs font-bold">내 선택</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {qMode !== 'multiple-choice' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">내 답변</p>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                      {savedAnswer.replace(/\|/g, ', ') || '(답변 없음)'}
                    </div>
                  </div>
                  {getDisplayAnswer(q) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">정답</p>
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 whitespace-pre-wrap">
                        {getDisplayAnswer(q)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {q.explanation && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">해설</p>
                  {q.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Review index list — summary of all answered questions.
    return (
      <div className="fixed inset-0 z-[95] bg-white flex flex-col">
        <TpoHeader
          onHome={() => onClose()}
          showNext
          nextLabel="Exit"
          onNext={() => onClose()}
        />
        <div className="bg-white border-b border-gray-300">
          <div className="px-4 sm:px-8 py-2 sm:py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold text-sm sm:text-base">
              {subject} Training Complete
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
            <div className="text-center mb-8">
              <div className="mb-4 flex justify-center">
                <CheckCircle2 className="w-14 h-14 text-[#1e6b73]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-['Inter',_sans-serif]">
                Training Complete
              </h1>
              <p className="text-gray-600">
                총 <strong>{totalQuestions}</strong>문항 중 <strong>{correctCount}</strong>문항 정답 ·
                정답률 <strong>{totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%</strong>
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 divide-y divide-gray-200 overflow-hidden">
              {questions.map((q, index) => {
                const saved = userAnswers[index];
                const qMode = getTrainingMode(q);
                const qCorrectIndex = getCorrectOptionIndex(q);
                let status: 'correct' | 'wrong' | 'skipped' | 'open' = 'skipped';
                if (saved !== undefined) {
                  if (qMode === 'open-response') {
                    status = 'open';
                  } else if (qMode === 'multiple-choice') {
                    status = Number(saved) === qCorrectIndex ? 'correct' : 'wrong';
                  } else if (qMode === 'fill-blanks') {
                    const parts = saved.split('|');
                    const ok = q.blanks?.every((b, i) => normalizeAnswer(parts[i] || '') === normalizeAnswer(b.answer)) ?? false;
                    status = ok ? 'correct' : 'wrong';
                  } else if (qMode === 'build-sentence') {
                    status = normalizeAnswer(saved) === normalizeAnswer(getDisplayAnswer(q)) ? 'correct' : 'wrong';
                  }
                }

                const statusBadge =
                  status === 'correct' ? { text: '정답', cls: 'bg-green-100 text-green-700 border-green-300' }
                  : status === 'wrong' ? { text: '오답', cls: 'bg-red-100 text-red-700 border-red-300' }
                  : status === 'open' ? { text: '작성', cls: 'bg-blue-100 text-blue-700 border-blue-300' }
                  : { text: '미풀이', cls: 'bg-gray-100 text-gray-600 border-gray-300' };

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setReviewIndex(index)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-10 flex-shrink-0 text-sm font-bold text-gray-500">Q{index + 1}</span>
                    <span className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.cls}`}>
                      {statusBadge.text}
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">
                      {q.questionText || q.questionType || '문제'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => onClose()}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white bg-[#1e6b73] hover:bg-[#155056]"
              >
                <RotateCcw className="w-4 h-4" /> 훈련 종료
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Question phase (TPO-style test screen) ──────────────────────────────
  return (
    <div className="fixed inset-0 z-[95] bg-white flex flex-col">
      <TpoHeader
        onHome={handleExit}
        showBack={!checked && currentIndex > 0}
        backLabel="Back"
        onBack={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
        showNext={checked}
        nextLabel={isLast ? 'Review' : 'Next'}
        onNext={handleNext}
      />

      {/* Section indicator + progress */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-4">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold text-sm sm:text-base">
            {subject}
            <span className="ml-2 text-xs sm:text-sm font-medium text-gray-500">
              · {questionType} · {getDifficultyLabel(difficulty)}
            </span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-gray-600 flex items-center gap-3">
            <span>문항 {currentIndex + 1} / {totalQuestions}</span>
            <span className="hidden sm:inline text-gray-400">|</span>
            <span className="hidden sm:inline">정답률 {mode === 'open-response' ? '—' : `${accuracy}%`}</span>
            <button
              onClick={handleExit}
              className="ml-2 inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              title="닫기"
            >
              <X className="w-3.5 h-3.5" /> 닫기
            </button>
          </div>
        </div>
        {/* Slim progress bar under the tab strip */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-[#1e6b73] transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Main content — question + inputs */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {/* Passage / notes */}
          {(currentQuestion.passageTitle || currentQuestion.passageText) && (
            <div className="mb-6">
              {currentQuestion.passageTitle && (
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 font-['Inter',_sans-serif]">
                  {currentQuestion.passageTitle}
                </h3>
              )}
              {currentQuestion.passageText && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {currentQuestion.passageText}
                </div>
              )}
            </div>
          )}

          {/* Image */}
          {currentQuestion.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
              <img src={currentQuestion.imageUrl} alt={currentQuestion.passageTitle || 'Question visual'} className="h-auto w-full object-cover" />
            </div>
          )}

          {/* Audio */}
          {(currentQuestion.audioUrl || currentQuestion.passageAudioUrl) && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Headphones className="h-4 w-4" />
                Audio
              </div>
              <audio controls className="w-full" src={currentQuestion.audioUrl || currentQuestion.passageAudioUrl} />
            </div>
          )}

          {/* Question */}
          <h2 className="text-lg sm:text-2xl font-bold leading-snug text-gray-900 mb-6 font-['Inter',_sans-serif]">
            {currentQuestion.questionText || '문제를 확인하세요.'}
          </h2>

          {/* Multiple choice */}
          {mode === 'multiple-choice' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isCorrect = checked && index === correctOptionIndex;
                const isWrong = checked && selectedOptionIndex === index && index !== correctOptionIndex;
                const isPicked = selectedOptionIndex === index;
                return (
                  <div
                    key={`${currentQuestion.id}-option-${index}`}
                    onClick={() => !checked && setSelectedOptionIndex(index)}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm sm:text-base transition-colors ${
                      checked ? '' : 'cursor-pointer'
                    } ${
                      isCorrect
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : isWrong
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : isPicked
                            ? 'border-[#1e6b73] bg-[#e6f3f4] text-[#1e6b73]'
                            : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <RadioOption
                      id={`opt-${currentQuestion.id}-${index}`}
                      name={`opts-${currentQuestion.id}`}
                      value={String(index)}
                      checked={isPicked}
                      onChange={() => !checked && setSelectedOptionIndex(index)}
                      label={option.replace(/^[A-D]\.\s*/, '')}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Fill blanks */}
          {mode === 'fill-blanks' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {currentQuestion.blanks?.map((blank, index) => {
                  const isCorrect = checked && normalizeAnswer(blankInputs[index] || '') === normalizeAnswer(blank.answer);
                  return (
                    <label key={`${currentQuestion.id}-blank-${index}`} className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Blank {index + 1}</span>
                      <input
                        value={blankInputs[index] || ''}
                        onChange={(e) => {
                          const next = [...blankInputs];
                          next[index] = e.target.value;
                          setBlankInputs(next);
                        }}
                        disabled={checked}
                        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors ${
                          checked ? (isCorrect ? 'border-green-400' : 'border-red-300') : 'border-gray-300 focus:border-[#1e6b73]'
                        }`}
                        placeholder="정답을 입력하세요"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Build sentence */}
          {mode === 'build-sentence' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="flex flex-wrap gap-2 mb-3">
                {currentQuestion.words?.map((word) => (
                  <span key={`${currentQuestion.id}-${word}`} className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
                    {word}
                  </span>
                ))}
              </div>
              <textarea
                value={sentenceAnswer}
                onChange={(e) => setSentenceAnswer(e.target.value)}
                disabled={checked}
                className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-6 text-gray-800 outline-none focus:border-[#1e6b73]"
                placeholder="단어를 조합해 문장을 완성해보세요"
              />
            </div>
          )}

          {/* Open response */}
          {mode === 'open-response' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <textarea
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                disabled={checked}
                className="min-h-[220px] w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm leading-6 text-gray-800 outline-none focus:border-[#1e6b73]"
                placeholder="실전처럼 바로 답변을 작성해보세요"
              />
            </div>
          )}

          {/* Feedback after check */}
          {checked && (
            <div
              className={`mt-6 rounded-lg border px-4 py-4 text-sm leading-6 ${
                mode === 'open-response'
                  ? 'border-gray-200 bg-gray-50 text-gray-700'
                  : objectiveResult
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {mode !== 'open-response' && (
                <p className="font-semibold">{objectiveResult ? '정답입니다.' : '정답을 다시 확인해보세요.'}</p>
              )}
              {mode !== 'open-response' && !objectiveResult && getDisplayAnswer(currentQuestion) && (
                <p className="mt-1 font-medium">정답: {getDisplayAnswer(currentQuestion)}</p>
              )}
              {currentQuestion.explanation && (
                <p className={mode !== 'open-response' ? 'mt-2' : ''}>{currentQuestion.explanation}</p>
              )}
              {mode === 'open-response' && !currentQuestion.explanation && (
                <p>실전형 서술 문제이므로 작성한 답변을 구조와 논리 흐름 중심으로 다시 점검해보세요.</p>
              )}
            </div>
          )}

          {/* Bottom action row (redundant with header Next; keeps the check flow visible on long screens) */}
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500">
              정답을 확인한 뒤 상단의 <strong>Next</strong>로 다음 문항으로 이동하세요.
            </p>
            {!checked ? (
              <button
                type="button"
                disabled={!canCheck}
                onClick={handleCheck}
                className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white ${
                  canCheck ? 'bg-[#1e6b73] hover:bg-[#155056]' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {mode === 'open-response' ? '작성 완료' : '정답 확인'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-[#1e6b73] hover:bg-[#155056]"
              >
                {isLast ? '리뷰 보기' : '다음 문제'}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {checked && mode !== 'open-response' && objectiveResult && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              현재까지 {correctCount}문항을 정확히 풀었습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
