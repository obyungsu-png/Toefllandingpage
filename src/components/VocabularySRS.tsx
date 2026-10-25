/**
 * VocabularySRS.tsx
 * -----------------------------------------------------------------------------
 * SRS(Spaced Repetition System, 간격 반복 학습) 기반 단어 학습 컴포넌트.
 * - Anki 계열 SM-2 알고리즘 단순화 버전을 사용해 카드마다 "언제 다시 볼지" 계산.
 * - 5개 단어장 소스(vol.1/vol.2/기출/참고서/vol.5) + DAY 선택 흐름 지원.
 * - 메인 학습: 영→한 Flashcard 재인 + 4단계 셀프평가(Again/Hard/Good/Easy)
 * - 세션 완료 시: 방금 Good/Easy 받은 단어 중 예문이 있는 것들로 "📝 문맥 복습" 보너스
 *   세션(Cloze) 을 선택적으로 돌릴 수 있음. SRS 상태는 바뀌지 않음(순수 복습).
 *   Cloze 는 "이미 아는 단어" 에만 노출되므로 모르는 단어로 벽에 막힐 일이 없음.
 * - 학습 상태는 localStorage 에 per-source-per-word 로 저장 (Supabase 연동은 추후).
 *
 * 리텐션 포인트: 앱을 열면 "오늘의 복습 N장"이 제시되어 매일 돌아올 이유를 제공.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, RotateCcw, Sparkles, Loader2, CheckCircle2, Volume2 } from 'lucide-react';
import { SATWord } from './vocaWordSets';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import { getAllWords } from './vocaWordSets';
import { callAi } from '../utils/aiClient';
import { loadWeakWords, type WeakWord } from '../utils/weakWords';
import { getCurrentOwnerName } from '../utils/gameStats';

// ============================================================================
// 소스 & 데이터
// ============================================================================
type SourceKey = 'toefl-easy' | 'toefl-hard' | 'etymology' | 'custom' | 'junior';

const SOURCES: { key: SourceKey; label: string; short: string }[] = [
  { key: 'toefl-easy', label: 'TOEFL 어휘 학습 vol.1', short: '어휘 vol.1' },
  { key: 'toefl-hard', label: 'TOEFL 어휘 학습 vol.2', short: '어휘 vol.2' },
  { key: 'etymology', label: '기출단어', short: '기출' },
  { key: 'custom', label: '참고서 영단어', short: '참고서' },
  { key: 'junior', label: '중3+고1 영단어 vol.5', short: 'vol.5' },
];

interface SrsWord extends SATWord {
  dayNumber: number;
}
interface DayInfo {
  id: number;
  name: string;
  count: number;
}

function normalizeWords(raw: any[]): SrsWord[] {
  return (raw || [])
    .filter(w => w?.english && w?.korean && !String(w.english).includes('_'))
    .map(w => ({
      english: String(w.english).trim(),
      korean: String(w.korean).trim(),
      definition: String(w.definition || ''),
      synonyms: String(w.synonyms || ''),
      chinese: w.chinese ? String(w.chinese) : undefined,
      example: w.example ? String(w.example) : undefined,
      dayNumber: Number(w.dayNumber) || 0,
    }))
    .filter(w => w.dayNumber > 0);
}
function daysFromWords(words: any[]): DayInfo[] {
  const map = new Map<number, number>();
  words.forEach(w => {
    const d = Number(w?.dayNumber);
    if (Number.isFinite(d) && d > 0 && !String(w?.english || '').includes('_')) {
      map.set(d, (map.get(d) || 0) + 1);
    }
  });
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([id, count]) => ({ id, name: `DAY ${id}`, count }));
}
function localVol1(): { words: SrsWord[]; days: DayInfo[] } {
  const clean = getAllWords().filter(w => !w.english.includes('_'));
  const words: SrsWord[] = clean.map((w, i) => ({
    english: w.english,
    korean: w.korean,
    definition: w.definition || '',
    synonyms: w.synonyms || '',
    example: w.example,
    dayNumber: Math.floor(i / 40) + 1,
  }));
  return { words, days: daysFromWords(words) };
}

// ============================================================================
// SM-2 (단순화) — 각 카드에 { interval, ease, streak, dueAt } 저장
// Grade 매핑: Again=0, Hard=1, Good=2, Easy=3
// ============================================================================
type Grade = 0 | 1 | 2 | 3;
interface CardState {
  interval: number;   // 다음 복습까지 일수 (0.007 = 10분, 0.04 = 1시간 등도 허용)
  ease: number;       // 난이도 계수 (기본 2.5, 최소 1.3)
  streak: number;     // 연속 정답(Good/Easy) 수
  dueAt: number;      // 다음 복습 timestamp (ms)
  reps: number;       // 총 학습 횟수
  lapses: number;     // 완전 망각(Again) 횟수
}
function newCardState(): CardState {
  return { interval: 0, ease: 2.5, streak: 0, dueAt: Date.now(), reps: 0, lapses: 0 };
}
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** SM-2 단순화: grade 기반으로 다음 interval/ease 계산. */
function nextCardState(prev: CardState, grade: Grade): CardState {
  const now = Date.now();
  let { interval, ease, streak, reps, lapses } = prev;
  reps += 1;

  if (grade === 0) {
    // Again — 10분 뒤 다시 (당일 큐로 복귀)
    lapses += 1;
    streak = 0;
    ease = Math.max(1.3, ease - 0.2);
    interval = 10 / (24 * 60); // 10분
  } else if (grade === 1) {
    // Hard — 1일 (ease 소폭 감소)
    streak = 0;
    ease = Math.max(1.3, ease - 0.15);
    interval = 1;
  } else if (grade === 2) {
    // Good — 첫 정답 1일, 두번째 3일, 이후 interval * ease
    streak += 1;
    if (streak === 1) interval = 1;
    else if (streak === 2) interval = 3;
    else interval = Math.round(interval * ease);
  } else {
    // Easy — 크게 늘림 (interval * ease * 1.3, 최소 4일부터)
    streak += 1;
    ease = Math.min(3.0, ease + 0.05);
    if (streak === 1) interval = 4;
    else interval = Math.round(interval * ease * 1.3);
  }

  const dueAt = now + interval * MS_PER_DAY;
  return { interval, ease, streak, dueAt, reps, lapses };
}

