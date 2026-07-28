import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Bot, ClipboardList, FileText, Languages, Lightbulb, MessageSquareText, Mic, Pause, Play, Pin, PinOff, Repeat, Sparkles, Volume2, X, type LucideIcon } from 'lucide-react';
import { createCachedAudioSync } from '../utils/mediaCache';
import { WrongNotesManager } from './WrongNotesManager';

export type ReviewSection = 'Reading' | 'Listening' | 'Writing' | 'Speaking';
export type ReviewVariant = 'reading' | 'listening' | 'writing-basic' | 'writing-guided' | 'speaking-repeat' | 'speaking-interview';
export type ReviewDifficulty = '쉬움' | '보통' | '어려움';

export interface ReviewPatternTrainingRequest {
  title: string;
  questionType?: string;
  difficulty?: ReviewDifficulty;
}

interface ReviewAssistantPanelProps {
  section: ReviewSection;
  variant: ReviewVariant;
  contentKey: string;
  questionType?: string;
  currentDifficulty?: ReviewDifficulty;
  onStartTraining: (request: ReviewPatternTrainingRequest) => void;
  /** AI 튜터 패널 열기 (오른쪽 통합 아이콘 바의 AI 버튼) */
  onOpenAiTutor?: () => void;
  // CMS question data for Translation, Analysis, Key Words
  translationNote?: string;
  analysisNote?: string;
  vocabularyNote?: string;
  /** Play Audio용 — 현재 문제의 오디오 URL (리스닝/스피킹) */
  audioUrl?: string;
  /** Dictation용 — CMS 스크립트/전사본 텍스트 */
  scriptText?: string;
  /** 문장별 타임스탬프 (초 단위) — CMS에 입력되면 정확한 오디오-텍스트 싱크.
   *  없으면 글자 수 비율로 근사 (기존 동작 유지) */
  sentenceTimestamps?: { start: number; end: number }[];
}

interface DictationExercise {
  prompt: string;
  fullSentence: string;
  blanks: string[];
  segments: string[];
}

const TAB_CONFIG: Record<ReviewVariant, string[]> = {
  reading: [],
  listening: ['Dictation'],
  'writing-basic': [],
  'writing-guided': [],
  'speaking-repeat': ['Dictation'],
  'speaking-interview': [],
};

const PANEL_THEME: Record<ReviewSection, { accent: string; soft: string; border: string }> = {
  Reading: { accent: '#1d6f73', soft: '#edf7f6', border: '#b9dedd' },
  Listening: { accent: '#2563eb', soft: '#eef4ff', border: '#c7d8ff' },
  Writing: { accent: '#d97706', soft: '#fff6e7', border: '#f5d7aa' },
  Speaking: { accent: '#7c3aed', soft: '#f4efff', border: '#d9c9ff' },
};

const TAB_META: Record<string, { icon: LucideIcon; title: string; description: string }> = {
  Dictation: {
    icon: Volume2,
    title: 'Dictation Training',
    description: 'Listen to the audio and fill in the blanks to review key expressions.',
  },
  Translation: {
    icon: Languages,
    title: 'Translation',
    description: 'Quickly grasp key sentences and logical flow with organized translations.',
  },
  Analysis: {
    icon: FileText,
    title: 'Question Analysis',
    description: 'Review answer criteria and approach strategies clearly and concisely.',
  },
  'Key Words': {
    icon: Sparkles,
    title: 'Key Words',
    description: 'Essential vocabulary from the current question, ready to use.',
  },
  Practice: {
    icon: ClipboardList,
    title: 'Question Practice',
    description: 'Practice real exam questions of the same type.',
  },
};

