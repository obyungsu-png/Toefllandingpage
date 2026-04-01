import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Headphones, Sparkles, X } from 'lucide-react';
import { ReviewSection } from './ReviewAssistantPanel';
import type { TPOQuestion, TPOTest } from './ContentManagement';

type TrainingMode = 'multiple-choice' | 'fill-blanks' | 'build-sentence' | 'open-response' | 'listen-repeat';

function normalizeType(type?: string) {
  return (type || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function isListenAndSpeakType(type?: string) {
  const normalized = normalizeType(type);
  return normalized.includes('listen and speak') || normalized.includes('listen and repeat') || normalized.includes('repeat');
}

function getTrainingMode(question: TPOQuestion, section: ReviewSection, selectedQuestionType?: string): TrainingMode {
  const effectiveType = selectedQuestionType || question.questionType;

  if (section === 'Speaking' && isListenAndSpeakType(effectiveType)) {
    return 'listen-repeat';
  }

  if (normalizeType(effectiveType).includes('complete words') || normalizeType(effectiveType).includes('fill in the blank')) {
    return 'fill-blanks';
  }

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

interface ReviewTrainingOverlayProps {
  section: ReviewSection;
  title: string;
  questionType?: string;
  trainingTests?: TPOTest[];
  onClose: () => void;
}

interface FillBlankSpec {
  answer: string;
  maxLength: number;
}

type FillInlinePart =
  | { type: 'text'; value: string }
  | { type: 'blank'; blankIndex: number; maxLength: number };

function getFillBlankSpecs(question: TPOQuestion): FillBlankSpec[] {
  if (question.blanks && question.blanks.length > 0) {
    return question.blanks.map((blank) => ({ answer: blank.answer, maxLength: blank.maxLength }));
  }

  const markedText = question.passageText || '';
  const markedMatches = [...markedText.matchAll(/\[([^\]:]+):(\d+)\]/g)];

  if (markedMatches.length > 0) {
    return markedMatches.map(([, answer, maxLength]) => ({
      answer,
      maxLength: Number(maxLength) || answer.length,
    }));
  }

  const underscoreMatches = (question.questionText || '').match(/_{2,}/g) || [];
  return underscoreMatches.map((match) => ({ answer: '', maxLength: match.length }));
}

function getFillInlineParts(question: TPOQuestion, specs: FillBlankSpec[]): FillInlinePart[] {
  const sourceText = question.passageText || question.questionText || '';

  if (sourceText.includes('[') && sourceText.includes(']')) {
    const regex = /\[([^\]:]+):(\d+)\]/g;
    const parts: FillInlinePart[] = [];
    let lastIndex = 0;
    let blankIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sourceText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: sourceText.slice(lastIndex, match.index) });
      }

      const maxLength = Number(match[2]) || specs[blankIndex]?.maxLength || match[1].length;
      parts.push({ type: 'blank', blankIndex, maxLength });
      blankIndex += 1;
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < sourceText.length) {
      parts.push({ type: 'text', value: sourceText.slice(lastIndex) });
    }

    return parts;
  }

  if (sourceText.match(/_{2,}/)) {
    const chunks = sourceText.split(/_{2,}/g);
    const matches = sourceText.match(/_{2,}/g) || [];
    const parts: FillInlinePart[] = [];

    chunks.forEach((chunk, index) => {
      if (chunk) parts.push({ type: 'text', value: chunk });
      if (index < matches.length) {
        parts.push({
          type: 'blank',
          blankIndex: index,
          maxLength: specs[index]?.maxLength || matches[index].length,
        });
      }
    });

    return parts;
  }

  return [{ type: 'text', value: sourceText }];
}

