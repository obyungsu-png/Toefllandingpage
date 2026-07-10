import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Headphones, Sparkles, X } from 'lucide-react';
import type { TPOQuestion } from './ContentManagement';

type TrainingSubject = 'Reading' | 'Listening' | 'Writing' | 'Speaking' | 'Vocabulary';
type TrainingDifficulty = '쉬움' | '보통' | '어려움';
type TrainingMode = 'multiple-choice' | 'fill-blanks' | 'build-sentence' | 'open-response';

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
  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer.join(', ');
  }

  if (typeof question.correctAnswer === 'string') {
    return question.correctAnswer;
  }

  if (question.blanks && question.blanks.length > 0) {
    return question.blanks.map((blank) => blank.answer).join(', ');
  }

  return '';
}

function getCorrectOptionIndex(question: TPOQuestion) {
  if (!question.options || question.options.length === 0) {
    return -1;
  }

  if (typeof question.correctAnswer === 'string') {
    const numericIndex = Number(question.correctAnswer);

    if (!Number.isNaN(numericIndex) && question.options[numericIndex] !== undefined) {
      return numericIndex;
    }

    return question.options.findIndex((option) => normalizeAnswer(option) === normalizeAnswer(question.correctAnswer || ''));
  }

  if (Array.isArray(question.correctAnswer) && question.correctAnswer.length > 0) {
    return question.options.findIndex((option) => normalizeAnswer(option) === normalizeAnswer(question.correctAnswer?.[0] || ''));
  }

  return -1;
}

function getDifficultyLabel(difficulty: TrainingDifficulty) {
  if (difficulty === '쉬움') return 'Easy';
  if (difficulty === '어려움') return 'Hard';
  return 'Normal';
}

