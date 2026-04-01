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
  difficulty?: TPOQuestion['difficulty'];
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
  difficulty: TPOQuestion['difficulty'] | undefined,
  trainingTests: TPOTest[] | undefined
): TPOQuestion[] {
  if (!questionType || !trainingTests) return [getDummyQuestion(section, questionType)].slice(0, 3);
  const normalizedSelected = normalizeType(questionType);

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

  const exactDifficultyMatches = difficulty
    ? allQuestions.filter((question) => question.difficulty === difficulty)
    : allQuestions;

  const fallbackMatches = difficulty
    ? allQuestions.filter((question) => question.difficulty !== difficulty)
    : [];

  const orderedPool = [...exactDifficultyMatches, ...fallbackMatches];

  for (let i = orderedPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orderedPool[i], orderedPool[j]] = [orderedPool[j], orderedPool[i]];
  }

  if (orderedPool.length === 0) {
    return Array.from({ length: 3 }, (_, index) => ({
      ...getDummyQuestion(section, questionType),
      id: `dummy-${section}-${index + 1}`,
      questionNumber: index + 1,
      difficulty: difficulty || '보통',
    }));
  }

  const sampled = orderedPool.slice(0, 3);
  while (sampled.length < 3) {
    sampled.push({
      ...getDummyQuestion(section, questionType),
      id: `dummy-${section}-${sampled.length + 1}`,
      questionNumber: sampled.length + 1,
      difficulty: difficulty || sampled[0]?.difficulty || '보통',
    });
  }

  return sampled;
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

  // Writing 섹션 - 객관식 예제
  if (section === 'Writing' && normalizeType(questionType).includes('multiple choice')) {
    return {
      id: 'dummy-writing-mc',
      questionNumber: 1,
      questionText: 'Which word would best complete the sentence: "The scholar argued that the research _____ further investigation."',
      questionType,
      options: [
        'A. required',
        'B. requiring',
        'C. requirement',
        'D. requires'
      ],
      correctAnswer: 'A. required',
      explanation: 'The past participle "required" correctly completes the passive construction.',
      difficulty: '보통',
    };
  }

  // Writing 섹션 - 빈칸 채우기 예제
  if (section === 'Writing' && normalizeType(questionType).includes('complete')) {
    return {
      id: 'dummy-writing-fill',
      questionNumber: 1,
      questionText: 'Though the conditions were not ideal, the expedition continued [onward:7].',
      questionType,
      blanks: [
        { answer: 'onward', maxLength: 7 }
      ],
      explanation: '"Onward" is the correct completion that maintains the sentence meaning.',
      difficulty: '보통',
    };
  }

  // Writing 섹션 - 문장 구성 예제
  if (section === 'Writing' && (normalizeType(questionType).includes('build') || normalizeType(questionType).includes('sentence'))) {
    return {
      id: 'dummy-writing-build',
      questionNumber: 1,
      questionText: 'Make an appropriate sentence.',
      questionType,
      words: ['was', 'the', 'conference', 'very', 'informative'],
      correctAnswer: 'The conference was very informative',
      explanation: '단어들을 올바른 순서로 배열하여 문법적으로 올바른 문장을 구성합니다.',
      difficulty: '보통',
    };
  }

  // 객관식 샘플 (Reading/Listening)
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
  if (questionType.includes('Open Response') || questionType.includes('Essay') || questionType.includes('Discussion') || questionType.includes('Email')) {
    return {
      id: 'dummy-open',
      questionNumber: 1,
      questionText: questionType.includes('Email')
        ? 'Write an email to the professor explaining why you missed class.'
        : 'Explain the importance of recycling in modern society.',
      questionType,
      explanation: questionType.includes('Email')
        ? 'You should write a formal email with clear subject line and polite tone.'
        : 'Recycling helps conserve resources and reduce pollution.',
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

export function ReviewTrainingOverlay({ section, title, questionType, difficulty, trainingTests, onClose }: ReviewTrainingOverlayProps) {
  const theme = SECTION_THEME[section];
  const questions = useMemo(() => getSampledQuestions(section, questionType, difficulty, trainingTests), [section, questionType, difficulty, trainingTests]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  const [sentenceAnswer, setSentenceAnswer] = useState('');
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setChecked(false);
    setCorrectCount(0);
  }, [section, title, questionType, difficulty]);

  const current = questions[currentIndex];
  const fillBlankSpecs = useMemo(() => (current ? getFillBlankSpecs(current) : []), [current]);
  const fillInlineParts = useMemo(() => (current ? getFillInlineParts(current, fillBlankSpecs) : []), [current, fillBlankSpecs]);
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / (questions.length || 1)) * 100;
  const sourceLabel = current.questionType || questionType || title;
  const accuracy = checked
    ? Math.round(((correctCount + (objectiveResult ? 1 : 0)) / (currentIndex + 1)) * 100)
    : currentIndex > 0
      ? Math.round((correctCount / currentIndex) * 100)
      : 0;

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

  const mode = current ? getTrainingMode(current, section, questionType) : 'open-response';
  const correctOptionIndex = getCorrectOptionIndex(current);

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
    if (mode !== 'open-response' && objectiveResult) {
      setCorrectCount((prev) => prev + 1);
    }
    setChecked(true);
  };

  const handleNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setSelectedOptionIndex(null);
    setBlankInputs(Array(fillBlankSpecs.length).fill(''));
    setSentenceAnswer('');
    setWrittenAnswer('');
    setChecked(false);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#f8fafc]">
      <div className="flex h-12 sm:h-16 items-center justify-between bg-[#1e6b73] px-3 shadow-lg sm:px-8">
        <div className="text-white text-sm font-bold tracking-wide sm:text-2xl">*toefl ibt</div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-white bg-[#0A6068] px-4 py-2 sm:flex">
            <span className="text-sm font-semibold text-white">Pattern Practice</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-white bg-white px-3 py-2 text-xs font-semibold text-[#0A6068] transition-colors hover:bg-gray-100 sm:text-sm"
          >
            <X className="h-4 w-4" />
            닫기
          </button>
        </div>
      </div>

      <div className="border-b border-gray-300 bg-white">
        <div className="flex flex-col gap-3 px-3 py-3 sm:px-8 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-gray-700 sm:text-base">{section}</div>
            <div className="text-xs font-medium text-gray-500 sm:text-sm">Question {currentIndex + 1} of {questions.length}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#cfe5e7] bg-[#eef8f7] px-3 py-1 text-xs font-semibold text-[#0f5d61]">{sourceLabel}</span>
            {difficulty && <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">난이도 {difficulty}</span>}
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">정확도 {accuracy}%</span>
          </div>
        </div>

        <div className="px-3 pb-3 sm:px-8 sm:pb-4">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: theme.card }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-black bg-white">
        <div className="grid min-h-full lg:grid-cols-[minmax(22rem,0.95fr)_minmax(24rem,1.05fr)]">
          <div className="border-b border-black p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="rounded-[24px] border border-black bg-white p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Pattern Practice</p>
                  <h2 className="mt-2 text-xl font-bold text-black sm:text-2xl">{title}</h2>
                </div>
                <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: theme.card }}>
                  Q{currentIndex + 1}
                </div>
              </div>

              {current.passageTitle && <h3 className="text-lg font-bold text-black">{current.passageTitle}</h3>}

              {current.imageUrl && (
                <div className="mt-4 overflow-hidden rounded-[18px] border border-gray-300">
                  <img src={current.imageUrl} alt={current.passageTitle || 'Question visual'} className="h-auto w-full object-cover" />
                </div>
              )}

              {(current.audioUrl || current.passageAudioUrl) && (
                <div className="mt-4 rounded-[18px] border border-gray-300 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Headphones className="h-4 w-4" />
                    Audio
                  </div>
                  <audio controls className="w-full" src={current.audioUrl || current.passageAudioUrl} />
                </div>
              )}

              {mode === 'fill-blanks' ? (
                <div className="mt-4 text-[15px] leading-8 text-gray-900 sm:text-base">
                  {fillInlineParts.map((part, partIndex) => {
                    if (part.type === 'text') {
                      return <span key={`text-${partIndex}`}>{part.value}</span>;
                    }

                    const value = blankInputs[part.blankIndex] || '';
                    const expectedLength = Math.max(part.maxLength, 2);
                    const width = Math.max(expectedLength * 12, 44);
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
                        className={`mx-1 inline-block border-b-2 bg-[#f8fafc] px-2 py-1 text-center font-medium text-gray-900 outline-none ${
                          checked ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-400'
                        }`}
                        style={{ width: `${width}px` }}
                      />
                    );
                  })}
                </div>
              ) : current.passageText ? (
                <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-gray-800 sm:text-base">{current.passageText}</div>
              ) : (
                <div className="mt-4 rounded-[18px] border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm leading-6 text-gray-500">
                  실전 화면처럼 왼쪽 영역을 유지하고 있습니다. 이 문제는 지문 대신 이미지, 오디오 또는 질문 자체를 중심으로 풉니다.
                </div>
              )}

              {(current.translationNote || current.vocabularyNote) && (
                <div className="mt-4 rounded-[18px] border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                  {current.translationNote && <p>{current.translationNote}</p>}
                  {current.vocabularyNote && <p className={current.translationNote ? 'mt-2' : ''}>{current.vocabularyNote}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-3xl">
              <h3 className="text-xl font-bold leading-8 text-black sm:text-[1.8rem]">{current.questionText}</h3>

              {mode === 'multiple-choice' && (
                <div className="mt-8 space-y-4">
                  {current.options?.map((option, index) => {
                    const isCorrect = checked && index === correctOptionIndex;
                    const isWrong = checked && selectedOptionIndex === index && index !== correctOptionIndex;
                    const isSelected = selectedOptionIndex === index;

                    return (
                      <button
                        key={`${current.id}-option-${index}`}
                        type="button"
                        onClick={() => !checked && setSelectedOptionIndex(index)}
                        disabled={checked}
                        className={`w-full rounded-[18px] border-2 px-5 py-4 text-left text-sm font-medium transition-all sm:px-6 sm:py-5 sm:text-base ${
                          isCorrect
                            ? 'border-green-500 bg-green-50 text-green-900'
                            : isWrong
                              ? 'border-red-500 bg-red-50 text-red-900'
                              : isSelected
                                ? 'border-[#1e6b73] bg-[#eef8f7] text-[#0f172a]'
                                : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{option}</span>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-gray-500">
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {(mode === 'listen-repeat' || mode === 'open-response') && (
                <div className="mt-8">
                  <textarea
                    value={writtenAnswer}
                    onChange={(event) => setWrittenAnswer(event.target.value)}
                    disabled={checked}
                    className="min-h-[220px] w-full rounded-[18px] border-2 border-gray-300 bg-white px-4 py-4 text-sm leading-6 text-gray-900 outline-none focus:border-[#1e6b73] sm:text-base"
                    placeholder={mode === 'listen-repeat' ? '들은 내용을 그대로 입력하세요' : '답변을 입력하세요'}
                  />
                </div>
              )}

              {mode === 'build-sentence' && (
                <div className="mt-8 space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {current.words?.map((word) => (
                      <span key={`${current.id}-${word}`} className="rounded-full border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900">
                        {word}
                      </span>
                    ))}
                  </div>
                  <textarea
                    value={sentenceAnswer}
                    onChange={(event) => setSentenceAnswer(event.target.value)}
                    disabled={checked}
                    className="min-h-[180px] w-full rounded-[18px] border-2 border-gray-300 bg-white px-4 py-4 text-sm leading-6 text-gray-900 outline-none focus:border-[#1e6b73] sm:text-base"
                    placeholder="실전처럼 문장을 완성하세요"
                  />
                </div>
              )}

              {checked && (
                <div className="mt-8 rounded-[18px] border-2 p-4" style={{
                  borderColor: objectiveResult ? '#10b981' : mode === 'open-response' ? '#94a3b8' : '#ef4444',
                  backgroundColor: objectiveResult ? '#ecfdf5' : mode === 'open-response' ? '#f8fafc' : '#fef2f2'
                }}>
                  {mode !== 'open-response' && (
                    <p className="font-semibold" style={{ color: objectiveResult ? '#065f46' : '#7c2d12' }}>
                      {objectiveResult ? '정답입니다.' : '다시 확인해 보세요.'}
                    </p>
                  )}
                  {current.explanation && <p className="mt-2 text-sm leading-6 text-gray-700">{current.explanation}</p>}
                  {mode !== 'open-response' && !objectiveResult && getDisplayAnswer(current) && (
                    <p className="mt-2 text-sm font-medium text-gray-700">정답: {getDisplayAnswer(current)}</p>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                {!checked ? (
                  <button
                    type="button"
                    disabled={!canCheck}
                    onClick={handleCheck}
                    className={`rounded-lg px-5 py-3 text-sm font-semibold text-white transition-all sm:px-6 sm:text-base ${canCheck ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50'}`}
                    style={{ backgroundColor: theme.card }}
                  >
                    {mode === 'open-response' ? '완료' : '정답 확인'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90 sm:px-6 sm:text-base"
                    style={{ backgroundColor: theme.card }}
                  >
                    {isLast ? '패턴연습 종료' : '다음 문제'}
                    {!isLast && <ArrowRight className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}