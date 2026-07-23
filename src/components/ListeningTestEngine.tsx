import React, { useState, useEffect, useRef } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { RadioOption } from './RadioOption';
import { MobileQuestionNav } from './MobileQuestionNav';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { createCachedAudio, stopAllAudio } from '../utils/mediaCache';
import { speakHighQuality, stopAllSpeech } from '../utils/cloudTts';
import { isModule2Question } from '../utils/readingQuestionUtils';

interface ListeningTestEngineProps {
  sectionData: any; // result of getCurrentSectionData('Listening')
  module: 1 | 2;
  onModuleEnd: () => void;
  onExitBack: () => void;
  onHome: () => void;
  testBankType: string;
  handleTabChange: (tab: any) => void;
  currentTest: any;
  /** Optional legacy screen key for progress restore (e.g. 'q5', 'm2q3') */
  initialLegacyKey?: string;
  /** Called when visible segment changes, with a legacy-compatible key. */
  onSegmentChange?: (legacyKey: any) => void;
}

const sortByNumber = (a: any, b: any) => {
  const na = typeof a.questionNumber === 'number' ? a.questionNumber : parseInt(String(a.questionNumber)) || 0;
  const nb = typeof b.questionNumber === 'number' ? b.questionNumber : parseInt(String(b.questionNumber)) || 0;
  return na - nb;
};

// ============================================================================
// getGroupIntroData — questionType별 그룹 인트로 데이터
// ============================================================================
function getGroupIntroData(questionType: string): { title: string } {
  switch (questionType) {
    case 'Short Conversation':
    case 'Campus Conversation':
      return { title: 'Listen to a conversation.' };
    case 'Announcements':
      return { title: 'Listen to an announcement in a classroom.' };
    case 'Academic Talk':
    case 'Academic Lecture':
      return { title: 'Listen to an academic lecture.' };
    case 'Listen and Response':
      return { title: 'Listen and choose a response.' };
    default:
      return { title: 'Listen carefully.' };
  }
}

