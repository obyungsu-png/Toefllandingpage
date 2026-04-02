import { useState } from 'react';
import { Headphones } from 'lucide-react';
import { ReviewSection } from './ReviewAssistantPanel';
import type { TPOQuestion, TPOTest } from './ContentManagement';
import { ResizableReadingLayout } from './ResizableReadingLayout';
import { RadioOption } from './RadioOption';
import { MobileQuestionNav } from './MobileQuestionNav';

interface ReviewTrainingOverlayProps {
  section: ReviewSection;
  title: string;
  questionType?: string;
  difficulty?: TPOQuestion['difficulty'];
  trainingTests?: TPOTest[];
  onClose: () => void;
}

function normalizeType(type?: string) {
  return (type || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
}

function getCorrectOptionIndex(question: TPOQuestion): number {
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

function getQuestionsFromCMS(
  section: ReviewSection,
  questionType: string | undefined,
  difficulty: TPOQuestion['difficulty'] | undefined,
  trainingTests: TPOTest[] | undefined,
): TPOQuestion[] {
  if (!questionType || !trainingTests || trainingTests.length === 0) return [];

  const normalizedSelected = normalizeType(questionType);

  const allMatching = trainingTests
    .flatMap((test) => test.sections)
    .filter((sec) => sec.sectionType === section)
    .flatMap((sec) => sec.questions)
    .filter((q) => {
      const nq = normalizeType(q.questionType);
      return nq === normalizedSelected || nq.includes(normalizedSelected) || normalizedSelected.includes(nq);
    });

  const exactDifficulty = difficulty ? allMatching.filter((q) => q.difficulty === difficulty) : allMatching;
  const fallback = difficulty ? allMatching.filter((q) => q.difficulty !== difficulty) : [];
  const pool = [...exactDifficulty, ...fallback];

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, 3);
}

export function ReviewTrainingOverlay({
  section,
  title,
  questionType,
  difficulty,
  trainingTests,
  onClose,
}: ReviewTrainingOverlayProps) {
  // Compute questions once on mount
  const [questions] = useState(() =>
    getQuestionsFromCMS(section, questionType, difficulty, trainingTests),
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const current = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;

  const goNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    setSelectedAnswer(null);
    setChecked(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentIndex === 0) {
      onClose();
      return;
    }
    setSelectedAnswer(null);
    setChecked(false);
    setCurrentIndex((prev) => prev - 1);
  };

  // ── Empty state (also guards against undefined current below) ────────────
  if (!questions.length || !current) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex bg-[#1e6b73] h-12 sm:h-16 items-center justify-between px-2 sm:px-8 shadow-lg">
          <div
            className="text-white text-sm sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity leading-tight"
            onClick={onClose}
          >
            *toefl ibt
          </div>
          <button
            className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">닫기</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <p className="text-lg font-bold text-gray-700">유형에 맞는 문제가 없습니다.</p>
          <p className="text-sm text-gray-500">이 유형의 TPO 문제가 아직 등록되지 않았습니다.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-[#1e6b73] px-6 py-2.5 text-white font-semibold hover:opacity-90"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const correctOptionIndex = getCorrectOptionIndex(current);
  const selectedIndex = current.options ? current.options.indexOf(selectedAnswer ?? '') : -1;
  const isCorrect = checked && selectedIndex !== -1 && selectedIndex === correctOptionIndex;

  // ── Left panel — passage / image / audio ──────────────────────────────────
  const leftContent = (
    <div className="space-y-4">
      {current.passageTitle && (
        <h3 className="text-xl sm:text-2xl font-['Inter',_sans-serif] font-bold text-black">
          {current.passageTitle}
        </h3>
      )}

      {current.imageUrl && (
        <img
          src={current.imageUrl}
          alt={current.passageTitle || 'Question visual'}
          className="w-full h-auto object-contain"
        />
      )}

      {(current.audioUrl || current.passageAudioUrl) && (
        <div className="border border-gray-300 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Headphones className="h-4 w-4" />
            Audio
          </div>
          <audio controls className="w-full" src={current.audioUrl || current.passageAudioUrl} />
        </div>
      )}

      {current.passageText ? (
        <div className="whitespace-pre-wrap text-[15px] leading-7 text-gray-800 font-['Inter',_sans-serif]">
          {current.passageText}
        </div>
      ) : (
        !current.imageUrl && !(current.audioUrl || current.passageAudioUrl) && (
          <div className="border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm leading-6 text-gray-500">
            지문 영역입니다.
          </div>
        )
      )}

      {(current.translationNote || current.vocabularyNote) && (
        <div className="border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600 mt-4">
          {current.translationNote && <p>{current.translationNote}</p>}
          {current.vocabularyNote && (
            <p className={current.translationNote ? 'mt-2' : ''}>{current.vocabularyNote}</p>
          )}
        </div>
      )}
    </div>
  );

  // ── Right panel — question text + options ──────────────────────────────────
  const rightContent = (
    <div>
      <h3 className="text-lg sm:text-xl md:text-2xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">
        {current.questionText}
      </h3>

      {current.options && current.options.length > 0 && (
        <div className="space-y-4 md:space-y-4 lg:space-y-6">
          {current.options.map((option, index) => (
            <RadioOption
              key={`q${currentIndex}-opt-${index}`}
              id={`training-q${currentIndex}-opt-${index}`}
              name={`training-q${currentIndex}`}
              value={option}
              checked={selectedAnswer === option}
              onChange={() => !checked && setSelectedAnswer(option)}
              label={option}
            />
          ))}
        </div>
      )}

      {/* Feedback after check */}
      {checked && (
        <div
          className={`mt-6 border-l-4 pl-4 py-2 ${
            isCorrect ? 'border-green-500' : 'border-red-400'
          }`}
        >
          <p
            className={`font-semibold text-sm ${
              isCorrect ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {isCorrect ? '정답입니다.' : '다시 확인해 보세요.'}
          </p>
          {current.explanation && (
            <p className="mt-1 text-sm text-gray-700">{current.explanation}</p>
          )}
          {!isCorrect && correctOptionIndex >= 0 && current.options && (
            <p className="mt-1 text-sm font-medium text-gray-700">
              정답: {current.options[correctOptionIndex]}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-8 flex justify-end gap-3">
        {!checked && selectedAnswer ? (
          <button
            type="button"
            onClick={() => setChecked(true)}
            className="rounded-lg bg-[#1e6b73] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            정답 확인
          </button>
        ) : checked ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 rounded-lg bg-[#1e6b73] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {isLast ? '유형연습 종료' : '다음 문제'}
          </button>
        ) : null}
      </div>
    </div>
  );

  // ── Full-screen TPO layout ─────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-white z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`${section} 유형연습`}
    >
      {/* Header — exact same structure as TPO question screens */}
      <div className="flex bg-[#1e6b73] h-12 sm:h-16 items-center justify-between px-2 sm:px-8 shadow-lg">
        <div
          className="text-white text-sm sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity leading-tight"
          onClick={onClose}
        >
          *toefl ibt
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            className="hidden sm:flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={goPrev}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          <button
            className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
            onClick={goNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">
              {isLast ? '종료' : 'Next'}
            </span>
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar — exact same structure as TPO question screens */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-3 sm:px-8 py-2 sm:py-3">
          <div className="flex gap-4 sm:gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">
              {section}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main content — exact same structure as TPO question screens */}
      <div className="flex-1 overflow-auto bg-white border border-black pb-16 md:pb-0">
        <ResizableReadingLayout
          leftContent={leftContent}
          rightContent={rightContent}
          passageTitle={title}
          passageSummary={current.passageTitle || title}
          onBack={goPrev}
          onNext={goNext}
        />
      </div>

      {/* Mobile navigation — exact same as TPO question screens */}
      <MobileQuestionNav
        onBack={goPrev}
        onHome={onClose}
        onNext={goNext}
      />
    </div>
  );
}
