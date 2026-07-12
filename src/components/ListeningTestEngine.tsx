import React, { useState, useEffect, useRef } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { RadioOption } from './RadioOption';
import { MobileQuestionNav } from './MobileQuestionNav';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { createCachedAudio } from '../utils/mediaCache';
import { isModule2Question } from '../utils/readingQuestionUtils';

interface ListeningTestEngineProps {
  sectionData: any; // result of getCurrentSectionData('Listening')
  module: 1 | 2;
  onModuleEnd: () => void;
  onExitBack: () => void;
  onHome: () => void;
  testBankType: string;
  handleTabChange: (tab: string) => void;
  currentTest: any;
  /** Optional legacy screen key for progress restore (e.g. 'q5', 'm2q3') */
  initialLegacyKey?: string;
  /** Called when visible segment changes, with a legacy-compatible key. */
  onSegmentChange?: (legacyKey: string) => void;
}

const sortByNumber = (a: any, b: any) => {
  const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
  const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
  return na - nb;
};

/**
 * Flexible, data-driven Listening test engine. Mirrors ReadingTestEngine's
 * approach: reads whatever questions exist in CMS for this module and walks
 * through them in questionNumber order — however many there are.
 *
 * Replaces the old fixed Q1-Q18 (Module 1) / Q1-Q16 (Module 2) screen flow
 * with a dynamic one driven entirely by CMS data.
 */