/**
 * Flexible, data-driven Listening test engine. Mirrors TPO 2's structure:
 *   Section Intro → Module Intro → Questions → Module 2 Intro → Questions
 *
 * - 리스닝 섹션 소개 페이지 (Module 1 시작 시만, TTS 안내)
 * - Module 안내 페이지
 * - QuestionScreen은 TPO 2의 레이아웃 사용 (이미지 크기, 간격 등)
 * - 실전문제는 정답 선택해야 Next 버튼 활성화
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

  // 세그먼트 배열: 섹션 소개 + Module 안내 + (그룹 인트로 + 질문) 반복
  type Segment =
    | { kind: 'section-intro'; legacyKey: string }
    | { kind: 'module-intro'; legacyKey: string }
    | { kind: 'group-intro'; title: string; imageUrl: string; audioUrl?: string; questionType: string; legacyKey: string }
    | { kind: 'question'; question: any; legacyKey: string };

  const segments: Segment[] = [];

  // 리스닝 섹션 소개 페이지 (Module 1 시작 시만)
  if (module === 1) {
    segments.push({ kind: 'section-intro', legacyKey: 'intro' });
  }

  // Module 안내 페이지
  segments.push({ kind: 'module-intro', legacyKey: module === 2 ? 'm2-intro' : 'm1-intro' });

  // 질문 + 그룹 인트로 (questionType이 변경될 때마다 인트로 페이지 삽입)
  let prevQuestionType: string | null = null;
  let questionIdx = 0;
  moduleQuestions.forEach((q) => {
    const qt = q?.questionType || '';
    // 첫 그룹이 아니고 questionType이 변경되면 group-intro 삽입
    // 단, Listen and Response는 인트로 불필요 (module-intro가 대체)
    if (prevQuestionType !== null && qt !== prevQuestionType && qt !== 'Listen and Response') {
      const intro = getGroupIntroData(qt);
      segments.push({
        kind: 'group-intro',
        title: intro.title,
        imageUrl: q?.introImageUrl || q?.imageUrl || '',
        audioUrl: q?.introAudioUrl || q?.audioUrl || '',
        questionType: qt,
        legacyKey: `group-intro-${questionIdx}`,
      });
    }
    prevQuestionType = qt;
    segments.push({
      kind: 'question',
      question: q,
      legacyKey: module === 2 ? `m2q${questionIdx + 1}` : `q${questionIdx + 1}`,
    });
    questionIdx++;
  });

  // 빈 상태 — CMS 데이터 없음
  if (moduleQuestions.length === 0) {
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

  // Legacy key → segment index 매핑 (진행 복원용)
  const resolveLegacyKey = (key: string | undefined): number => {
    if (!key) return 0;
    if (key === 'intro' || key === 'm1-intro' || key === 'm2-intro') return 0;
    // group-intro-{n} 형식 — 해당 인트로 위치로 이동
    if (key.startsWith('group-intro-')) {
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].kind === 'group-intro' && segments[i].legacyKey === key) return i;
      }
      return 0;
    }
    const prefix = module === 2 ? 'm2q' : 'q';
    const match = key.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
    if (match) {
      const targetIdx = parseInt(match[1]) - 1;
      // 질문 세그먼트 중에서 targetIdx와 일치하는 것 찾기
      let qCount = 0;
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].kind === 'question') {
          if (qCount === targetIdx) return i;
          qCount++;
        }
      }
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

  const totalQuestions = moduleQuestions.length;
  const goNext = () => {
    stopAllAudio(); // 이전 세그먼트 오디오 정지
    if (segmentIndex + 1 < segments.length) setSegmentIndex(segmentIndex + 1);
    else onModuleEnd();
  };
  const goBack = () => {
    stopAllAudio(); // 이전 세그먼트 오디오 정지
    if (segmentIndex > 0) setSegmentIndex(segmentIndex - 1);
    else onExitBack();
  };

  const current = segments[segmentIndex];

  // 현재 질문의 표시 번호 계산 (질문 세그먼트만 카운트)
  let displayQNum = 0;
  for (let i = 0; i <= segmentIndex; i++) {
    if (segments[i].kind === 'question') displayQNum++;
  }

  // Section Intro 페이지 (리스닝 섹션 소개)
  if (current.kind === 'section-intro') {
    return (
      <ListeningSectionIntro
        onHome={onHome}
        onBack={onExitBack}
        onNext={goNext}
      />
    );
  }

  // Module Intro 페이지
  if (current.kind === 'module-intro') {
    return (
      <ModuleIntroScreen
        module={module}
        onHome={onHome}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  // Group Intro 페이지 (conversation, announcement, academic lecture 등)
  if (current.kind === 'group-intro') {
    return (
      <GroupIntroScreen
        title={current.title}
        imageUrl={current.imageUrl}
        audioUrl={current.audioUrl}
        onHome={onHome}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  // Question 페이지
  const question = current.question;
  return (
    <ListeningQuestionScreen
      key={current.legacyKey}
      question={question}
      qNum={displayQNum}
      totalQuestions={totalQuestions}
      onHome={onHome}
      onBack={goBack}
      onNext={goNext}
    />
  );
}

// ============================================================================
// useSpeechEffect — TTS 안내 음성 재생 (ListeningM1Screens와 동일)
// ============================================================================
function useSpeechEffect(text: string) {
  useEffect(() => {
    if (!text || !text.trim()) return;
    stopAllSpeech();
    speakHighQuality(text);
    return () => { stopAllSpeech(); };
  }, [text]);
}

// ============================================================================
// ListeningSectionIntro — 리스닝 섹션 소개 페이지 (TTS 안내 포함)
// ListeningM1Screens의 IntroScreen과 동일한 내용
// ============================================================================
function ListeningSectionIntro({
  onHome,
  onBack,
  onNext,
}: {
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  useSpeechEffect(
    'Listening. In the listening section, you will answer questions to demonstrate how well you understand spoken English. There are three types of tasks: Listen and Choose a Response, Conversations, and Lectures. You will not be able to return to previous questions.'
  );

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
          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="hidden sm:inline text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          <button
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => { stopAllSpeech(); onNext(); }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-4 sm:px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
            Listening
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-auto bg-white pb-20 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-['Inter',_sans-serif] font-bold text-black mb-6 md:mb-8">Listening</h1>
          <div className="space-y-4 md:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
            <p className="text-base md:text-lg">
              In the listening section, you will answer questions to demonstrate how well you understand spoken English.
            </p>
            <p className="text-base md:text-lg">There are three types of tasks:</p>
            <div className="text-left max-w-md mx-auto space-y-3 text-base md:text-lg">
              <p>1. <strong>Listen and Choose a Response</strong></p>
              <p>2. <strong>Conversations</strong></p>
              <p>3. <strong>Lectures</strong></p>
            </div>
            <p className="text-base md:text-lg">You will not be able to return to previous questions.</p>
          </div>
        </div>
      </div>

      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={() => { stopAllSpeech(); onNext(); }} />
    </div>
  );
}

// ============================================================================
// GroupIntroScreen — 문제 그룹 전 인트로 (큰 이미지 + 오디오)
// conversation, announcement, academic lecture 등
// ============================================================================
function GroupIntroScreen({
  title,
  imageUrl,
  audioUrl,
  onHome,
  onBack,
  onNext,
}: {
  title: string;
  imageUrl: string;
  audioUrl?: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(!audioUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // React ref로 오디오 종료 상태 추적 (audio.ended 속성은 브라우저마다 정확하지 않음)
  const audioEndedRef = useRef(!audioUrl);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  const cleanupAudio = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
      // 이벤트 핸들러 제거 (노이즈 없음)
      audio.onended = null;
      audio.onpause = null;
      audio.onerror = null;
      // 오디오가 이미 종료된 경우 muted/volume/pause 변경 금지 — 브라우저 클릭/팝 노이즈 원인
      // audio.ended 대신 audioEndedRef 사용 (더 정확)
      if (audioEndedRef.current) return;
      // 아직 재생 중인 경우에만 mute + pause (순서: mute 먼저 → 노이즈 차단 후 pause)
      audio.muted = true;
      audio.volume = 0;
      audio.pause();
      audio.currentTime = 0;
    } catch { /* ignore */ }
  };

  useEffect(() => {
    audioEndedRef.current = !audioUrl;
    if (!audioUrl) return;
    const timer = setTimeout(async () => {
      try {
        const audio = await createCachedAudio(audioUrl);
        cleanupAudio(audioRef.current);
        audioRef.current = audio;
        audioEndedRef.current = false;  // 새 오디오 시작
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
        audio.onended = () => {
          setIsPlaying(false);
          setAudioEnded(true);
          audioEndedRef.current = true;  // 종료 상태 업데이트
        };
      } catch { /* ignore */ }
    }, 500);
    return () => {
      clearTimeout(timer);
      cleanupAudio(audioRef.current);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const canGoNext = !audioUrl || audioEnded;
  const handleNext = canGoNext ? () => {
    // Next 눌러서 다음 세그먼트로 넘어갈 때 이전 인트로 오디오 즉시 정리 — 잔여 재생 방지
    cleanupAudio(audioRef.current);
    audioRef.current = null;
    onNext();
  } : () => {};
  const handleReplay = async () => {
    if (!audioUrl || isPlaying) return;
    cleanupAudio(audioRef.current);
    try {
      const audio = await createCachedAudio(audioUrl);
      audioRef.current = audio;
      setAudioEnded(false);
      audioEndedRef.current = false;  // 리플레이 시작
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      audio.onended = () => {
        setIsPlaying(false);
        setAudioEnded(true);
        audioEndedRef.current = true;  // 종료 상태 업데이트
      };
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
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
          <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-2 sm:gap-3 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-2 hover:bg-[#084d52] transition-colors">
            <span className="text-white font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Volume</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="hidden sm:inline text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          <button
            className={`flex items-center gap-2 border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-2 transition-colors ${canGoNext ? 'bg-white hover:bg-gray-100' : 'bg-gray-200 cursor-not-allowed'}`}
            onClick={handleNext}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation tab */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-4 sm:px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
            Listening
          </div>
        </div>
      </div>

      {/* Main content — 큰 이미지 + 오디오 */}
      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-auto bg-white border border-black">
        <h1 className="text-2xl md:text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-6 md:mb-8 text-center mt-4">
          {title}
        </h1>
        <div className="flex-1 flex flex-col justify-center items-center gap-6">
          {/* 오디오 재생 버튼 */}
          {audioUrl && (
            <div className="flex justify-center">
              <button
                onClick={handleReplay}
                disabled={isPlaying}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-base transition-all shadow-sm ${
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

          {/* 큰 이미지 */}
          {imageUrl && (
            <div className="w-full max-w-2xl md:max-w-3xl aspect-[4/3] flex items-center justify-center">
              <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </div>

      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={handleNext} />
    </div>
  );
}

// ============================================================================
// ModuleIntroScreen — TPO 2 스타일 (TTS 안내 + 안내 텍스트)
// ============================================================================
function ModuleIntroScreen({
  module,
  onHome,
  onBack,
  onNext,
}: {
  module: 1 | 2;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const isM2 = module === 2;
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
          <button
            className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-2 hover:bg-[#084d52] transition-colors"
            onClick={onBack}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            <span className="hidden sm:inline text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
          </button>
          <button
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => { stopAllSpeech(); onNext(); }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-4 sm:px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
            Listening
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-12 overflow-auto bg-white pb-20 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-['Inter',_sans-serif] font-bold text-black mb-6 md:mb-8">
            Module {module}
          </h1>
          <div className="space-y-4 md:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
            <p className="text-base md:text-lg">
              You can use <strong>Next</strong> to move to the next question.
            </p>
            <p className="text-base md:text-lg">
              {isM2
                ? 'In an actual test, the clock will show you how much time you have to complete each question.'
                : 'The first task is Listen and Choose a Response. In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.'
              }
            </p>
          </div>
        </div>
      </div>

      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={() => { stopAllSpeech(); onNext(); }} />
    </div>
  );
}

// ============================================================================
// ListeningQuestionScreen — TPO 2 QuestionScreen 레이아웃 (이미지 크기, 간격 등)
// ============================================================================
interface ListeningQuestionScreenProps {
  question: any;
  qNum: number;
  totalQuestions: number;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
}

function ListeningQuestionScreen({
  question,
  qNum,
  totalQuestions,
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

  const options: string[] = (question?.options && question.options.length > 0) ? question.options : [];
  const audioUrl: string = question?.audioUrl || '';
  const imageUrl: string = question?.imageUrl || '';
  const questionText: string = question?.questionText || 'Choose the best response.';

  // 옵션에서 A./B./C./D. 접두사 제거 (실제 시험 형식 - 접두사 없이 옵션 내용만 표시)
  const formatOptionLabel = (option: string, _index: number): string => {
    return option.replace(/^[A-D]\.\s*/, '');
  };

  // 오디오 자동 재생
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPlayedRef = useRef(false);
  // React ref로 오디오 종료 상태 추적 (audio.ended 속성은 브라우저마다 정확하지 않음)
  const audioEndedRef = useRef(false);

  // 오디오 정리 헬퍼 — 잔여 노이즈/틱 소리 방지
  // 오디오가 이미 종료된 경우 muted/volume/pause 변경 금지 (브라우저 클릭/팝 노이즈 원인)
  const cleanupAudio = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
      // 이벤트 핸들러 제거 (노이즈 없음)
      audio.onended = null;
      audio.onpause = null;
      audio.onerror = null;
      // 오디오가 이미 종료된 경우 muted/volume/pause 변경 금지
      // audio.ended 대신 audioEndedRef 사용 (더 정확)
      if (audioEndedRef.current) return;
      // 아직 재생 중인 경우에만 mute + pause (순서: mute 먼저 → 노이즈 차단 후 pause)
      audio.muted = true;
      audio.volume = 0;
      audio.pause();
      audio.currentTime = 0;
    } catch { /* ignore */ }
  };

  useEffect(() => {
    audioPlayedRef.current = false;
    audioEndedRef.current = false;  // 새 오디오 시작 시 리셋
    if (audioUrl && !audioPlayedRef.current) {
      audioPlayedRef.current = true;
      const timer = setTimeout(async () => {
        try {
          const audio = await createCachedAudio(audioUrl);
          cleanupAudio(audioRef.current);
          audioRef.current = audio;
          audioEndedRef.current = false;  // 새 오디오 시작
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
          audio.onended = () => {
            setIsPlaying(false);
            audioEndedRef.current = true;  // 종료 상태 업데이트
          };
        } catch { /* ignore */ }
      }, 1000);
      return () => {
        clearTimeout(timer);
        cleanupAudio(audioRef.current);
        audioRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, qNum]);

  const handlePlayAudio = async () => {
    if (!audioUrl || isPlaying) return;
    cleanupAudio(audioRef.current);
    try {
      const audio = await createCachedAudio(audioUrl);
      audioRef.current = audio;
      audioEndedRef.current = false;  // 재생 시작
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
      audio.onended = () => {
        setIsPlaying(false);
        audioEndedRef.current = true;  // 종료 상태 업데이트
      };
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

  // 정답 선택해야 Next 가능
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
              Question {qNum} of {totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* Main content — TPO 2 QuestionScreen 레이아웃 */}
      <div className="flex-1 p-4 md:p-8 overflow-auto bg-white border border-black pb-20 md:pb-8">
        <div className="w-full">
          {/* Mobile: Image → Audio → Question → Options */}
          <div className="md:hidden flex flex-col items-center">
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
                    label={formatOptionLabel(option, index)}
                    labelClassName="text-lg"
                  />
                ))}
                {options.length === 0 && (
                  <p className="text-sm text-gray-400 italic text-center">옵션이 없습니다. CMS에서 옵션을 추가해주세요.</p>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: TPO 2 side-by-side layout (이미지 크기, 간격 등 동일) */}
          <div className="hidden md:block">
            {/* Play Audio Button - Desktop */}
            {audioUrl && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  className={`flex items-center gap-3 px-10 py-3 rounded-full font-semibold text-base transition-all shadow-sm ${
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
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-10 text-center">
              {questionText}
            </h2>

            {/* TPO 2 절대 위치 레이아웃 (이미지 왼쪽, 옵션 오른쪽) */}
            {/* Conversation 그룹(Short/Campus Conversation)은 TPO 2처럼 더 큰 이미지 사용 */}
            {(() => {
              const isConversation = ['Short Conversation', 'Campus Conversation'].includes(question?.questionType || '');
              const imgWidth = isConversation ? '460px' : '280px';
              const imgLeft = isConversation ? '12%' : '18%';
              const imgMaxHeight = isConversation ? '560px' : '480px';
              const optLeft = imageUrl ? (isConversation ? '56%' : '51%') : '10%';
              const optWidth = imageUrl ? (isConversation ? '38%' : '42%') : '80%';
              return (
                <>
                  <div className="relative" style={{minHeight: '420px'}}>
                    {imageUrl && (
                      <div style={{position: 'absolute', left: imgLeft, top: 0, width: imgWidth}}>
                        <img src={imageUrl} alt="Listening" className="w-full object-contain object-top" style={{maxHeight: imgMaxHeight}} />
                      </div>
                    )}
                    <div style={{position: 'absolute', left: optLeft, top: '8px', width: optWidth}}>
                <div className="space-y-7">
                  {options.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`lq-${qNum}-opt-${index}`}
                      name={`lq-${qNum}`}
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => recordListeningAnswer(option)}
                      label={formatOptionLabel(option, index)}
                      labelClassName="text-xl font-['Inter',_sans-serif] text-gray-900"
                    />
                  ))}
                  {options.length === 0 && (
                    <p className="text-sm text-gray-400 italic">옵션이 없습니다. CMS에서 옵션을 추가해주세요.</p>
                  )}
                </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Must Answer Modal — TPO 2 스타일 */}
          {showMustAnswer && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" style={{ animation: 'mustAnswerFadeIn 0.2s ease' }}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 sm:p-8" style={{ animation: 'mustAnswerPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Must Answer</h3>
                  <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
                    You must enter an answer before you can leave this question.
                  </p>
                  <button
                    onClick={() => setShowMustAnswer(false)}
                    className="w-full py-3 bg-[#1e6b73] text-white font-semibold rounded-xl hover:bg-[#164f54] active:scale-[0.98] transition-all text-base shadow-sm"
                  >
                    Return to Question
                  </button>
                </div>
              </div>
              <style>{`
                @keyframes mustAnswerFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes mustAnswerPopIn { from { opacity: 0; transform: scale(0.92) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
              `}</style>
            </div>
          )}
        </div>
      </div>

      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />

      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={handleNext} />
    </div>
  );
}
