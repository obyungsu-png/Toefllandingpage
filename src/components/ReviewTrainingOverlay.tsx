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
  const [blankInputs, setBlankInputs] = useState<string[]>([]);
  const [sentenceAnswer, setSentenceAnswer] = useState('');
  const [writtenAnswer, setWrittenAnswer] = useState('');

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
    <div className={`fixed inset-0 z-[95] overflow-y-auto bg-white`}>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-xs overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: theme.card }}
            />
          </div>
          <button
            onClick={onClose}
            className="ml-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Question Number and Title */}
          <div className="mb-8">
            <div className="text-sm font-semibold text-gray-500 mb-2">Question {currentIndex + 1} of {questions.length}</div>
            <h2 className="text-2xl font-bold text-gray-900">{current.questionText}</h2>
          </div>

          {/* Multiple Choice */}
          {mode === 'multiple-choice' && (
            <div className="space-y-3 mb-8">
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
                    className={`w-full text-left px-6 py-4 border-2 rounded-lg font-medium transition-all ${
                      isCorrect
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : isWrong
                          ? 'border-red-500 bg-red-50 text-red-900'
                          : isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-lg font-bold mr-4">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in Blanks */}
          {mode === 'fill-blanks' && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="text-lg leading-relaxed text-gray-900">
                {fillInlineParts.map((part, partIndex) => {
                  if (part.type === 'text') {
                    return <span key={`text-${partIndex}`}>{part.value}</span>;
                  }

                  const value = blankInputs[part.blankIndex] || '';
                  const expectedLength = Math.max(part.maxLength, 2);
                  const width = Math.max(expectedLength * 12, 40);
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
                      className={`mx-1 inline-block px-2 py-1 bg-gray-300 border-b-2 text-gray-900 font-medium outline-none ${
                        checked ? (isCorrect ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100') : 'border-gray-400'
                      }`}
                      style={{ width: `${width}px` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Listen and Repeat / Open Response */}
          {(mode === 'listen-repeat' || mode === 'open-response') && (
            <div className="mb-8 space-y-4">
              {(current.audioUrl || current.passageAudioUrl) && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <audio controls className="w-full" src={current.audioUrl || current.passageAudioUrl} />
                </div>
              )}
              <textarea
                value={mode === 'listen-repeat' ? writtenAnswer : writtenAnswer}
                onChange={(event) => setWrittenAnswer(event.target.value)}
                disabled={checked}
                className="w-full min-h-[200px] p-4 border-2 border-gray-300 rounded-lg text-gray-900 outline-none focus:border-blue-500"
                placeholder={mode === 'listen-repeat' ? '들은 내용을 입력하세요' : '답변을 입력하세요'}
              />
            </div>
          )}

          {/* Build Sentence */}
          {mode === 'build-sentence' && (
            <div className="mb-8 space-y-4">
              <div className="flex flex-wrap gap-2">
                {current.words?.map((word) => (
                  <span
                    key={`${current.id}-${word}`}
                    className="px-3 py-2 bg-gray-200 rounded-full text-sm font-medium text-gray-900"
                  >
                    {word}
                  </span>
                ))}
              </div>
              <textarea
                value={sentenceAnswer}
                onChange={(event) => setSentenceAnswer(event.target.value)}
                disabled={checked}
                className="w-full min-h-[150px] p-4 border-2 border-gray-300 rounded-lg text-gray-900 outline-none focus:border-blue-500"
                placeholder="문장을 구성하세요"
              />
            </div>
          )}

          {/* Feedback */}
          {checked && (
            <div className="mb-8 p-4 rounded-lg border-2" style={{
              borderColor: objectiveResult ? '#10b981' : mode === 'open-response' ? '#6b7280' : '#ef4444',
              backgroundColor: objectiveResult ? '#ecfdf5' : mode === 'open-response' ? '#f9fafb' : '#fef2f2'
            }}>
              {mode !== 'open-response' && (
                <p style={{ color: objectiveResult ? '#065f46' : '#7c2d12' }} className="font-semibold mb-2">
                  {objectiveResult ? '✓ 정답입니다' : '✗ 다시 확인해주세요'}
                </p>
              )}
              {current.explanation && (
                <p className="text-gray-700 text-sm leading-relaxed">{current.explanation}</p>
              )}
              {mode !== 'open-response' && !objectiveResult && getDisplayAnswer(current) && (
                <p className="text-gray-700 text-sm mt-2 font-medium">정답: {getDisplayAnswer(current)}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 justify-end mb-8">
            {!checked ? (
              <button
                type="button"
                disabled={!canCheck}
                onClick={handleCheck}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                  canCheck
                    ? 'cursor-pointer hover:opacity-90'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ backgroundColor: theme.card }}
              >
                {mode === 'open-response' ? '완료' : '확인'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: theme.card }}
              >
                {isLast ? '완료' : '다음'}
                {!isLast && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}