// ============================================================================
// GLM 예문 자동 생성 — 학생 단어 학습용 짧은 영어 예문 1개
// - 결과는 localStorage 에 캐시하여 재요청 없음 (첫 1회만 비용)
// - 실패 시 null 반환 → Cloze 대신 Flashcard 로 fallback
// ============================================================================
const EXAMPLE_CACHE_PREFIX = 'srs-example-';

function loadCachedExample(english: string): string | null {
  try {
    const raw = localStorage.getItem(`${EXAMPLE_CACHE_PREFIX}${english.toLowerCase()}`);
    return raw && raw.length > 0 ? raw : null;
  } catch { return null; }
}
function saveCachedExample(english: string, example: string) {
  try { localStorage.setItem(`${EXAMPLE_CACHE_PREFIX}${english.toLowerCase()}`, example); } catch {}
}

/** GLM 으로 target 단어를 반드시 포함하는 자연스러운 학습용 예문 1개 생성.
 *  - 문장 길이 8~14 단어, TOEFL 수준의 자연스러운 영어.
 *  - target 단어의 어형(원형/과거/-ing 등) 을 문맥에 맞게 사용.
 *  - 학습용이라 문장이 target 단어의 의미를 문맥으로 드러나게. */
async function generateExampleGLM(english: string, korean: string): Promise<string | null> {
  const cached = loadCachedExample(english);
  if (cached) return cached;
  const systemPrompt = `You generate ONE example sentence in English to help a TOEFL student learn a target word.
Rules:
- The sentence MUST contain the target word (any natural inflection is OK: base/past/-ing/-s).
- 8 to 14 words long.
- Natural, TOEFL-level English, no rare idioms.
- The sentence's context should reveal the word's meaning.
- Output ONLY the sentence text, no quotes, no explanations, no numbering.`;
  const userPrompt = `Target word: ${english}
Target meaning (Korean): ${korean}

Write ONE example sentence.`;
  try {
    const raw = await callAi(systemPrompt, userPrompt, 'glm', 120, 0.7);
    // 첫 줄만 취하고 따옴표/앞뒤 공백/마침표 유지
    const line = String(raw || '').split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
    const cleaned = line.replace(/^["'`]|["'`]$/g, '').trim();
    if (cleaned.length < 10) return null;
    // 이형태 포함해서 target 단어가 등장하는지 확인 (최소 stem 매칭)
    const stem = english.replace(/(ing|ed|es|s)$/i, '');
    const re = new RegExp(`\\b(${escapeRegExp(english)}|${escapeRegExp(stem)}\\w*)\\b`, 'i');
    if (!re.test(cleaned)) return null;
    saveCachedExample(english, cleaned);
    return cleaned;
  } catch {
    return null;
  }
}

// ============================================================================
// localStorage 저장 — key: srs-<source>-<english>
// ============================================================================
function stateKey(source: SourceKey, english: string): string {
  return `srs-${source}-${english.toLowerCase()}`;
}
function loadState(source: SourceKey, english: string): CardState | null {
  try {
    const raw = localStorage.getItem(stateKey(source, english));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.ease === 'number' && typeof parsed?.dueAt === 'number') return parsed as CardState;
    return null;
  } catch { return null; }
}
function saveState(source: SourceKey, english: string, state: CardState) {
  try { localStorage.setItem(stateKey(source, english), JSON.stringify(state)); } catch {}
}

// ============================================================================
// 오디오 (TTS)
// ============================================================================
function speakEnglish(text: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ============================================================================
// Cloze 유틸 — example 문장에서 target 단어(영어)를 빈칸으로 치환
// ============================================================================
function makeCloze(example: string, target: string): { blanked: string; matched: boolean } {
  const t = target.trim();
  if (!example || !t) return { blanked: example, matched: false };
  // 단어 경계 매칭 (대소문자 무시). 이형태(-ing/-ed/-s) 는 stem 매칭 시도.
  const stem = t.replace(/(ing|ed|es|s)$/i, '');
  const re = new RegExp(`\\b(${escapeRegExp(t)}|${escapeRegExp(stem)}\\w*)\\b`, 'i');
  if (re.test(example)) {
    return { blanked: example.replace(re, '________'), matched: true };
  }
  return { blanked: example, matched: false };
}
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function VocabularySRS({ onExit }: { onExit: () => void }) {
  // Vocabulary 는 학원생 등록 없이도 누구나 사용 가능 — 게이트 제거됨.
  // 로그인 학생 이름 — 약점 단어 서버 조회에 사용 (없으면 로컬 진행만)
  const ownerName = useMemo(() => getCurrentOwnerName(), []);

  // 약점 단어 (Typing Game 에서 놓친 단어들) — SRS 세션 큐 최상단에 우선 배치
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);

  // --- 소스/DAY 선택 상태 ---
  const [source, setSource] = useState<SourceKey>('toefl-easy');
  const [days, setDays] = useState<DayInfo[]>([]);
  const [wordsByDay, setWordsByDay] = useState<SrsWord[]>([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [day, setDay] = useState<number | 'all'>(1);
  const sourceCache = useRef<Partial<Record<SourceKey, { words: SrsWord[]; days: DayInfo[] }>>>({});

  // --- 학습 세션 상태 ---
  type Phase = 'setup' | 'learn' | 'done' | 'cloze-bonus' | 'cloze-done';
  const [phase, setPhase] = useState<Phase>('setup');
  const [queue, setQueue] = useState<SrsWord[]>([]);       // 오늘 학습할 카드 큐
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, again: 0 });
  const [newLimit, setNewLimit] = useState(10);            // 하루 신규 카드 수

  // --- 세션 끝 Cloze 보너스 ---
  //   방금 세션에서 Good/Easy 를 받은 "확실히 아는 단어" 들만 모아 문맥 복습.
  //   SRS 상태는 절대 수정하지 않음(순수 복습용). 예문이 없는 단어는 자동 제외.
  const [sessionGoodWords, setSessionGoodWords] = useState<SrsWord[]>([]);
  const [clozeBonusQueue, setClozeBonusQueue] = useState<SrsWord[]>([]);
  const [clozeBonusIdx, setClozeBonusIdx] = useState(0);
  const [clozeAnswer, setClozeAnswer] = useState('');
  const [clozeResult, setClozeResult] = useState<'ok' | 'ng' | null>(null);
  const [clozeHintLevel, setClozeHintLevel] = useState(0); // 0=없음, 1=첫글자, 2=앞 2글자
  const [bonusStats, setBonusStats] = useState({ attempted: 0, correct: 0 });

  // 현재 카드에서 사용할 예문(있으면 SATWord.example, 없으면 GLM 캐시/생성 결과)
  //   메인 세션(learn) 에서는 뒷면 노출용. 보너스 세션(cloze-bonus) 에서는 빈칸 생성용.
  const [currentExample, setCurrentExample] = useState<string | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);

  // --- 마운트 시 약점 단어 로드 (setup 화면 열릴 때 한 번) ---
  useEffect(() => {
    if (!ownerName) return;
    let cancelled = false;
    loadWeakWords(ownerName).then(ws => { if (!cancelled) setWeakWords(ws); });
    return () => { cancelled = true; };
  }, [ownerName]);

  // --- 소스 로드 ---
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const cached = sourceCache.current[source];
      if (cached) {
        setWordsByDay(cached.words);
        setDays(cached.days);
        setDay(cached.days[0]?.id ?? 'all');
        return;
      }
      setLoadingSource(true);
      setLoadError(null);
      try {
        const res = await fetch(`${SERVER_BASE_URL}/vocabulary/${source}`, {
          method: 'GET',
          headers: { ...getServerHeaders(), 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const words = normalizeWords(data.words || []);
        const dayList = daysFromWords(data.words || []);
        if (words.length === 0) throw new Error('단어 없음');
        if (cancelled) return;
        sourceCache.current[source] = { words, days: dayList };
        setWordsByDay(words);
        setDays(dayList);
        setDay(dayList[0]?.id ?? 'all');
      } catch (err: any) {
        if (cancelled) return;
        if (source === 'toefl-easy') {
          const local = localVol1();
          sourceCache.current[source] = local;
          setWordsByDay(local.words);
          setDays(local.days);
          setDay(1);
          setLoadError(null);
        } else {
          setWordsByDay([]);
          setDays([]);
          setLoadError('이 단어장을 불러오지 못했어요. 네트워크를 확인해주세요.');
        }
      } finally {
        if (!cancelled) setLoadingSource(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, retryTick]);

  // --- 학습 대상 계산 (선택된 DAY 범위) ---
  const scopedWords = useMemo(() => {
    if (wordsByDay.length === 0) return [];
    return day === 'all' ? wordsByDay : wordsByDay.filter(w => w.dayNumber === day);
  }, [wordsByDay, day]);

  // --- 오늘 due 통계 (신규 / 복습) ---
  const todayStats = useMemo(() => {
    const now = Date.now();
    let newCards = 0;
    let dueCards = 0;
    for (const w of scopedWords) {
      const s = loadState(source, w.english);
      if (!s) newCards += 1;
      else if (s.dueAt <= now) dueCards += 1;
    }
    return { newCards, dueCards, total: newCards + dueCards };
  }, [scopedWords, source, phase]);

  // --- 학습 시작: 오늘 due + 신규 N개 큐잉 (SM-2 스타일) ---
  const startSession = () => {
    const now = Date.now();
    // 5티어: 약점 단어(놓친 단어)를 큐 최상단에 우선 배치.
    // - 현재 scope 안의 단어만 대상 (다른 소스/DAY 의 약점 단어는 이번 세션에 안 나옴)
    // - due/new 판정보다 앞서 별도 그룹으로 분리
    const weakEngSet = new Set(weakWords.map(w => w.english.toLowerCase()));
    const weakQueue: SrsWord[] = [];
    const dueQueue: SrsWord[] = [];
    const newQueue: SrsWord[] = [];
    for (const w of scopedWords) {
      if (weakEngSet.has(w.english.toLowerCase())) {
        weakQueue.push(w);
        continue;
      }
      const s = loadState(source, w.english);
      if (!s) newQueue.push(w);
      else if (s.dueAt <= now) dueQueue.push(w);
    }
    // 약점 큐는 랜덤(스크램블), 그 뒤에 due+new 를 셔플해서 붙임 — "약점 우선 학습"
    for (let i = weakQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weakQueue[i], weakQueue[j]] = [weakQueue[j], weakQueue[i]];
    }
    const rest = [...dueQueue, ...newQueue.slice(0, newLimit)];
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    const combined = [...weakQueue, ...rest];
    if (combined.length === 0) return;
    setQueue(combined);
    setCurrentIdx(0);
    setSessionStats({ reviewed: 0, correct: 0, again: 0 });
    setSessionGoodWords([]);
    setPhase('learn');
  };

  const current = queue[currentIdx];

  // --- 현재 카드가 바뀔 때: UI 초기화 + 뒷면 노출용 예문 준비 ---
  //   메인 세션은 Flashcard 전용 (영→한 재인). 예문은 뒤집었을 때만 참고용으로 보임.
  //   DB(CMS)/캐시 예문이 있으면 그대로, 없으면 GLM 으로 생성 시도.
  useEffect(() => {
    if (phase !== 'learn' || !current) return;
    setFlipped(false);
    setCurrentExample(null);

    let cancelled = false;
    const prepareExample = async () => {
      const existing = current.example || loadCachedExample(current.english);
      if (existing) {
        if (!cancelled) setCurrentExample(existing);
        return;
      }
      // 예문 없음 → GLM 생성 1회 (실패해도 Flashcard 는 돌아감)
      setLoadingExample(true);
      const gen = await generateExampleGLM(current.english, current.korean);
      if (cancelled) { setLoadingExample(false); return; }
      setLoadingExample(false);
      if (gen) setCurrentExample(gen);
    };
    prepareExample();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, phase, queue.length]);

  // --- 카드 등급 매기기 (Flashcard 자체평가) ---
  const gradeCurrent = (grade: Grade) => {
    if (!current) return;
    const prev = loadState(source, current.english) || newCardState();
    const next = nextCardState(prev, grade);
    saveState(source, current.english, next);

    setSessionStats(s => ({
      reviewed: s.reviewed + 1,
      correct: s.correct + (grade >= 2 ? 1 : 0),
      again: s.again + (grade === 0 ? 1 : 0),
    }));

    // Good/Easy 받은 "확실히 아는 단어" 는 세션 끝 Cloze 보너스 후보로 수집.
    //   같은 단어가 세션 내 두 번 등장할 수도 있어 중복 제거.
    if (grade >= 2) {
      setSessionGoodWords(prevList => {
        if (prevList.some(w => w.english.toLowerCase() === current.english.toLowerCase())) return prevList;
        return [...prevList, current];
      });
    }

    // Again 은 이번 세션에서 몇 칸 뒤에 다시 나오도록 재삽입 (즉시 반복 방지).
    // 남은 카드가 충분하면 3장 뒤, 부족하면 남은 만큼 뒤에 삽입.
    let nextQueue = queue;
    if (grade === 0) {
      const before = queue.slice(0, currentIdx + 1);
      const rest = queue.slice(currentIdx + 1);
      const gap = Math.min(rest.length, 3);
      nextQueue = [...before, ...rest.slice(0, gap), current, ...rest.slice(gap)];
    }
    const nextIdx = currentIdx + 1;
    if (nextIdx >= nextQueue.length) {
      setPhase('done');
      return;
    }
    setQueue(nextQueue);
    setCurrentIdx(nextIdx);
  };

  // --- 철자 판정 (완전 일치 / 어간 일치 / 그 외) ---
  const judgeSpelling = (typed: string, target: string): 'ok' | 'ng' => {
    const t = typed.trim().toLowerCase();
    const g = target.trim().toLowerCase();
    if (!t) return 'ng';
    if (t === g) return 'ok';
    const stem = g.replace(/(ing|ed|es|s)$/i, '');
    if (t === stem) return 'ok';
    return 'ng';
  };

  // ==========================================================================
  // 세션 끝 Cloze 보너스 핸들러
  //   메인 세션에서 Good/Easy 받은 "확실히 아는 단어" + 예문이 있는 단어만 대상.
  //   SRS 상태는 전혀 수정하지 않음(순수 복습용).
  // ==========================================================================
  const bonusCurrent = clozeBonusQueue[clozeBonusIdx];

  // 보너스 세션 카드 전환 시 UI/예문 초기화
  useEffect(() => {
    if (phase !== 'cloze-bonus' || !bonusCurrent) return;
    setFlipped(false);
    setClozeAnswer('');
    setClozeResult(null);
    setClozeHintLevel(0);
    setCurrentExample(bonusCurrent.example || loadCachedExample(bonusCurrent.english));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clozeBonusIdx, phase]);

  // 보너스 세션 시작 — Good/Easy 단어 중 "target 을 blanks 처리 가능한 예문" 만 선별
  const startClozeBonus = () => {
    const eligible: SrsWord[] = [];
    for (const w of sessionGoodWords) {
      const ex = w.example || loadCachedExample(w.english);
      if (ex && makeCloze(ex, w.english).matched) eligible.push(w);
    }
    if (eligible.length === 0) return;
    // 가볍게 셔플
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    setClozeBonusQueue(eligible);
    setClozeBonusIdx(0);
    setBonusStats({ attempted: 0, correct: 0 });
    setPhase('cloze-bonus');
  };

  // 보너스 Cloze 답 제출
  const submitCloze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusCurrent) return;
    const verdict = judgeSpelling(clozeAnswer, bonusCurrent.english);
    setClozeResult(verdict);
    setFlipped(true);
    setBonusStats(s => ({ attempted: s.attempted + 1, correct: s.correct + (verdict === 'ok' ? 1 : 0) }));
  };

  // 힌트 사다리 (1단계=첫글자, 2단계=앞 2글자, 3단계=포기 → 정답 공개)
  const revealClozeHint = () => {
    if (!bonusCurrent) return;
    if (clozeHintLevel >= 2) {
      setClozeResult('ng');
      setFlipped(true);
      setBonusStats(s => ({ attempted: s.attempted + 1, correct: s.correct }));
      return;
    }
    setClozeHintLevel(l => l + 1);
  };

  // 다음 보너스 카드로
  const continueAfterCloze = () => {
    const nextIdx = clozeBonusIdx + 1;
    if (nextIdx >= clozeBonusQueue.length) {
      setPhase('cloze-done');
      return;
    }
    setClozeBonusIdx(nextIdx);
  };

  // --- 카드 리셋 (학습 이력 초기화) ---
  const resetProgress = () => {
    if (!confirm(`${SOURCES.find(s => s.key === source)?.short} 학습 이력을 모두 초기화할까요? (다른 단어장은 유지)`)) return;
    for (const w of scopedWords) {
      try { localStorage.removeItem(stateKey(source, w.english)); } catch {}
    }
    setRetryTick(t => t + 1); // 통계 재계산 트리거
  };

  const totalStudied = useMemo(() => {
    let n = 0;
    for (const w of scopedWords) if (loadState(source, w.english)) n += 1;
    return n;
    // scopedWords, source, phase(세션 완료 후 갱신) 시 재계산
  }, [scopedWords, source, phase]);

  // ==========================================================================
  // 화면 1: setup
  // ==========================================================================
  if (phase === 'setup') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-auto">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2d7a7c]" /> 간격 반복 학습 (SRS)
            </h2>
            <button onClick={onExit} aria-label="닫기" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 p-5 max-h-[75vh] overflow-y-auto">
            {/* 단어장 선택 */}
            <div>
              <p className="mb-2.5 text-xs font-medium text-gray-500">단어장 선택</p>
              <div className="grid grid-cols-2 gap-2">
                {SOURCES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSource(s.key)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      source === s.key
                        ? 'border-[#2d7a7c] bg-[#f0f9f9] text-[#2d7a7c]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-[#2d7a7c]/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DAY 선택 */}
            <div>
              <p className="mb-2.5 text-xs font-medium text-gray-500">
                DAY 선택 {loadingSource && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
              </p>
              {loadError ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                  <p className="flex-1 text-xs text-red-500">{loadError}</p>
                  <button
                    onClick={() => { delete sourceCache.current[source]; setRetryTick(t => t + 1); }}
                    className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >다시 시도</button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  <button
                    onClick={() => setDay('all')}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      day === 'all' ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#2d7a7c]/50'
                    }`}
                  >전체 ({wordsByDay.length})</button>
                  {days.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDay(d.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        day === d.id ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-[#2d7a7c]/50'
                      }`}
                    >{d.name} <span className="opacity-60">({d.count})</span></button>
                  ))}
                  {!loadingSource && days.length === 0 && !loadError && (
                    <p className="text-xs text-gray-400">이 단어장에 등록된 단어가 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 하루 신규 카드 개수 — '전체' 는 제한 없이 이 DAY 전부 학습 */}
            <div>
              <p className="mb-2.5 text-xs font-medium text-gray-500">오늘 학습할 신규 카드 수</p>
              <div className="grid grid-cols-5 gap-2">
                {[5, 10, 15, 20, Infinity].map(n => (
                  <button
                    key={String(n)}
                    onClick={() => setNewLimit(n)}
                    className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                      newLimit === n ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white' : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >{n === Infinity ? '전체' : `${n}장`}</button>
                ))}
              </div>
              {newLimit === Infinity && (
                <p className="mt-2 text-[11px] text-gray-400">
                  선택한 DAY의 신규 단어를 모두 오늘 학습합니다.
                </p>
              )}
            </div>

            {/* 오늘의 학습 통계 — 5티어: 약점 단어 카운트 추가 (Typing Game 에서 놓친 단어) */}
            {(() => {
              const weakEngSet = new Set(weakWords.map(w => w.english.toLowerCase()));
              const weakInScope = scopedWords.filter(w => weakEngSet.has(w.english.toLowerCase())).length;
              const totalStart = weakInScope + todayStats.dueCards + Math.min(newLimit, todayStats.newCards);
              return (
                <>
                  <div className="rounded-xl bg-gradient-to-br from-[#f0f9f9] to-[#e6f4f4] p-4 border border-[#d1e8e8]">
                    <p className="text-[10px] font-bold text-[#2d7a7c] uppercase tracking-wider mb-2">오늘의 학습</p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-extrabold text-red-500">{weakInScope}</p>
                        <p className="text-[10px] text-gray-500">약점</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-[#2d7a7c]">{Math.min(newLimit, todayStats.newCards)}</p>
                        <p className="text-[10px] text-gray-500">신규</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-[#e67e22]">{todayStats.dueCards}</p>
                        <p className="text-[10px] text-gray-500">복습</p>
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold text-emerald-600">{totalStudied}</p>
                        <p className="text-[10px] text-gray-500">학습됨</p>
                      </div>
                    </div>
                    {weakInScope > 0 && (
                      <p className="mt-2 text-[11px] text-red-500/80">
                        ⚠️ 슈팅 게임에서 놓친 단어 {weakInScope}개가 이번 세션 앞부분에 우선 배치됩니다.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={startSession}
                    disabled={loadingSource || totalStart === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d7a7c] px-6 py-3 text-white transition-colors hover:bg-[#256668] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {totalStart === 0
                        ? '오늘 학습할 카드가 없습니다'
                        : `학습 시작 (${totalStart}장)`}
                    </span>
                  </button>
                </>
              );
            })()}

            {totalStudied > 0 && (
              <button
                onClick={resetProgress}
                className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2"
              >이 단어장 학습 이력 초기화</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 화면 3: 완료 — 세션 끝에서 "방금 익힌 단어로 문맥 복습" 보너스 제안
  // ==========================================================================
  if (phase === 'done') {
    const acc = sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0;
    // 보너스 Cloze 대상 — Good/Easy 받은 단어 중 예문이 있고 target 을 blanks 가능한 것만.
    const bonusEligible = sessionGoodWords.filter(w => {
      const ex = w.example || loadCachedExample(w.english);
      return !!ex && makeCloze(ex, w.english).matched;
    });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" style={{ animation: 'srsPop .4s ease-out' }}>
          <style>{`@keyframes srsPop { from { transform:scale(.85); opacity:0 } to { transform:scale(1); opacity:1 } }`}</style>
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h2 className="mb-1 text-lg font-bold text-gray-800">학습 완료!</h2>
          <p className="mb-5 text-sm text-gray-500">
            {SOURCES.find(s => s.key === source)?.short} · {day === 'all' ? '전체' : `DAY ${day}`}
          </p>
          <div className="mb-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-[#2d7a7c]">{sessionStats.reviewed}</p>
              <p className="text-xs text-gray-500">학습</p>
            </div>
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-emerald-600">{acc}%</p>
              <p className="text-xs text-gray-500">정답률</p>
            </div>
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-red-500">{sessionStats.again}</p>
              <p className="text-xs text-gray-500">Again</p>
            </div>
          </div>

          {/* 📝 문맥 복습 보너스 (선택) — 방금 Good/Easy 받은 단어가 2개 이상일 때만 노출 */}
          {bonusEligible.length >= 2 && (
            <button
              onClick={startClozeBonus}
              className="mb-3 w-full rounded-lg bg-gradient-to-r from-[#2d7a7c] to-[#4d9a9c] px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition-opacity shadow"
              title="방금 Good/Easy 받은 단어를 문장 안에서 다시 떠올려보기 (선택)"
            >
              📝 방금 익힌 단어 {bonusEligible.length}개로 문맥 복습
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                SRS 점수에 영향 없음 · 선택
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setPhase('setup')}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >설정으로</button>
            <button
              onClick={startSession}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2d7a7c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#256668]"
            ><RotateCcw className="h-4 w-4" /> 이어서 학습</button>
          </div>
          <button onClick={onExit} className="mt-3 text-xs text-gray-400 hover:text-gray-600">닫기</button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 화면 3-보너스: Cloze 보너스 세션 (방금 아는 단어만)
  // ==========================================================================
  if (phase === 'cloze-bonus' && bonusCurrent) {
    const bonusProgress = clozeBonusQueue.length > 0 ? (clozeBonusIdx / clozeBonusQueue.length) * 100 : 0;
    const bonusExample = currentExample || bonusCurrent.example || '';
    const bonusCloze = bonusExample ? makeCloze(bonusExample, bonusCurrent.english) : null;
    const bonusHintText =
      clozeHintLevel >= 2 ? `${bonusCurrent.english.slice(0, 2)}___ (${bonusCurrent.english.length}글자)` :
      clozeHintLevel === 1 ? `${bonusCurrent.english[0]}___ (${bonusCurrent.english.length}글자)` :
      `___ (${bonusCurrent.english.length}글자)`;
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#f7fbfb] via-white to-[#f0f9f9]">
        <style>{`@keyframes cardIn { from { transform:scale(.94); opacity:0 } to { transform:scale(1); opacity:1 } }`}</style>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <button onClick={() => setPhase('done')} aria-label="그만" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 mx-4">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#2d7a7c] to-[#4d9a9c] transition-all duration-300" style={{ width: `${bonusProgress}%` }} />
            </div>
            <p className="mt-1 text-center text-[10px] text-gray-400">
              문맥 복습 · {clozeBonusIdx + 1} / {clozeBonusQueue.length}
            </p>
          </div>
          <span className="text-xs font-semibold text-[#2d7a7c] w-16 text-right">보너스</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl">
            {!flipped && bonusCloze && (
              <form onSubmit={submitCloze} className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8" style={{ animation: 'cardIn .3s ease-out' }}>
                <p className="text-[11px] font-bold text-[#2d7a7c] uppercase tracking-wider mb-3">문맥에서 단어 찾기</p>
                <p className="text-lg sm:text-xl leading-relaxed text-gray-800 mb-2">{bonusCloze.blanked}</p>
                <p className="text-xs text-gray-400 mb-5">
                  뜻: <b>{bonusCurrent.korean}</b> · {bonusHintText}
                </p>
                <input
                  autoFocus
                  value={clozeAnswer}
                  onChange={e => setClozeAnswer(e.target.value)}
                  placeholder="빈칸에 들어갈 영어 단어"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-full border-2 border-gray-200 bg-white px-5 py-3 text-center text-base sm:text-lg font-medium text-gray-800 outline-none focus:border-[#2d7a7c] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!clozeAnswer.trim()}
                  className="mt-4 w-full rounded-lg bg-[#2d7a7c] px-6 py-3 text-white font-semibold hover:bg-[#256668] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >제출</button>
                <button
                  type="button"
                  onClick={revealClozeHint}
                  className="mt-2 w-full text-[12px] text-gray-500 hover:text-[#2d7a7c] underline underline-offset-2"
                >
                  {clozeHintLevel === 0 ? '힌트 — 첫 글자 보기' :
                   clozeHintLevel === 1 ? '힌트 — 앞 2글자 보기' :
                   '모르겠어요 — 정답 보기'}
                </button>
              </form>
            )}

            {flipped && (
              <div className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8" style={{ animation: 'cardIn .3s ease-out' }}>
                {clozeResult && (
                  <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                    clozeResult === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {clozeResult === 'ok' ? '✅ 정답!' : `❌ 오답 (정답: ${bonusCurrent.english})`}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-800">{bonusCurrent.english}</p>
                  <button
                    onClick={() => speakEnglish(bonusCurrent.english)}
                    aria-label="발음 듣기"
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#2d7a7c] transition-colors"
                  ><Volume2 className="w-4 h-4" /></button>
                </div>
                <p className="text-base sm:text-lg text-[#2d7a7c] font-semibold mb-3">{bonusCurrent.korean}</p>
                {bonusExample && (
                  <div className="rounded-lg bg-gray-50 p-3 mb-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">예문</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{bonusExample}</p>
                  </div>
                )}
                <button
                  onClick={continueAfterCloze}
                  className="w-full rounded-lg bg-[#2d7a7c] px-6 py-3 text-white font-semibold hover:bg-[#256668] transition-colors"
                >{clozeBonusIdx + 1 >= clozeBonusQueue.length ? '마치기' : '다음 →'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 화면 3-보너스-완료: Cloze 보너스 결과
  // ==========================================================================
  if (phase === 'cloze-done') {
    const bAcc = bonusStats.attempted > 0 ? Math.round((bonusStats.correct / bonusStats.attempted) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" style={{ animation: 'srsPop .4s ease-out' }}>
          <style>{`@keyframes srsPop { from { transform:scale(.85); opacity:0 } to { transform:scale(1); opacity:1 } }`}</style>
          <Sparkles className="mx-auto mb-3 h-12 w-12 text-[#2d7a7c]" />
          <h2 className="mb-1 text-lg font-bold text-gray-800">문맥 복습 완료!</h2>
          <p className="mb-5 text-sm text-gray-500">
            {bonusStats.attempted} 문항 · 정답 {bonusStats.correct} / 정답률 {bAcc}%
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPhase('setup')}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >설정으로</button>
            <button
              onClick={onExit}
              className="flex-1 rounded-lg bg-[#2d7a7c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#256668]"
            >닫기</button>
          </div>
        </div>
      </div>
    );
  }


  // ==========================================================================
  // 화면 2: 학습 진행 — 순수 Flashcard (영→한 재인 + 4단계 셀프평가)
  //   예전 시도했던 MC/Typing/Cloze 자동 사다리는 "모르는 단어 Cloze" 문제를 일으켜
  //   제거됨. Cloze 는 세션 완료 화면의 "📝 문맥 복습" 보너스로만 등장.
  // ==========================================================================
  if (!current) return null;
  const progress = queue.length > 0 ? (currentIdx / queue.length) * 100 : 0;
  const displayExample = currentExample;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#f7fbfb] via-white to-[#f0f9f9]">
      <style>{`@keyframes cardIn { from { transform:scale(.94); opacity:0 } to { transform:scale(1); opacity:1 } }`}</style>
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <button onClick={onExit} aria-label="닫기" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 mx-4">
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2d7a7c] to-[#4d9a9c] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-center text-[10px] text-gray-400">
            {currentIdx + 1} / {queue.length}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#2d7a7c] w-16 text-right">Flashcard</span>
      </div>

      {/* 카드 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* 앞면 — 영단어 (예문 로딩은 뒷면에서만 보여지면 되므로 앞면 가리지 않음) */}
          {!flipped && (
            <button
              onClick={() => setFlipped(true)}
              className="w-full rounded-2xl bg-white shadow-xl border border-gray-100 p-8 sm:p-12 text-center hover:shadow-2xl transition-shadow"
              style={{ animation: 'cardIn .3s ease-out' }}
            >
              <p className="text-[11px] font-bold text-[#2d7a7c] uppercase tracking-wider mb-4">단어의 뜻은?</p>
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-4xl sm:text-5xl font-extrabold text-gray-800">{current.english}</p>
                <button
                  onClick={e => { e.stopPropagation(); speakEnglish(current.english); }}
                  aria-label="발음 듣기"
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-[#2d7a7c] transition-colors"
                ><Volume2 className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-gray-400 mt-6">카드를 눌러 뜻 확인</p>
            </button>
          )}

          {/* 뒷면 — 뜻 + 예문 + 4단계 셀프평가 */}
          {flipped && (
            <div className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8" style={{ animation: 'cardIn .3s ease-out' }}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-800">{current.english}</p>
                <button
                  onClick={() => speakEnglish(current.english)}
                  aria-label="발음 듣기"
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#2d7a7c] transition-colors"
                ><Volume2 className="w-4 h-4" /></button>
              </div>
              <p className="text-base sm:text-lg text-[#2d7a7c] font-semibold mb-3">{current.korean}</p>
              {current.definition && (
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{current.definition}</p>
              )}
              {current.synonyms && (
                <p className="text-xs text-gray-400 mb-3"><b>유의어:</b> {current.synonyms}</p>
              )}
              {loadingExample && (
                <p className="text-xs text-gray-400 mb-3 italic">예문 준비 중…</p>
              )}
              {displayExample && (
                <div className="rounded-lg bg-gray-50 p-3 mb-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    예문
                    {!current.example && (
                      <span className="text-[9px] font-medium text-[#2d7a7c]/70 normal-case tracking-normal">· AI 생성</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{displayExample}</p>
                </div>
              )}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">얼마나 잘 아셨나요?</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => gradeCurrent(0)}
                  className="rounded-lg border-2 border-red-200 bg-white px-3 py-2.5 text-center hover:bg-red-50 transition-colors"
                  title="이 세션에서 몇 카드 뒤에 다시 · 다음 정식 복습은 10분 뒤"
                >
                  <p className="text-sm font-bold text-red-600">Again</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">세션 내 재시도</p>
                </button>
                <button
                  onClick={() => gradeCurrent(1)}
                  className="rounded-lg border-2 border-orange-200 bg-white px-3 py-2.5 text-center hover:bg-orange-50 transition-colors"
                  title="1일 뒤"
                >
                  <p className="text-sm font-bold text-orange-600">Hard</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">1일 뒤</p>
                </button>
                <button
                  onClick={() => gradeCurrent(2)}
                  className="rounded-lg border-2 border-emerald-200 bg-white px-3 py-2.5 text-center hover:bg-emerald-50 transition-colors"
                  title="점점 길게"
                >
                  <p className="text-sm font-bold text-emerald-600">Good</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">3~15일</p>
                </button>
                <button
                  onClick={() => gradeCurrent(3)}
                  className="rounded-lg border-2 border-sky-200 bg-white px-3 py-2.5 text-center hover:bg-sky-50 transition-colors"
                  title="넉넉히 뒤"
                >
                  <p className="text-sm font-bold text-sky-600">Easy</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">7~60일</p>
                </button>
              </div>
            </div>
          )}

          {/* 세션 통계 */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-gray-400">
            <span>학습 <b className="text-gray-600">{sessionStats.reviewed}</b></span>
            <span>정답 <b className="text-emerald-600">{sessionStats.correct}</b></span>
            <span>Again <b className="text-red-500">{sessionStats.again}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