export function TrainingInterface({ subject, questionType, difficulty, questions, onClose, onComplete, resumeIndex = 0, resumeCorrectCount = 0, resumeAnswers = {} }: TrainingInterfaceProps) {
  const theme = SUBJECT_THEME[subject];
  const [currentIndex, setCurrentIndex] = useState(resumeIndex);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  const [sentenceAnswer, setSentenceAnswer] = useState('');
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(resumeCorrectCount);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>(resumeAnswers);

  const currentQuestion = questions[currentIndex];
  const mode = useMemo(() => (currentQuestion ? getTrainingMode(currentQuestion) : 'open-response'), [currentQuestion]);
  const correctOptionIndex = getCorrectOptionIndex(currentQuestion);
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = checked ? currentIndex + 1 : currentIndex;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  useEffect(() => {
    setSelectedOptionIndex(null);
    setBlankInputs(currentQuestion?.blanks ? Array(currentQuestion.blanks.length).fill('') : []);
    setSentenceAnswer('');
    setWrittenAnswer('');
    setChecked(false);
  }, [currentIndex, currentQuestion]);

  if (!questions.length || !currentQuestion) {
    return (
      <div className={`fixed inset-0 z-[95] overflow-y-auto bg-gradient-to-br ${theme.bg}`}>
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
            <h2 className="text-2xl font-bold text-slate-900">연동된 훈련 문제가 없습니다</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">현재 선택한 과목, 유형, 난이도 조합에 맞는 문제가 아직 등록되지 않았습니다.</p>
            <button
              type="button"
              onClick={handleExit}
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

  const objectiveResult = (() => {
    if (mode === 'multiple-choice') {
      return selectedOptionIndex === correctOptionIndex;
    }

    if (mode === 'fill-blanks') {
      return blankInputs.every((input, index) => normalizeAnswer(input) === normalizeAnswer(currentQuestion.blanks?.[index]?.answer || ''));
    }

    if (mode === 'build-sentence') {
      return normalizeAnswer(sentenceAnswer) === normalizeAnswer(getDisplayAnswer(currentQuestion));
    }

    return false;
  })();

  const canCheck = (() => {
    if (mode === 'multiple-choice') return selectedOptionIndex !== null;
    if (mode === 'fill-blanks') return blankInputs.every((input) => input.trim().length > 0);
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
    
    // 답변 기록
    setUserAnswers(prev => ({ ...prev, [currentIndex]: currentAnswer }));

    if (mode !== 'open-response' && objectiveResult) {
      setCorrectCount((prev) => prev + 1);
    }

    setChecked(true);
  };

  const handleNext = () => {
    if (isLast) {
      // 결과 저장 후 닫기 (완료)
      onComplete?.({ correctCount: checked ? correctCount : correctCount, totalQuestions: questions.length });
      onClose(); // 완료된 건 progress 저장 안 함
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  // 중간에 나갈 때 progress 저장
  const handleExit = () => {
    const answeredCount = Object.keys(userAnswers).length + (checked ? 1 : 0);
    const progress: TrainingProgress = {
      subject,
      questionType,
      difficulty,
      questions,
      currentIndex,
      correctCount: checked ? correctCount : correctCount,
      answers: { ...userAnswers },
      startTime: Date.now(),
      sessionTitle: `${subject} ${questionType} 훈련`,
    };
    onClose(progress);
  };

  return (
    <div className={`fixed inset-0 z-[95] overflow-y-auto bg-gradient-to-br ${theme.bg}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-7rem] top-[-6rem] h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: theme.card }} />
        <div className="absolute bottom-[-10rem] right-[-7rem] h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: theme.accent }} />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-3 py-4 sm:px-6 sm:py-8">
        <div className="relative w-full max-w-[88rem] rounded-[36px] border border-white/70 bg-white/88 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.20)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <button
            type="button"
            onClick={handleExit}
            className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.10)] backdrop-blur sm:right-6 sm:top-6"
          >
            <X className="h-3.5 w-3.5" />
            닫기
          </button>

          <div className="grid gap-6 xl:grid-cols-[minmax(21rem,0.9fr)_minmax(0,1.2fr)]">
            <div className="rounded-[30px] border px-5 py-6 sm:px-6" style={{ borderColor: theme.border, background: `linear-gradient(180deg, ${theme.soft} 0%, rgba(255,255,255,0.92) 100%)` }}>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: theme.border, color: theme.accent, backgroundColor: '#ffffffcc' }}>
                <Sparkles className="h-3.5 w-3.5" />
                {subject} Training
              </div>

              <h1 className="mt-4 text-[1.9rem] font-bold leading-tight text-slate-900 sm:text-[2.2rem]">{questionType}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">실전 문제와 같은 흐름으로 비슷한 유형과 난이도의 문제를 먼저 풀고, 감각을 유지한 채 원래 학습으로 돌아갈 수 있습니다.</p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: theme.border, color: theme.accent }}>{subject}</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">{getDifficultyLabel(difficulty)} · {difficulty}</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">{questions.length}문제</span>
              </div>

              <div className="mt-6 rounded-[24px] border bg-white/80 p-4" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                  <span>진행 상태</span>
                  <span>{currentIndex + 1} / {questions.length}</span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${theme.card} 0%, ${theme.accent} 100%)` }} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-4">
                  {questions.map((question, index) => {
                    const isCurrent = index === currentIndex;
                    const isCompleted = index < currentIndex;

                    return (
                      <div
                        key={question.id}
                        className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold transition-all ${
                          isCurrent ? 'text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]' : isCompleted ? 'bg-white text-slate-900' : 'bg-white/55 text-slate-500'
                        }`}
                        style={{
                          borderColor: isCurrent || isCompleted ? theme.border : '#e2e8f0',
                          background: isCurrent ? `linear-gradient(135deg, ${theme.card} 0%, ${theme.accent} 100%)` : undefined,
                        }}
                      >
                        Q{index + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/70 bg-white/75 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Question Type</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{currentQuestion.questionType || questionType}</p>
                </div>
                <div className="rounded-[22px] border border-white/70 bg-white/75 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Accuracy</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{mode === 'open-response' ? 'Self review' : `${accuracy}%`}</p>
                </div>
              </div>

              {(currentQuestion.passageText || currentQuestion.translationNote || currentQuestion.vocabularyNote || currentQuestion.passageTitle) && (
                <div className="mt-5 rounded-[26px] border border-white/70 bg-white/75 p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Source Notes</p>
                  {currentQuestion.passageTitle && <h2 className="mt-3 text-lg font-bold text-slate-900">{currentQuestion.passageTitle}</h2>}
                  {currentQuestion.passageText && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{currentQuestion.passageText}</p>}
                  {currentQuestion.translationNote && <p className="mt-3 text-sm leading-6 text-slate-600">{currentQuestion.translationNote}</p>}
                  {currentQuestion.vocabularyNote && <p className="mt-2 text-sm leading-6 text-slate-600">{currentQuestion.vocabularyNote}</p>}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-[30px] border bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.10)] sm:p-6 lg:p-7" style={{ borderColor: theme.border }}>
              <div className="absolute right-[-3rem] top-[-4rem] h-40 w-40 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: theme.card }} />

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: theme.card }}>
                    Question {currentIndex + 1}
                  </div>
                  <div className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {mode.replace('-', ' ')}
                  </div>
                </div>

                <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900 sm:text-[2rem]">{currentQuestion.questionText || '문제를 확인하세요.'}</h2>

                {currentQuestion.imageUrl && (
                  <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
                    <img src={currentQuestion.imageUrl} alt={currentQuestion.passageTitle || 'Question visual'} className="h-auto w-full object-cover" />
                  </div>
                )}

                {(currentQuestion.audioUrl || currentQuestion.passageAudioUrl) && (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Headphones className="h-4 w-4" />
                      Audio
                    </div>
                    <audio controls className="w-full" src={currentQuestion.audioUrl || currentQuestion.passageAudioUrl} />
                  </div>
                )}

                {mode === 'multiple-choice' && (
                  <div className="mt-6 space-y-3">
                    {currentQuestion.options?.map((option, index) => {
                      const isCorrect = checked && index === correctOptionIndex;
                      const isWrong = checked && selectedOptionIndex === index && index !== correctOptionIndex;

                      return (
                        <button
                          key={`${currentQuestion.id}-option-${index}`}
                          type="button"
                          onClick={() => !checked && setSelectedOptionIndex(index)}
                          className={`w-full rounded-[22px] border px-4 py-4 text-left text-sm font-medium transition-all duration-200 sm:px-5 ${
                            isCorrect
                              ? 'border-green-500 bg-green-50 text-green-700 shadow-[0_10px_28px_rgba(34,197,94,0.12)]'
                              : isWrong
                                ? 'border-red-400 bg-red-50 text-red-700 shadow-[0_10px_28px_rgba(248,113,113,0.12)]'
                                : selectedOptionIndex === index
                                  ? 'border-slate-400 bg-slate-50 text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.08)]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{option}</span>
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-slate-500">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {mode === 'fill-blanks' && (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {currentQuestion.blanks?.map((blank, index) => {
                        const isCorrect = checked && normalizeAnswer(blankInputs[index] || '') === normalizeAnswer(blank.answer);

                        return (
                          <label key={`${currentQuestion.id}-blank-${index}`} className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Blank {index + 1}</span>
                            <input
                              value={blankInputs[index] || ''}
                              onChange={(event) => {
                                const next = [...blankInputs];
                                next[index] = event.target.value;
                                setBlankInputs(next);
                              }}
                              disabled={checked}
                              className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-colors ${
                                checked ? (isCorrect ? 'border-green-400' : 'border-red-300') : 'border-slate-200 focus:border-slate-400'
                              }`}
                              placeholder="정답을 입력하세요"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {mode === 'build-sentence' && (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.words?.map((word) => (
                        <span key={`${currentQuestion.id}-${word}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                          {word}
                        </span>
                      ))}
                    </div>
                    <textarea
                      value={sentenceAnswer}
                      onChange={(event) => setSentenceAnswer(event.target.value)}
                      disabled={checked}
                      className="mt-4 min-h-[140px] w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition-colors focus:border-slate-400"
                      placeholder="단어를 조합해 문장을 완성해보세요"
                    />
                  </div>
                )}

                {mode === 'open-response' && (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <textarea
                      value={writtenAnswer}
                      onChange={(event) => setWrittenAnswer(event.target.value)}
                      disabled={checked}
                      className="min-h-[240px] w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition-colors focus:border-slate-400"
                      placeholder="실전처럼 바로 답변을 작성해보세요"
                    />
                  </div>
                )}

                {checked && (
                  <div className={`mt-5 rounded-[24px] border px-4 py-4 text-sm leading-6 ${mode === 'open-response' ? 'text-slate-600' : objectiveResult ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`} style={mode === 'open-response' ? { borderColor: theme.border, backgroundColor: theme.soft } : undefined}>
                    {mode !== 'open-response' && <p className="font-semibold">{objectiveResult ? '정답입니다.' : '정답을 다시 확인해보세요.'}</p>}
                    {currentQuestion.explanation && <p className={mode !== 'open-response' ? 'mt-2' : ''}>{currentQuestion.explanation}</p>}
                    {mode !== 'open-response' && !objectiveResult && getDisplayAnswer(currentQuestion) && <p className="mt-2 font-medium">정답: {getDisplayAnswer(currentQuestion)}</p>}
                    {mode === 'open-response' && !currentQuestion.explanation && <p>실전형 서술 문제이므로 작성한 답변을 구조와 논리 흐름 중심으로 다시 점검해보세요.</p>}
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">정답 확인 후 다음 문제로 넘어가며, 마지막 문제를 마치면 훈련이 종료됩니다.</p>
                  {!checked ? (
                    <button
                      type="button"
                      disabled={!canCheck}
                      onClick={handleCheck}
                      className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      style={{ backgroundColor: canCheck ? theme.card : '#cbd5e1' }}
                    >
                      {mode === 'open-response' ? '작성 완료' : '정답 확인'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: theme.card }}
                    >
                      {isLast ? '훈련 종료' : '다음 문제'}
                      {!isLast && <ArrowRight className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                {checked && mode !== 'open-response' && objectiveResult && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    현재까지 {correctCount}문제를 정확히 풀었습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}