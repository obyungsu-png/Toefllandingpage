import { useState, useRef, useEffect } from 'react';
// motion removed - using CSS animations
import { ChevronLeft, Play, Pause, Star, StarOff, Check, X, Volume2, ChevronDown, ChevronUp, Mic, Moon, Sun, Sparkles } from 'lucide-react';
import { TestResult } from './HistorySection';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { loadRecordings } from '../utils/uploadRecording';
import { ToeflAiWidget } from './ToeflAiWidget';
import { WritingReviewAiTutor } from './WritingReviewAiTutor';
import { UniversalAudioPlayer } from './UniversalAudioPlayer';
import { getQuestionRangeLabel, buildGlobalSlots, getModuleSlots } from '../utils/readingQuestionUtils';
import { ReadingReviewToolbar, ReadingReviewActions } from './ReadingReviewToolbar';
import { WordPopup } from './WordPopup';
import { saveHighlight, loadHighlights, deleteAllHighlights, Highlight } from '../utils/readingHighlights';

/**
 * Reading review — Range API로 하이라이트/밑줄을 DOM에 적용 — 선택한 색상 반영
 */
function applyHighlightToRange(range: Range, type: 'h' | 'u', color: string) {
  const selectedText = range.toString();
  if (!selectedText) return;

  const mark = document.createElement(type === 'h' ? 'mark' : 'u');
  if (type === 'h') {
    mark.style.backgroundColor = color;
    mark.style.textDecoration = 'none';
  } else {
    mark.style.backgroundColor = 'transparent';
    mark.style.textDecoration = 'underline';
    mark.style.textDecorationColor = color;
    mark.style.textDecorationThickness = '2px';
  }

  try {
    range.surroundContents(mark);
  } catch {
    // surroundContents가 실패하는 경우 (여러 노드에 걸친 선택)
    // extractContents + insertNode 사용
    const contents = range.extractContents();
    mark.appendChild(contents);
    range.insertNode(mark);
  }
}

/**
 * CMS 지문 텍스트 파싱 — JSON 템플릿인 경우 본문 추출
 */
function parsePassageContent(rawPassage: string | null | undefined): string {
  if (!rawPassage) return '';
  try {
    const parsed = JSON.parse(rawPassage);
    if (parsed.fields?.body) return parsed.fields.body;
    if (parsed.passage) return parsed.passage;
    return rawPassage;
  } catch {
    return rawPassage;
  }
}

/**
 * 저장된 하이라이트를 DOM에 복원
 * - passageEl 내의 텍스트 노드를 순회하며 누적 offset으로 매칭
 */
function restoreHighlights(passageEl: HTMLElement, highlights: Highlight[], passageText: string) {
  if (!highlights.length) return;

  // 다크모드 감지 — 하이라이트된 텍스트가 다크 배경에서 보이도록 색상 조정
  const isDark = document.documentElement.classList.contains('dark');

  highlights.forEach(h => {
    if (h.end_offset > passageText.length) return;

    const walker = document.createTreeWalker(passageEl, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    let currentOffset = 0;

    while ((node = walker.nextNode() as Text | null)) {
      const nodeText = node.nodeValue || '';
      const relativeStart = h.start_offset - currentOffset;
      const relativeEnd = h.end_offset - currentOffset;

      if (relativeStart >= 0 && relativeEnd <= nodeText.length && relativeEnd > 0) {
        try {
          const range = document.createRange();
          range.setStart(node, relativeStart);
          range.setEnd(node, relativeEnd);

          const mark = document.createElement(h.type === 'h' ? 'mark' : 'u');
          mark.style.backgroundColor = h.type === 'h' ? '#fff3a3' : 'transparent';
          mark.style.textDecoration = h.type === 'u' ? 'underline' : 'none';
          mark.style.textDecorationColor = h.type === 'u' ? '#1e6b73' : '';
          mark.style.textDecorationThickness = h.type === 'u' ? '2px' : '';
          // 다크모드에서 밝은 하이라이트 배경 위의 텍스트가 보이도록 어두운 색상 적용
          if (h.type === 'h' && isDark) {
            mark.style.color = '#1a1a1a';
          }

          try {
            range.surroundContents(mark);
          } catch {
            const contents = range.extractContents();
            mark.appendChild(contents);
            range.insertNode(mark);
          }
          break;
        } catch {
          // 실패 시 다음 노드에서 시도하지 않고 종료
          break;
        }
      }
      currentOffset += nodeText.length;
    }
  });
}

type SectionTab = 'Reading' | 'Listening' | 'Writing' | 'Speaking';

/** Audio element that reloads src explicitly when it changes — for My Recording playback */
function AudioPlayer({ src, qNum }: { src: string; qNum: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.pause();
      audioRef.current.src = src;
      audioRef.current.load();
    }
  }, [src, qNum]);
  return <audio ref={audioRef} key={`audio-${qNum}`} controls className="w-full h-11" />;
}

interface QuestionReviewFullProps {
  result: TestResult;
  tpoTests?: any[];
  onBack: () => void;
  themeColor?: string;
  initialSection?: 'Reading' | 'Listening' | 'Writing' | 'Speaking';
  initialIndex?: number;
  /** Reading/Listening 모듈 (모달에서 넘어온 모듈 유지용) */
  initialModule?: 1 | 2;
}

interface ReviewQuestion {
  id: string;
  number: number;
  text: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  isCorrect: boolean;
  hasAudio?: boolean;
  audioText?: string;
  scriptText?: string;
  dictationBlanks?: string;
  organization?: string;
  organizationBlanks?: string;
  passageText?: string;
  imageUrl?: string;
  audioUrl?: string;
  translation?: string;
  keyWords?: string[];
  analysis?: string;
  /** CMS에 정답이 등록되지 않아 채점 불가 — 사용자가 CMS에서 정답 등록 필요 */
  unscored?: boolean;
  /** 시도하지 않은 섹션의 문제 — 미답변 (회색 pill로 표시) */
  isUnanswered?: boolean;
}

interface WritingBuildSentenceReviewQuestion {
  id: string;
  number: number;
  prompt: string;
  words: string[];
  slotCount: number;
  correctAnswer?: string;
  sentenceEnding?: '.' | '?';
  avatar1ImageUrl?: string;
  avatar2ImageUrl?: string;
}

interface FillBlankReviewConfig {
  id: string;
  passageText?: string;
  blanks: { answer: string; maxLength: number }[];
  fallbackSegments?: string[];
}

// Speaking question data
interface SpeakingQuestion {
  id: string;
  number: number;
  taskGroup: 'Listen and Speak' | 'Take an Interview';
  prompt: string;
  modelLabel: string;
  currentVoice: string;
  voiceAvatar: string;
  modelAudioDuration: number;
  userAudioDuration: number;
  showTextDefault: boolean;
  materialImage?: string;
  materialAudioDuration?: number;
  audioUrl?: string;
  transcript?: string;
}