export function ListeningTestEngine({
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
}: ListeningTestEngineProps) {
  const allQuestions: any[] = sectionData?.questions || [];
  const moduleQuestions = allQuestions
    .filter(q => {
      const isM2 = isModule2Question(q);
      return module === 2 ? isM2 : !isM2;
    })
    .sort(sortByNumber);

  type Segment = { question: any; legacyKey: string };
  const segments: Segment[] = moduleQuestions.map((q, i) => ({
    question: q,
    legacyKey: module === 2 ? `m2q${i + 1}` : `q${i + 1}`,
  }));

  // Resolve a legacy key to a segment index for progress restore.
  const resolveLegacyKey = (key: string | undefined): number => {
    if (!key) return 0;
    const prefix = module === 2 ? 'm2q' : 'q';
    const match = key.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
    if (match) {
      const idx = parseInt(match[1]) - 1;
      return Math.min(Math.max(0, idx), segments.length - 1);
    }
    return 0;
  };

  const [segmentIndex, setSegmentIndex] = useState(() => resolveLegacyKey(initialLegacyKey));

  useEffect(() => {
    if (onSegmentChange && segments[segmentIndex]) {
      onSegmentChange(segments[segmentIndex].legacyKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentIndex]);

  // Empty state — no CMS data for this module yet.
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

  const totalDisplayCount = segments.length;
  const goNext = () => {
    if (segmentIndex + 1 < segments.length) setSegmentIndex(segmentIndex + 1);
    else onModuleEnd();
  };
  const goBack = () => {
    if (segmentIndex > 0) setSegmentIndex(segmentIndex - 1);
    else onExitBack();
  };

  const current = segments[segmentIndex];
  const question = current.question;
  const rawQNum = question?.questionNumber;
  const qNumForDisplay = typeof rawQNum === 'number' ? rawQNum : (parseInt(String(rawQNum)) || (segmentIndex + 1));
  const options: string[] = (question?.options && question.options.length > 0) ? question.options : [];
  const audioUrl: string = question?.audioUrl || (question as any)?.introAudioUrl || '';
  const imageUrl: string = question?.imageUrl || (question as any)?.introImageUrl || '';
  const questionText: string = question?.questionText || 'Choose the best response.';
  const passageTitle: string = question?.passageTitle || '';

  return (
    <ListeningQuestionScreen
      key={current.legacyKey}
      question={question}
      qNum={qNumForDisplay}
      totalQuestions={totalDisplayCount}
      segmentIndex={segmentIndex}
      options={options}
      audioUrl={audioUrl}
      imageUrl={imageUrl}
      questionText={questionText}
      passageTitle={passageTitle}
      onHome={onHome}
      onBack={goBack}
      onNext={goNext}
    />
  );
}

// ============================================================================
// ListeningQuestionScreen — reuses the proven layout from ListeningM1Screens
// ============================================================================
interface ListeningQuestionScreenProps {
  question: any;
  qNum: number;
  totalQuestions: number;
  segmentIndex: number;
  options: string[];
  audioUrl: string;
  imageUrl: string;
  questionText: string;
  passageTitle: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}

function ListeningQuestionScreen({
  question,
  qNum,
  totalQuestions,
  segmentIndex,
  options,
  audioUrl,
  imageUrl,
  questionText,
  passageTitle,
  onHome,
  onBack,
  onNext,
}: ListeningQuestionScreenProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showMustAnswer, setShowMustAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  // Reset answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowMustAnswer(false);
  }, [qNum]);

  // Audio playback — auto-play after 1s, only once per question
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    audioPlayedRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [qNum]);

  useEffect(() => {
    if (audioUrl && !audioPlayedRef.current) {
      audioPlayedRef.current = true;
      const timer = setTimeout(async () => {
        try {
          const audio = await createCachedAudio(audioUrl);
          audioRef.current = audio;
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
          audio.onended = () => setIsPlaying(false);
        } catch { /* ignore */ }
      }, 1000);
      return () => {
        clearTimeout(timer);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, qNum]);

  const handlePlayAudio = async () => {
    if (!audioUrl || isPlaying) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    try {
      const audio = await createCachedAudio(audioUrl);
      audioRef.current = audio;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      audio.onended = () => setIsPlaying(false);
    } catch { /* ignore */ }
  };

  const recordListeningAnswer = (option: string) => {
    setSelectedAnswer(option);
    if (typeof window !== 'undefined') {
      (window as any).__moduleAnswers = {
        ...((window as any).__moduleAnswers || {}),
        [qNum]: option,
      };
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      setShowMustAnswer(true);
      return;
    }
    onNext();
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
        <div className="flex items-center">
          <div
            className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            *toefl ibt
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Volume Button */}
          <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-2 sm:gap-3 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-2 hover:bg-[#084d52] transition-colors">
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Volume</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>

          {/* Back Button */}
          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="hidden sm:inline text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>

          {/* Next Button */}
          <button
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={handleNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-4 sm:px-8 py-3">
          <div className="flex gap-8">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
              Listening
            </div>
            <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
              Question {segmentIndex + 1} of {totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="w-full">
          {/* Mobile: Image -> Audio -> Question -> Options */}
          <div className="md:hidden flex flex-col items-center">
            {/* Passage Title (if any) */}
            {passageTitle && (
              <h3 className="text-base font-['Inter',_sans-serif] font-semibold text-gray-800 mb-4 text-center px-4">
                {passageTitle}
              </h3>
            )}

            {/* Image */}
            {imageUrl && (
              <div className="w-48 h-48 bg-white rounded-lg overflow-hidden border border-gray-300 mb-6">
                <ImageWithFallback src={imageUrl} alt="Listening" className="w-full h-full object-contain" />
              </div>
            )}

            {/* Play Audio Button - Mobile */}
            {audioUrl && (
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-base mb-6 transition-all shadow-sm ${
                  isPlaying
                    ? 'bg-[#0d9488] text-white cursor-not-allowed'
                    : 'bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]'
                }`}
              >
                <span style={{fontSize: '0px', width: 0, height: 0, borderStyle: 'solid', borderWidth: '7px 0 7px 12px', borderColor: `transparent transparent transparent ${isPlaying ? 'white' : '#1e293b'}`, display: 'inline-block'}} />
                <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
              </button>
            )}

            {/* Question */}
            <h2 className="text-lg font-['Inter',_sans-serif] font-bold text-gray-800 mb-6 text-center px-4">
              {questionText}
            </h2>

            {/* Options */}
            <div className="w-full max-w-2xl px-8">
              <div className="space-y-5">
                {options.map((option, index) => (
                  <RadioOption
                    key={index}
                    id={`lq-${qNum}-opt-${index}`}
                    name={`lq-${qNum}`}
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => recordListeningAnswer(option)}
                    label={option}
                    labelClassName="text-lg"
                  />
                ))}
                {options.length === 0 && (
                  <p className="text-sm text-gray-400 italic text-center">옵션이 없습니다. CMS에서 옵션을 추가해주세요.</p>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: side-by-side layout */}
          <div className="hidden md:block">
            <div className="flex gap-8">
              {/* Left: Image */}
              <div className="flex-shrink-0">
                {imageUrl && (
                  <div className="w-64 h-64 bg-white rounded-lg overflow-hidden border border-gray-300">
                    <ImageWithFallback src={imageUrl} alt="Listening" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Right: Audio + Question + Options */}
              <div className="flex-1">
                {passageTitle && (
                  <h3 className="text-lg font-['Inter',_sans-serif] font-semibold text-gray-800 mb-4">
                    {passageTitle}
                  </h3>
                )}

                {/* Play Audio Button - Desktop */}
                {audioUrl && (
                  <div className="mb-6">
                    <button
                      onClick={handlePlayAudio}
                      disabled={isPlaying}
                      className={`flex items-center gap-3 px-6 py-2 rounded-full font-semibold text-base transition-all shadow-sm ${
                        isPlaying
                          ? 'bg-[#0d9488] text-white cursor-not-allowed'
                          : 'bg-[#f0f0f0] text-[#1e293b] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      <span style={{fontSize: '0px', width: 0, height: 0, borderStyle: 'solid', borderWidth: '7px 0 7px 12px', borderColor: `transparent transparent transparent ${isPlaying ? 'white' : '#1e293b'}`, display: 'inline-block'}} />
                      <span>{isPlaying ? 'Playing...' : 'Play Audio'}</span>
                    </button>
                  </div>
                )}

                {/* Question */}
                <h2 className="text-lg font-['Inter',_sans-serif] font-bold text-gray-800 mb-6">
                  {questionText}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`lq-${qNum}-opt-${index}`}
                      name={`lq-${qNum}`}
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => recordListeningAnswer(option)}
                      label={option}
                      labelClassName="text-base"
                    />
                  ))}
                  {options.length === 0 && (
                    <p className="text-sm text-gray-400 italic">옵션이 없습니다. CMS에서 옵션을 추가해주세요.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Must answer warning */}
          {showMustAnswer && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-center">
              <p className="text-sm text-yellow-800 font-medium">답을 선택한 후 Next 버튼을 눌러주세요.</p>
            </div>
          )}
        </div>
      </div>

      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />

      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={handleNext} />
    </div>
  );
}
