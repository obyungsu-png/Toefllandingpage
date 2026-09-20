/**
 * VocabularySRS.tsx
 * -----------------------------------------------------------------------------
 * SRS(Spaced Repetition System, 간격 반복 학습) 기반 단어 학습 컴포넌트.
 * - Anki 계열 SM-2 알고리즘 단순화 버전을 사용해 카드마다 "언제 다시 볼지" 계산.
 * - 5개 단어장 소스 + DAY 선택 흐름은 VocabularyTypingGame 이 쓰던 구조 재사용.
 * - 카드 형식: 기본 Flashcard, 예문(example) 이 있는 단어는 30% 확률로 Cloze 로 노출.
 * - 학습 상태는 localStorage 에 per-source-per-word 로 저장 (Supabase 연동은 추후).
 *
 * 리텐션 포인트: 앱을 열면 "오늘의 복습 N장"이 제시되어 매일 돌아올 이유를 제공.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, RotateCcw, Sparkles, Loader2, CheckCircle2, Volume2 } from 'lucide-react';
import { SATWord } from './vocaWordSets';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import { getAllWords } from './vocaWordSets';

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
  type Phase = 'setup' | 'learn' | 'done';
  const [phase, setPhase] = useState<Phase>('setup');
  const [queue, setQueue] = useState<SrsWord[]>([]);       // 오늘 학습할 카드 큐
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [clozeMode, setClozeMode] = useState(false);       // 현재 카드가 Cloze 인지
  const [clozeAnswer, setClozeAnswer] = useState('');
  const [clozeResult, setClozeResult] = useState<'ok' | 'ng' | null>(null);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, again: 0 });
  const [newLimit, setNewLimit] = useState(10);            // 하루 신규 카드 수

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
    const dueQueue: SrsWord[] = [];
    const newQueue: SrsWord[] = [];
    for (const w of scopedWords) {
      const s = loadState(source, w.english);
      if (!s) newQueue.push(w);
      else if (s.dueAt <= now) dueQueue.push(w);
    }
    // 신규는 하루 newLimit 개까지만
    const combined = [...dueQueue, ...newQueue.slice(0, newLimit)];
    if (combined.length === 0) return;
    // 랜덤 셔플 (학습 순서 다양화)
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    setQueue(combined);
    setCurrentIdx(0);
    setSessionStats({ reviewed: 0, correct: 0, again: 0 });
    pickCardMode(combined[0]);
    setFlipped(false);
    setClozeAnswer('');
    setClozeResult(null);
    setPhase('learn');
  };

  // 카드 하나의 형식(Flashcard vs Cloze) 결정
  const pickCardMode = (w: SrsWord | undefined) => {
    if (!w) { setClozeMode(false); return; }
    // 예문 있고 target 매칭 가능 + 30% 확률 → Cloze
    const canCloze = !!w.example && makeCloze(w.example, w.english).matched;
    setClozeMode(canCloze && Math.random() < 0.3);
  };

  const current = queue[currentIdx];

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

    // Again 은 이번 세션 큐 끝에 다시 붙임 (반복 학습 효과)
    let nextQueue = queue;
    if (grade === 0) {
      nextQueue = [...queue.slice(0, currentIdx + 1), current, ...queue.slice(currentIdx + 1)];
    }
    const nextIdx = currentIdx + 1;
    if (nextIdx >= nextQueue.length) {
      setPhase('done');
      return;
    }
    setQueue(nextQueue);
    setCurrentIdx(nextIdx);
    pickCardMode(nextQueue[nextIdx]);
    setFlipped(false);
    setClozeAnswer('');
    setClozeResult(null);
  };

  // --- Cloze 답 제출 ---
  const submitCloze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    const typed = clozeAnswer.trim().toLowerCase();
    const target = current.english.trim().toLowerCase();
    const stem = target.replace(/(ing|ed|es|s)$/i, '');
    const ok = typed === target || typed === stem || target.startsWith(typed) && typed.length >= Math.max(3, target.length - 2);
    setClozeResult(ok ? 'ok' : 'ng');
    // Cloze 정답 = Good(2), 오답 = Again(0). 이후 카드 뒷면(뜻/예문) 자동 노출 후 다음.
    setFlipped(true);
  };

  const continueAfterCloze = () => {
    const grade: Grade = clozeResult === 'ok' ? 2 : 0;
    gradeCurrent(grade);
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

            {/* 하루 신규 카드 개수 */}
            <div>
              <p className="mb-2.5 text-xs font-medium text-gray-500">오늘 학습할 신규 카드 수</p>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setNewLimit(n)}
                    className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                      newLimit === n ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white' : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >{n}장</button>
                ))}
              </div>
            </div>

            {/* 오늘의 학습 통계 */}
            <div className="rounded-xl bg-gradient-to-br from-[#f0f9f9] to-[#e6f4f4] p-4 border border-[#d1e8e8]">
              <p className="text-[10px] font-bold text-[#2d7a7c] uppercase tracking-wider mb-2">오늘의 학습</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-extrabold text-[#2d7a7c]">{Math.min(newLimit, todayStats.newCards)}</p>
                  <p className="text-[11px] text-gray-500">신규</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#e67e22]">{todayStats.dueCards}</p>
                  <p className="text-[11px] text-gray-500">복습</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-emerald-600">{totalStudied}</p>
                  <p className="text-[11px] text-gray-500">학습됨</p>
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={loadingSource || (todayStats.newCards === 0 && todayStats.dueCards === 0)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d7a7c] px-6 py-3 text-white transition-colors hover:bg-[#256668] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {todayStats.newCards === 0 && todayStats.dueCards === 0
                  ? '오늘 학습할 카드가 없습니다'
                  : `학습 시작 (${Math.min(newLimit, todayStats.newCards) + todayStats.dueCards}장)`}
              </span>
            </button>

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
  // 화면 3: 완료
  // ==========================================================================
  if (phase === 'done') {
    const acc = sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0;
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
  // 화면 2: 학습 진행
  // ==========================================================================
  if (!current) return null;
  const progress = queue.length > 0 ? ((currentIdx) / queue.length) * 100 : 0;
  const clozeData = clozeMode && current.example ? makeCloze(current.example, current.english) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#f7fbfb] via-white to-[#f0f9f9]">
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
        <span className="text-xs font-semibold text-[#2d7a7c] w-16 text-right">
          {clozeMode ? 'Cloze' : 'Flashcard'}
        </span>
      </div>

      {/* 카드 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Cloze 모드 */}
          {clozeMode && clozeData && !flipped && (
            <form onSubmit={submitCloze} className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8">
              <p className="text-[11px] font-bold text-[#2d7a7c] uppercase tracking-wider mb-3">문맥에서 단어 찾기</p>
              <p className="text-lg sm:text-xl leading-relaxed text-gray-800 mb-2">
                {clozeData.blanked}
              </p>
              <p className="text-xs text-gray-400 mb-5">
                힌트: {current.english[0]}로 시작 · {current.english.length}글자 · 뜻: <b>{current.korean}</b>
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
            </form>
          )}

          {/* Flashcard 앞면 (뒤집기 전) */}
          {(!clozeMode || (clozeMode && flipped && clozeData)) && !flipped && (
            <button
              onClick={() => setFlipped(true)}
              className="w-full rounded-2xl bg-white shadow-xl border border-gray-100 p-8 sm:p-12 text-center hover:shadow-2xl transition-shadow"
              style={{ animation: 'cardIn .3s ease-out' }}
            >
              <style>{`@keyframes cardIn { from { transform:scale(.94); opacity:0 } to { transform:scale(1); opacity:1 } }`}</style>
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

          {/* 뒤집힘: 뜻 + 예문 + 자체평가 */}
          {flipped && (
            <div className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8" style={{ animation: 'cardIn .3s ease-out' }}>
              {clozeMode && clozeResult && (
                <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                  clozeResult === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {clozeResult === 'ok' ? '✅ 정답!' : `❌ 오답 (정답: ${current.english})`}
                </div>
              )}
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
              {current.example && (
                <div className="rounded-lg bg-gray-50 p-3 mb-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">예문</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{current.example}</p>
                </div>
              )}

              {/* Cloze 결과 확인 후 자동으로 다음 카드 이동 버튼 */}
              {clozeMode ? (
                <button
                  onClick={continueAfterCloze}
                  className="w-full rounded-lg bg-[#2d7a7c] px-6 py-3 text-white font-semibold hover:bg-[#256668] transition-colors"
                >다음 카드</button>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">얼마나 잘 아셨나요?</p>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => gradeCurrent(0)}
                      className="rounded-lg border-2 border-red-200 bg-white px-3 py-2.5 text-center hover:bg-red-50 transition-colors"
                      title="10분 뒤 다시"
                    >
                      <p className="text-sm font-bold text-red-600">Again</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">10분 뒤</p>
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
                </>
              )}
            </div>
          )}

          {/* 세션 통계 (하단 요약) */}
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