const SECTION_THEME: Record<ReviewSection, { bg: string; card: string; accent: string; soft: string; border: string }> = {
  Reading: { bg: 'from-[#eef9f8] via-[#e4f5f4] to-[#d6efed]', card: '#1d6f73', accent: '#164e52', soft: '#eef8f7', border: '#b9dedd' },
  Listening: { bg: 'from-[#edf4ff] via-[#e5efff] to-[#d7e6ff]', card: '#2563eb', accent: '#1d4ed8', soft: '#eef4ff', border: '#c7d8ff' },
  Writing: { bg: 'from-[#fff8ef] via-[#fff1dc] to-[#ffe5bf]', card: '#d97706', accent: '#b45309', soft: '#fff5e7', border: '#f5d7aa' },
  Speaking: { bg: 'from-[#f8f3ff] via-[#f1eaff] to-[#e3d7ff]', card: '#7c3aed', accent: '#6d28d9', soft: '#f4efff', border: '#d9c9ff' },
};

function getSampledQuestions(
  section: ReviewSection,
  questionType: string | undefined,
  trainingTests: TPOTest[] | undefined
): TPOQuestion[] {
  if (!questionType || !trainingTests) return [getDummyQuestion(section, questionType)];
  const normalizedSelected = normalizeType(questionType);

  // Flatten all questions from all training tests for this section
  const allQuestions = trainingTests
    .flatMap(test => test.sections)
    .filter(sec => sec.sectionType === section)
    .flatMap(sec => sec.questions)
    .filter((q) => {
      const normalizedQuestionType = normalizeType(q.questionType);
      return (
        normalizedQuestionType === normalizedSelected
        || normalizedQuestionType.includes(normalizedSelected)
        || normalizedSelected.includes(normalizedQuestionType)
      );
    });

  // Shuffle and pick 3
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  if (allQuestions.length === 0) {
    // Return 1 dummy question if none exist
    return [getDummyQuestion(section, questionType)];
  }
  return allQuestions.slice(0, 3);
}

function getDummyQuestion(section: ReviewSection, questionType: string): TPOQuestion {
  if (section === 'Speaking' && isListenAndSpeakType(questionType)) {
    return {
      id: 'dummy-listen-speak',
      questionNumber: 1,
      questionText: 'Listen and repeat what you hear.',
      questionType,
      correctAnswer: 'Please welcome the visitors and guide them to the main hall.',
      explanation: '핵심 의미를 정확히 전달하면서 문장 리듬을 유지해 보세요.',
      difficulty: '보통',
    };
  }

  // 객관식 샘플
  if (questionType.includes('Read in Daily') || questionType.includes('Factual') || questionType.includes('Multiple Choice')) {
    return {
      id: 'dummy-mc',
      questionNumber: 1,
      questionText: 'Which of the following is TRUE according to the passage?',
      questionType,
      options: ['A. The sun rises in the west.', 'B. Water boils at 100°C.', 'C. Birds cannot fly.', 'D. Fish live on land.'],
      correctAnswer: 'B. Water boils at 100°C.',
      explanation: 'Water boils at 100°C is a scientific fact.',
      difficulty: '보통',
    };
  }
  // 빈칸 채우기 샘플
  if (questionType.includes('Complete Words') || questionType.includes('Fill in the Blank')) {
    return {
      id: 'dummy-fill',
      questionNumber: 1,
      questionText: 'The ___ is the largest planet in our solar system.',
      questionType,
      blanks: [
        { answer: 'Jupiter', maxLength: 10 }
      ],
      explanation: 'Jupiter is the largest planet.',
      difficulty: '보통',
    };
  }
  // 문장 배열/구성 샘플
  if (questionType.includes('Build a Sentence') || questionType.includes('Sentence') || questionType.includes('Arrange')) {
    return {
      id: 'dummy-build',
      questionNumber: 1,
      questionText: 'Arrange the words to make a correct sentence.',
      questionType,
      words: ['is', 'the', 'sky', 'blue'],
      correctAnswer: ['The', 'sky', 'is', 'blue'],
      explanation: 'The correct sentence is: The sky is blue.',
      difficulty: '보통',
    };
  }
  // 서술형 샘플
  if (questionType.includes('Open Response') || questionType.includes('Essay') || questionType.includes('Discussion')) {
    return {
      id: 'dummy-open',
      questionNumber: 1,
      questionText: 'Explain the importance of recycling in modern society.',
      questionType,
      explanation: 'Recycling helps conserve resources and reduce pollution.',
      difficulty: '보통',
    };
  }
  // 기본 객관식
  return {
    id: 'dummy-mc',
    questionNumber: 1,
    questionText: 'Which of the following is correct?',
    questionType,
    options: ['A. 2+2=5', 'B. 2+2=4', 'C. 2+2=3', 'D. 2+2=1'],
    correctAnswer: 'B. 2+2=4',
    explanation: '2+2=4 is correct.',
    difficulty: '보통',
  };
}