function buildDictationExercise(variant: ReviewVariant, cmsScript?: string): DictationExercise {
  if (cmsScript) {
    const allLines = cmsScript.split('\n').map(l => l.trim()).filter(Boolean);
    const narratorPattern = /^Narrator\s*:/i;

    // Narrator 안내문 제외, 나머지 전체 줄 유지
    const cleanLines = allLines.filter(l => !narratorPattern.test(l) && l.trim());
    if (cleanLines.length === 0) return buildFallbackDictation(variant);

    // 전체 스크립트를 하나의 문자열로 (fullSentence = TTS용)
    const fullScript = cleanLines.join(' ');

    // 빈칸 대상 단어 수집: 화자 레이블 첫 단어 제외, 3글자 이상 내용어
    const contentWords: { lineIdx: number; wordIdx: number; word: string }[] = [];
    cleanLines.forEach((line, lineIdx) => {
      const words = line.split(/\s+/);
      words.forEach((w, wordIdx) => {
        const isLabel = wordIdx === 0 && /^\w+:$/.test(w);
        const clean = w.replace(/[^a-zA-Z\'\-]/g, '');
        if (!isLabel && clean.length >= 3) {
          contentWords.push({ lineIdx, wordIdx, word: w });
        }
      });
    });

    // 전체 내용어 수에 비례해 빈칸 개수 결정 (최소 3, 최대 8)
    const totalBlanks = Math.min(Math.max(3, Math.floor(contentWords.length / 6)), 8);
    const step = Math.max(1, Math.floor(contentWords.length / totalBlanks));
    const selectedBlanks: typeof contentWords = [];
    for (let i = Math.floor(step / 2); i < contentWords.length && selectedBlanks.length < totalBlanks; i += step) {
      selectedBlanks.push(contentWords[i]);
    }

    const blankSet = new Set(selectedBlanks.map(b => `${b.lineIdx}-${b.wordIdx}`));
    const blanks = selectedBlanks.map(b => b.word);

    // segments 생성: 전체 스크립트를 순회하며 빈칸 위치에 segment 경계 삽입
    const segments: string[] = [];
    let currentSegment = '';
    let blankCount = 0;

    cleanLines.forEach((line, lineIdx) => {
      const words = line.split(/\s+/);
      if (lineIdx > 0) currentSegment += '\n';
      words.forEach((word, wordIdx) => {
        const key = `${lineIdx}-${wordIdx}`;
        if (blankSet.has(key) && blankCount < blanks.length) {
          segments.push(currentSegment);
          currentSegment = '';
          blankCount++;
        } else {
          if (wordIdx > 0 || (lineIdx > 0 && wordIdx === 0)) {
            // 줄 첫 단어는 앞에 공백 없이 (\n으로 이미 구분됨), 그 외엔 공백
            if (!(wordIdx === 0 && lineIdx > 0)) currentSegment += ' ';
          }
          currentSegment += word;
        }
      });
    });
    segments.push(currentSegment);

    return {
      prompt: '전체 스크립트를 보며 빈칸에 알맞은 단어를 입력하세요.',
      fullSentence: fullScript,
      blanks,
      segments,
    };
  }

  return buildFallbackDictation(variant);
}
/** CMS 스크립트 없을 때 사용하는 기본값 */
function buildFallbackDictation(variant: ReviewVariant): DictationExercise {
  if (variant === 'speaking-repeat') {
    return {
      prompt: '음성 아이콘을 누르고, 들리는 문장을 빈칸에 입력하세요.',
      fullSentence: 'Please welcome the visitors and guide them to the main hall.',
      blanks: ['welcome', 'guide', 'main'],
      segments: ['Please ', ' the visitors and ', ' them to the ', ' hall.'],
    };
  }
  return {
    prompt: '음성 아이콘을 누르고, 들리는 내용을 받아쓰세요.',
    fullSentence: 'The orientation session starts at nine and students should bring their ID cards.',
    blanks: ['orientation', 'starts', 'students'],
    segments: ['The ', ' session ', ' at nine and ', ' should bring their ID cards.'],
  };
}

/** 스크립트를 문장 단위로 분할 — 마침표/물음표/느낌표 + 줄바꿈 기준.
 *  문장별 TTS 재생·반복·클릭 이동에 사용 */
function splitIntoSentences(script: string): string[] {
  if (!script) return [];
  // Narrator: 같은 안내 줄 제거
  const lines = script.split('\n').map(l => l.trim()).filter(l => l && !/^Narrator\s*:/i.test(l));
  const joined = lines.join(' ');
  // 문장 종결 부호 기준 분할 (종결 부호를 문장에 붙여서 유지)
  const raw = joined.match(/[^.!?]+[.!?]+["']?\s*/g) || [joined];
  return raw.map(s => s.trim()).filter(s => s.length > 1);
}

/** 오답 노트 — 틀린 빈칸 단어를 localStorage에 저장해 재학습 가능하게 */
const WRONG_NOTE_KEY = 'dictation_wrong_notes';
interface WrongNoteEntry { word: string; sentence: string; savedAt: number; contentKey: string; }

function loadWrongNotes(): WrongNoteEntry[] {
  try {
    return JSON.parse(localStorage.getItem(WRONG_NOTE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWrongNotes(entries: Omit<WrongNoteEntry, 'savedAt'>[]) {
  if (!entries.length) return;
  const existing = loadWrongNotes();
  const now = Date.now();
  const merged = [...existing];
  entries.forEach(e => {
    // 같은 단어+문장 조합은 중복 저장하지 않고 최신으로 갱신
    const idx = merged.findIndex(m => m.word === e.word && m.sentence === e.sentence);
    if (idx >= 0) merged[idx] = { ...e, savedAt: now };
    else merged.push({ ...e, savedAt: now });
  });
  // 최대 200개 유지
  localStorage.setItem(WRONG_NOTE_KEY, JSON.stringify(merged.slice(-200)));
}

function getWords(section: ReviewSection, variant: ReviewVariant) {
  if (section === 'Reading') {
    return [
      { word: 'attribute', meaning: '원인을 ~의 탓으로 돌리다' },
      { word: 'notion', meaning: '개념, 생각' },
      { word: 'subsequent', meaning: '그 다음의' },
      { word: 'crucial', meaning: '매우 중요한' },
    ];
  }

  if (variant === 'speaking-repeat') {
    return [
      { word: 'escort', meaning: '안내하다, 동행하다' },
      { word: 'entrance', meaning: '입구' },
      { word: 'schedule', meaning: '일정' },
      { word: 'proceed', meaning: '진행하다, 나아가다' },
    ];
  }

  return [
    { word: 'clarify', meaning: '명확히 하다' },
    { word: 'concern', meaning: '우려, 걱정' },
    { word: 'proposal', meaning: '제안' },
    { word: 'convincing', meaning: '설득력 있는' },
  ];
}

function getAnalysisLines(variant: ReviewVariant) {
  if (variant === 'writing-guided') {
    return [
      '문제가 요구하는 입장과 근거 수를 먼저 확인합니다.',
      '도입 1문장, 근거 2개, 마무리 1문장 구조로 빠르게 잡습니다.',
      '읽기/듣기 또는 제시문과 직접 연결되는 핵심만 남기고 군더더기를 줄입니다.',
    ];
  }

  return [
    '질문 의도와 화자의 목적을 먼저 파악합니다.',
    '답변은 결론을 먼저 말하고 이유나 예시를 뒤에 붙이는 구조가 안정적입니다.',
    '제한 시간 안에서는 새로운 아이디어보다 명확한 구조가 더 중요합니다.',
  ];
}



function getTrainingTitle(section: ReviewSection, variant: ReviewVariant) {
  if (section === 'Reading') return 'Reading 유형문제 Training';
  if (section === 'Listening') return 'Listening 유형문제 Training';
  if (variant === 'writing-guided') return 'Writing 1/2, 2/2 유형문제 Training';
  if (variant === 'writing-basic') return 'Writing 유형문제 Training';
  if (variant === 'speaking-interview') return 'Take an Interview 유형문제 Training';
  return 'Listen and Speak 유형문제 Training';
}


function getTabMeta(tab: string) {
  return TAB_META[tab] ?? {
    icon: Sparkles,
    title: tab,
    description: `${tab} 내용을 확인할 수 있습니다.`,
  };
}

export function ReviewAssistantPanel({ section, variant, contentKey, questionType, currentDifficulty, onStartTraining, onOpenAiTutor, translationNote, analysisNote, vocabularyNote, audioUrl, scriptText, sentenceTimestamps }: ReviewAssistantPanelProps) {
  const tabs = TAB_CONFIG[variant];
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [dictationInputs, setDictationInputs] = useState<string[]>([]);
  const [dictationChecked, setDictationChecked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDictationPlaying, setIsDictationPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Dictation 전용 오디오 — Play Audio(audioRef)와 분리해 서로 덮어쓰지 않도록
  const dictationAudioRef = useRef<HTMLAudioElement | null>(null);
  const dictationInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const theme = PANEL_THEME[section];

  // ── 패널 고정(pinned) — 중앙 모달 팝업으로 띄워 리뷰 화면과 동시 사용 ──
  // 핀 클릭 시 화면 중앙에 트렌디한 모달창으로 팝업, 드래그 이동 + 우하단 핸들로 크기 조절 가능
  // 모바일 대응: 화면 폭에 따라 기본 사이즈 자동 조정 (작은 화면에서는 거의 풀스크린)
  const getDefaultPanelSize = () => {
    if (typeof window === 'undefined') return { width: 760, height: 600 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (vw < 640) return { width: Math.min(760, vw * 0.92), height: Math.min(600, vh * 0.85) };
    return { width: 760, height: 600 };
  };
  const [panelPinned, setPanelPinned] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [panelSize, setPanelSize] = useState(getDefaultPanelSize);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // ── Dictation 학습 상태 ──
  // 모드 분리: 훈련(빈칸 받아쓰기) vs 복습(풀 스크립트 + 하이라이트 싱크)
  const [dictationMode, setDictationMode] = useState<'training' | 'review'>('training');
  const [showWrongNotes, setShowWrongNotes] = useState(false); // 오답 노트 조회 토글
  const [showWrongNotesManager, setShowWrongNotesManager] = useState(false); // 오답 노트 통합 관리 모달
  const [wrongNoteFilter, setWrongNoteFilter] = useState<'this' | 'all'>('this'); // 오답 노트 필터
  const [wrongNotesVersion, setWrongNotesVersion] = useState(0); // 오답 노트 변경 시 재렌더링 트리거 (삭제 후 즉시 반영)
  const [showTranslation, setShowTranslation] = useState(false); // 복습 모드 한글 번역 토글
  const [showSentences, setShowSentences] = useState(false); // 훈련 모드에서 문장별 듣기 목록 표시
  // 4단계 프레임워크 1단계(무자막 정취) 지원 — 스크립트 블러 토글
  const [scriptBlur, setScriptBlur] = useState(false);
  // 복습 모드 Key Words 사이드바 토글 — 스크립트 옆에 핵심 어휘를 나란히 표시
  const [showKeyWordsSidebar, setShowKeyWordsSidebar] = useState(false);
  // 문장 자동 정지 모드 — 한 문장 재생 후 자동 일시정지, "다음 문장" 버튼으로 진행 (1·2단계 집중 훈련)
  const [autoStopMode, setAutoStopMode] = useState(false);
  const [autoStopIdx, setAutoStopIdx] = useState<number | null>(null); // 자동 정지된 문장 인덱스
  // 쉐도잉 녹음 — 복습 모드에서 사용자 음성 녹음 후 원본과 비교
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number | null>(null); // 현재 재생 중인 문장
  const [loopSentenceIdx, setLoopSentenceIdx] = useState<number | null>(null); // 구간 반복 대상 문장
  const [hintIndices, setHintIndices] = useState<Set<number>>(new Set()); // 첫 글자 힌트를 연 빈칸
  const [wrongAttempts, setWrongAttempts] = useState(0); // 정답 확인 후 틀린 횟수 (3회 이상 시 힌트 권유)
  const sentenceUtterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const loopActiveRef = useRef(false);
  const loopSentenceIdxRef = useRef<number | null>(null); // ontimeupdate 클로저에서 최신 반복 문장 참조용
  const fullPlayActiveRef = useRef(false); // TTS 전체 듣기 순차 재생 중 여부
  const sentenceListRef = useRef<HTMLDivElement | null>(null); // 문장 목록 스크롤 컨테이너

  const dictationExercise = useMemo(() => buildDictationExercise(variant, scriptText || translationNote), [variant, scriptText, translationNote]);
  const dictationSentences = useMemo(() => splitIntoSentences(scriptText || translationNote || ''), [scriptText, translationNote]);
  // 한국어 번역 문장 분할 — translationNote를 한국어 문장 단위로 쪼개 영어 문장과 인덱스 매칭
  // (정확한 1:1 매칭이 안 될 수 있으나, 전체 번역이 있으면 문장별 표시에 활용)
  const translationSentences = useMemo(() => {
    if (!translationNote) return [];
    // 한국어 종결 부호 + 줄바꿈 기준 분할
    const raw = translationNote.match(/[^.!?。。\n]+[.!?。。]?\s*/g) || [translationNote];
    return raw.map(s => s.trim()).filter(s => s.length > 0);
  }, [translationNote]);
  // 문장 시작 비율 — CMS 오디오 전체 재생 시 하이라이트 싱크 + 문장 클릭 seek 추정용
  // sentenceTimestamps(CMS 타임스탬프)가 있으면 정확히 사용, 없으면 글자 수 비율로 근사
  // 주의: 타임스탬프 개수가 문장 수와 정확히 일치할 때만 사용 — 부분 입력 시 매칭 어긋남 방지
  const effectiveTimestamps = (sentenceTimestamps && sentenceTimestamps.length > 0 && sentenceTimestamps.length === dictationSentences.length)
    ? sentenceTimestamps
    : null;
  const sentenceRatios = useMemo(() => {
    if (effectiveTimestamps) {
      const totalDuration = effectiveTimestamps[effectiveTimestamps.length - 1]?.end || 1;
      return effectiveTimestamps.map(t => (t.start || 0) / totalDuration);
    }
    const total = dictationSentences.reduce((acc, s) => acc + s.length, 0);
    let acc = 0;
    return dictationSentences.map(s => {
      const start = total > 0 ? acc / total : 0;
      acc += s.length;
      return start;
    });
  }, [dictationSentences, effectiveTimestamps]);
  const wordList = useMemo(() => getWords(section, variant), [section, variant]);
  const activeTabMeta = activeTab ? getTabMeta(activeTab) : null;

  // state + ref 동기화 — 오디오 이벤트 핸들러 클로저에서도 최신 반복 문장 참조
  const updateLoopSentence = (idx: number | null) => {
    loopSentenceIdxRef.current = idx;
    setLoopSentenceIdx(idx);
  };

  useEffect(() => {
    setActiveTab(null);
    setPanelPinned(false);
    setDictationInputs(Array(dictationExercise.blanks.length).fill(''));
    setDictationChecked(false);
    setHintIndices(new Set());
    setWrongAttempts(0);
    setActiveSentenceIdx(null);
    updateLoopSentence(null);
    setShowSentences(false);
    setDictationMode('training');
    setShowWrongNotes(false);
    setShowTranslation(false);
    setWrongNoteFilter('this');
    setAutoStopMode(false);
    setAutoStopIdx(null);
    setScriptBlur(false);
    setShowKeyWordsSidebar(false);
    // 녹음 중이면 정리
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
  }, [contentKey, dictationExercise.blanks.length, tabs]);

  // ── audioUrl 변경 시 기존 오디오 정리 — 문제 바뀌면 이전 오디오가 재생되지 않도록 ──
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
  }, [audioUrl, contentKey]);

  // ── 패널 드래그 (고정 모드) — 모달 헤더를 잡고 화면 내 이동 ──
  const onPanelDragStart = (e: React.MouseEvent) => {
    if (!panelPinned) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: panelPos.x, origY: panelPos.y };
    e.preventDefault();
  };

  // ── 패널 리사이즈 (고정 모드) — 우하단 핸들을 드래그해 크기 조절 ──
  const onPanelResizeStart = (e: React.MouseEvent) => {
    if (!panelPinned) return;
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: panelSize.width, origH: panelSize.height };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!panelPinned) return;
    const onMove = (e: MouseEvent) => {
      // 드래그 이동
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPanelPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
      }
      // 리사이즈 — 최소 480×400, 최대 뷰포트의 92%
      if (resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const maxW = Math.max(480, window.innerWidth * 0.92);
        const maxH = Math.max(400, window.innerHeight * 0.92);
        const newW = Math.min(Math.max(resizeRef.current.origW + dx, 480), maxW);
        const newH = Math.min(Math.max(resizeRef.current.origH + dy, 400), maxH);
        setPanelSize({ width: newW, height: newH });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [panelPinned]);

  // Play/Pause Audio — Listening/Speaking 섹션의 오디오 재생/일시정지 (토글)
  const handlePlayAudio = () => {
    if (!audioUrl) return;

    if (isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (audioRef.current) {
      // Resume from wherever it was paused — do NOT reset currentTime
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    } else {
      const audio = createCachedAudioSync(audioUrl);
      audioRef.current = audio;
      audio.play().then(() => setIsPlayingAudio(true)).catch(() => {});
      audio.onended = () => setIsPlayingAudio(false);
      audio.onpause = () => setIsPlayingAudio(false);
    }
  };

  // ── Dictation 전체 듣기 — CMS 오디오는 pause/resume 토글 (멈춘 지점부터 이어 재생),
  //    TTS fallback은 문장 단위 순차 재생 + 현재 문장 하이라이트, pause/resume 지원 ──
  const playDictation = () => {
    if (isDictationPlaying) {
      // 일시정지 (TTS + 오디오 모두) — 다시 누륩면 이어서 재생
      if (window.speechSynthesis?.speaking) window.speechSynthesis.pause();
      dictationAudioRef.current?.pause();
      setIsDictationPlaying(false);
      return;
    }

    if (audioUrl) {
      // CMS 실제 오디오 — 이전에 일시정지한 오디오가 있으면 이어서 재생
      if (dictationAudioRef.current && dictationAudioRef.current.paused && dictationAudioRef.current.currentTime > 0) {
        dictationAudioRef.current.play().then(() => setIsDictationPlaying(true)).catch(() => setIsDictationPlaying(false));
        return;
      }
      const audio = createCachedAudioSync(audioUrl);
      dictationAudioRef.current = audio;
      setIsDictationPlaying(true);
      setShowSentences(true); // 전체 듣기 시 문장 목록 자동 표시 (하이라이트 싱크 확인용)
      audio.play().catch(() => setIsDictationPlaying(false));
      // 재생 위치 → 현재 문장 하이라이트 싱크 (글자 수 비율 근사)
      audio.ontimeupdate = () => {
        const duration = audio.duration || 0;
        if (!duration) return;
        const ratio = audio.currentTime / duration;
        // 구간 반복 활성 시 반복 문장 끝에 도달하면 다시 해당 문장 시작으로
        const loopIdx = loopSentenceIdxRef.current;
        if (loopIdx !== null) {
          const loopStart = sentenceRatios[loopIdx] ?? 0;
          const loopEnd = sentenceRatios[loopIdx + 1] ?? 1;
          if (ratio >= loopEnd || ratio < loopStart) {
            audio.currentTime = loopStart * duration;
            setActiveSentenceIdx(loopIdx);
            return;
          }
        }
        let idx = 0;
        for (let i = 0; i < sentenceRatios.length; i++) {
          if (sentenceRatios[i] <= ratio) idx = i; else break;
        }
        setActiveSentenceIdx(idx);
      };
      audio.onended = () => { setIsDictationPlaying(false); setActiveSentenceIdx(null); updateLoopSentence(null); };
      audio.onpause = () => setIsDictationPlaying(false);
      return;
    }

    // TTS fallback — CMS 오디오 없을 때 (일시정지 상태면 resume)
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsDictationPlaying(true);
      return;
    }
    // 문장 자동 정지 모드 — 첫 문장 또는 이어서
    if (autoStopMode) {
      playAutoStop(autoStopIdx !== null ? Math.min(autoStopIdx + 1, dictationSentences.length - 1) : 0);
      return;
    }
    playAllSentences(0);
  };

  // ── TTS 전체 듣기 — 문장 단위 순차 재생 + 현재 문장 하이라이트.
  //    startIdx부터 끝까지 읽음. 문장 클릭으로 중간 점프 가능 ──
  const playAllSentences = (startIdx: number) => {
    if (!('speechSynthesis' in window) || dictationSentences.length === 0) return;
    window.speechSynthesis.cancel();
    loopActiveRef.current = false;
    updateLoopSentence(null);
    fullPlayActiveRef.current = true;
    setIsDictationPlaying(true);
    setShowSentences(true);

    const speakNext = (i: number) => {
      if (!fullPlayActiveRef.current || i >= dictationSentences.length) {
        fullPlayActiveRef.current = false;
        setIsDictationPlaying(false);
        setActiveSentenceIdx(null);
        return;
      }
      setActiveSentenceIdx(i);
      const utterance = new SpeechSynthesisUtterance(dictationSentences[i]);
      utterance.rate = 0.82;
      utterance.lang = 'en-US';
      utterance.onend = () => speakNext(i + 1);
      utterance.onerror = () => {
        fullPlayActiveRef.current = false;
        setIsDictationPlaying(false);
        setActiveSentenceIdx(null);
      };
      sentenceUtterRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };
    speakNext(startIdx);
  };

  // ── 문장 클릭 — CMS 오디오: 해당 문장 위치로 seek(추정) 후 이어서 재생,
  //    TTS 전체 재생 중: 그 문장부터 다시 순차 재생, 그 외: 그 문장만 재생 ──
  const handleSentenceClick = (idx: number) => {
    if (audioUrl) {
      // 오디오 없이 처음 클릭 → 전체 재생을 그 문장부터 시작
      if (!dictationAudioRef.current) {
        playDictation();
        return;
      }
      const audio = dictationAudioRef.current;
      const duration = audio.duration || 0;
      // CMS 타임스탬프가 있으면 직접 사용 (정확), 없으면 글자 수 비율 추정
      if (sentenceTimestamps && sentenceTimestamps[idx]) {
        audio.currentTime = sentenceTimestamps[idx].start;
      } else if (duration) {
        audio.currentTime = (sentenceRatios[idx] ?? 0) * duration;
      }
      setActiveSentenceIdx(idx);
      updateLoopSentence(null);
      audio.play().then(() => setIsDictationPlaying(true)).catch(() => {});
      return;
    }
    if (fullPlayActiveRef.current) {
      playAllSentences(idx);
      return;
    }
    playSentence(idx);
  };

  // ── 문장별 TTS 재생 — 해당 문장만 읽기. loop=true면 무한 구간 반복 ──
  const playSentence = (idx: number, loop = false) => {
    const sentence = dictationSentences[idx];
    if (!sentence) return;

    // CMS 오디오 모드 — 구간 반복 토글: ontimeupdate에서 해당 문장 구간만 반복
    if (audioUrl) {
      if (loop) {
        if (loopSentenceIdx === idx) {
          updateLoopSentence(null); // 반복 해제
          return;
        }
        updateLoopSentence(idx);
        // 오디오가 없으면 전체 재생 시작 후 반복 구간 적용
        if (!dictationAudioRef.current) { playDictation(); return; }
        const audio = dictationAudioRef.current;
        // CMS 타임스탬프가 있으면 직접 사용, 없으면 글자 수 비율
        if (sentenceTimestamps && sentenceTimestamps[idx]) {
          audio.currentTime = sentenceTimestamps[idx].start;
        } else {
          const duration = audio.duration || 0;
          if (duration) audio.currentTime = (sentenceRatios[idx] ?? 0) * duration;
        }
        setActiveSentenceIdx(idx);
        audio.play().then(() => setIsDictationPlaying(true)).catch(() => {});
        return;
      }
      handleSentenceClick(idx);
      return;
    }

    if (!('speechSynthesis' in window)) return;

    // 같은 문장 재생 중 다시 누륨 → 정지
    if (activeSentenceIdx === idx && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      fullPlayActiveRef.current = false;
      loopActiveRef.current = false;
      setActiveSentenceIdx(null);
      setIsDictationPlaying(false);
      if (loop) updateLoopSentence(null);
      return;
    }

    window.speechSynthesis.cancel();
    fullPlayActiveRef.current = false; // 단일 문장 재생 시 전체 재생 모드 해제
    setIsDictationPlaying(false);
    loopActiveRef.current = loop;
    if (loop) updateLoopSentence(idx); else updateLoopSentence(null);
    setActiveSentenceIdx(idx);

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.82;
      utterance.lang = 'en-US';
      utterance.onend = () => {
        // 구간 반복 활성 시 같은 문장 다시 재생
        if (loopActiveRef.current) {
          speak();
        } else {
          setActiveSentenceIdx(null);
        }
      };
      utterance.onerror = () => { loopActiveRef.current = false; setActiveSentenceIdx(null); updateLoopSentence(null); };
      sentenceUtterRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };
    speak();
  };

  // ── 문장 자동 정지 모드 — 한 문장 재생 후 자동 일시정지, "다음 문장" 버튼으로 진행 ──
  const playAutoStop = (idx: number) => {
    if (!('speechSynthesis' in window)) return;
    const sentence = dictationSentences[idx];
    if (!sentence) return;
    window.speechSynthesis.cancel();
    fullPlayActiveRef.current = false;
    loopActiveRef.current = false;
    updateLoopSentence(null);
    setIsDictationPlaying(true);
    setActiveSentenceIdx(idx);
    setAutoStopIdx(null);
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = 0.82;
    utterance.lang = 'en-US';
    utterance.onend = () => {
      setActiveSentenceIdx(null);
      setAutoStopIdx(idx); // "다음 문장" 버튼 표시
      setIsDictationPlaying(false);
    };
    utterance.onerror = () => { setActiveSentenceIdx(null); setAutoStopIdx(null); setIsDictationPlaying(false); };
    sentenceUtterRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // ── 쉐도잉 녹음 — MediaRecorder로 마이크 녹음 후 재생/삭제 ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      alert('마이크 접근 권한이 필요합니다. 브라우저 설정을 확인하세요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const deleteRecording = () => {
    stopRecording();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
  };

  // 탭이 바뀌거나 문제가 바뀌면 TTS + 오디오 정지
  useEffect(() => {
    window.speechSynthesis?.cancel();
    fullPlayActiveRef.current = false;
    loopActiveRef.current = false;
    setIsDictationPlaying(false);
    setActiveSentenceIdx(null);
    if (dictationAudioRef.current) {
      dictationAudioRef.current.pause();
      dictationAudioRef.current = null;
    }
    return () => { window.speechSynthesis?.cancel(); };
  }, [contentKey]);

  // 재생 중인 문장이 목록에서 보이도록 자동 스크롤
  useEffect(() => {
    if (activeSentenceIdx === null || !sentenceListRef.current) return;
    sentenceListRef.current
      .querySelector(`[data-sentence-idx="${activeSentenceIdx}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeSentenceIdx]);

  const normalizeDictationValue = (value: string) =>
    value.trim().toLowerCase().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ');

  const isDictationCorrect = (index: number) => normalizeDictationValue(dictationInputs[index] || '') === normalizeDictationValue(dictationExercise.blanks[index] || '');

  // 정답 확인 — 틀린 빈칸은 오답 노트에 저장 + 틀린 횟수 추적 (3회 이상 시 힌트 권유)
  const handleCheckDictation = () => {
    setDictationChecked(true);
    const wrongEntries: { word: string; sentence: string; contentKey: string }[] = [];
    let wrongCount = 0;
    dictationExercise.blanks.forEach((blank, i) => {
      if (!isDictationCorrect(i)) {
        wrongCount++;
        // 틀린 단어가 포함된 문장 찾기
        const sentence = dictationSentences.find(s => s.toLowerCase().includes(blank.toLowerCase())) || dictationExercise.fullSentence.slice(0, 120);
        wrongEntries.push({ word: blank, sentence, contentKey });
      }
    });
    if (wrongEntries.length > 0) {
      saveWrongNotes(wrongEntries);
      setWrongAttempts(prev => prev + 1);
      setWrongNotesVersion(v => v + 1); // 복습 모드 오답 카운트 즉시 갱신
    } else {
      setWrongAttempts(0);
    }
  };

  // 첫 글자 힌트 토글
  const toggleHint = (index: number) => {
    setHintIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  // 현재 학습 단계 계산 — 4단계 프레임워크 인디케이터용
  // 1: 무자막 정취 (훈련+입력없음) / 2: 받아쓰기 (훈련+입력시작) / 3: 갭분석 (훈련+정답확인) / 4: 쉐도잉 (복습)
  const currentStep = dictationMode === 'review' ? 4
    : dictationChecked ? 3
    : dictationInputs.some(i => (i || '').trim().length > 0) ? 2
    : 1;
  const stepLabels = ['무자막 정취', '받아쓰기', '갭 분석', '쉐도잉'];

  // ── Dictation 헤더 — 모드 토글(훈련/복습) + 전체 듣기 (공통) ──
  const renderDictationHeader = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: theme.soft, borderColor: theme.border }}>
        {/* 모드 토글 — 훈련(빈칸 받아쓰기) / 복습(풀 스크립트 + 싱크) */}
        <div className="flex items-center gap-1 rounded-full bg-white/60 p-0.5 border border-gray-200">
          <button
            type="button"
            onClick={() => { setDictationMode('training'); setShowWrongNotes(false); }}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${dictationMode === 'training' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            style={dictationMode === 'training' ? { backgroundColor: theme.accent } : undefined}
          >
            훈련
          </button>
          <button
            type="button"
            onClick={() => { setDictationMode('review'); setShowSentences(false); }}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${dictationMode === 'review' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            style={dictationMode === 'review' ? { backgroundColor: theme.accent } : undefined}
          >
            복습
          </button>
        </div>
        <span className="text-[11px] text-gray-500 font-medium hidden sm:block">
          {dictationMode === 'training' ? '받아쓰기 — 빈칸 채우기' : '풀 스크립트 — 클릭·하이라이트 싱크'}
        </span>
        {/* 전체 듣기 — pause/resume 토글 (멈춘 지점부터 이어서) */}
        <div className="flex items-center gap-1.5">
          {/* 문장 자동 정지 모드 — TTS에서 한 문장씩 자동 정지 (CMS 오디오 없을 때) */}
          {!audioUrl && dictationSentences.length > 1 && (
            <button
              type="button"
              onClick={() => { setAutoStopMode(s => !s); setAutoStopIdx(null); }}
              title={autoStopMode ? '자동 정지 모드 끄기' : '자동 정지 모드 — 한 문장씩 재생 후 정지'}
              className={`flex h-8 items-center justify-center rounded-full px-2.5 text-[10px] font-bold shadow-sm transition-colors ${
                autoStopMode ? 'text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
              style={autoStopMode ? { backgroundColor: '#7c3aed' } : undefined}
            >
              자동정지
            </button>
          )}
          <button
            type="button"
            onClick={playDictation}
            title={isDictationPlaying ? '일시정지 (다시 누르면 이어서 재생)' : '전체 오디오 듣기'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-opacity active:opacity-70"
            style={{ backgroundColor: isDictationPlaying ? '#e67e22' : theme.accent }}
          >
            {isDictationPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {/* 자동 정지 모드 "다음 문장" 버튼 — 한 문장 재생 완료 후 표시 */}
      {autoStopMode && autoStopIdx !== null && !isDictationPlaying && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2">
          <span className="text-xs font-semibold text-violet-700">
            문장 {autoStopIdx + 1}/{dictationSentences.length} 완료
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => playAutoStop(autoStopIdx)}
              className="flex items-center gap-1 rounded-full bg-white border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-violet-600 hover:bg-violet-50"
            >
              <Repeat className="h-3 w-3" /> 다시
            </button>
            {autoStopIdx + 1 < dictationSentences.length && (
              <button
                type="button"
                onClick={() => playAutoStop(autoStopIdx + 1)}
                className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: '#7c3aed' }}
              >
                다음 문장 ▶
              </button>
            )}
          </div>
        </div>
      )}
      {/* 4단계 학습 플로우 인디케이터 — 현재 단계 하이라이트 */}
      <div className="flex items-center justify-between gap-1 px-1">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isCurrent = currentStep === stepNum;
          const isDone = currentStep > stepNum;
          return (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition-all ${
                isCurrent ? 'text-white shadow-sm' : isDone ? 'text-white/90' : 'text-gray-400 bg-gray-100'
              }`} style={isCurrent || isDone ? { backgroundColor: isCurrent ? theme.accent : '#9ca3af' } : undefined}>
                <span className={`text-[10px] font-bold flex h-4 w-4 items-center justify-center rounded-full ${
                  isCurrent ? 'bg-white' : isDone ? 'bg-white/30' : 'bg-gray-300'
                }`} style={isCurrent ? { color: theme.accent } : undefined}>
                  {isDone ? '✓' : stepNum}
                </span>
                <span className="text-[10px] font-semibold whitespace-nowrap">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`h-0.5 flex-1 rounded ${isDone ? 'bg-gray-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── 훈련 모드 — 빈칸 받아쓰기 + 힌트 + 채점 (1·2·3단계) ──
  const renderTrainingMode = () => (
    <>
      {/* 문장별 듣기 목록 토글 (훈련 모드에서만) */}
      {dictationSentences.length > 1 && (
        <button
          type="button"
          onClick={() => setShowSentences(s => !s)}
          title={showSentences ? '문장 목록 닫기' : '문장별 듣기 열기 — 원하는 문장만 반복 청취'}
          className={`flex h-8 items-center justify-center rounded-full px-3 text-xs font-semibold shadow-sm transition-colors self-start ${
            showSentences ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
          style={showSentences ? { backgroundColor: theme.accent } : undefined}
        >
          {showSentences ? '문장별 닫기' : '문장별 듣기'}
        </button>
      )}

      {/* 문장별 듣기 목록 — 클릭하면 해당 문장으로 이동(전체 재생 중 점프/seek), 반복 버튼으로 무한 루프 */}
      {showSentences && dictationSentences.length > 1 && (
        <div ref={sentenceListRef} className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-3 space-y-1.5 max-h-56 overflow-y-auto">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">스크립트 — 문장 클릭 시 해당 부분부터 재생</p>
          {dictationSentences.map((sentence, idx) => {
            const isActive = activeSentenceIdx === idx;
            const isLooping = loopSentenceIdx === idx;
            return (
              <div
                key={idx}
                data-sentence-idx={idx}
                className={`flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                  isActive ? 'bg-[#eef4ff] border border-[#c7d8ff]' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSentenceClick(idx)}
                  title={isActive && !isLooping ? '정지 / 다시 듣기' : '이 문장부터 듣기'}
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: isActive ? '#ef4444' : theme.accent }}
                >
                  {isActive ? <span className="text-[9px]">■</span> : <Play className="h-3 w-3" />}
                </button>
                <span
                  className={`flex-1 text-xs leading-5 cursor-pointer transition-colors ${isActive ? 'text-[#1d4ed8] font-semibold' : 'text-[#334155]'}`}
                  onClick={() => handleSentenceClick(idx)}
                >
                  {sentence}
                </span>
                <button
                  type="button"
                  onClick={() => playSentence(idx, true)}
                  title={isLooping ? '반복 정지' : '이 문장 무한 반복'}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isLooping ? 'text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  style={isLooping ? { backgroundColor: '#e67e22' } : undefined}
                >
                  <Repeat className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 빈칸 받아쓰기 본문 — 2단계 */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4">
        <div className="text-[14px] leading-8 text-[#1f2937] whitespace-pre-wrap">
          {dictationExercise.segments.map((segment, index) => (
            <span key={index}>
              <span>{segment}</span>
              {index < dictationExercise.blanks.length && (
                <span className="inline-flex items-center gap-1 align-bottom">
                  <input
                    ref={(element) => { dictationInputRefs.current[index] = element; }}
                    value={dictationInputs[index] || ''}
                    onChange={(event) => {
                      const next = [...dictationInputs];
                      next[index] = event.target.value;
                      setDictationInputs(next);
                      setDictationChecked(false);
                    }}
                    onKeyDown={(event) => {
                      if ((event.key === 'Tab' || event.key === 'Enter') && index < dictationExercise.blanks.length - 1) {
                        event.preventDefault();
                        dictationInputRefs.current[index + 1]?.focus();
                        dictationInputRefs.current[index + 1]?.select();
                      }
                      if (event.key !== 'Backspace' && event.key !== 'Delete' && event.key.length === 1) {
                        const projected = (dictationInputs[index] || '') + event.key;
                        const answerLen = normalizeDictationValue(dictationExercise.blanks[index]).length;
                        if (index < dictationExercise.blanks.length - 1 && normalizeDictationValue(projected).length >= answerLen && answerLen >= 3) {
                          setTimeout(() => { dictationInputRefs.current[index + 1]?.focus(); dictationInputRefs.current[index + 1]?.select(); }, 50);
                        }
                      }
                    }}
                    className={`inline-block border-b-2 bg-transparent px-1 py-0 text-center outline-none align-baseline ${
                      dictationChecked
                        ? isDictationCorrect(index) ? 'border-green-500 text-green-700' : 'border-red-500 text-red-600'
                        : 'border-[#94a3b8] text-[#1f2937]'
                    }`}
                    style={{ width: `${Math.max(dictationExercise.blanks[index].length * 10, 64)}px` }}
                  />
                  {/* 첫 글자 힌트 — 클릭 시 첫 글자 표시/숨김 */}
                  <button
                    type="button"
                    onClick={() => toggleHint(index)}
                    title={hintIndices.has(index) ? '힌트 숨기기' : '첫 글자 힌트'}
                    className={`inline-flex items-center justify-center h-5 min-w-[20px] rounded px-0.5 text-[10px] font-bold transition-colors ${
                      hintIndices.has(index)
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                  >
                    {hintIndices.has(index) ? dictationExercise.blanks[index].charAt(0).toUpperCase() : <Lightbulb className="h-3 w-3" />}
                  </button>
                  {dictationChecked && !isDictationCorrect(index) && (
                    <span className="text-xs font-semibold text-red-500">({dictationExercise.blanks[index]})</span>
                  )}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* 3단계 — 갭 분석: 정답 확인 */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleCheckDictation}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: theme.accent }}
          >
            정답 확인
          </button>
          {dictationChecked && (
            <p className="text-xs text-[#64748b]">
              {dictationExercise.blanks.filter((_, i) => isDictationCorrect(i)).length}/{dictationExercise.blanks.length} 정답
            </p>
          )}
          {wrongAttempts >= 3 && dictationChecked && dictationExercise.blanks.some((_, i) => !isDictationCorrect(i)) && (
            <p className="text-xs text-amber-600 font-medium">💡 어려우면 빈칸 옆 전구 아이콘으로 첫 글자 힌트를 확인하세요</p>
          )}
        </div>
        {dictationChecked && dictationExercise.blanks.some((_, i) => !isDictationCorrect(i)) && (
          <p className="mt-2 text-[11px] text-gray-400">틀린 단어는 오답 노트에 자동 저장되었습니다. (복습 모드에서 조회 가능)</p>
        )}
      </div>
    </>
  );

  // ── 복습 모드 — 풀 스크립트 + 하이라이트 싱크 + 클릭 점프 + 구간 반복 (4단계) ──
  const renderReviewMode = () => (
    <>
      {/* 풀 스크립트 컨트롤 — 블러 토글 + 번역 토글 + 단어장 사이드바 + 쉐도잉 녹음 + 구간 반복 해제 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 블러 토글 — 4단계 프레임워크 1단계(무자막 정취) 지원.
              스크립트를 블러 처리해 오디오에만 집중하게 함. 클릭/재생은 그대로 작동. */}
          <button
            type="button"
            onClick={() => setScriptBlur(s => !s)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors ${
              scriptBlur ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
            style={scriptBlur ? { backgroundColor: '#7c3aed' } : undefined}
            title="스크립트 블러 — 1단계 무자막 정취용. 오디오에만 집중할 때 사용"
          >
            {scriptBlur ? '👁 블러 중' : '👁 블러'}
          </button>
          {translationSentences.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTranslation(s => !s)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors ${
                showTranslation ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={showTranslation ? { backgroundColor: '#2563eb' } : undefined}
            >
              <Languages className="h-3 w-3" /> 번역 {showTranslation ? '숨기기' : '보기'}
            </button>
          )}
          {/* 단어장 사이드바 토글 — 스크립트 옆에 핵심 어휘를 나란히 표시 (CMS vocabularyNote 또는 기본 wordList) */}
          {(vocabularyNote || wordList.length > 0) && (
            <button
              type="button"
              onClick={() => setShowKeyWordsSidebar(s => !s)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors ${
                showKeyWordsSidebar ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={showKeyWordsSidebar ? { backgroundColor: '#0d9488' } : undefined}
              title="핵심 어휘 사이드바 — 이 지문의 Key Vocabulary & 숙어"
            >
              📚 단어장 {showKeyWordsSidebar ? '닫기' : '보기'}
            </button>
          )}
          {/* 쉐도잉 녹음 — 마이크로 내 음성 녹음 후 비교 */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-1 rounded-full bg-white border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
              title="내 음성 녹음 (쉐도잉)"
            >
              <Mic className="h-3 w-3" /> 녹음
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white animate-pulse"
              title="녹음 중지"
            >
              <span className="h-2 w-2 rounded-full bg-white" /> 녹음 중... (탭하여 정지)
            </button>
          )}
          {recordedUrl && !isRecording && (
            <button
              type="button"
              onClick={() => { recordedAudioRef.current?.play(); }}
              className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
              title="녹음 재생"
            >
              <Play className="h-3 w-3" /> 내 녹음
            </button>
          )}
          {recordedUrl && !isRecording && (
            <button
              type="button"
              onClick={deleteRecording}
              className="text-xs text-gray-400 hover:text-red-500"
              title="녹음 삭제"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {loopSentenceIdx !== null && (
          <button
            type="button"
            onClick={() => updateLoopSentence(null)}
            className="flex items-center gap-1 rounded-full bg-[#e67e22] px-3 py-1 text-xs font-bold text-white"
          >
            <Repeat className="h-3 w-3" /> 반복 중 (문장 {loopSentenceIdx + 1}) ✕
          </button>
        )}
      </div>
      {/* 숨겨진 녹음 재생용 audio 요소 */}
      {recordedUrl && <audio ref={recordedAudioRef} src={recordedUrl} className="hidden" />}

      {/* 풀 스크립트 + 단어장 사이드바 — flex 레이아웃 (모바일에서는 자동 세로 스택) */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* 풀 스크립트 — 문장별 클릭 가능, 재생 중 하이라이트 + 자동 스크롤.
            scriptBlur 시 블러 처리 (1단계 무자막 정취). 클릭/재생은 그대로 작동. */}
        <div
          ref={sentenceListRef}
          className={`rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 space-y-1 max-h-[420px] overflow-y-auto flex-1 min-w-0 transition-all ${scriptBlur ? 'blur-sm' : ''}`}
        >
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 sticky top-0 bg-white py-1">
            풀 스크립트 — 문장 클릭 시 해당 부분부터 재생
          </p>
          {dictationSentences.length > 0 ? dictationSentences.map((sentence, idx) => {
            const isActive = activeSentenceIdx === idx;
            const isLooping = loopSentenceIdx === idx;
            const translation = showTranslation ? translationSentences[idx] : undefined;
            return (
              <div
                key={idx}
                data-sentence-idx={idx}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#eef4ff] border-l-4 border-[#2563eb]'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
                onClick={() => handleSentenceClick(idx)}
              >
                <span className="text-[10px] font-bold text-gray-300 mt-0.5 shrink-0 w-5">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm leading-6 transition-colors block ${isActive ? 'text-[#1d4ed8] font-semibold' : 'text-[#1f2937]'}`}>
                    {sentence}
                  </span>
                  {translation && (
                    <span className="text-xs leading-5 text-gray-500 mt-0.5 block border-l-2 border-blue-100 pl-2">
                      {translation}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); playSentence(idx, true); }}
                  title={isLooping ? '반복 정지' : '이 문장 무한 반복'}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isLooping ? 'text-white' : 'text-gray-300 hover:text-[#e67e22] hover:bg-orange-50'
                  }`}
                  style={isLooping ? { backgroundColor: '#e67e22' } : undefined}
                >
                  <Repeat className="h-3 w-3" />
                </button>
              </div>
            );
          }) : (
            <p className="text-sm text-gray-400 text-center py-8">스크립트가 없습니다.</p>
          )}
        </div>

        {/* 단어장 사이드바 — showKeyWordsSidebar && (vocabularyNote 또는 wordList)가 있을 때 표시.
            CMS vocabularyNote를 우선, 없으면 기본 wordList 사용. */}
        {showKeyWordsSidebar && (vocabularyNote || wordList.length > 0) && (
          <div className="md:w-56 shrink-0 rounded-xl border border-[#0d9488]/30 bg-gradient-to-b from-teal-50/40 to-white px-3 py-3 max-h-[420px] overflow-y-auto">
            <p className="text-[11px] font-bold text-[#0d9488] uppercase tracking-wide mb-2 sticky top-0 bg-inherit py-1">
              📚 Key Vocabulary
            </p>
            {vocabularyNote ? (
              <div className="space-y-1.5">
                {vocabularyNote.split('\n').filter(l => l.trim()).map((line, i) => {
                  const [word, ...rest] = line.split('=');
                  const meaning = rest.join('=').trim();
                  return (
                    <div key={i} className="border-b border-teal-100 last:border-0 pb-1.5">
                      <p className="text-xs font-bold text-[#0f172a] leading-tight">{word.trim()}</p>
                      {meaning && <p className="text-[11px] text-gray-600 leading-tight mt-0.5">{meaning}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {wordList.map((item) => (
                  <div key={item.word} className="border-b border-teal-100 last:border-0 pb-1.5">
                    <p className="text-xs font-bold text-[#0f172a] leading-tight">{item.word}</p>
                    <p className="text-[11px] text-gray-600 leading-tight mt-0.5">{item.meaning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 오답 노트 조회 — 토글 버튼 + 필터 + 패널 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowWrongNotes(s => !s)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
            showWrongNotes ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
          style={showWrongNotes ? { backgroundColor: '#dc2626' } : undefined}
        >
          📒 오답 노트 {showWrongNotes ? '닫기' : '보기'}
        </button>
        <button
          type="button"
          onClick={() => setShowWrongNotesManager(true)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 transition-colors"
          title="모든 TPO의 오답을 한곳에서 관리"
        >
          🗂 전체 관리
        </button>
        {(() => {
          void wrongNotesVersion; // 삭제 시 카운트 즉시 갱신
          const allNotes = loadWrongNotes();
          const thisCount = allNotes.filter(n => n.contentKey === contentKey).length;
          return (
            <span className="text-[11px] text-gray-400">
              이 문제 {thisCount}개 / 전체 {allNotes.length}개
            </span>
          );
        })()}
      </div>

      {showWrongNotes && (() => {
        // wrongNotesVersion 참조 — 삭제 시 즉시 재렌더링
        void wrongNotesVersion;
        const allNotes = loadWrongNotes();
        const filtered = wrongNoteFilter === 'this'
          ? allNotes.filter(n => n.contentKey === contentKey)
          : allNotes;
        return (
          <div className="rounded-xl border border-red-200 bg-red-50/40 px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
            {/* 필터 토글 */}
            <div className="flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-1 rounded-full bg-white p-0.5 border border-red-200">
                <button
                  type="button"
                  onClick={() => setWrongNoteFilter('this')}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${wrongNoteFilter === 'this' ? 'text-white' : 'text-gray-500'}`}
                  style={wrongNoteFilter === 'this' ? { backgroundColor: '#dc2626' } : undefined}
                >
                  이 문제
                </button>
                <button
                  type="button"
                  onClick={() => setWrongNoteFilter('all')}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${wrongNoteFilter === 'all' ? 'text-white' : 'text-gray-500'}`}
                  style={wrongNoteFilter === 'all' ? { backgroundColor: '#dc2626' } : undefined}
                >
                  전체
                </button>
              </div>
              {allNotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('오답 노트를 모두 삭제할까요?')) {
                      localStorage.removeItem(WRONG_NOTE_KEY);
                      setWrongNotesVersion(v => v + 1);
                      setShowWrongNotes(false);
                    }
                  }}
                  className="text-[10px] text-gray-400 hover:text-red-500"
                >
                  전체 삭제
                </button>
              )}
            </div>
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">저장된 오답이 없습니다.</p>
            ) : (
              filtered.slice().reverse().map((note, i) => (
                <div key={i} className="rounded-lg bg-white border border-red-100 px-3 py-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600">{note.word}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(note.savedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 leading-5">{note.sentence}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // 개별 삭제 — 같은 word+sentence 조합 제거 + version 증가로 즉시 재렌더링
                      const remaining = loadWrongNotes().filter(n => !(n.word === note.word && n.sentence === note.sentence));
                      localStorage.setItem(WRONG_NOTE_KEY, JSON.stringify(remaining.slice(-200)));
                      setWrongNotesVersion(v => v + 1);
                    }}
                    title="이 오답 삭제"
                    className="text-gray-300 hover:text-red-500 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        );
      })()}
    </>
  );

  const renderDictation = () => (
    <div className="space-y-3">
      {renderDictationHeader()}
      {dictationMode === 'training' ? renderTrainingMode() : renderReviewMode()}
    </div>
  );
  const renderWords = () => {
    if (vocabularyNote) {
      const lines = vocabularyNote.split('\n').filter(l => l.trim());
      return (
        <div className="space-y-2">
          {lines.map((line, i) => {
            const [word, ...rest] = line.split('=');
            const meaning = rest.join('=').trim();
            return (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <span className="font-bold text-sm text-[#0f172a] min-w-[100px]">{word.trim()}</span>
                {meaning && <span className="text-sm text-gray-600">{meaning}</span>}
              </div>
            );
          })}
        </div>
      );
    }
    // fallback
    return (
    <div className="space-y-3">
      {wordList.map((item) => (
        <div key={item.word} className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3">
          <p className="text-sm font-bold text-[#111827]">{item.word}</p>
          <p className="mt-1 text-xs text-[#64748b]">{item.meaning}</p>
        </div>
      ))}
    </div>
  );
  };

  const renderBullets = (title: string, lines: string[], icon: JSX.Element) => (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <div key={line} className="rounded-xl bg-[#f8fafc] px-3 py-2 text-xs leading-5 text-[#475569]">
            {line}
          </div>
        ))}
      </div>
    </div>
  );


  const renderActiveTab = () => {
    if (!activeTab) return null;

    if (activeTab === 'Dictation') {
      if (translationNote) {
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Listening Script</p>
            <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200">
              {translationNote}
            </div>
          </div>
        );
      }
      return renderDictation();
    }
    if (activeTab === 'Key Words') return renderWords();
        if (activeTab === 'Translation') {
      if (translationNote) {
        return (
          <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
            {translationNote}
          </div>
        );
      }
      return renderBullets(
        'Translation',
        [
          '핵심 문장은 먼저 직역하고, 뒤에서 자연스럽게 재구성합니다.',
          '배경 설명보다 결론과 근거의 연결을 먼저 잡으면 빠르게 이해됩니다.',
          '문단마다 중심 문장을 한 줄로 요약하는 습관이 중요합니다.',
        ],
        <Languages className="h-4 w-4" />,
      );
    }
        if (activeTab === 'Analysis') {
      if (analysisNote) {
        return (
          <div className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
            {analysisNote}
          </div>
        );
      }
      return renderBullets('Analysis', getAnalysisLines(variant), <FileText className="h-4 w-4" />);
    }
    if (activeTab === 'Practice') return null;
    return null;
  };

  return (
    <div className="fixed right-4 bottom-4 md:bottom-6 z-[85] flex flex-col items-end gap-2">
      {/* ── Right vertical icon sidebar (horizontal row) ── */}
      <div className="flex flex-row gap-3 shrink-0">
        {tabs.map((tab) => {
          const meta = getTabMeta(tab);
          const Icon = meta.icon;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              title={meta.title}
              onClick={() => {
                if (tab === 'Practice') {
                  onStartTraining({
                    title: `${questionType || getTrainingTitle(section, variant)} Practice`,
                    questionType,
                    difficulty: currentDifficulty,
                  });
                } else {
                  setActiveTab((current) => current === tab ? null : tab);
                }
              }}
              className="flex flex-col items-center gap-1 transition-all duration-200"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${isActive ? '-translate-x-0.5 shadow-md' : 'hover:-translate-x-0.5'}`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}cc 100%)`
                    : 'linear-gradient(180deg, #f1f5f9 0%, #e8edf2 100%)',
                  boxShadow: isActive ? `0 6px 18px ${theme.accent}33` : '0 2px 8px rgba(15,23,42,0.08)',
                }}
              >
                <Icon className="h-5 w-5" style={{ color: isActive ? 'white' : theme.accent }} />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-center max-w-[52px]"
                style={{ color: isActive ? theme.accent : '#94a3b8' }}>
                {tab}
              </span>
            </button>
          );
        })}

        {/* AI 튜터 버튼 — 오른쪽 통합 아이콘 바에 배치 */}
        {audioUrl && (
          <button
            type="button"
            title={isPlayingAudio ? 'Pause' : 'Play Audio'}
            onClick={handlePlayAudio}
            className="flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-x-0.5"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200"
              style={{
                background: isPlayingAudio
                  ? `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}cc 100%)`
                  : 'linear-gradient(180deg, #f1f5f9 0%, #e8edf2 100%)',
                boxShadow: isPlayingAudio ? `0 6px 18px ${theme.accent}33` : '0 2px 8px rgba(15,23,42,0.08)',
              }}
            >
              {isPlayingAudio ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5" style={{ color: theme.accent }} />}
            </span>
            <span className="text-[10px] font-semibold leading-tight text-center max-w-[52px]"
              style={{ color: isPlayingAudio ? theme.accent : '#94a3b8' }}>
              {isPlayingAudio ? 'Pause' : 'Play'}
            </span>
          </button>
        )}

        {onOpenAiTutor && (
          <button
            type="button"
            title="AI 튜터"
            onClick={onOpenAiTutor}
            className="flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-x-0.5"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #cfe0ff 0%, #a9c6ff 35%, #8fd6ee 70%, #bfe9ff 100%)',
                boxShadow: '0 6px 18px rgba(102, 126, 234, 0.30)',
              }}
            >
              <Bot className="h-5 w-5" style={{ color: '#2d2d3a' }} />
            </span>
            <span className="text-[10px] font-semibold leading-tight text-center max-w-[52px] text-[#667eea]">
              AI 튜터
            </span>
          </button>
        )}
      </div>

      {/* ── Content panel ──
          • 미고정: 오른쪽 슬라이드 인 drawer (AI 튜터와 동일 스타일)
          • 고정(pinned): 화면 중앙 트렌디 모달 팝업 — 헤더 드래그로 이동 + 우하단 핸들로 크기 조절 ── */}
      {activeTab && activeTabMeta && (
        <>
          {!panelPinned && (
            <div
              className="fixed inset-0 z-[84]"
              style={{ background: 'rgba(15, 23, 42, 0.35)', animation: 'reviewPanelFadeIn 0.2s ease' }}
              onClick={() => setActiveTab(null)}
            />
          )}
          <div
            className={`fixed bg-white flex flex-col z-[85] ${panelPinned ? 'review-panel-modal' : ''}`}
            style={panelPinned ? {
              top: '50%',
              left: '50%',
              width: panelSize.width,
              maxWidth: '92vw',
              height: panelSize.height,
              maxHeight: '92vh',
              borderRadius: 24,
              border: `1px solid ${theme.border}40`,
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28), 0 8px 24px rgba(15, 23, 42, 0.12)',
              transform: `translate(-50%, -50%) translate(${panelPos.x}px, ${panelPos.y}px)`,
              animation: 'reviewModalPop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden',
            } : {
              top: 0,
              right: 0,
              height: '100%',
              width: 420,
              maxWidth: '100vw',
              boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
              animation: 'reviewPanelSlideIn 0.25s ease',
            }}
          >
            {/* ── 트렌디 그라데이션 헤더 (고정 모드) — 드래그 핸들 역할 ── */}
            <div
              className={`relative flex items-center justify-between px-6 py-4 shrink-0 ${panelPinned ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
              onMouseDown={onPanelDragStart}
              style={panelPinned ? {
                background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}cc 60%, ${theme.accent}99 100%)`,
                borderBottom: 'none',
              } : {
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={panelPinned
                    ? { background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }
                    : { background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)` }
                  }
                >
                  <activeTabMeta.icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <h3
                    className="text-base font-bold tracking-tight"
                    style={{ color: panelPinned ? '#ffffff' : '#0f172a' }}
                  >
                    {activeTabMeta.title}
                  </h3>
                  {panelPinned && (
                    <span className="text-[11px] font-medium text-white/70 leading-tight">
                      헤더를 드래그해 이동 · 우하단 핸들로 크기 조절
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* 고정 토글 — 핀 클릭 시 중앙 모달 팝업으로 전환 */}
                <button
                  type="button"
                  onClick={() => {
                    setPanelPinned(p => !p);
                    setPanelPos({ x: 0, y: 0 });
                    setPanelSize(getDefaultPanelSize());
                  }}
                  title={panelPinned ? '고정 해제' : '패널 고정 — 중앙 모달로 띄워 리뷰와 동시에 사용'}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    panelPinned
                      ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {panelPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  {panelPinned ? '고정됨' : '고정'}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab(null); setPanelPinned(false); setPanelPos({ x: 0, y: 0 }); setPanelSize(getDefaultPanelSize()); }}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    panelPinned
                      ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                      : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                  닫기
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {renderActiveTab()}
            </div>
            {/* ── 리사이즈 핸들 (우하단) — 고정 모드에서만 노출 ── */}
            {panelPinned && (
              <div
                onMouseDown={onPanelResizeStart}
                className="absolute bottom-1.5 right-1.5 w-5 h-5 cursor-nwse-resize z-[86] group"
                title="드래그해서 크기 조절"
              >
                <svg
                  width="20" height="20" viewBox="0 0 20 20" fill="none"
                  className="text-gray-300 group-hover:text-gray-400 transition-colors"
                >
                  <circle cx="16" cy="4" r="1.3" fill="currentColor" />
                  <circle cx="16" cy="10" r="1.3" fill="currentColor" />
                  <circle cx="10" cy="10" r="1.3" fill="currentColor" />
                  <circle cx="16" cy="16" r="1.3" fill="currentColor" />
                  <circle cx="10" cy="16" r="1.3" fill="currentColor" />
                  <circle cx="4" cy="16" r="1.3" fill="currentColor" />
                </svg>
              </div>
            )}
          </div>
          <style>{`
            @keyframes reviewPanelSlideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes reviewPanelFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes reviewModalPop {
              0% { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
              100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            .review-panel-modal {
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
            }
          `}</style>
        </>
      )}

      {/* 오답 노트 통합 관리 모달 — 모든 TPO의 오답을 한곳에서 조회/삭제/내보내기 */}
      <WrongNotesManager
        open={showWrongNotesManager}
        onClose={() => setShowWrongNotesManager(false)}
        currentContentKey={contentKey}
        onChanged={() => setWrongNotesVersion(v => v + 1)}
      />
    </div>
  );
}
