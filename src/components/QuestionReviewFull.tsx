import { useState, useRef, useEffect } from 'react';
// motion removed - using CSS animations
import { ChevronLeft, Play, Pause, Star, StarOff, Check, X, Volume2, ChevronDown, ChevronUp, Mic, Moon, Sun } from 'lucide-react';
import { TestResult } from './HistorySection';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { loadRecordings } from '../utils/uploadRecording';
import { ToeflAiWidget } from './ToeflAiWidget';
import { UniversalAudioPlayer } from './UniversalAudioPlayer';
import { getQuestionRangeLabel } from '../utils/readingQuestionUtils';
import { ReadingReviewToolbar } from './ReadingReviewToolbar';
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
  passageText?: string;
  imageUrl?: string;
  audioUrl?: string;
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

function includesQuestionType(value: string | undefined, candidates: string[]) {
  const normalized = String(value || '').toLowerCase();
  return candidates.some(candidate => normalized.includes(candidate.toLowerCase()));
}

export function QuestionReviewFull({
  result,
  tpoTests = [],
  onBack,
  themeColor = '#005f61',
  initialSection,
  initialIndex = 0
}: QuestionReviewFullProps) {
  const [activeSection, setActiveSection] = useState<SectionTab>(initialSection || (result.category as SectionTab) || 'Reading');
  const [activeModule, setActiveModule] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const progressInterval = useRef<number | null>(null);
  const listeningAudioRef = useRef<HTMLAudioElement | null>(null);

  // Reading review — 하이라이트/밑줄/단어 뜻 팝업 도구 상태
  const [activeTool, setActiveTool] = useState<'highlight' | 'underline' | null>(null);
  const [activeColor, setActiveColor] = useState<string>('#fff3a3');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>(() => {
    return (localStorage.getItem('wordLookupLanguage') as 'en' | 'ko') || 'en';
  });
  const [popupData, setPopupData] = useState<{ word: string; context?: string; x: number; y: number } | null>(null);

  // Reading review — 하이라이트 저장/로드 (Supabase)
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const passageRef = useRef<HTMLDivElement | null>(null);

  // Speaking-specific state
  // Real recordings — load from DB (30-day retention) with sessionStorage fallback
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

  // Extract TPO number from test name and find test data
  const tpoNumber = (() => {
    const match = result.testName.match(/TPO\s+(\d+)/i);
    return match ? parseInt(match[1]) : null;
  })();
  
  // Find the matching test: by testNumber, or by exact testName match (covers Test/Training)
  const currentTPOTest = tpoTests.find((test: any) =>
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
    console.log('[Review] testName:', result.testName, '→ matched test:', currentTPOTest?.testName || currentTPOTest?.testNumber || 'NONE', '| tests available:', tpoTests.length);
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
  const currentSection = currentTPOTest?.sections?.find((s: any) => s.sectionType === activeSection);
  const passageText = currentSection?.passages?.[0]?.content || null;
  const readingCompleteWordsQuestions = (currentSection?.questions || []).filter((question: any) =>
    includesQuestionType(question?.questionType, ['Complete Words', 'Fill in the Blanks', 'Cloze Test'])
  );
  const readingCompleteWordsQuestion = activeSection === 'Reading'
    ? readingCompleteWordsQuestions[activeModule - 1] || readingCompleteWordsQuestions[0]
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
    const wrongIds = new Set(wrongQs.map(w => w.questionId));

    // Try to get real questions from CMS data — filtered by active module
    const isModule2Q = (q: any) => (q?.questionType || '').toLowerCase().includes('module 2');
    const isFillBlanksQ = (q: any) => {
      const t = (q?.questionType || '').toLowerCase();
      return t.includes('complete words') || t.includes('fill in the blank') || t.includes('cloze');
    };
    const allRealQuestions = currentSection?.questions || [];
    const realQuestions = activeSection === 'Reading' || activeSection === 'Listening'
      ? (activeModule === 2
          ? allRealQuestions.filter(isModule2Q)
          // Module 1 Reading: exclude FillBlanks (Q1-10) — they are shown separately in Complete Words review
          : allRealQuestions.filter((q: any) => !isModule2Q(q) && (activeSection !== 'Reading' || !isFillBlanksQ(q))))
      : allRealQuestions;
    
    // For Reading Module 1, realQuestions are Q11-Q20 (FillBlanks excluded above)
    const readingM1Offset = (activeSection === 'Reading' && activeModule === 1) ? 10 : 0;

    // Total = max(result total, CMS question count for this module) so all CMS questions show
    const cmsCount = realQuestions.length + readingM1Offset;
    const totalQ = Math.max(result.totalQuestions || 0, cmsCount);

    // 섹션 시도 여부: 이 섹션의 문제 범위에 wrongAnswer가 하나라도 있으면 시도한 것으로 간주.
    // 시도하지 않은 섹션의 문제는 "안 푼 문제" → 틀린 것으로 표시.
    const attemptedSection = (() => {
      const startQ = readingM1Offset + 1;
      const endQ = totalQ;
      return wrongQs.some(w => {
        const num = parseInt(w.questionId);
        return !isNaN(num) && num >= startQ && num <= endQ;
      });
    })();

    for (let i = 0; i < totalQ; i++) {
      const realQ = realQuestions[i - readingM1Offset];
      const qNum = i + 1;
      const wrong = wrongQs.find(w => w.questionId === String(qNum) || parseInt(w.questionId) === qNum);
      const isWrong = !!wrong;
      // 시도하지 않은 섹션의 문제는 정답이 아님 (안 푼 것 = 틀린 것)
      const isCorrect = !isWrong && attemptedSection;

      if (realQ) {
        // Use real CMS question data
        qs.push({
          id: realQ.id || `q-${i}`,
          number: qNum,
          text: realQ.questionText || realQ.text || `Question ${qNum}`,
          options: realQ.options || (wrong ? generateOptions(wrong.correctAnswer, wrong.userAnswer) : ['Option A', 'Option B', 'Option C', 'Option D']),
          userAnswer: isWrong ? (wrong?.userAnswer || '') : (realQ.correctAnswer || 'A'),
          correctAnswer: isWrong ? (wrong?.correctAnswer || realQ.correctAnswer || 'A') : (realQ.correctAnswer || 'A'),
          explanation: wrong?.explanation,
          isCorrect,
          hasAudio: activeSection === 'Listening',
          audioText: realQ.scriptText || realQ.audioText || undefined,
          scriptText: realQ.scriptText,
          audioUrl: realQ.audioUrl,
          passageText: realQ.passageText || passageText,
          imageUrl: realQ.imageUrl,
        });
      } else {
        // No CMS data — minimal placeholder. Wrong answers still show their detail below.
        qs.push({
          id: `correct-${i}`,
          number: i + 1,
          text: wrong?.questionText || `Question ${i + 1}`,
          options: wrong ? generateOptions(wrong.correctAnswer, wrong.userAnswer) : ['Option A', 'Option B', 'Option C', 'Option D'],
          userAnswer: wrong?.userAnswer || 'A',
          correctAnswer: wrong?.correctAnswer || 'A',
          isCorrect,
          hasAudio: activeSection === 'Listening',
          audioText: activeSection === 'Listening' ? 'Audio transcript for this question.' : undefined,
          passageText: passageText,
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
  const showReadingCompleteWordsReview = activeSection === 'Reading' && currentQuestionIndex < 10 && !!readingCompleteWordsConfig;

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

  // Reading review — 하이라이트/밑줄 모두 지우기
  const handleClearAllHighlights = async () => {
    setActiveTool(null);
    // DOM에서 <mark>, <u> 제거 (원래 텍스트로 복원)
    if (passageRef.current) {
      const marks = passageRef.current.querySelectorAll('mark, u');
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
    }
    // Supabase에서 삭제
    if (currentTestId && currentPassageKey) {
      await deleteAllHighlights(currentTestId, currentPassageKey);
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

      // Complete Words 시도 여부: wrongAnswers 중 하나라도 Q1-10 범위에 매칭되면 시도한 것
      const attemptedCompleteWords = result.wrongAnswers.some(w => {
        const id = w.questionId || '';
        const num = parseInt(id);
        return !isNaN(num) && num >= 1 && num <= 10
          || id === '1-10' || id.startsWith('blank-')
          || id.toLowerCase().includes('complete') || id.toLowerCase().includes('fill');
      });

      while ((match = regex.exec(normalizedPassage)) !== null) {
        const blankIndex = Number(match[1]);
        const blank = extractedBlanks[blankIndex];
        const beforeText = normalizedPassage.slice(lastIndex, match.index);

        if (beforeText) parts.push(<span key={`text-${key++}`}>{beforeText}</span>);
        if (blank) {
          // Find if user got this blank wrong — 다양한 questionId 포맷 매칭
          const blankNum = blankIndex + 1;
          const wrongEntry = result.wrongAnswers.find(w => {
            const id = (w.questionId || '').toLowerCase();
            return id === String(blankNum) || id === `blank-${blankNum}` || id === `q${blankNum}`
              || id === `reading-${blankNum}` || id === `complete-words-${blankNum}`
              || (id === '1-10' && w.userAnswer?.split(',')[blankIndex]);
          });
          const userAnswerForBlank = wrongEntry?.userAnswer?.split(',')?.[blankIndex]?.trim() || null;

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
                      : isCorrect
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
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

          </div>

          {/* Reading controls: Tools + toolbar + DarkMode — flex-nowrap으로 항상 인라인 유지 */}
          {activeSection === 'Reading' && (
            <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto max-w-[65vw]">
              {/* Tools 버튼 */}
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

              {/* 도구 모음 — Tools와 DarkMode 사이에 인라인 */}
              {toolsOpen && (
                <div className="shrink-0">
                  <ReadingReviewToolbar
                    activeTool={activeTool}
                    activeColor={activeColor}
                    onToolChange={handleToolChange}
                    onClearAll={handleClearAllHighlights}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                  />
                </div>
              )}

              {/* 다크 모드 토글 */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  darkMode
                    ? 'bg-gray-700 text-yellow-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={darkMode ? '라이트 모드' : '다크 모드'}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="hidden md:flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 shrink-0 absolute right-0">
            {activeSection !== 'Speaking' && activeSection !== 'Writing' && (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-lg">
                <span className="text-gray-500 text-sm">Score</span>
                <strong className="text-gray-900 dark:text-gray-100 text-sm">{correctCount}<span className="text-gray-400 font-normal">/{totalQuestions}</span></strong>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  correctCount/totalQuestions >= 0.8 ? 'bg-green-100 text-green-700' :
                  correctCount/totalQuestions >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>{Math.round(correctCount/totalQuestions*100)}%</span>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">{readingCompleteWordsQuestion ? getQuestionRangeLabel(readingCompleteWordsQuestion, 1) : 'Q1-Q10'}</p>
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
                    Reading Module {activeModule}의 1-10번은 TPO 기준 Complete Words 유형입니다. Review에서도 객관식이 아니라 빈칸 본문 형태로 표시되도록 맞췄습니다.
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
                      return displayBlanks.map((blank, index) => {
                        const wrongEntry = result.wrongAnswers.find(w =>
                          w.questionId === `blank-${index+1}`
                        );
                        const isCorrect = !wrongEntry;
                        const userAns = wrongEntry?.userAnswer || null;
                        return (
                          <div key={`answer-key-${index}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}>
                            <span className="text-gray-500">Blank {index + 1}</span>
                            <div className="flex items-center gap-2">
                              {!isCorrect && userAns && (
                                <span className="text-xs text-red-400 line-through">{userAns}</span>
                              )}
                              <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {blank.answer}
                              </span>
                              {isCorrect
                                ? <Check className="w-3.5 h-3.5 text-green-500" />
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
                    const readingM1Offset = activeModule === 1 ? 10 : 0;
                    const isFBQ = (q: any) => {
                      const t = (q?.questionType || '').toLowerCase();
                      return t.includes('complete words') || t.includes('fill in the blank') || t.includes('cloze');
                    };
                    const filteredCmsQuestions = (currentSection?.questions || []).filter((q: any) => !isFBQ(q));
                    const mappedCmsQ = filteredCmsQuestions[currentQuestionIndex - readingM1Offset];
                    const passageTitle = mappedCmsQ?.passageTitle || null;

                    // Parse JSON template if needed
                    const passageContent = parsePassageContent(rawPassage) || null;

                    return passageContent ? (
                      <>
                        {passageTitle && (
                          <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{passageTitle}</h4>
                        )}
                        <p className="text-sm md:text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{passageContent}</p>
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
              const realQ = (currentSection?.questions || [])[currentQuestionIndex];
              const transcript = realQ?.scriptText || realQ?.audioText || realQ?.transcript || currentQuestion?.audioText;
              const translation = realQ?.translation || realQ?.koreanTranslation;
              const keyWords: string[] = realQ?.keyWords || realQ?.vocabulary || [];
              const analysis = realQ?.analysis || realQ?.explanation || currentQuestion?.explanation;
              return (
                <div className="w-full md:w-1/2 order-1 md:order-none">
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 md:p-5 h-full overflow-y-auto">
                    {/* Listening Image (CMS) — full face visible */}
                    {currentQuestion?.imageUrl ? (
                      <div className="rounded-lg overflow-hidden mb-4 border border-gray-200 bg-white flex items-center justify-center" style={{ maxHeight: '320px' }}>
                        <img
                          src={currentQuestion.imageUrl}
                          alt="Listening question context"
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: '320px' }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg mb-4 border-2 border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-300 text-xs" style={{ height: '180px' }}>
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
                        />
                      </div>
                    ) : (
                      <div className="mb-3 text-xs text-gray-400 italic px-1">
                        CMS에 등록된 오디오가 없습니다.
                      </div>
                    )}

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
                    {currentQuestion?.options.map((option, idx) => {
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
                              ? 'bg-emerald-50 border-emerald-200'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <span className={`text-sm md:text-lg flex-1 ${
                            isCorrectAnswer
                              ? 'text-emerald-700 font-semibold'
                              : isUserAnswer && !currentQuestion.isCorrect
                              ? 'text-red-700 font-medium'
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
                    })}
                  </div>

                  {currentQuestion?.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-xs font-bold text-blue-800 mb-1">Explanation</p>
                      <p className="text-xs text-blue-700">{currentQuestion.explanation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                    {(() => {
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
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6 overflow-auto">
            {/* ---- Writing 1: Build a Sentence (Q1-Q10) ---- */}
            {activeModule === 1 && currentWritingBuildSentence && (
              <div className="w-full max-w-4xl mx-auto p-3 md:p-5">
                <div className="bg-white">
                  <h2 className="text-lg md:text-xl font-bold text-black dark:text-gray-100 mb-3 text-center">Make an appropriate sentence.</h2>

                  <div className="space-y-3 mt-2 px-1 md:px-4">
                    {/* Avatar 1 + prompt */}
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {currentWritingBuildSentence.avatar1ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar1ImageUrl} alt="Q" className="w-full h-full object-cover" />
                          : <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="text-base md:text-lg text-gray-800">{currentWritingBuildSentence.prompt}</div>
                    </div>

                    {/* Avatar 2 + word chips */}
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#1e6b73] flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        {currentWritingBuildSentence.avatar2ImageUrl
                          ? <img src={currentWritingBuildSentence.avatar2ImageUrl} alt="A" className="w-full h-full object-cover" />
                          : <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        }
                      </div>
                      <div className="flex-1">
                        {/* Word bank */}
                        <div className="flex flex-wrap gap-1.5">
                          {currentWritingBuildSentence.words.map((word, idx) => {
                            const isPrefilled = word.startsWith('[') && word.endsWith(']');
                            const display = word.replace(/^\[|\]$/g, '');
                            return isPrefilled
                              ? <span key={idx} className="text-lg font-medium text-gray-700">{display}</span>
                              : <span key={idx} className="px-3 py-1.5 border border-gray-300 rounded-lg text-lg text-gray-700 bg-gray-50">{display}</span>;
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
                            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-base font-medium text-emerald-800">
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
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
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
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all"
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
                <div className="md:w-2/5 p-3 md:p-5 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300">
                  <p className="text-sm md:text-base text-gray-800 leading-relaxed mb-3">
                    {cmsEmailQ?.emailScenario || 'A new poetry magazine has asked its readers for submissions, and you want to submit two of your poems. However, you had a problem using the online submission form, and you are not certain that your submissions were received.'}
                  </p>
                  <p className="text-sm md:text-base text-gray-800 font-bold mb-2">
                    {cmsEmailQ?.emailInstruction || 'Write an email to the editor of the magazine. In your email, do the following.'}
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {(Array.isArray(cmsEmailQ?.emailBullets) && cmsEmailQ.emailBullets.length
                      ? cmsEmailQ.emailBullets
                      : ['Tell the editor what you like about the new magazine.', 'Describe the problem you experienced.', 'Ask about the status of your submissions.']
                    ).map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-800">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm md:text-base text-gray-800">Write as much as you can and in complete sentences.</p>
                </div>
                {/* Right: Email response area */}
                <div className="md:w-3/5 p-3 md:p-5 overflow-auto bg-gray-50">
                  <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">Your Response:</h3>
                  <div className="mb-2 text-sm md:text-base text-gray-700">
                    <span className="font-bold">To:</span> {cmsEmailQ?.emailTo || 'editor@sunshinepoetymagazine.com'}
                  </div>
                  <div className="mb-3 text-sm md:text-base text-gray-700">
                    <span className="font-bold">Subject:</span> {cmsEmailQ?.emailSubject || 'Problem using submission form'}
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">내가 쓴 답안</p>
                  <div className={`bg-white border rounded-lg p-3 md:p-4 min-h-32 text-sm md:text-base whitespace-pre-wrap ${result.wrongAnswers[0]?.userAnswer ? 'text-gray-800 border-gray-300' : 'text-gray-400 italic border-gray-200'}`}>
                    {result.wrongAnswers[0]?.userAnswer || '작성한 답안이 저장되지 않았습니다.'}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">※ 이메일/토론 작문은 자유 서술형이라 자동 채점되지 않습니다.</p>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => toggleBookmark('writing-email')}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors"
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
                <div className="md:w-2/5 p-3 md:p-5 overflow-auto bg-white border-b md:border-b-0 md:border-r border-gray-300">
                  <p className="text-sm md:text-base text-gray-800 leading-relaxed mb-3 font-serif">
                    {cmsAcademicQ?.questionText || "Your professor is teaching a class. Write a post responding to the professor's question."}
                  </p>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-serif">In your response, you should do the following.</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-800 font-serif">Express and support your opinion.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-800 font-serif">Make a contribution to the discussion in your own words.</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm md:text-base text-gray-800 mb-4 font-serif">An effective response will contain at least 100 words.</p>
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex flex-col items-center mb-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#1e6b73] mb-1.5 bg-gray-100 flex items-center justify-center">
                        {cmsAcademicQ?.professorImageUrl ? (
                          <img src={cmsAcademicQ.professorImageUrl} alt="Professor" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <p className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100 font-serif">{cmsAcademicQ?.professorName || 'Professor'}</p>
                    </div>
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed font-serif">
                      {cmsAcademicQ?.professorMessage || cmsAcademicQ?.questionText || '(No professor message in CMS)'}
                    </p>
                  </div>
                </div>
                {/* Right: Student responses + user response */}
                <div className="md:w-3/5 p-3 md:p-5 overflow-auto bg-[#f8f7f3]">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2.5 rounded-2xl bg-white/80 p-3 shadow-sm border border-[#e7e3d7]">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b] bg-gray-100 flex items-center justify-center">
                        {cmsAcademicQ?.student1ImageUrl ? (
                          <img src={cmsAcademicQ.student1ImageUrl} alt="Student 1" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        {cmsAcademicQ?.student1Name && <p className="font-bold text-sm text-gray-700 font-serif mb-0.5">{cmsAcademicQ.student1Name}</p>}
                        <p className="text-sm md:text-base text-gray-800 leading-relaxed font-serif">
                          {cmsAcademicQ?.student1Message || '(No student 1 message in CMS)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-2xl bg-white/80 p-3 shadow-sm border border-[#e7e3d7]">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#c9b99b] bg-gray-100 flex items-center justify-center">
                        {cmsAcademicQ?.student2ImageUrl ? (
                          <img src={cmsAcademicQ.student2ImageUrl} alt="Student 2" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        )}
                      </div>
                      <div className="flex-1">
                        {cmsAcademicQ?.student2Name && <p className="font-bold text-sm text-gray-700 font-serif mb-0.5">{cmsAcademicQ.student2Name}</p>}
                        <p className="text-sm md:text-base text-gray-800 leading-relaxed font-serif">
                          {cmsAcademicQ?.student2Message || '(No student 2 message in CMS)'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-[#ddd4c4]">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 font-serif">Your Response:</h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">내가 쓴 답안</p>
                    <div className={`border rounded-xl p-3 md:p-4 min-h-32 text-sm md:text-base whitespace-pre-wrap font-serif ${result.wrongAnswers[1]?.userAnswer ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-gray-50 text-gray-400 italic border-gray-200'}`}>
                      {result.wrongAnswers[1]?.userAnswer || '작성한 답안이 저장되지 않았습니다.'}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">※ 토론 작문은 자유 서술형이라 자동 채점되지 않습니다.</p>
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => toggleBookmark('writing-discussion')}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors"
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
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {speakingQuestionCount}
                </p>
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: themeColor }}>
                  {currentSpeakingQ.taskGroup}
                </span>
              </div>

              {/* Prompt */}
              <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 mb-2">Prompt</p>
                <p className="text-base md:text-lg text-gray-900 dark:text-gray-100 leading-relaxed font-medium">{currentSpeakingQ.prompt}</p>
              </div>

              {/* Reference image + question audio (실제 시험 화면 구조) */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-3">
                <div className="flex justify-center mb-3">
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl border-2 border-gray-300 bg-white overflow-hidden flex items-center justify-center">
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
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showModelText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showModelText ? 'Hide Script' : 'View Script'}</span>
                  </button>
                  {showModelText && currentSpeakingQ.transcript && (
                    <p className="text-sm text-gray-700 leading-relaxed mt-2 p-3 bg-white rounded-lg border border-gray-200 animate-[fadeIn_0.2s_ease-out]">
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
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                        My Recording — Q{qNum}
                      </span>
                    </div>
                    {recUrl ? (
                      <AudioPlayer src={recUrl} qNum={qNum} />
                    ) : (
                      <p className="text-xs text-gray-400 italic">
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
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-yellow-500 transition-colors"
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
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
      <div className="border-t border-gray-200 px-4 py-2 text-center text-xs text-gray-400 shrink-0">
        © {new Date().getFullYear()} TOEFL TPO Practice Platform. All Rights Reserved.
      </div>

      {/* AI 튜터 위젯 — History 리뷰 결과 화면. 우측 하단 FAB + 슬라이드인 팝업 */}
      <ToeflAiWidget
        position="right"
        zIndex={60}
        contextLabel={`Review · ${activeSection} (Q${currentQuestionIndex + 1})`}
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