export function ReviewTrainingOverlay({ section, title, questionType, trainingTests, onClose }: ReviewTrainingOverlayProps) {
  const theme = SECTION_THEME[section];
  const questions = useMemo(() => getSampledQuestions(section, questionType, trainingTests), [section, questionType, trainingTests]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setChecked(false);
  }, [section, title, questionType]);

  const current = questions[currentIndex];
  const fillBlankSpecs = useMemo(() => (current ? getFillBlankSpecs(current) : []), [current]);
  const fillInlineParts = useMemo(() => (current ? getFillInlineParts(current, fillBlankSpecs) : []), [current, fillBlankSpecs]);
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / (questions.length || 1)) * 100;
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  const [sentenceAnswer, setSentenceAnswer] = useState('');
  const [writtenAnswer, setWrittenAnswer] = useState('');

  useEffect(() => {
    setSelectedOptionIndex(null);
    setBlankInputs(Array(fillBlankSpecs.length).fill(''));
    setSentenceAnswer('');
    setWrittenAnswer('');
    setChecked(false);
  }, [currentIndex, current, fillBlankSpecs.length]);

  if (!questions.length) {
    return (
      <div className={`fixed inset-0 z-[95] flex items-center justify-center bg-gradient-to-br ${theme.bg}`}>
        <div className="bg-white/90 rounded-2xl p-10 border shadow-xl flex flex-col items-center">
          <X className="w-8 h-8 mb-4 text-gray-400" />
          <div className="text-lg font-bold mb-2">유형에 맞는 실전 문제가 없습니다.</div>
          <div className="text-sm text-gray-500 mb-6">이 유형의 TPO 문제가 아직 등록되지 않았습니다.</div>
          <button onClick={onClose} className="px-6 py-2 rounded bg-slate-600 text-white font-semibold">돌아가기</button>
        </div>
      </div>
    );
  }

  // 문제 유형별로 TrainingInterface와 동일하게 분기 렌더링
  const mode = current ? getTrainingMode(current, section, questionType) : 'open-response';
  const correctOptionIndex = getCorrectOptionIndex(current);

  // 정답 체크 로직
  const objectiveResult = (() => {
    if (mode === 'multiple-choice') {
      return selectedOptionIndex === correctOptionIndex;
    }
    if (mode === 'fill-blanks') {
      return fillBlankSpecs.every((blank, index) => normalizeAnswer(blankInputs[index] || '') === normalizeAnswer(blank.answer || ''));
    }
    if (mode === 'build-sentence') {
      return normalizeAnswer(sentenceAnswer) === normalizeAnswer(getDisplayAnswer(current));
    }
    if (mode === 'listen-repeat') {
      return normalizeAnswer(writtenAnswer) === normalizeAnswer(getDisplayAnswer(current));
    }
    return false;
  })();

  const canCheck = (() => {
    if (mode === 'multiple-choice') return selectedOptionIndex !== null;
    if (mode === 'fill-blanks') return fillBlankSpecs.length > 0 && blankInputs.every((input) => input.trim().length > 0);
    if (mode === 'build-sentence') return sentenceAnswer.trim().length > 0;
    if (mode === 'listen-repeat') return writtenAnswer.trim().length > 0;
    return writtenAnswer.trim().length > 0;
  })();

  const handleCheck = () => {
    if (!canCheck || checked) return;
    setChecked(true);
  };

  const handleNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setSelectedOptionIndex(null);
    setBlankInputs(current?.blanks ? Array(current.blanks.length).fill('') : []);
    setSentenceAnswer('');
    setWrittenAnswer('');
    setChecked(false);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className={`fixed inset-0 z-[95] overflow-y-auto bg-gradient-to-br ${theme.bg}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: theme.card }} />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: theme.accent }} />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
        <div className="relative w-full max-w-4xl rounded-[34px] border border-white/70 bg-white/88 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl sm:p-6 lg:p-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-[#334155] shadow-[0_10px_24px_rgba(15,23,42,0.10)] backdrop-blur sm:right-5 sm:top-5"
          >
            <X className="h-3.5 w-3.5" />
            닫기
          </button>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-6">
            <div className="rounded-[28px] border px-4 py-5 sm:px-5 sm:py-6" style={{ borderColor: theme.border, background: `linear-gradient(180deg, ${theme.soft} 0%, rgba(255,255,255,0.92) 100%)` }}>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: theme.border, color: theme.accent, backgroundColor: '#ffffffcc' }}>
                <Sparkles className="h-3.5 w-3.5" />
                {section} Training
              </div>

              <h2 className="mt-4 max-w-[24rem] text-2xl font-bold leading-9 text-[#0f172a] sm:text-[1.9rem]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">비슷한 유형의 문제를 먼저 풀고 감각을 유지한 뒤 원래 문제로 돌아갑니다.</p>

              <div className="mt-6 rounded-[24px] border bg-white/80 p-4" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#0f172a]">
                  <span>진행 상태</span>
                  <span>{currentIndex + 1} / {questions.length}</span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${theme.card} 0%, ${theme.accent} 100%)` }} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {questions.map((_, index) => {
                    const isCurrent = index === currentIndex;
                    const isComplete = index < currentIndex || (checked && index === currentIndex && (mode === 'open-response' || objectiveResult));

                    return (
                      <div
                        key={`step-${index}`}
                        className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold transition-all ${
                          isCurrent ? 'text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]' : isComplete ? 'bg-white text-[#0f172a]' : 'bg-white/55 text-[#64748b]'
                        }`}
                        style={{
                          borderColor: isCurrent || isComplete ? theme.border : '#e2e8f0',
                          background: isCurrent ? `linear-gradient(135deg, ${theme.card} 0%, ${theme.accent} 100%)` : undefined,
                        }}
                      >
                        Q{index + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              {checked && selectedIndex === current.answerIndex ? (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  정답입니다. 같은 흐름으로 다음 문제까지 이어가면 됩니다.
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm leading-6 text-[#64748b]">
                  답을 고른 뒤 정답 확인을 누르면 해설이 바로 아래에 표시됩니다.
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.10)] sm:p-6" style={{ borderColor: theme.border }}>
              <div className="absolute right-[-3rem] top-[-4rem] h-36 w-36 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: theme.card }} />

              <div className="relative">
                <div>
                  <div className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: theme.card }}>
                    Question {currentIndex + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-bold leading-8 text-[#0f172a] sm:text-[1.45rem]">{current.questionText}</h3>
                </div>

                {mode === 'multiple-choice' && (
                  <div className="mt-6 space-y-3">
                    {current.options?.map((option, index) => {
                      const isCorrect = checked && index === correctOptionIndex;
                      const isWrong = checked && selectedOptionIndex === index && index !== correctOptionIndex;

                      return (
                        <button
                          key={`${current.id}-option-${index}`}
                          type="button"
                          onClick={() => !checked && setSelectedOptionIndex(index)}
                          className={`w-full rounded-[22px] border px-4 py-4 text-left text-sm font-medium transition-all duration-200 sm:px-5 sm:py-4 ${
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
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-[#64748b]">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {mode === 'fill-blanks' && (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-[#f6f6f6] p-5 sm:p-6">
                    <h4 className="mb-6 text-center text-2xl font-bold text-black">{current.questionText}</h4>
                    <div className="text-[1.28rem] leading-[1.9] text-black whitespace-pre-wrap">
                      {fillInlineParts.map((part, partIndex) => {
                        if (part.type === 'text') {
                          return <span key={`text-${partIndex}`}>{part.value}</span>;
                        }

                        const value = blankInputs[part.blankIndex] || '';
                        const expectedLength = Math.max(part.maxLength, 2);
                        const width = Math.max(expectedLength * 20, 44);
                        const isCorrect = checked && normalizeAnswer(value) === normalizeAnswer(fillBlankSpecs[part.blankIndex]?.answer || '');

                        return (
                          <input
                            key={`blank-${partIndex}`}
                            value={value}
                            disabled={checked}
                            onChange={(event) => {
                              const next = [...blankInputs];
                              next[part.blankIndex] = event.target.value;
                              setBlankInputs(next);
                            }}
                            className={`mx-1 inline-block h-[1.55em] rounded-[4px] bg-[#d8d8d8] px-1 align-baseline text-black outline-none ${
                              checked ? (isCorrect ? 'ring-2 ring-green-400' : 'ring-2 ring-red-300') : ''
                            }`}
                            style={{ width: `${width}px` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {mode === 'listen-repeat' && (
                  <div className="mt-6 space-y-4 rounded-[24px] border border-slate-200 bg-[#f8f7ff] p-4 sm:p-5">
                    {(current.audioUrl || current.passageAudioUrl) && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Headphones className="h-4 w-4" />
                          Audio
                        </div>
                        <audio controls className="w-full" src={current.audioUrl || current.passageAudioUrl} />
                      </div>
                    )}

                    <textarea
                      value={writtenAnswer}
                      onChange={(event) => setWrittenAnswer(event.target.value)}
                      disabled={checked}
                      className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition-colors focus:border-slate-400"
                      placeholder="들은 문장을 입력하거나, 말한 내용을 텍스트로 정리해 보세요"
                    />
                  </div>
                )}

                {mode === 'build-sentence' && (
                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="flex flex-wrap gap-2">
                      {current.words?.map((word) => (
                        <span key={`${current.id}-${word}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
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
                      className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition-colors focus:border-slate-400"
                      placeholder="실전처럼 바로 답변을 작성해보세요"
                    />
                  </div>
                )}

                {checked && (
                  <div className="mt-6 rounded-[24px] border px-4 py-4 text-sm leading-6 text-slate-600" style={{ borderColor: theme.border, backgroundColor: theme.soft }}>
                    {mode !== 'open-response' && mode !== 'listen-repeat' && (
                      <p className={`font-semibold ${objectiveResult ? 'text-green-700' : 'text-red-700'}`}>
                        {objectiveResult ? '정답입니다.' : '정답을 다시 확인해보세요.'}
                      </p>
                    )}
                    {current.explanation && <p className={mode !== 'open-response' ? 'mt-2' : ''}>{current.explanation}</p>}
                    {mode !== 'open-response' && mode !== 'listen-repeat' && !objectiveResult && getDisplayAnswer(current) && (
                      <p className="mt-2 font-medium">정답: {getDisplayAnswer(current)}</p>
                    )}
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-[#64748b]">정답 확인 후에는 다음 문제로 바로 넘어갈 수 있습니다.</p>
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
                      {isLast ? '원래 문제로 돌아가기' : '다음 문제'}
                      {!isLast && <ArrowRight className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}