export function QuestionReviewFull({
  result,
  tpoTests = [],
  onBack,
  themeColor = '#005f61',
  initialSection,
  initialIndex = 0,
  initialModule = 1
}: QuestionReviewFullProps) {
  const [activeSection, setActiveSection] = useState<SectionTab>(initialSection || (result.category as SectionTab) || 'Reading');
  const [activeModule, setActiveModule] = useState<number>(initialModule);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const progressInterval = useRef<number | null>(null);
  const listeningAudioRef = useRef<HTMLAudioElement | null>(null);

  // Listening Dictation + Organization 빈칸 입력 상태
  const [dictationAnswers, setDictationAnswers] = useState<Record<number, string>>({});
  const [dictationChecked, setDictationChecked] = useState(false);
  const [orgAnswers, setOrgAnswers] = useState<Record<number, string>>({});
  const [orgChecked, setOrgChecked] = useState(false);

  // 문제 전환 시 Dictation/Organization 상태 초기화
  useEffect(() => {
    setDictationAnswers({});
    setDictationChecked(false);
    setOrgAnswers({});
    setOrgChecked(false);
  }, [currentQuestionIndex, activeSection]);

  // Reading review — 하이라이트/밑줄/단어 뜻 팝업 도구 상태
  const [activeTool, setActiveTool] = useState<'highlight' | 'underline' | null>(null);
  const [activeColor, setActiveColor] = useState<string>('#fff3a3');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>(() => {
    return (localStorage.getItem('wordLookupLanguage') as 'en' | 'ko') || 'en';
  });
  const [popupData, setPopupData] = useState<{ word: string; context?: string; x: number; y: number } | null>(null);
  // Listening/Speaking — 오디오 재생 시간 (타임스탬프 기반 문장 하이라이트 싱크용)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Reading review — 하이라이트 저장/로드 (Supabase)
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const passageRef = useRef<HTMLDivElement | null>(null);
  // Writing review — 드래그 하이라이트/밑줄/사전 적용 대상 컨테이너 (Reading passageRef와 별개)
  const writingReviewRef = useRef<HTMLDivElement | null>(null);

  // Speaking-specific state
  // Real recordings — load from DB (10-day retention) with sessionStorage fallback
  const [speakingRecordings, setSpeakingRecordings] = useState<Record<string, string>>({});
  const [speakingUserPlaying, setSpeakingUserPlaying] = useState(false);
  const [speakingMaterialPlaying, setSpeakingMaterialPlaying] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [userProgress, setUserProgress] = useState(0);
  const [materialProgress, setMaterialProgress] = useState(0);
  const [showModelText, setShowModelText] = useState(true);
  const [showFullText, setShowFullText] = useState(false);
  const modelInterval = useRef<number | null>(null);
  const userInterval = useRef<number | null>(null);
  const materialInterval = useRef<number | null>(null);

  // Writing review — AI 튜터 패널 고정(pinned) 상태 추적
  // pinned일 때 글 작성 영역(Your Response)에 right padding을 줘서 패널과 겹침 방지
  const [aiTutorPinned, setAiTutorPinned] = useState(false);
  // Writing review — AI 채점(WritingReviewAiTutor) 팝업 표시
  const [showWritingAiGrader, setShowWritingAiGrader] = useState<'email' | 'discussion' | null>(null);

  // TPO 번호 — 결과 레코드에 저장된 낸부 testNumber를 최우선 사용.
  // (testName 정규식 파싱은 "TPO 2026년 1월" 형식에서 2026을 번호로 오인하는 버그가 있었음)
  const tpoNumber = (() => {
    if (result.testNumber != null) return result.testNumber;
    const match = result.testName.match(/TPO\s+(\d+)/i);
    return match ? parseInt(match[1]) : null;
  })();
  
  // Find the matching test: testType + testNumber 동시 매칭 우선 (Test 1 결과가 TPO 1을 잘못 집는 것 방지)
  const resultType = String(result.type || result.bankType || '').toLowerCase();
  const currentTPOTest = tpoTests.find((test: any) =>
    test.testNumber === tpoNumber &&
    String(test.testType || '').toLowerCase() === resultType
  ) || tpoTests.find((test: any) =>
    test.testNumber === tpoNumber ||
    test.testName === result.testName ||
    `${test.testType} ${test.testNumber}` === result.testName
  ) || tpoTests.find((test: any) => test.testNumber === tpoNumber);

  // 현재 리딩 review 지문 식별자 — testId / passageKey
  const currentTestId = currentTPOTest?.testNumber != null
    ? `${currentTPOTest.testType || 'tpo'}-${currentTPOTest.testNumber}`
    : result.testName;
  const currentPassageKey = `reading-m${activeModule}`;

  if (typeof window !== 'undefined') {
  }

  // Load speaking recordings once currentTPOTest is available
  useEffect(() => {
    if (activeSection !== 'Speaking') return;
    const testType   = currentTPOTest?.testType   ?? sessionStorage.getItem('current_test_type')   ?? 'tpo';
    const testNumber = currentTPOTest?.testNumber  ?? Number(sessionStorage.getItem('current_test_number') ?? 0);
    loadRecordings(String(testType), Number(testNumber))
      .then(setSpeakingRecordings)
      .catch(() => {
        try { setSpeakingRecordings(JSON.parse(sessionStorage.getItem('speakingRecordings') || '{}')); }
        catch {}
      });
  }, [activeSection, currentTPOTest]);

  // sectionType 정확 일치 우선 → 없으면 대소문자 무시 (CMS에 'reading'/'Reading' 혼재)
  const currentSection = currentTPOTest?.sections?.find((s: any) => s.sectionType === activeSection)
    || currentTPOTest?.sections?.find((s: any) => String(s.sectionType || '').toLowerCase() === activeSection.toLowerCase());
  const passageText = currentSection?.passages?.[0]?.content || null;

  // 섹션 전체 슬롯 (엔진 표시 순서 + CW 빈칸 확장) — 모듈별 문제 수/번호 매핑의 기준
  const allSlots = buildGlobalSlots(currentSection?.questions || []);
  const moduleSlots = (activeSection === 'Reading' || activeSection === 'Listening')
    ? getModuleSlots(allSlots, activeModule === 2 ? 2 : 1)
    : allSlots;
  const moduleGlobalStart = moduleSlots.length > 0 ? moduleSlots[0].start : 1;

  // Complete Words review — 전역 슬롯 기반 범위 판정
  // TPO3/5/6 Reading M1처럼 CW 지문이 2개(로컬 1-10, 11-20)인 경우도 올바르게 처리:
  // 현재 로컬 번호가 어느 CW 슬롯 범위에 속하는지로 지문/blank-N 매핑을 결정한다.
  const cwSlots = moduleSlots.filter(s => s.isCompleteWords);
  const mcqSlots = moduleSlots.filter(s => !s.isCompleteWords);
  const cwRanges = cwSlots.map(s => ({
    question: s.question,
    localStart: s.start - moduleGlobalStart + 1,
    localEnd: s.start - moduleGlobalStart + 1 + s.count - 1,
    globalStart: s.start,
  }));
  const currentLocalNum = currentQuestionIndex + 1;
  const activeCwRange = cwRanges.find(r => currentLocalNum >= r.localStart && currentLocalNum <= r.localEnd) || null;
  // MC 문제의 슬롯 조회 (passageTitle 등 CMS 데이터 매핑용)
  const mcqSlotForLocal = (localNum: number) => {
    const global = moduleGlobalStart + localNum - 1;
    return mcqSlots.find(s => global >= s.start && global < s.start + s.count) || null;
  };

  const readingCompleteWordsQuestion = activeSection === 'Reading'
    ? (activeCwRange?.question || cwRanges[0]?.question || null)
    : null;
  const readingCompleteWordsConfig: FillBlankReviewConfig | null = activeSection === 'Reading' && readingCompleteWordsQuestion
    ? {
        id: readingCompleteWordsQuestion.id || `reading-complete-words-${activeModule}`,
        passageText: readingCompleteWordsQuestion.passageText,
        blanks: Array.isArray(readingCompleteWordsQuestion.blanks) ? readingCompleteWordsQuestion.blanks : [],
      }
    : null;

  // Build questions from result data (for Reading/Listening)
  const questions: ReviewQuestion[] = (() => {
    if (activeSection === 'Writing' || activeSection === 'Speaking') return [];
    const qs: ReviewQuestion[] = [];
    const wrongQs = result.wrongAnswers;

    // 모듈 슬롯 기반 — 리뷰 문제 수 = 실제 TPO 모듈 문제 수와 정확히 일치
    // (CW 빈칸 확장 포함, 오답 매칭은 전역 연속 번호 기준)
    // cwRanges/mcqSlotForLocal은 컴포넌트 스코프에 정의됨
    const isCwLocalNum = (localNum: number) =>
      cwRanges.some(r => localNum >= r.localStart && localNum <= r.localEnd);

    // Total = 모듈 슬롯 수 (CMS 기준). 없으면 결과값 fallback
    const cmsCount = moduleSlots.reduce((sum, s) => sum + s.count, 0);
    const totalQ = cmsCount > 0 ? cmsCount : (result.totalQuestions || 0);

    // 모듈 시도 여부: 이 모듈의 전역 번호 범위에 wrongAnswer가 하나라도 있으면 시도한 것으로 간주.
    // 시도하지 않은 모듈의 문제는 "안 푼 문제" (회색 pill로 표시).
    const moduleGlobalEnd = moduleGlobalStart + totalQ - 1;
    const attemptedSection = wrongQs.some(w => {
      const num = parseInt(String(w.questionId).replace(/^blank-/i, ''));
      return !isNaN(num) && num >= moduleGlobalStart && num <= moduleGlobalEnd;
    });

    for (let i = 0; i < totalQ; i++) {
      const qNum = i + 1; // 모듈 로컬 번호
      const globalQNum = moduleGlobalStart + i;
      const inCwRange = isCwLocalNum(qNum);
      const slot = inCwRange ? null : mcqSlotForLocal(qNum);
      const realQ = slot?.question;
      const wrong = wrongQs.find(w =>
        w.questionId === String(globalQNum) ||
        parseInt(w.questionId) === globalQNum ||
        (inCwRange && w.questionId === `blank-${globalQNum}`)
      );
      const isWrong = !!wrong;
      // 미답변 = 오답 기록이 없고 시도하지 않은 섹션의 문제 (회색 pill로 표시)
      // 정답 = 오답 기록이 없고 시도한 섹션의 문제
      const isUnanswered = !isWrong && !attemptedSection;
      const isCorrect = !isWrong && attemptedSection;

      if (realQ) {
        // Use real CMS question data
        const ca = isWrong ? (wrong?.correctAnswer || realQ.correctAnswer || 'A') : (realQ.correctAnswer || 'A');
        const isUnscored = ca === '(정답 미등록)';
        qs.push({
          id: realQ.id || `q-${i}`,
          number: qNum,
          text: realQ.questionText || realQ.text || `Question ${qNum}`,
          options: isUnscored ? [] : (realQ.options || (wrong ? generateOptions(wrong.correctAnswer, wrong.userAnswer) : ['Option A', 'Option B', 'Option C', 'Option D'])),
          userAnswer: isWrong ? (wrong?.userAnswer || '') : (realQ.correctAnswer || 'A'),
          correctAnswer: ca,
          explanation: wrong?.explanation,
          isCorrect,
          hasAudio: activeSection === 'Listening',
          audioText: realQ.scriptText || realQ.audioText || undefined,
          scriptText: realQ.scriptText,
          dictationBlanks: realQ.dictationBlanks,
          organization: realQ.organization,
          organizationBlanks: realQ.organizationBlanks,
          audioUrl: realQ.audioUrl,
          passageText: realQ.passageText || passageText,
          imageUrl: realQ.imageUrl,
          translation: realQ.translation || realQ.koreanTranslation,
          keyWords: realQ.keyWords || realQ.vocabulary,
          analysis: realQ.analysis || realQ.explanation,
          unscored: isUnscored,
          isUnanswered,
        });
      } else {
        // No CMS data — minimal placeholder. Wrong answers still show their detail below.
        const ca2 = wrong?.correctAnswer || 'A';
        const isUnscored2 = ca2 === '(정답 미등록)';
        qs.push({
          id: `correct-${i}`,
          number: i + 1,
          text: wrong?.questionText || `Question ${i + 1}`,
          options: isUnscored2 ? [] : (wrong ? generateOptions(wrong.correctAnswer, wrong.userAnswer) : ['Option A', 'Option B', 'Option C', 'Option D']),
          userAnswer: wrong?.userAnswer || 'A',
          correctAnswer: ca2,
          isCorrect,
          hasAudio: activeSection === 'Listening',
          audioText: activeSection === 'Listening' ? 'Audio transcript for this question.' : undefined,
          passageText: passageText,
          unscored: isUnscored2,
          isUnanswered,
        });
      }
    }
    
    // Add remaining wrong answers that weren't covered by the loop
    // Skip blank-N IDs (they belong to Complete Words / FillBlanks Q1-10, shown separately)
    wrongQs.forEach((wrong) => {
      // Skip FillBlanks entries (blank-1, blank-2, ...) — shown in Complete Words review
      if (/^blank-/i.test(wrong.questionId)) return;
      const alreadyAdded = qs.find(q => q.id === wrong.questionId || String(q.number) === wrong.questionId);
      if (!alreadyAdded) {
        const num = parseInt(wrong.questionId);
        // Only add if within the expected totalQ range (prevent extra pills beyond 20)
        if (!num || num < 1 || num > totalQ) return;
        qs.push({
          id: wrong.questionId,
          number: num,
          text: wrong.questionText,
          options: generateOptions(wrong.correctAnswer, wrong.userAnswer),
          userAnswer: wrong.userAnswer,
          correctAnswer: wrong.correctAnswer,
          explanation: wrong.explanation,
          isCorrect: false,
          hasAudio: activeSection === 'Listening',
          audioText: activeSection === 'Listening' ? 'Audio transcript for this question.' : undefined,
          passageText: passageText,
        });
      }
    });
    
    // Sort by question number and cap at totalQ to ensure exactly 20 pills
    qs.sort((a, b) => a.number - b.number);
    return qs.slice(0, totalQ);
  })();

  const speakingQuestionsFromCms: SpeakingQuestion[] = activeSection === 'Speaking'
    ? (currentSection?.questions || []).slice(0, 11).map((question: any, index: number) => {
        const isInterview = index >= 7;
        return {
          id: question.id || `spk-${index + 1}`,
          number: index + 1,
          taskGroup: isInterview ? 'Take an Interview' : 'Listen and Speak',
          prompt: question.questionText || question.text || (isInterview ? `Interview task ${index - 6}` : `Listen and Speak task ${index + 1}`),
          modelLabel: 'Model Answer',
          currentVoice: isInterview ? 'Interviewer' : 'Speaker',
          voiceAvatar: question.introImageUrl || question.imageUrl || '',
          modelAudioDuration: Number(question.duration) || (isInterview ? 45 : 8),
          userAudioDuration: Number(question.duration) || (isInterview ? 45 : 8),
          showTextDefault: !isInterview,
          materialImage: question.imageUrl || question.introImageUrl,
          materialAudioDuration: question.audioUrl ? 5 : undefined,
          audioUrl: question.audioUrl,
          transcript: question.passageText || question.scriptText || question.questionText || question.text,
        };
      })
    : [];

  const allSpeakingQuestions = activeSection === 'Speaking' ? speakingQuestionsFromCms : [];
  const speakingQs = activeSection === 'Speaking'
    ? (activeModule === 1 ? allSpeakingQuestions.slice(0, 7) : allSpeakingQuestions.slice(7, 11))
    : [];
  const speakingQuestionCount = speakingQs.length;
  const showReadingCompleteWordsReview = activeSection === 'Reading' && !!activeCwRange && !!readingCompleteWordsConfig;

  // Determine total questions based on section/module
  const totalQuestions = activeSection === 'Writing'
    ? activeModule === 1
      ? 10
      : 1
    : activeSection === 'Speaking'
    ? speakingQuestionCount
    : questions.length;

  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const correctCount = activeSection === 'Writing' || activeSection === 'Speaking'
    ? result.correctAnswers
    : questions.filter(q => q.isCorrect).length;
  // 정답/오답/미답변/unscored 개수 — Reading/Listening에서만 의미 있음
  const wrongCount = activeSection === 'Writing' || activeSection === 'Speaking'
    ? 0
    : questions.filter(q => !q.isCorrect && !q.unscored && !q.isUnanswered).length;
  const unansweredCount = activeSection === 'Writing' || activeSection === 'Speaking'
    ? 0
    : questions.filter(q => q.isUnanswered).length;
  const unscoredCount = activeSection === 'Writing' || activeSection === 'Speaking'
    ? 0
    : questions.filter(q => q.unscored).length;

  // Calculate time display
  const timeMinutes = result.timeSpent ? Math.floor(result.timeSpent / 60) : 0;
  const timeSeconds = result.timeSpent ? result.timeSpent % 60 : 0;
  const timeDisplay = `${timeMinutes}'${String(timeSeconds).padStart(2, '0')}"`;

  // Listening/Speaking audio progress now comes from real <audio> onTimeUpdate — no simulation needed

  useEffect(() => {
    if (speakingUserPlaying) {
      userInterval.current = window.setInterval(() => {
        setUserProgress(prev => {
          if (prev >= 100) { setSpeakingUserPlaying(false); return 0; }
          return prev + 2;
        });
      }, 100);
    } else {
      if (userInterval.current) clearInterval(userInterval.current);
    }
    return () => { if (userInterval.current) clearInterval(userInterval.current); };
  }, [speakingUserPlaying]);

  useEffect(() => {
    if (speakingMaterialPlaying) {
      materialInterval.current = window.setInterval(() => {
        setMaterialProgress(prev => {
          if (prev >= 100) { setSpeakingMaterialPlaying(false); return 0; }
          return prev + 2;
        });
      }, 100);
    } else {
      if (materialInterval.current) clearInterval(materialInterval.current);
    }
    return () => { if (materialInterval.current) clearInterval(materialInterval.current); };
  }, [speakingMaterialPlaying]);

  const toggleBookmark = (qId: string) => {
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Reading review — 단어 뜻 언어 전환 핸들러
  const handleLanguageChange = (lang: 'en' | 'ko') => {
    setLanguage(lang);
    localStorage.setItem('wordLookupLanguage', lang);
  };

  // Reading review — 툴 + 색상 변경 핸들러
  const handleToolChange = (tool: 'highlight' | 'underline' | null, color?: string) => {
    setActiveTool(tool);
    if (color) setActiveColor(color);
  };

  // Reading/Writing review — 하이라이트/밑줄 모두 지우기
  const handleClearAllHighlights = async () => {
    setActiveTool(null);
    // DOM에서 <mark>, <u> 제거 (원래 텍스트로 복원) — Reading passageRef + Writing writingReviewRef 모두 정리
    [passageRef.current, writingReviewRef.current].forEach(container => {
      if (!container) return;
      const marks = container.querySelectorAll('mark, u');
      marks.forEach(m => {
        const parent = m.parentNode;
        if (parent) {
          while (m.firstChild) {
            parent.insertBefore(m.firstChild, m);
          }
          parent.removeChild(m);
          parent.normalize();
        }
      });
    });
    // Supabase에서 삭제 — Reading passage 키 + Writing 키 모두
    if (currentTestId) {
      await Promise.all([
        currentPassageKey ? deleteAllHighlights(currentTestId, currentPassageKey) : Promise.resolve(),
        deleteAllHighlights(currentTestId, 'writing-review'),
      ]);
    }
    setHighlights([]);
  };

  // Reading review — 지문 영역 mouseup 핸들러
  const handlePassageMouseUp = async (
    e: React.MouseEvent,
    passageText: string,
    testId: string,
    passageKey: string
  ) => {
    // Tools 버튼이 눌려(도구 영역 열림) 있을 때만 드래그 동작 — 밑줄/하이라이트/사전
    if (!toolsOpen) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const words = selectedText.split(/\s+/);

    if (activeTool) {
      // 하이라이트/밑줄 적용
      const type = activeTool === 'highlight' ? 'h' : 'u';

      // 표시된 지문 텍스트에서 offset 계산 (JSON 파싱 후)
      const passageContent = parsePassageContent(passageText);
      const startOffset = passageContent.indexOf(selectedText);

      // DOM에 적용 — 항상 적용 (Complete Words처럼 offset 매칭이 안 되어도 시각적 하이라이트/밑줄)
      applyHighlightToRange(range, type, activeColor);

      // Supabase에 저장 — offset을 찾은 경우만 저장 (수강권 확인은 saveHighlight 내부에서 처리)
      if (startOffset !== -1) {
        const endOffset = startOffset + selectedText.length;
        const id = await saveHighlight({
          test_id: testId,
          passage_key: passageKey,
          start_offset: startOffset,
          end_offset: endOffset,
          type,
        });

        // 로컬 상태에 추가
        setHighlights(prev => [...prev, {
          id: id || undefined,
          test_id: testId,
          passage_key: passageKey,
          start_offset: startOffset,
          end_offset: endOffset,
          type,
          expires_at: '',
        }]);
      }

      selection.removeAllRanges();
    } else if (words.length === 1) {
      // 단어 팝업 표시 — 클릭한 단어 바로 아래에 표시
      const passageContent = parsePassageContent(passageText);
      setPopupData({
        word: selectedText,
        context: passageContent,
        x: e.clientX,
        y: e.clientY + 20,
      });
      selection.removeAllRanges();
    }
  };

  // Reset audio states on question change
  useEffect(() => {
    setSpeakingUserPlaying(false);
    setSpeakingMaterialPlaying(false);
    setModelProgress(0);
    setUserProgress(0);
    setMaterialProgress(0);
    setShowModelText(true);
    setShowFullText(false);
    setIsPlaying(false);
    setAudioProgress(0);
    if (listeningAudioRef.current) listeningAudioRef.current.pause();
  }, [currentQuestionIndex]);

  // Reading review — 지문이 표시될 때 Supabase에서 하이라이트 로드
  useEffect(() => {
    if (activeSection !== 'Reading') return;
    if (!currentTestId || !currentPassageKey) return;

    let cancelled = false;
    loadHighlights(currentTestId, currentPassageKey)
      .then(loaded => {
        if (!cancelled) setHighlights(loaded);
      })
      .catch(() => {
        if (!cancelled) setHighlights([]);
      });

    return () => { cancelled = true; };
  }, [activeSection, currentTestId, currentPassageKey]);

  // Reading review — 하이라이트가 로드/변경되면 DOM에 복원
  useEffect(() => {
    if (activeSection !== 'Reading') return;
    if (!passageRef.current) return;

    const passageContent = parsePassageContent(currentQuestion?.passageText);
    if (passageContent) {
      restoreHighlights(passageRef.current, highlights, passageContent);
    }
  }, [highlights, activeSection, currentQuestion]);

  const sectionTabs: SectionTab[] = ['Reading', 'Listening', 'Writing', 'Speaking'];

  const writingSectionQuestions = currentSection?.questions || [];
  const writingBuildSentenceFromCms = writingSectionQuestions
    .filter((question: any) => {
      const type = String(question?.questionType || '').toLowerCase();
      return type.includes('build a sentence') || type.includes('sentence');
    })
    .slice(0, 10)
    .map((question: any, index: number) => {
      const rawWords = Array.isArray(question?.words)
        ? question.words
        : Array.isArray(question?.options)
        ? question.options
        : [];
      // CSV 헤더 단어(context, review, wordbank 등)가 word bank에 섞이는 현상 방지
      const HEADER_WORDS = new Set(['context', 'review', 'wordbank', 'word bank', '단어', '문장끝']);
      const cmsWords = rawWords.filter((w: any) => {
        const normalized = String(w || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
        return normalized && !HEADER_WORDS.has(normalized);
      });

      return {
        id: `bs-q${index + 1}`,
        number: index + 1,
        prompt: question?.questionText || question?.text || `Build a Sentence ${index + 1}`,
        words: cmsWords,
        slotCount: Number(question?.slotCount) || 5,
        correctAnswer: question?.correctAnswer as string || undefined,
        sentenceEnding: (question?.sentenceEnding as '.' | '?') || '.',
        avatar1ImageUrl: question?.avatar1ImageUrl || undefined,
        avatar2ImageUrl: question?.avatar2ImageUrl || undefined,
      } as WritingBuildSentenceReviewQuestion;
    });

  // Use CMS data directly — no hardcoded fallback
  const writingBuildSentenceQuestions = writingBuildSentenceFromCms;

  const writingModuleQuestionCount = activeSection === 'Writing'
    ? activeModule === 1
      ? writingBuildSentenceQuestions.length
      : 1
    : 0;

  // Writing question pill data
  const writingPills = Array.from({ length: writingModuleQuestionCount }, (_, i) => ({
    id: `writing-${activeModule}-${i + 1}`,
    number: i + 1,
  }));

  // Speaking question pill data
  const speakingPills = speakingQs.map((q, i) => ({
    id: q.id,
    number: q.number,
    isCorrect: true, // Speaking doesn't have right/wrong in the same way
  }));

  const currentSpeakingQ = speakingQs[currentQuestionIndex] || speakingQs[0];
  const currentWritingBuildSentence = writingBuildSentenceQuestions[currentQuestionIndex] || writingBuildSentenceQuestions[0];

  // CMS Writing questions (Email / Academic Discussion) for dynamic review
  const writingCmsQuestions = (activeSection === 'Writing' ? (currentSection?.questions || []) : []) as any[];
  const cmsEmailQ = writingCmsQuestions.find(q => q.questionType === 'Write an Email');
  const cmsAcademicQ = writingCmsQuestions.find(q => q.questionType === 'Academic Discussion');

  const renderCompleteWordsPassage = () => {
    if (!readingCompleteWordsConfig) return null;

    const inputWidth = (blank: { answer: string; maxLength: number }) => `${Math.max(blank.maxLength || 3, (blank.answer || '').length) * 14 + 8}px`;

    const rawPassage = readingCompleteWordsConfig.passageText || '';
    
    // Normalize: convert [answer:maxLen] → [N] and build blanks array if needed
    let normalizedPassage = rawPassage;
    let extractedBlanks: { answer: string; maxLength: number }[] = readingCompleteWordsConfig.blanks || [];
    
    if (/\[[^\]]+:\d+\]/.test(rawPassage)) {
      // CMS format: word[answer:maxLen] → extract and replace with [N]
      const newBlanks: { answer: string; maxLength: number }[] = [];
      let idx = 0;
      normalizedPassage = rawPassage.replace(/\[([^\]]+):(\d+)\]/g, (_: string, answer: string, maxLen: string) => {
        newBlanks.push({ answer: answer.trim(), maxLength: parseInt(maxLen) });
        return `[${idx++}]`;
      });
      if (newBlanks.length > 0) extractedBlanks = newBlanks;
    }

    if (normalizedPassage) {
      const parts: React.ReactNode[] = [];
      const regex = /\[(\d+)\]/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let key = 0;

      // 현재 CW 지문의 전역 blank 범위 (M1은 1-10, M2는 11-20 등).
      // 모듈 전환 시 이전 모듈 답변이 남아 보이지 않도록 반드시 이 범위만으로 판단해야 함.
      const rangeStart = activeCwRange?.globalStart ?? 1;
      const rangeEnd = rangeStart + extractedBlanks.length - 1;

      // Complete Words 시도 여부: 이 CW 범위의 전역 번호에 해당하는 wrongAnswer 가 하나라도 있어야 시도한 것.
      const attemptedCompleteWords = result.wrongAnswers.some(w => {
        const id = (w.questionId || '').toLowerCase();
        const numMatch = id.match(/^(?:blank-|q|reading-|complete-words-)?(\d+)$/);
        if (numMatch) {
          const num = parseInt(numMatch[1]);
          return num >= rangeStart && num <= rangeEnd;
        }
        const rangeMatch = id.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
          const s = parseInt(rangeMatch[1]);
          const e = parseInt(rangeMatch[2]);
          return !(e < rangeStart || s > rangeEnd);
        }
        return false;
      });

      while ((match = regex.exec(normalizedPassage)) !== null) {
        const blankIndex = Number(match[1]);
        const blank = extractedBlanks[blankIndex];
        const beforeText = normalizedPassage.slice(lastIndex, match.index);

        if (beforeText) parts.push(<span key={`text-${key++}`}>{beforeText}</span>);
        if (blank) {
          // 전역 blank 번호(예: M2 첫 blank = 11)로 wrongAnswers 검색
          const globalBlankNum = rangeStart + blankIndex;
          const wrongEntry = result.wrongAnswers.find(w => {
            const id = (w.questionId || '').toLowerCase();
            if (id === String(globalBlankNum) || id === `blank-${globalBlankNum}` || id === `q${globalBlankNum}`
              || id === `reading-${globalBlankNum}` || id === `complete-words-${globalBlankNum}`) return true;
            // 범위 questionId ("11-20") + userAnswer 콤마 분리 지원
            const rangeMatch = id.match(/^(\d+)\s*-\s*(\d+)$/);
            if (rangeMatch) {
              const s = parseInt(rangeMatch[1]);
              const e = parseInt(rangeMatch[2]);
              return globalBlankNum >= s && globalBlankNum <= e && !!w.userAnswer?.split(',')[globalBlankNum - s];
            }
            return false;
          });
          const userAnswerForBlank = (() => {
            if (!wrongEntry) return null;
            const wid = (wrongEntry.questionId || '').toLowerCase();
            const rangeMatch = wid.match(/^(\d+)\s*-\s*(\d+)$/);
            if (rangeMatch) {
              const s = parseInt(rangeMatch[1]);
              return wrongEntry.userAnswer?.split(',')?.[globalBlankNum - s]?.trim() || null;
            }
            return wrongEntry.userAnswer?.trim() || null;
          })();

          // 3가지 상태: 정답(초록), 오답(빨강+취소선), 안 풼(회색)
          const isBlankWrong = !!wrongEntry && userAnswerForBlank !== blank.answer;
          const isBlankCorrect = !wrongEntry && attemptedCompleteWords;
          // 안 푼 경우 (시도 안 했거나, wrongEntry 없고 시도 안 함)

          parts.push(
            <span key={`blank-${blankIndex}`} className="inline-flex flex-col items-center mx-0.5 align-bottom">
              <span
                className={`inline-block border-b-2 px-1 text-xs font-bold min-w-[24px] text-center rounded-sm ${
                  isBlankWrong
                    ? 'border-red-500 text-red-700 bg-red-50'
                    : isBlankCorrect
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-gray-400 text-gray-500 bg-gray-100'
                }`}
                style={{ minWidth: inputWidth(blank) }}
              >
                {blank.answer}
              </span>
              {isBlankWrong && userAnswerForBlank && (
                <span className="text-[9px] text-gray-400 line-through">{userAnswerForBlank}</span>
              )}
            </span>
          );
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < readingCompleteWordsConfig.passageText.length) {
        parts.push(<span key={`text-${key++}`}>{readingCompleteWordsConfig.passageText.slice(lastIndex)}</span>);
      }

      return parts;
    }

    if (readingCompleteWordsConfig.fallbackSegments) {
      return readingCompleteWordsConfig.blanks.flatMap((blank, index) => {
        const nodes: React.ReactNode[] = [];
        const prefix = readingCompleteWordsConfig.fallbackSegments?.[index];
        const suffix = index === readingCompleteWordsConfig.blanks.length - 1
          ? readingCompleteWordsConfig.fallbackSegments?.[index + 1]
          : null;

        if (prefix) nodes.push(<span key={`segment-${index}`}>{prefix}</span>);
        nodes.push(
          <input
            key={`fallback-blank-${index}`}
            type="text"
            readOnly
            disabled
            value={blank.answer}
            className="gap-input filled"
            style={{ width: inputWidth(blank) }}
          />
        );
        if (suffix) nodes.push(<span key={`segment-tail-${index}`}>{suffix}</span>);

        return nodes;
      });
    }

    return null;
  };

  // Module tab label helper
  const getModuleTabLabel = (mod: number) => {
    if (activeSection === 'Writing') {
      if (mod === 1) return 'Build a Sentence';
      if (mod === 2) return 'Writing an Email';
      return 'Academic Discussion';
    }
    if (activeSection === 'Speaking') return mod === 1 ? 'Listen and Speak' : 'Take an Interview';
    return `Module ${mod}`;
  };

  useEffect(() => {
    if (activeSection !== 'Writing') return;

    const maxIndex = activeModule === 1 ? Math.max(0, writingBuildSentenceQuestions.length - 1) : 0;
    if (currentQuestionIndex > maxIndex) {
      setCurrentQuestionIndex(0);
    }
  }, [activeModule, activeSection, currentQuestionIndex, writingBuildSentenceQuestions.length]);

  return (
    <div className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Top bar */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-2 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Back</span>
        </button>

        {/* Section Tabs */}
        <div className="flex justify-center mb-1 md:mb-2">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
            {sectionTabs.map(tab => (
              <button
                key={tab}
                className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  activeSection === tab
                    ? 'bg-[#1e6b73] text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
                style={{
                  backgroundColor: activeSection === tab ? themeColor : undefined
                }}
                onClick={() => { setActiveSection(tab); setCurrentQuestionIndex(0); }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Module/Task Tabs */}
        <div className="flex items-center justify-center">
          <div className="flex gap-3 md:gap-4">
            {(activeSection === 'Writing' ? [1, 2, 3] : [1, 2]).map(mod => (
              <button
                key={mod}
                onClick={() => { setActiveModule(mod); setCurrentQuestionIndex(0); }}
                className={`text-xs md:text-base font-medium pb-1 md:pb-1.5 border-b-2 transition-all ${
                  activeModule === mod
                    ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {getModuleTabLabel(mod)}
              </button>
            ))}
          </div>
        </div>

        {/* Question Navigation + Stats */}
        <div className="relative flex flex-wrap items-center justify-center mt-2 gap-2">
          {/* Question Pills only — flex-wrap 허용 */}
          <div className="flex flex-wrap gap-1.5 justify-center items-center">
            {activeSection === 'Writing' && writingPills.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 md:w-9 md:h-9 rounded-full text-[11px] md:text-sm font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'text-white shadow-lg scale-110'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? themeColor : undefined,
                    borderColor: isCurrent ? themeColor : undefined
                  }}
                >
                  Q{q.number}
                </button>
              );
            })}
            {activeSection === 'Speaking' && speakingPills.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 md:w-9 md:h-9 rounded-full text-[11px] md:text-sm font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'text-white shadow-lg scale-110'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? themeColor : undefined,
                    borderColor: isCurrent ? themeColor : undefined
                  }}
                >
                  Q{q.number}
                </button>
              );
            })}
            {(activeSection === 'Reading' || activeSection === 'Listening') && questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isCorrect = q.isCorrect;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 md:w-9 md:h-9 rounded-full text-[11px] md:text-sm font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'text-white shadow-lg scale-110'
                      : q.unscored
                      ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                      : isCorrect
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                      : q.isUnanswered
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200'
                      : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? themeColor : undefined,
                    borderColor: isCurrent ? themeColor : undefined
                  }}
                  title={`Q${q.number} — ${q.unscored ? '정답 미등록' : isCorrect ? '정답' : q.isUnanswered ? '미답변' : '오답'}`}
                >
                  Q{q.number}
                </button>
              );
            })}
          </div>

          {/* Reading controls: Tools + colors + DarkMode + actions — always inline */}
          {activeSection === 'Reading' && (
            <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto max-w-full">
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  toolsOpen
                    ? 'bg-[#1e6b73] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tools
              </button>

              {toolsOpen && (
                <div className="shrink-0">
                  <ReadingReviewToolbar
                    activeTool={activeTool}
                    activeColor={activeColor}
                    onToolChange={handleToolChange}
                    onClearAll={handleClearAllHighlights}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                    colorsOnly
                  />
                </div>
              )}

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  darkMode
                    ? 'bg-gray-700 text-yellow-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
                title={darkMode ? '라이트 모드' : '다크 모드'}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {toolsOpen && (
                <div className="shrink-0">
                  <ReadingReviewActions
                    onClearAll={handleClearAllHighlights}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Listening / Writing / Speaking — Tools(하이라이트/밑줄/사전) + DarkMode */}
          {activeSection !== 'Reading' && (
            <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto max-w-full">
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  toolsOpen
                    ? 'bg-[#1e6b73] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tools
              </button>

              {toolsOpen && (
                <div className="shrink-0">
                  <ReadingReviewToolbar
                    activeTool={activeTool}
                    activeColor={activeColor}
                    onToolChange={handleToolChange}
                    onClearAll={handleClearAllHighlights}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                    colorsOnly
                  />
                </div>
              )}

              {toolsOpen && (
                <div className="shrink-0">
                  <ReadingReviewActions
                    onClearAll={handleClearAllHighlights}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                  />
                </div>
              )}

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  darkMode
                    ? 'bg-gray-700 text-yellow-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
                title={darkMode ? '라이트 모드' : '다크 모드'}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          )}

          {/* Stats — 자연스러운 flex flow */}
          <div className="hidden md:flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 shrink-0 ml-auto">
            {activeSection !== 'Speaking' && activeSection !== 'Writing' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Score</span>
                  <strong className="text-gray-900 dark:text-gray-100 text-sm">{correctCount}<span className="text-gray-400 font-normal">/{totalQuestions}</span></strong>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    correctCount/totalQuestions >= 0.8 ? 'bg-green-100 text-green-700' :
                    correctCount/totalQuestions >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{Math.round(correctCount/totalQuestions*100)}%</span>
                </div>
                {/* 정답/오답/미답변/unscored 개수 배지 — 사용자가 한눈에 파악 가능 */}
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">맞은 {correctCount}</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700">틀린 {wrongCount}</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">안 푼 {unansweredCount}</span>
                  {unscoredCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">미채점 {unscoredCount}</span>
                  )}
                </div>
              </div>
            )}
            <span>
              Time: <strong className="text-gray-900 dark:text-gray-100">{timeDisplay}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ===== READING / LISTENING CONTENT ===== */}
        {(activeSection === 'Reading' || activeSection === 'Listening') && (
          showReadingCompleteWordsReview ? (
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 md:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activeCwRange ? `Q${activeCwRange.localStart}-Q${activeCwRange.localEnd}` : (readingCompleteWordsQuestion ? getQuestionRangeLabel(readingCompleteWordsQuestion, 1) : 'Q1-Q10')}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">Complete Words</h3>
                    </div>
                    <button
                      onClick={() => toggleBookmark(readingCompleteWordsConfig?.id || '')}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      {bookmarkedQuestions.has(readingCompleteWordsConfig?.id || '') ? (
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-3.5 h-3.5" />
                      )}
                      <span>{bookmarkedQuestions.has(readingCompleteWordsConfig?.id || '') ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>

                  <p className="mb-3 text-base md:text-lg text-black dark:text-gray-100 font-bold text-center">
                    Fill in the missing letters in the paragraph.
                  </p>

                  <div
                    ref={passageRef}
                    className="text-sm md:text-lg leading-[1.7] text-black dark:text-gray-100"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                    onMouseUp={(e) => {
                      // Complete Words passageText의 [answer:maxLen] → answer 로 정규화하여 offset 매칭
                      const rawPassage = readingCompleteWordsConfig?.passageText || '';
                      const normalizedForLookup = rawPassage.replace(/\[([^\]]+):(\d+)\]/g, '$1');
                      handlePassageMouseUp(e, normalizedForLookup, currentTestId, `${currentPassageKey}-complete-words`);
                    }}
                  >
                    {renderCompleteWordsPassage()}
                  </div>
                </div>

                <div className="flex justify-between mt-4 pb-3">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ backgroundColor: themeColor }}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Review Note</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Reading Module {activeModule}의 {activeCwRange ? `Q${activeCwRange.localStart}-Q${activeCwRange.localEnd}` : 'Q1-Q10'}은 TPO 기준 Complete Words 유형입니다. 빈칸별로 내 답 / 정답 / 미답변을 구분해 표시합니다.
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      // Parse blanks from CMS format if needed
                      const rawP = readingCompleteWordsConfig?.passageText || '';
                      let displayBlanks = readingCompleteWordsConfig?.blanks || [];
                      if (/\[[^\]]+:\d+\]/.test(rawP)) {
                        const parsed: {answer:string;maxLength:number}[] = [];
                        rawP.replace(/\[([^\]]+):(\d+)\]/g, (_:string, ans:string, ml:string) => {
                          parsed.push({answer:ans.trim(), maxLength:parseInt(ml)});
                          return '';
                        });
                        if (parsed.length > 0) displayBlanks = parsed;
                      }
                      // blank-N ID는 전역 슬롯 번호 기준 (CW2 지문이면 11부터 시작)
                      const globalBlankStart = activeCwRange?.globalStart ?? 1;
                      const rangeEndForSidebar = globalBlankStart + displayBlanks.length - 1;
                      // 이 CW 범위 내에서 시도된 흔적이 있어야 "시도한 모듈".
                      // 이전 모듈만 풀고 현재 모듈은 안 푼 경우 → 이 범위 wrongAnswer 가 없으므로 false
                      // → 미답변(회색) 로 표시되도록 함 (초록 정답 오표시 방지)
                      const attemptedRange = result.wrongAnswers.some(w => {
                        const id = (w.questionId || '').toLowerCase();
                        const numMatch = id.match(/^(?:blank-|q|reading-|complete-words-)?(\d+)$/);
                        if (numMatch) {
                          const num = parseInt(numMatch[1]);
                          return num >= globalBlankStart && num <= rangeEndForSidebar;
                        }
                        const rangeMatch = id.match(/^(\d+)\s*-\s*(\d+)$/);
                        if (rangeMatch) {
                          const s = parseInt(rangeMatch[1]);
                          const e = parseInt(rangeMatch[2]);
                          return !(e < globalBlankStart || s > rangeEndForSidebar);
                        }
                        return false;
                      });
                      return displayBlanks.map((blank, index) => {
                        const globalBlankNum = globalBlankStart + index;
                        const wrongEntry = result.wrongAnswers.find(w =>
                          w.questionId === `blank-${globalBlankNum}` || w.questionId === String(globalBlankNum)
                        );
                        // 정답: wrongEntry 없음 + 이 범위를 시도한 상태여야 함
                        const isCorrect = !wrongEntry && attemptedRange;
                        // 미답변: 이 범위를 아예 시도 안 함, 또는 채점 시 '(빈칸)' 기록
                        const isUnattempted = !wrongEntry && !attemptedRange;
                        // 미답변: 채점 시 '(빈칸)'으로 기록됨 — 오답과 구분해 회색 표시
                        const isOmitted = !!wrongEntry && (
                          wrongEntry.userAnswer === '(빈칸)' ||
                          wrongEntry.userAnswer === '(미답변)' ||
                          !wrongEntry.userAnswer
                        );
                        const isUnscoredBlank = !!wrongEntry && wrongEntry.correctAnswer === '(정답 미등록)';
                        const userAns = wrongEntry?.userAnswer || null;
                        const stateCls = isUnscoredBlank
                          ? 'border-amber-200 bg-amber-50'
                          : isCorrect
                            ? 'border-green-200 bg-green-50'
                            : (isOmitted || isUnattempted)
                              ? 'border-gray-200 bg-gray-50'
                              : 'border-red-200 bg-red-50';
                        const stateTextCls = isUnscoredBlank
                          ? 'text-amber-700'
                          : isCorrect
                            ? 'text-green-700'
                            : (isOmitted || isUnattempted)
                              ? 'text-gray-500'
                              : 'text-red-700';
                        return (
                          <div key={`answer-key-${index}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${stateCls}`}>
                            <span className="text-gray-500">Q{globalBlankNum}</span>
                            <div className="flex items-center gap-2">
                              {!isCorrect && !isOmitted && !isUnattempted && userAns && (
                                <span className="text-xs text-red-400 line-through">{userAns}</span>
                              )}
                              {(isOmitted || isUnattempted) && (
                                <span className="text-xs text-gray-400">미답변</span>
                              )}
                              <span className={`font-semibold ${stateTextCls}`}>
                                {blank.answer || '(정답 미등록)'}
                              </span>
                              {isUnscoredBlank
                                ? <span className="text-xs text-amber-500">채점불가</span>
                                : isCorrect
                                  ? <Check className="w-3.5 h-3.5 text-green-500" />
                                  : (isOmitted || isUnattempted)
                                    ? <span className="w-3.5 h-3.5 rounded-full bg-gray-300 inline-block" />
                                    : <X className="w-3.5 h-3.5 text-red-500" />
                              }
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row gap-4">
            {/* Left Panel: Passage (for Reading) - Equal width 50% */}
            {activeSection === 'Reading' && (
              <div className="w-full md:w-1/2 order-1 md:order-none flex flex-col gap-2">
                <div
                  ref={passageRef}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 md:p-4 h-full overflow-y-auto"
                  style={{ maxHeight: '62vh' }}
                  onMouseUp={(e) => handlePassageMouseUp(e, currentQuestion?.passageText || '', currentTestId, currentPassageKey)}
                >
                  {(() => {
                    // Use passageText from the already-correctly-mapped currentQuestion
                    // (currentQuestion is built with correct CMS offset for Q11-20)
                    const rawPassage = currentQuestion?.passageText || null;

                    // Also try to get passageTitle from the mapped CMS question
                    // 전역 슬롯으로 현재 로컬 번호의 CMS 문제를 조회 (CW 빈칸 수/지문 개수와 무관하게 정확)
                    const mappedCmsQ = mcqSlotForLocal(currentLocalNum)?.question || null;
                    const passageTitle = mappedCmsQ?.passageTitle || null;

                    // Parse JSON template if needed
                    const passageContent = parsePassageContent(rawPassage) || null;

                    return passageContent ? (
                      <>
                        {passageTitle && (
                          <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{passageTitle}</h4>
                        )}
                        {/* 텍스트는 ref 콜백으로 주입 — 하이라이트(mark/u) DOM 직접 조작과
                            React 자식 렌더가 충돌해 insertBefore NotFoundError가 나던 것을 방지.
                            React는 빈 <p>만 관리하고, 텍스트는 dataset 비교로 같을 때 재주입하지 않아
                            하이라이트가 유지됨 */}
                        <p
                          ref={(el) => {
                            if (el && el.dataset.passage !== passageContent) {
                              el.dataset.passage = passageContent;
                              el.textContent = passageContent;
                            }
                          }}
                          className="text-sm md:text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap"
                        />
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">지문을 불러올 수 없습니다.</p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Left Panel: Audio Player (for Listening) - Equal width 50% */}
            {activeSection === 'Listening' && (() => {
              // currentQuestion에서 직접 데이터 사용 — 모듈 필터링 후에도 올바른 문제 데이터 보장
              const transcript = currentQuestion?.scriptText || currentQuestion?.audioText;
              const translation = currentQuestion?.translation;
              const keyWords: string[] = currentQuestion?.keyWords || [];
              const analysis = currentQuestion?.analysis || currentQuestion?.explanation;
              return (
                <div className="w-full md:w-1/2 order-1 md:order-none">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 h-full overflow-y-auto">
                    {/* Listening Image (CMS) — full face visible */}
                    {currentQuestion?.imageUrl ? (
                      <div className="rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 flex items-center justify-center" style={{ maxHeight: '320px' }}>
                        <img
                          src={currentQuestion.imageUrl}
                          alt="Listening question context"
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: '320px' }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg mb-4 border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 flex items-center justify-center text-gray-300 dark:text-gray-500 text-xs" style={{ height: '180px' }}>
                        No image
                      </div>
                    )}

                    {/* Audio Player — UniversalAudioPlayer: URL 변경 시 자동 reload */}
                    {currentQuestion?.audioUrl ? (
                      <div className="mb-3">
                        <UniversalAudioPlayer
                          key={`listen-audio-${currentQuestionIndex}`}
                          audioUrl={currentQuestion.audioUrl}
                          qNum={currentQuestionIndex + 1}
                          label="Play Audio"
                          color="#0d3b4a"
                          onTimeUpdate={(t, d) => { setAudioCurrentTime(t); if (d) setAudioDuration(d); }}
                          onEnded={() => setAudioCurrentTime(0)}
                        />
                      </div>
                    ) : (
                      <div className="mb-3 text-xs text-gray-400 italic px-1">
                        CMS에 등록된 오디오가 없습니다.
                      </div>
                    )}

                    {/* Script Sync — 타임스탬프 있을 때 문장 단위 하이라이트 (오디오 재생 싱크) */}
                    {transcript && (currentQuestion as any)?.sentenceTimestamps && (() => {
                      const ts: Array<{ start: number; end: number }> = (currentQuestion as any).sentenceTimestamps;
                      if (!Array.isArray(ts) || ts.length === 0) return null;
                      // Narrator 줄 제거 + 문장 분할 (ReviewAssistantPanel과 동일 규칙)
                      const lines = transcript.split('\n').map(l => l.trim()).filter(l => l && !/^Narrator\s*:/i.test(l));
                      const joined = lines.join(' ');
                      const sentences = (joined.match(/[^.!?]+[.!?]+["']?\s*/g) || [joined]).map(s => s.trim()).filter(s => s.length > 1);
                      // 타임스탬프 개수와 문장 수가 다르면 하이라이트 안 함 (매칭 어긋남 방지)
                      if (sentences.length !== ts.length) return null;
                      // 현재 재생 시간이 속한 문장 인덱스
                      let activeIdx = -1;
                      for (let i = 0; i < ts.length; i++) {
                        if (audioCurrentTime >= ts[i].start) activeIdx = i; else break;
                      }
                      return (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <p className="text-xs font-bold text-[#2d7a7c] uppercase tracking-wide mb-2">🎵 Script Sync</p>
                          <div className="space-y-1.5">
                            {sentences.map((s, i) => (
                              <p
                                key={i}
                                className={`text-sm leading-relaxed rounded-lg px-2 py-1 transition-colors cursor-pointer ${
                                  i === activeIdx
                                    ? 'bg-[#2d7a7c]/15 text-[#0d3b4a] dark:text-[#5fbfc4] font-medium'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {s}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Dictation — 리스닝 스크립트 빈칸 채우기 */}
                    {transcript && (() => {
                      const blankList = (currentQuestion?.dictationBlanks || '').split(',').map((w: string) => w.trim()).filter(Boolean);
                      const blankSet = new Set(blankList.map((w: string) => w.toLowerCase()));
                      const tokens = transcript.split(/(\s+)/);
                      let blankIdx = 0;
                      return (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-[#2d7a7c] uppercase tracking-wide">✨ Dictation</p>
                            {blankList.length > 0 && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setDictationChecked(!dictationChecked)}
                                  className="text-xs px-2 py-1 rounded bg-[#2d7a7c] text-white hover:bg-[#1e5a5c]"
                                >
                                  {dictationChecked ? '정답 숨기기' : '정답 확인'}
                                </button>
                                <button
                                  onClick={() => { setDictationAnswers({}); setDictationChecked(false); }}
                                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  초기화
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                            {blankList.length === 0 ? (
                              transcript
                            ) : (
                              tokens.map((token, i) => {
                                const lower = token.toLowerCase().replace(/[^a-z0-9']/g, '');
                                if (lower && blankSet.has(lower)) {
                                  const idx = blankIdx++;
                                  const userAns = dictationAnswers[idx] || '';
                                  const isCorrect = userAns.toLowerCase().trim() === lower;
                                  return (
                                    <input
                                      key={i}
                                      type="text"
                                      value={userAns}
                                      onChange={(e) => setDictationAnswers({ ...dictationAnswers, [idx]: e.target.value })}
                                      className={`inline-block mx-1 px-2 py-0.5 border rounded text-sm ${
                                        dictationChecked
                                          ? (isCorrect
                                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                            : 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300')
                                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                                      }`}
                                      style={{ width: `${Math.max(60, token.length * 10)}px` }}
                                      placeholder="..."
                                    />
                                  );
                                }
                                return <span key={i}>{token}</span>;
                              })
                            )}
                          </p>
                          {blankList.length > 0 && dictationChecked && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              빈칸: {blankList.join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Organization — 구조/요약 빈칸 채우기 (Announcement/Conversation/Lecture용) */}
                    {(() => {
                      const orgText = currentQuestion?.organization;
                      if (!orgText) return null;
                      const orgBlankList = (currentQuestion?.organizationBlanks || '').split(',').map((w: string) => w.trim()).filter(Boolean);
                      const orgBlankSet = new Set(orgBlankList.map((w: string) => w.toLowerCase()));
                      const tokens = orgText.split(/(\s+)/);
                      let blankIdx = 0;
                      return (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-[#2d7a7c] uppercase tracking-wide">📋 Organization</p>
                            {orgBlankList.length > 0 && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setOrgChecked(!orgChecked)}
                                  className="text-xs px-2 py-1 rounded bg-[#2d7a7c] text-white hover:bg-[#1e5a5c]"
                                >
                                  {orgChecked ? '정답 숨기기' : '정답 확인'}
                                </button>
                                <button
                                  onClick={() => { setOrgAnswers({}); setOrgChecked(false); }}
                                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  초기화
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                            {orgBlankList.length === 0 ? (
                              orgText
                            ) : (
                              tokens.map((token, i) => {
                                const lower = token.toLowerCase().replace(/[^a-z0-9']/g, '');
                                if (lower && orgBlankSet.has(lower)) {
                                  const idx = blankIdx++;
                                  const userAns = orgAnswers[idx] || '';
                                  const isCorrect = userAns.toLowerCase().trim() === lower;
                                  return (
                                    <input
                                      key={i}
                                      type="text"
                                      value={userAns}
                                      onChange={(e) => setOrgAnswers({ ...orgAnswers, [idx]: e.target.value })}
                                      className={`inline-block mx-1 px-2 py-0.5 border rounded text-sm ${
                                        orgChecked
                                          ? (isCorrect
                                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                            : 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300')
                                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                                      }`}
                                      style={{ width: `${Math.max(60, token.length * 10)}px` }}
                                      placeholder="..."
                                    />
                                  );
                                }
                                return <span key={i}>{token}</span>;
                              })
                            )}
                          </p>
                          {orgBlankList.length > 0 && orgChecked && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              빈칸: {orgBlankList.join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                </div>
              );
            })()}

            {/* Right: Question Content - Equal width 50% */}
            <div className="w-full md:w-1/2 shrink-0 order-2 md:order-none">
              <>
                <div
                  key={currentQuestion?.id}
                  className="animate-[fadeIn_0.2s_ease-out]"
                >
                  <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-yellow-300 mb-2 md:mb-3">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </p>

                  <p className="text-sm md:text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3 md:mb-4 leading-relaxed">
                    {currentQuestion?.text}
                  </p>

                  <div className="space-y-2 mb-4 md:mb-5">
                    {currentQuestion?.unscored ? (
                      // 정답 미등록 — 채점 불가 안내 배너
                      <div className="rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 p-4 md:p-5">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm md:text-base font-bold text-amber-800 dark:text-amber-200 mb-1">
                              채점 불가 — CMS에 정답 미등록
                            </p>
                            <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                              이 문제는 CMS에 정답(correctAnswer)이 등록되어 있지 않아 자동 채점에서 제외되었습니다.
                              <br />
                              CMS 관리 화면에서 해당 문제의 정답을 등록해 주세요. 정답 등록 후 다시 풀면 정상적으로 채점됩니다.
                            </p>
                            {currentQuestion?.userAnswer && currentQuestion.userAnswer !== '(미답변)' && (
                              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                제출한 답: <strong>{currentQuestion.userAnswer}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                    currentQuestion?.options.map((option, idx) => {
                      // 옵션에서 A./B./C./D. 접두사 제거 (실제 시험 형식)
                      const cleanOption = option.replace(/^[A-D]\.\s*/, '');
                      const optionLetter = String.fromCharCode(65 + idx);
                      const isUserAnswer = cleanOption === currentQuestion.userAnswer || option === currentQuestion.userAnswer || optionLetter === currentQuestion.userAnswer;
                      const isCorrectAnswer = cleanOption === currentQuestion.correctAnswer || option === currentQuestion.correctAnswer || optionLetter === currentQuestion.correctAnswer;

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 p-2 md:p-3 rounded-lg border transition-all ${
                            isCorrectAnswer
                              ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <span className={`text-sm md:text-lg flex-1 ${
                            isCorrectAnswer
                              ? 'text-emerald-700 dark:text-emerald-300 font-semibold'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'text-red-700 dark:text-red-300 font-medium'
                              : 'text-gray-700 dark:text-gray-100 font-medium'
                          }`}>
                            {cleanOption}
                          </span>
                          {isCorrectAnswer && (
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          {isUserAnswer && !currentQuestion.isCorrect && !isCorrectAnswer && (
                            <X className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                        </div>
                      );
                    })
                    )}
                  </div>

                  {currentQuestion?.explanation && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-1">Explanation</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                    {(() => {
                      // 정답 미등록(unscored)인 경우 — 채점 불가 표시
                      if (currentQuestion?.unscored) {
                        return (
                          <div className="flex flex-col gap-1 text-xs md:text-sm">
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              ⚠️ 미채점 (CMS 정답 미등록)
                            </span>
                            {currentQuestion?.userAnswer && currentQuestion.userAnswer !== '(미답변)' && (
                              <span className="text-gray-500">
                                제출한 답: <strong>{currentQuestion.userAnswer}</strong>
                              </span>
                            )}
                          </div>
                        );
                      }
                      // Convert full-text answer to letter (A/B/C/D) using option index
                      const toLetter = (ans: string | undefined) => {
                        if (!ans) return '-';
                        const opts = currentQuestion?.options || [];
                        const idx = opts.findIndex(o => o === ans);
                        if (idx >= 0) return String.fromCharCode(65 + idx);
                        // Already a letter?
                        if (/^[A-D]$/i.test(ans.trim())) return ans.trim().toUpperCase();
                        return ans;
                      };
                      return (
                        <div className="flex flex-col gap-1 text-xs md:text-sm">
                          <span className="text-gray-600">
                            My Answer: <strong className={currentQuestion?.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                              {toLetter(currentQuestion?.userAnswer)}
                            </strong>
                          </span>
                          <span className="text-gray-600">
                            Correct Answer: <strong className="text-emerald-600">
                              {toLetter(currentQuestion?.correctAnswer)}
                            </strong>
                          </span>
                        </div>
                      );
                    })()}
                    <button
                      onClick={() => toggleBookmark(currentQuestion?.id || '')}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      {bookmarkedQuestions.has(currentQuestion?.id || '') ? (
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-3.5 h-3.5" />
                      )}
                      <span>{bookmarkedQuestions.has(currentQuestion?.id || '') ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>
                </div>
              </>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-3 md:mt-4 pb-3">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
          )
        )}

        {/* ===== WRITING CONTENT ===== */}
        {activeSection === 'Writing' && (
          <div
            ref={writingReviewRef}
            onMouseUp={(e) => handlePassageMouseUp(e, e.currentTarget.textContent || '', currentTestId, 'writing-review')}
            className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6 overflow-auto"
          >
            {/* ---- Writing 1: Build a Sentence (Q1-Q10) ---- */}
            {activeModule === 1 && currentWritingBuildSentence && (
              <div className="w-full max-w-4xl mx-auto p-3 md:p-5">
                <div className="bg-white dark:bg-gray-800">
                  <h2 className="text-lg md:text-xl font-bold text-black dark:text-gray-100 mb-3 text-center">Make an appropriate sentence.</h2>

                  <div className="space-y-3 mt-2 px-1 md:px-4">
                    {/* Avatar 1 + prompt */}
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {currentWritingBuildSentence.avatar1ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar1ImageUrl} alt="Q" className="w-full h-full object-cover" />
                          : <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="text-base md:text-lg text-gray-800 dark:text-gray-100">{currentWritingBuildSentence.prompt}</div>
                    </div>

                    {/* Avatar 2 + word chips */}
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {currentWritingBuildSentence.avatar2ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar2ImageUrl} alt="A" className="w-full h-full object-cover" />
                          : <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="flex-1">
                        {/* Word bank */}
                        <div className="flex flex-wrap gap-1.5">
                          {currentWritingBuildSentence.words.map((word, idx) => {
                            const isPrefilled = word.startsWith('[') && word.endsWith(']');
                            const display = word.replace(/^\[|\]$/g, '');
                            return isPrefilled
                              ? <span key={idx} className="text-lg font-medium text-gray-700 dark:text-gray-200">{display}</span>
                              : <span key={idx} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-lg text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700">{display}</span>;
                          })}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Correct Answer + My Answer (below conversation) */}
                  {(() => {
                    // Reconstruct correct answer from words array if correctAnswer is missing
                    const reconstructFromWords = () => {
                      const parts = currentWritingBuildSentence.words.map(w =>
                        w.startsWith('[') && w.endsWith(']') ? w.slice(1, -1) : w
                      );
                      return parts.join(' ');
                    };
                    const correctText = currentWritingBuildSentence.correctAnswer || reconstructFromWords();
                    const ending = currentWritingBuildSentence.sentenceEnding || '.';
                    const fullCorrect = `${correctText}${ending}`;
                    // Writing Build a Sentence 시도 여부 — Q1-10 범위에 wrongAnswer가 하나라도 있으면 시도한 것
                    const attemptedWriting = result.wrongAnswers.some(w => {
                      const id = (w.questionId || '').toLowerCase();
                      const num = parseInt(id);
                      return !isNaN(num) && num >= 1 && num <= 10
                        || id.startsWith('writing-bs') || id.startsWith('writing-')
                        || id.startsWith('build-sentence') || id.includes('sentence');
                    });
                    return (
                      <div className="mt-4 space-y-2 px-1 md:px-4">
                        {correctText && (
                          <div className="flex items-start gap-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1.5 shrink-0 w-12">정답</p>
                            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-base font-medium text-emerald-800 dark:text-emerald-200">
                              {fullCorrect}
                            </div>
                          </div>
                        )}

                        {/* User's answer + grading */}
                        {(() => {
                          const qNum = currentQuestionIndex + 1;
                          const wrongEntry = result.wrongAnswers.find(w => {
                            const id = (w.questionId || '').toLowerCase();
                            return id === `writing-bs-${qNum}` || id === String(qNum)
                              || id === `writing-${qNum}` || id === `build-sentence-${qNum}`
                              || id === `bs-${qNum}` || id === `q${qNum}`;
                          });
                          const userAns = wrongEntry?.userAnswer;
                          // 시도하지 않은 Writing 섹션 → 안 푼 것 = 틀린 것
                          const isWrong = !!wrongEntry || !attemptedWriting;
                          return (
                            <div className="flex items-start gap-2">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1.5 shrink-0 w-12">내 답</p>
                              <div className="flex-1">
                                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${isWrong ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {isWrong ? '✕ 오답' : '✓ 정답'}
                                </span>
                                <div className={`rounded-lg px-3 py-2 text-base border ${
                                  isWrong
                                    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                                    : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                                }`}>
                                  {userAns || (isWrong ? '(미제출)' : fullCorrect)}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>

                {/* Nav buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
                  >← Previous</button>
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-all"
                    style={{ backgroundColor: themeColor }}
                  >Next →</button>
                </div>
              </div>
            )}

            {/* ---- Writing 2: Writing an Email ---- */}
            {activeModule === 2 && (
              <>
                {/* Left: Prompt */}
                <div className="md:w-2/5 p-3 md:p-5 overflow-auto bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-300 dark:border-gray-700">
                  <p className="text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed mb-3">
                    {cmsEmailQ?.emailScenario || 'A new poetry magazine has asked its readers for submissions, and you want to submit two of your poems. However, you had a problem using the online submission form, and you are not certain that your submissions were received.'}
                  </p>
                  <p className="text-sm md:text-base text-gray-800 dark:text-gray-100 font-bold mb-2">
                    {cmsEmailQ?.emailInstruction || 'Write an email to the editor of the magazine. In your email, do the following.'}
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {(Array.isArray(cmsEmailQ?.emailBullets) && cmsEmailQ.emailBullets.length
                      ? cmsEmailQ.emailBullets
                      : ['Tell the editor what you like about the new magazine.', 'Describe the problem you experienced.', 'Ask about the status of your submissions.']
                    ).map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-gray-300 mt-2 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-800 dark:text-gray-100">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm md:text-base text-gray-800 dark:text-gray-100">Write as much as you can and in complete sentences.</p>
                </div>
                {/* Right: Email response area */}
                <div className={`md:w-3/5 p-3 md:p-5 overflow-auto bg-gray-50 dark:bg-gray-900 transition-[padding] duration-200 ${aiTutorPinned ? 'md:pr-[420px]' : ''}`}>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Your Response:</h3>
                  <div className="mb-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
                    <span className="font-bold">To:</span> {cmsEmailQ?.emailTo || 'editor@sunshinepoetymagazine.com'}
                  </div>
                  <div className="mb-3 text-sm md:text-base text-gray-700 dark:text-gray-300">
                    <span className="font-bold">Subject:</span> {cmsEmailQ?.emailSubject || 'Problem using submission form'}
                  </div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">내가 쓴 답안</p>
                  <div className={`bg-white dark:bg-gray-800 border rounded-lg p-3 md:p-4 min-h-32 text-sm md:text-base whitespace-pre-wrap ${result.wrongAnswers[0]?.userAnswer ? 'text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600' : 'text-gray-400 italic border-gray-200 dark:border-gray-700'}`}>
                    {result.wrongAnswers[0]?.userAnswer || '작성한 답안이 저장되지 않았습니다.'}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setShowWritingAiGrader('email')}
                      disabled={!result.wrongAnswers[0]?.userAnswer?.trim()}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] text-white px-4 py-2 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-[#1e6b73]/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI 튜터로 첨삭받기
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">6점 만점</span>
                    </button>
                    <button
                      onClick={() => toggleBookmark('writing-email')}
                      className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      {bookmarkedQuestions.has('writing-email') ? (
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="w-3.5 h-3.5" />
                      )}
                      <span>{bookmarkedQuestions.has('writing-email') ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ---- Writing 3: Academic Discussion ---- */}
            {activeModule === 3 && (
              <>
                {/* Left: Professor prompt */}
                <div className="md:w-2/5 p-3 md:p-5 overflow-auto bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-300 dark:border-gray-700">
                  <p className="text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed mb-3 font-serif">
                    {cmsAcademicQ?.questionText || "Your professor is teaching a class. Write a post responding to the professor's question."}
                  </p>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-serif">In your response, you should do the following.</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-gray-300 mt-2 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-800 dark:text-gray-100 font-serif">Express and support your opinion.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-gray-300 mt-2 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-800 dark:text-gray-100 font-serif">Make a contribution to the discussion in your own words.</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm md:text-base text-gray-800 dark:text-gray-100 mb-4 font-serif">An effective response will contain at least 100 words.</p>
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                    <div className="flex flex-col items-center mb-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1e6b73] mb-1.5 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {cmsAcademicQ?.professorImageUrl ? (
                          <img src={cmsAcademicQ.professorImageUrl} alt="Professor" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <p className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100 font-serif">{cmsAcademicQ?.professorName || 'Professor'}</p>
                    </div>
                    <p className="text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed font-serif">
                      {cmsAcademicQ?.professorMessage || cmsAcademicQ?.questionText || '(No professor message in CMS)'}
                    </p>
                  </div>
                </div>
                {/* Right: Student responses + user response */}
                <div className={`md:w-3/5 p-3 md:p-5 overflow-auto bg-[#f8f7f3] dark:bg-gray-900 transition-[padding] duration-200 ${aiTutorPinned ? 'md:pr-[420px]' : ''}`}>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2.5 rounded-2xl bg-white/80 dark:bg-gray-800/80 p-3 shadow-sm border border-[#e7e3d7] dark:border-gray-700">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {cmsAcademicQ?.student1ImageUrl ? (
                          <img src={cmsAcademicQ.student1ImageUrl} alt="Student 1" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        {cmsAcademicQ?.student1Name && <p className="font-bold text-sm text-gray-700 dark:text-gray-200 font-serif mb-0.5">{cmsAcademicQ.student1Name}</p>}
                        <p className="text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed font-serif">
                          {cmsAcademicQ?.student1Message || '(No student 1 message in CMS)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-2xl bg-white/80 dark:bg-gray-800/80 p-3 shadow-sm border border-[#e7e3d7] dark:border-gray-700">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b] bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {cmsAcademicQ?.student2ImageUrl ? (
                          <img src={cmsAcademicQ.student2ImageUrl} alt="Student 2" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        {cmsAcademicQ?.student2Name && <p className="font-bold text-sm text-gray-700 dark:text-gray-200 font-serif mb-0.5">{cmsAcademicQ.student2Name}</p>}
                        <p className="text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed font-serif">
                          {cmsAcademicQ?.student2Message || '(No student 2 message in CMS)'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 md:p-4 shadow-sm border border-[#ddd4c4] dark:border-gray-700">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 font-serif">Your Response:</h3>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">내가 쓴 답안</p>
                    <div className={`border rounded-xl p-3 md:p-4 min-h-32 text-sm md:text-base whitespace-pre-wrap font-serif ${result.wrongAnswers[1]?.userAnswer ? 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 italic border-gray-200 dark:border-gray-600'}`}>
                      {result.wrongAnswers[1]?.userAnswer || '작성한 답안이 저장되지 않았습니다.'}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => setShowWritingAiGrader('discussion')}
                        disabled={!result.wrongAnswers[1]?.userAnswer?.trim()}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#1e6b73] to-[#2d8a8c] text-white px-4 py-2 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-[#1e6b73]/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI 튜터로 첨삭받기
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">6점 만점</span>
                      </button>
                      <button
                        onClick={() => toggleBookmark('writing-discussion')}
                        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 transition-colors"
                      >
                        {bookmarkedQuestions.has('writing-discussion') ? (
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5" />
                        )}
                        <span>{bookmarkedQuestions.has('writing-discussion') ? 'Bookmarked' : 'Bookmark'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== SPEAKING CONTENT ===== */}
        {activeSection === 'Speaking' && currentSpeakingQ && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3">
            <div key={currentSpeakingQ.id} className="animate-[fadeIn_0.2s_ease-out]">
              {/* Question header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {speakingQuestionCount}
                </p>
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>
                  {currentSpeakingQ.taskGroup}
                </span>
              </div>

              {/* Prompt */}
              <div className="mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400 mb-2">Prompt</p>
                <p className="text-base md:text-lg text-gray-900 dark:text-gray-100 leading-relaxed font-medium">{currentSpeakingQ.prompt}</p>
              </div>

              {/* Reference image + question audio (실제 시험 화면 구조) */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 mb-3">
                <div className="flex justify-center mb-3">
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                    {currentSpeakingQ.materialImage ? (
                      <ImageWithFallback
                        src={currentSpeakingQ.materialImage}
                        alt="Speaking material"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Question audio player — UniversalAudioPlayer */}
                {currentSpeakingQ.audioUrl ? (
                  <UniversalAudioPlayer
                    key={`spk-audio-${currentQuestionIndex}-${activeModule}`}
                    audioUrl={currentSpeakingQ.audioUrl}
                    qNum={currentQuestionIndex + 1}
                    label="Play Audio"
                    color="#0d3b4a"
                  />
                ) : (
                  <p className="text-center text-xs text-gray-400 italic">CMS에 등록된 오디오가 없습니다.</p>
                )}

                {/* Script toggle */}
                <div className="text-center mt-2">
                  <button
                    onClick={() => setShowModelText(!showModelText)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {showModelText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showModelText ? 'Hide Script' : 'View Script'}</span>
                  </button>
                  {showModelText && currentSpeakingQ.transcript && (
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-[fadeIn_0.2s_ease-out]">
                      {currentSpeakingQ.transcript}
                    </p>
                  )}
                </div>
              </div>

              {/* My Recording */}
              {(() => {
                const qNum = activeModule === 1 ? currentQuestionIndex + 1 : currentQuestionIndex + 8;
                const recUrl = speakingRecordings[String(qNum)];
                return (
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                        My Recording — Q{qNum}
                      </span>
                    </div>
                    {recUrl ? (
                      <AudioPlayer src={recUrl} qNum={qNum} />
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        녹음이 없습니다. (스피킹 세션 완료 후 표시됩니다)
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Bookmark + Nav */}
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => toggleBookmark(currentSpeakingQ.id)}
                  className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-yellow-500 transition-colors"
                >
                  {bookmarkedQuestions.has(currentSpeakingQ.id) ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                  <span>{bookmarkedQuestions.has(currentSpeakingQ.id) ? 'Bookmarked' : 'Bookmark'}</span>
                </button>
              </div>

              <div className="flex justify-between pb-3">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(speakingQuestionCount - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === speakingQuestionCount - 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-center text-xs text-gray-400 dark:text-gray-500 shrink-0">
        © {new Date().getFullYear()} TOEFL TPO Practice Platform. All Rights Reserved.
      </div>

      {/* AI 튜터 위젯 — History 리뷰 결과 화면. 우측 하단 FAB + 슬라이드인 팝업
          모든 섹션에서 pinnable=true — Listening/Reading 리뷰에서도 스크립트·지문을
          복습하면서 AI 튜터를 띄워놓을 수 있도록 고정 기능 확장 */}
      <ToeflAiWidget
        position="right"
        zIndex={60}
        contextLabel={`Review · ${activeSection} (Q${currentQuestionIndex + 1})`}
        pinnable={true}
        onPinnedChange={setAiTutorPinned}
        suggestedQuestions={
          activeSection === 'Writing' && activeModule === 2
            ? [
                '📌 문제 핵심 요구사항 & 추천 구조',
                '👥 상황별 맞춤 어휘 & 이메일 표현',
                '✍️ 이메일 도입부(첫 문장) 추천',
                '💡 본문 전개용 브레인스토밍 아이디어',
              ]
            : activeSection === 'Writing' && activeModule === 3
            ? [
                '📌 토론 주제 및 학생 의견 핵심 요약',
                '👥 타인 의견 인용 및 연계 표현 추천',
                '✍️ 토론형 라이팅 도입부(첫 문장) 예시',
                '💡 독창적 의견 전개를 위한 브레인스토밍',
              ]
            : undefined
        }
      />

      {/* Writing AI 채점 — TPO review Email/Discussion */}
      {showWritingAiGrader === 'email' && cmsEmailQ && (
        <WritingReviewAiTutor
          writingType="email"
          userAnswer={result.wrongAnswers[0]?.userAnswer || ''}
          questionData={cmsEmailQ}
          onClose={() => setShowWritingAiGrader(null)}
        />
      )}
      {showWritingAiGrader === 'discussion' && cmsAcademicQ && (
        <WritingReviewAiTutor
          writingType="discussion"
          userAnswer={result.wrongAnswers[1]?.userAnswer || ''}
          questionData={cmsAcademicQ}
          onClose={() => setShowWritingAiGrader(null)}
        />
      )}

      {/* 단어 뜻 팝업 — 리딩 review에서 단어 클릭 시 표시 */}
      {popupData && (
        <WordPopup
          word={popupData.word}
          context={popupData.context}
          language={language}
          x={popupData.x}
          y={popupData.y}
          onClose={() => setPopupData(null)}
        />
      )}
    </div>
  );
}

// Helper function to generate options from correct and user answers
function generateOptions(correctAnswer: string, userAnswer: string): string[] {
  const options = [correctAnswer];
  if (userAnswer !== correctAnswer) {
    options.push(userAnswer);
  }
  const fillers = [
    'None of the above',
    'All of the above',
    'Cannot be determined',
    'Not mentioned in the passage'
  ];
  let i = 0;
  while (options.length < 4 && i < fillers.length) {
    if (!options.includes(fillers[i])) {
      options.push(fillers[i]);
    }
    i++;
  }
  return options.sort(() => Math.random() - 0.5);
}