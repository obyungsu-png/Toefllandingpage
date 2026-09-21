import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Pause, Play, RotateCcw, Gauge, Heart, Trophy, Sparkles, Loader2, Zap, Flame, Target, CheckCircle2 } from 'lucide-react';
import { getAllWords } from './vocaWordSets';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import {
  loadGameStats, saveGameStats, applySessionDelta, bumpStreakOnLogin,
  computeLevel, type GameStats,
} from '../utils/gameStats';

// ============================================================================
// 단어 소스 — SATVocaPage의 5개 탭과 동일한 서버 엔드포인트 사용
// ============================================================================
type SourceKey = 'toefl-easy' | 'toefl-hard' | 'etymology' | 'custom' | 'junior';

const SOURCES: { key: SourceKey; label: string; short: string }[] = [
  { key: 'toefl-easy', label: 'TOEFL 어휘 학습 vol.1', short: '어휘 vol.1' },
  { key: 'toefl-hard', label: 'TOEFL 어휘 학습 vol.2', short: '어휘 vol.2' },
  { key: 'etymology', label: '기출단어', short: '기출' },
  { key: 'custom', label: '참고서 영단어', short: '참고서' },
  { key: 'junior', label: '중3+고1 영단어 vol.5', short: 'vol.5' },
];

interface GameWord {
  english: string;
  korean: string;
  synonyms: string[];
}
interface DayInfo {
  id: number;
  name: string;
  count: number;
}

// 서버 단어 → 게임 단어 정규화 (가짜 "_11_3" 접미사 단어 제외, 동의어 배열화)
function normalizeWords(raw: any[]): GameWord[] {
  return (raw || [])
    .filter(w => w?.english && w?.korean && !String(w.english).includes('_'))
    .map(w => ({
      english: String(w.english).trim(),
      korean: String(w.korean).trim(),
      synonyms: String(w.synonyms || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    }));
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

// vol.1 로컬 평백 (서버 실패 시) — vocaWordSets의 진짜 400단어를 40개씩 DAY로 묶음
function localVol1(): { words: (GameWord & { dayNumber: number })[]; days: DayInfo[] } {
  const clean = getAllWords().filter(w => !w.english.includes('_'));
  const words = clean.map((w, i) => ({
    english: w.english,
    korean: w.korean,
    synonyms: String(w.synonyms || '').split(',').map(s => s.trim()).filter(Boolean),
    dayNumber: Math.floor(i / 40) + 1,
  }));
  return { words, days: daysFromWords(words) };
}

// ============================================================================
// 효과음 — Web Audio (공유 AudioContext + 시퀀스)
// ============================================================================
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch { return null; }
}
function tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', vol = 0.08, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch { /* 무시 */ }
}
const sfx = {
  correct: () => { tone(660, 0.1); tone(880, 0.14, 'sine', 0.08, 0.06); },
  // 정답 종소리 — 맑고 경쾌한 상행 차임 (딩-동-댕)
  chime: () => {
    tone(659, 0.14, 'sine', 0.09);
    tone(880, 0.16, 'sine', 0.09, 0.07);
    tone(1109, 0.22, 'sine', 0.08, 0.14);
  },
  combo: (n: number) => { // 콤보 5단위마다 팡파레, 단계가 높을수록 화려
    const base = [523, 659, 784, 1047];
    const steps = Math.min(3, Math.floor(n / 5));
    // 상위 콤보일수록 옥타브 살짝 올림 (5~9: 1.0x, 10~14: 1.06x, 15+: 1.12x)
    const pitch = 1 + steps * 0.06;
    base.slice(0, 2 + steps).forEach((f, i) => tone(f * pitch, 0.13, 'triangle', 0.09, i * 0.07));
  },
  fever: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.06, i * 0.06)); },
  wrong: () => { tone(220, 0.16, 'sawtooth', 0.05); tone(155, 0.22, 'sawtooth', 0.05, 0.07); },
  miss: () => { tone(130, 0.22, 'square', 0.07); tone(98, 0.28, 'square', 0.06, 0.09); },
  start: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.1, 'triangle', 0.08, i * 0.07)); },
  gameover: () => { [440, 349, 294, 220].forEach((f, i) => tone(f, 0.28, 'triangle', 0.08, i * 0.18)); },
  // 대포 발사 — 낮은 펄스 + 노이즈 버스트
  cannon: () => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.26);
      // 노이즈 버스트 (발사 화약음)
      const len = Math.floor(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      const ng = ctx.createGain();
      ng.gain.value = 0.06;
      noise.connect(filter); filter.connect(ng); ng.connect(ctx.destination);
      noise.start(t);
    } catch { /* 무시 */ }
  },
  // 포탄 비행 휘파람 — 밴드패스 노이즈 스윕 (슈우웁)
  whoosh: () => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.3);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - (i / len) * 0.5);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(500, t);
      bp.frequency.exponentialRampToValueAtTime(2400, t + 0.13);
      bp.frequency.exponentialRampToValueAtTime(450, t + 0.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      src.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start(t);
    } catch { /* 무시 */ }
  },
  // 폭발 — 저음 붐 + 화약 버스트 + 크래클 + 스파클 4레이어
  explode: () => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      // 1) 저음 붐 (부드럽게)
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.28);
      og.gain.setValueAtTime(0.1, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(og); og.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.32);
      // 2) 화약 버스트 (로우패스 노이즈, 억제)
      const len = Math.floor(ctx.sampleRate * 0.18);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 800;
      const ng = ctx.createGain(); ng.gain.value = 0.08;
      noise.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
      noise.start(t);
      // 3) 명중 종소리 (따르릉 — 기계음 대신 맑은 음)
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.13, 'triangle', 0.075, i * 0.05));
    } catch { /* 무시 */ }
  },
};

// ============================================================================
// 타입 & 상수
// ============================================================================
type Direction = 'kr2en' | 'en2kr';
type SpeedLevel = 1 | 2 | 3 | 4;
type GameStatus = 'setup' | 'playing' | 'paused' | 'gameover';

interface FallingWord {
  id: number;
  prompt: string;
  answer: string;
  altAnswers: string[];
  hint: string | null; // kr→en일 때 첫글자 힌트
  x: number;
  y: number;
  speed: number;
  colorIdx: number;
  hit?: boolean; // 정답으로 맞춘 상태 — 그 자리에 멈춰 있다가 포탄 도착 시 폭발
}
interface ScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
}
interface CannonShot {
  id: number;
  fx: string;  // 발사 위치 (CSS)
  fy: string;
  tx: string;  // 목표 위치 (CSS)
  ty: string;
}
interface Boom {
  id: number;
  x: number;  // %
  y: number;  // px
}

// 낙하 속도(px/60fps 기준) + 다음 단어 spawn 간격(ms)
// 사용자 피드백 반영: 이전보다 30~40% 더 느리게 재조정.
// - 초보자도 타이핑할 시간이 충분한 '느림' (약 3.5초 낙하)
// - '매우 빠름'도 이전 '보통' 수준 (약 2초 내외)
// 파워업 아이템 정의 — 콤보 마일스톤(10/20/30/40…) 에 순환하며 자동 드롭
type ItemType = 'slow' | 'bomb' | 'heart';
const ITEM_CONFIG: Record<ItemType, { emoji: string; label: string; desc: string }> = {
  slow:  { emoji: '⏱', label: 'Slow',  desc: '5초간 낙하 속도 절반' },
  bomb:  { emoji: '💣', label: 'Bomb',  desc: '화면의 모든 단어 파괴' },
  heart: { emoji: '❤️', label: 'Heart', desc: '목숨 +1' },
};
/** 콤보 마일스톤 → 아이템 매핑. 10/40/70… slow, 20/50/80… bomb, 30/60/90… heart. */
function itemForCombo(c: number): ItemType | null {
  if (c <= 0 || c % 10 !== 0) return null;
  const stage = (c / 10) % 3; // 1=slow, 2=bomb, 0=heart
  if (stage === 1) return 'slow';
  if (stage === 2) return 'bomb';
  return 'heart';
}

const SPEED_CONFIG: Record<SpeedLevel, { label: string; fallSpeed: number; spawnMs: number }> = {
  1: { label: '느림', fallSpeed: 0.15, spawnMs: 4800 },
  2: { label: '보통', fallSpeed: 0.25, spawnMs: 4000 },
  3: { label: '빠름', fallSpeed: 0.4, spawnMs: 3200 },
  4: { label: '매우 빠름', fallSpeed: 0.6, spawnMs: 2500 },
};
const START_LIVES = 5;
const FEVER_COMBO = 10;

// 단어 칩 색상 팔레트 (그라데이션)
const CHIP_COLORS = [
  'linear-gradient(135deg,#fdfbfb,#ebedee)',
  'linear-gradient(135deg,#fff1eb,#ace0f9)',
  'linear-gradient(135deg,#f6d5f7,#fbe9d7)',
  'linear-gradient(135deg,#d4fc79,#96e6a1)',
  'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
  'linear-gradient(135deg,#fdcbf1,#e6dee9)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
];

// 영어 정답 첫글자 힌트 — "e _ _ _ _ _" (공백/하이픈 위치는 유지)
function buildHint(answer: string): string {
  return answer
    .split('')
    .map((c, i) => {
      if (c === ' ') return '  ';
      if (c === '-') return '- ';
      return i === 0 ? `${c} ` : '_ ';
    })
    .join('')
    .trim();
}

// 포탄 — WAAPI로 left/top을 직접 애니메이션 (CSS var() 키프레임 대비 확실한 동작)
function CannonShotEl({ shot }: { shot: CannonShot }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.animate(
      [{ left: shot.fx, top: shot.fy }, { left: shot.tx, top: shot.ty }],
      { duration: 340, easing: 'linear', fill: 'forwards' }
    );
  }, [shot]);
  return (
    <div ref={ref} className="pointer-events-none absolute" style={{ left: shot.fx, top: shot.fy }}>
      <span className="block" style={{ animation: 'arcY .34s ease-in-out forwards' }}>
        <span
          className="block w-4 h-4 rounded-full"
          style={{
            background: 'radial-gradient(circle at 32% 28%, #fffbe8 0%, #fde68a 25%, #f59e0b 55%, #92400e 90%)',
            boxShadow: '0 0 14px rgba(251,191,36,.95), 0 0 34px rgba(249,115,22,.6), -10px 8px 16px rgba(249,115,22,.35), inset -2px -3px 5px rgba(0,0,0,.45)',
            animation: 'ballDepth .34s ease-in-out forwards',
          }}
        />
      </span>
      {/* 궤적 잔상 */}
      <span
        className="block absolute left-1 top-1 w-2 h-2 rounded-full bg-amber-400/70 blur-[2px]"
        style={{ animation: 'arcY .34s ease-in-out .04s forwards' }}
      />
    </div>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function VocabularyTypingGame({ onExit, ownerName }: { onExit: () => void; ownerName?: string }) {
  const [source, setSource] = useState<SourceKey>('toefl-easy');
  const [days, setDays] = useState<DayInfo[]>([]);
  const [wordsByDay, setWordsByDay] = useState<(GameWord & { dayNumber: number })[]>([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [day, setDay] = useState<number | 'all'>(1);
  const [direction, setDirection] = useState<Direction>('kr2en');
  const [speedLevel, setSpeedLevel] = useState<SpeedLevel>(2);

  const [status, setStatus] = useState<GameStatus>('setup');
  const [words, setWords] = useState<FallingWord[]>([]);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);
  const [fever, setFever] = useState(false);
  const [shots, setShots] = useState<CannonShot[]>([]);
  // ── 파워업 아이템 (인벤토리 3슬롯) ──
  // 콤보 마일스톤 10/20/30/40... 에 각각 slow/bomb/heart 자동 드롭.
  const [inventory, setInventory] = useState<(ItemType | null)[]>([null, null, null]);
  const [slowUntil, setSlowUntil] = useState(0); // 슬로우 종료 timestamp (ms)
  const [itemToast, setItemToast] = useState<ItemType | null>(null);
  const lastComboRewardRef = useRef(0);

  // ── 게이미피케이션 (XP/레벨/스트릭/일일 미션) ──
  // ownerName 없으면 게스트 모드 — 서버 저장 없이 세션 통계만.
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [streakToast, setStreakToast] = useState<number | null>(null);
  const [xpToast, setXpToast] = useState<{ amount: number; missions: string[] } | null>(null);
  // 이 판(단일 세션)에 발생한 이벤트 누적 — 게임 종료 시 applySessionDelta 로 반영
  const sessionCountersRef = useRef({ words: 0, bombs: 0, slows: 0, fevers: 0 });
  const [booms, setBooms] = useState<Boom[]>([]);
  const [firing, setFiring] = useState(false);
  // 대포 조준 — 발사 시 목표 단어 쪽으로 좌우 이동 + 포신 각도 조절
  const [cannonX, setCannonX] = useState(50);
  const [barrelAngle, setBarrelAngle] = useState(0);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextIdRef = useRef(0);
  const popupIdRef = useRef(0);
  const poolRef = useRef<GameWord[]>([]);
  const recentRef = useRef<string[]>([]);
  const speedLevelRef = useRef(speedLevel);
  const comboRef = useRef(0);
  // handleSubmit의 동기적 매칭 판정용 — setState updater 부수효과는 실행 시점이 보장되지 않아
  // matchedAt이 null인 채로 발사 로직을 걄뛰는 버그가 있었음 (포탄이 아예 안 나가는 현상)
  const wordsRef = useRef<FallingWord[]>([]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  const sourceCache = useRef<Partial<Record<SourceKey, { words: (GameWord & { dayNumber: number })[]; days: DayInfo[] }>>>({});

  useEffect(() => { speedLevelRef.current = speedLevel; }, [speedLevel]);

  // 재시도 트리거용 카운터 — 실패 시 "다시 시도" 버튼으로 증가시켜 아래 useEffect 재실행
  const [retryTick, setRetryTick] = useState(0);

  // ── 소스별 단어 로드 (서버 → 캐시 → vol.1 로컬 평백) ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const cached = sourceCache.current[source];
      if (cached) {
        setWordsByDay(cached.words);
        setDays(cached.days);
        setDay(cached.days.length > 0 ? cached.days[0].id : 'all');
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
        const rawWords = data.words || [];
        const words = normalizeWords(rawWords).map((w, i) => ({
          ...w,
          dayNumber: Number(rawWords[i]?.dayNumber) || 0,
        })).filter(w => w.dayNumber > 0);
        const dayList = daysFromWords(rawWords);
        if (words.length === 0) throw new Error('단어 없음');
        if (cancelled) return;
        sourceCache.current[source] = { words, days: dayList };
        setWordsByDay(words);
        setDays(dayList);
        setDay(dayList.length > 0 ? dayList[0].id : 'all');
      } catch (err: any) {
        if (cancelled) return;
        // vol.1만 로컬 데이터로 평백 가능
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
    // retryTick 를 deps 에 포함 — 사용자가 재시도 버튼 누르면 재로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, retryTick]);

  // 별 배경 (한 번만 생성)
  const stars = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 4,
      dur: 3 + Math.random() * 4,
    })),
    []
  );

  // 속도를 바꾸면 이미 떨어지고 있는 단어들의 속도도 즉시 반영
  // (슬로우 파워업이 활성 중이면 그 배수 유지)
  useEffect(() => {
    if (status !== 'playing') return;
    const mult = Date.now() < slowUntil ? 0.5 : 1;
    setWords(prev => prev.map(w => ({ ...w, speed: SPEED_CONFIG[speedLevel].fallSpeed * mult })));
  }, [speedLevel, status, slowUntil]);

  // ── 게이미피케이션: 마운트 시 게임 통계 로드 + 오늘 첫 접속이면 스트릭 +1 ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadGameStats(ownerName || '');
      if (cancelled) return;
      const { stats: bumped, incremented } = bumpStreakOnLogin(loaded);
      setGameStats(bumped);
      if (incremented && bumped.streakCurrent > 1) {
        setStreakToast(bumped.streakCurrent);
        window.setTimeout(() => setStreakToast(null), 2600);
      }
      // 스트릭 갱신됐으면 서버에도 즉시 반영
      if (incremented && ownerName) saveGameStats(ownerName, bumped);
    })();
    return () => { cancelled = true; };
  }, [ownerName]);

  // ── 게임 종료(gameover) 진입 시 세션 델타를 XP/미션에 반영 후 서버 저장 ──
  const gameoverProcessedRef = useRef(false);
  useEffect(() => {
    if (status !== 'gameover') { gameoverProcessedRef.current = false; return; }
    if (gameoverProcessedRef.current) return;
    gameoverProcessedRef.current = true;
    if (!gameStats) return;
    const delta = {
      score,
      bestCombo,
      wordsCorrect: sessionCountersRef.current.words,
      bombsUsed: sessionCountersRef.current.bombs,
      slowsUsed: sessionCountersRef.current.slows,
      feversEntered: sessionCountersRef.current.fevers,
      completedGame: true,
    };
    const { stats: next, xpGained, completedMissions } = applySessionDelta(gameStats, delta);
    setGameStats(next);
    setXpToast({
      amount: xpGained,
      missions: completedMissions.map(m => m.label),
    });
    window.setTimeout(() => setXpToast(null), 4200);
    if (ownerName) saveGameStats(ownerName, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── 콤보 마일스톤 → 아이템 자동 드롭 ──
  useEffect(() => {
    if (status !== 'playing') return;
    if (combo <= 0 || combo <= lastComboRewardRef.current) return;
    const item = itemForCombo(combo);
    if (!item) return;
    lastComboRewardRef.current = combo;
    // 첫 빈 슬롯에 삽입 (가득 차면 무시)
    setInventory(prev => {
      const idx = prev.findIndex(s => s === null);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = item;
      return next;
    });
    setItemToast(item);
    sfx.chime();
    window.setTimeout(() => setItemToast(cur => (cur === item ? null : cur)), 1600);
  }, [combo, status]);

  /** 인벤토리 슬롯 발동 — 클릭 or 숫자키 */
  const useItem = (slotIdx: number) => {
    if (status !== 'playing') return;
    const item = inventory[slotIdx];
    if (!item) return;
    setInventory(prev => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });

    if (item === 'bomb') {
      // 화면의 모든 non-hit 단어 파괴 + 대량 점수
      const targets = wordsRef.current.filter(w => !w.hit);
      if (targets.length === 0) { sfx.explode(); return; }
      let gain = 0;
      targets.forEach(w => {
        const bid = popupIdRef.current++;
        setBooms(prev => [...prev, { id: bid, x: w.x, y: w.y }]);
        window.setTimeout(() => setBooms(prev => prev.filter(b => b.id !== bid)), 700);
        gain += 20;
      });
      setWords(prev => prev.filter(w => w.hit));
      setScore(s => s + gain);
      setCleared(n => n + targets.length);
      sessionCountersRef.current.bombs += 1; // 미션 진행도 (bomb N회 사용)
      sfx.explode();
      sfx.cannon();
      // 화면 흔들림
      const area = gameAreaRef.current;
      if (area) {
        area.style.animation = 'shakeX .4s ease-out';
        window.setTimeout(() => { area.style.animation = ''; }, 420);
      }
    } else if (item === 'slow') {
      const until = Date.now() + 5000;
      setSlowUntil(until);
      // 이미 떨어지는 단어들도 즉시 감속 (원복은 위 useEffect 가 slowUntil 만료 후 재실행 X → 5초 뒤 직접 setWords)
      setWords(prev => prev.map(w => ({ ...w, speed: SPEED_CONFIG[speedLevelRef.current].fallSpeed * 0.5 })));
      sessionCountersRef.current.slows += 1;
      sfx.chime();
      window.setTimeout(() => {
        // 만료 시 현재 속도 원복 (단, 그 사이 다시 slow 를 걸었으면 유지)
        if (Date.now() >= until) {
          setSlowUntil(0);
          setWords(prev => prev.map(w => ({ ...w, speed: SPEED_CONFIG[speedLevelRef.current].fallSpeed })));
        }
      }, 5100);
    } else if (item === 'heart') {
      setLives(l => Math.min(START_LIVES, l + 1));
      sfx.chime();
    }
    // 클릭 후 입력창에 포커스 복귀 (게임 진행 유지)
    window.setTimeout(() => inputRef.current?.focus(), 30);
  };

  const startGame = () => {
    poolRef.current = day === 'all' ? wordsByDay : wordsByDay.filter(w => w.dayNumber === day);
    if (poolRef.current.length === 0) return;
    recentRef.current = [];
    setWords([]);
    setPopups([]);
    setShots([]);
    setBooms([]);
    setScore(0);
    setLives(START_LIVES);
    setCombo(0);
    comboRef.current = 0;
    setBestCombo(0);
    setCleared(0);
    setInput('');
    setFlash(null);
    setFever(false);
    // 파워업 인벤토리/보상 상태 리셋
    setInventory([null, null, null]);
    setSlowUntil(0);
    setItemToast(null);
    lastComboRewardRef.current = 0;
    // 세션 이벤트 카운터 리셋 (XP/미션 계산용)
    sessionCountersRef.current = { words: 0, bombs: 0, slows: 0, fevers: 0 };
    lastSpawnRef.current = 0;
    setStatus('playing');
    sfx.start();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const spawnWord = useCallback(() => {
    const pool = poolRef.current;
    if (pool.length === 0) return;

    let candidate = pool[Math.floor(Math.random() * pool.length)];
    let tries = 0;
    while (recentRef.current.includes(candidate.english) && tries < 8 && pool.length > 3) {
      candidate = pool[Math.floor(Math.random() * pool.length)];
      tries += 1;
    }
    recentRef.current.push(candidate.english);
    if (recentRef.current.length > Math.min(8, Math.max(3, pool.length - 1))) {
      recentRef.current.shift();
    }

    const isKr2En = direction === 'kr2en';
    const prompt = isKr2En ? candidate.korean : candidate.english;
    const answer = isKr2En ? candidate.english : candidate.korean;
    const altAnswers = isKr2En
      ? candidate.synonyms
      : candidate.korean.split(/[,，、;·\/]/).map(s => s.trim()).filter(s => s && s !== candidate.korean);

    setWords(prev => [
      ...prev,
      {
        id: nextIdRef.current++,
        prompt,
        answer,
        altAnswers,
        hint: isKr2En ? buildHint(candidate.english) : null,
        x: 8 + Math.random() * 76,
        y: -14,
        speed: SPEED_CONFIG[speedLevelRef.current].fallSpeed,
        colorIdx: nextIdRef.current % CHIP_COLORS.length,
      },
    ]);
  }, [direction]);

  // 게임 루프
  useEffect(() => {
    if (status !== 'playing') return;

    lastFrameRef.current = performance.now();
    lastSpawnRef.current = performance.now() - SPEED_CONFIG[speedLevelRef.current].spawnMs + 400;

    const tick = (now: number) => {
      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;

      if (now - lastSpawnRef.current > SPEED_CONFIG[speedLevelRef.current].spawnMs) {
        lastSpawnRef.current = now;
        spawnWord();
      }

      const areaHeight = gameAreaRef.current?.clientHeight || 420;
      setWords(prev => {
        const kept: FallingWord[] = [];
        let missed = 0;
        for (const w of prev) {
          if (w.hit) { kept.push(w); continue; } // 명중된 단어는 폭발까지 그 자리에 고정
          const ny = w.y + w.speed * (dt / 16.6);
          if (ny > areaHeight - 36) missed += 1;
          else kept.push({ ...w, y: ny });
        }
        if (missed > 0) {
          sfx.miss();
          comboRef.current = 0;
          setCombo(0);
          setFever(false);
          lastComboRewardRef.current = 0; // 스트릭 끊김 → 다음 콤보 마일스톤 재보상 허용
          setShake(true);
          window.setTimeout(() => setShake(false), 350);
          setLives(l => {
            const nl = Math.max(0, l - missed);
            // gameover sfx 중복 재생 방지 — 이번 프레임에 처음 0에 닿을 때만 트리거
            if (nl === 0 && l > 0) {
              setStatus('gameover');
              sfx.gameover();
            }
            return nl;
          });
        }
        return kept;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, spawnWord]);

  const addPopup = (x: number, y: number, text: string) => {
    const id = popupIdRef.current++;
    setPopups(prev => [...prev, { id, x, y, text }]);
    window.setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 800);
  };

  // 대포 발사 — 목표 쪽으로 대포가 이동/조준한 뒤 포탄이 포물선으로 날아가 폭발
  const fireCannon = (target: { x: number; y: number }, gainText: string, hitId: number) => {
    const areaH = gameAreaRef.current?.clientHeight || 420;
    const areaW = gameAreaRef.current?.clientWidth || 800;
    // 대포를 목표 아래쪽으로 이동시키고, 포신을 목표 방향으로 기울임
    const nextX = Math.max(10, Math.min(90, target.x));
    setCannonX(nextX);
    const dx = ((target.x - nextX) / 100) * areaW;
    const dy = Math.max(60, areaH - 30 - target.y);
    const angle = Math.max(-55, Math.min(55, (Math.atan2(dx, dy) * 180) / Math.PI));
    setBarrelAngle(angle);
    const id = popupIdRef.current++;
    setShots(prev => [...prev, { id, fx: `${nextX}%`, fy: `${areaH - 52}px`, tx: `${target.x}%`, ty: `${target.y}px` }]);
    setFiring(true);
    sfx.cannon();
    window.setTimeout(() => sfx.whoosh(), 60);
    window.setTimeout(() => {
      setShots(prev => prev.filter(s => s.id !== id));
      // 명중 표시된 단어를 이 시점에 제거 — 단어가 폭발하며 사라지는 연출
      setWords(prev => prev.filter(w => w.id !== hitId));
      const bid = popupIdRef.current++;
      setBooms(prev => [...prev, { id: bid, x: target.x, y: target.y }]);
      sfx.explode();
      addPopup(target.x, target.y, gainText);
      // 명중 충격으로 화면 미세 흔들림
      const area = gameAreaRef.current;
      if (area) {
        area.style.animation = 'shakeSmall .3s ease-out';
        window.setTimeout(() => { area.style.animation = ''; }, 320);
      }
      window.setTimeout(() => setBooms(prev => prev.filter(b => b.id !== bid)), 700);
    }, 340);
    window.setTimeout(() => setFiring(false), 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'playing' || !input.trim()) return;

    // 답 정규화 — 여분 공백 압축 + 소문자 + 영어 앞의 관사(a/an/the) 무시.
    // 예) "the apple" == "apple", " a  car " == "car"
    const normalize = (s: string) =>
      s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^(a|an|the)\s+/, '');
    const typed = normalize(input);

    // wordsRef로 동기 판정 — updater 부수효과 방식은 발사가 누락될 수 있음
    const current = wordsRef.current;
    const idx = current.findIndex(
      w =>
        !w.hit && (
          normalize(w.answer) === typed ||
          w.altAnswers.some(a => normalize(a) === typed)
        )
    );
    const matchedAt: { x: number; y: number } | null = idx !== -1 ? { x: current[idx].x, y: current[idx].y } : null;
    const hitId = idx !== -1 ? current[idx].id : -1;
    if (idx !== -1) {
      // 단어를 즉시 지우지 않고 명중 상태로 표시 — 포탄이 도착하면 폭발하며 사라짐
      setWords(prev => prev.map(w => (w.id === hitId ? { ...w, hit: true } : w)));
    }

    if (matchedAt) {
      comboRef.current += 1;
      const c = comboRef.current;
      setCombo(c);
      setBestCombo(b => Math.max(b, c));
      const isFever = c >= FEVER_COMBO;
      if (isFever && !fever) {
        setFever(true);
        sfx.fever();
        sessionCountersRef.current.fevers += 1; // 미션 진행도 (fever 진입)
      } else if (c % 5 === 0) {
        sfx.combo(c);
      } else {
        sfx.chime(); // 정답 종소리 (기계음 대신)
      }
      const gain = (10 + Math.min(20, c * 2)) * (isFever ? 2 : 1);
      setScore(s => s + gain);
      sessionCountersRef.current.words += 1; // 미션/XP (정답 단어 수)
      setCleared(n => n + 1);
      setFlash('correct');
      fireCannon(matchedAt as { x: number; y: number }, `+${gain}`, hitId);
    } else {
      sfx.wrong();
      comboRef.current = 0;
      setCombo(0);
      setFever(false);
      lastComboRewardRef.current = 0; // 스트릭 끊김
      setFlash('wrong');
    }
    setInput('');
    window.setTimeout(() => setFlash(null), 220);
  };

  const togglePause = () => setStatus(s => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));

  // paused → playing 재개 시 input 자동 포커스 (모바일에서는 키보드 재노출)
  useEffect(() => {
    if (status === 'playing') {
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [status]);

  // 키보드 단축키 — Esc 로 일시정지/재개 토글 (playing/paused 상태일 때만)
  useEffect(() => {
    if (status !== 'playing' && status !== 'paused') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status]);

  const promptLabel = direction === 'kr2en'
    ? '한글 뜻을 보고 영어 단어를 입력하세요 (첫글자 힌트 제공)'
    : '영어 단어를 보고 한글 뜻을 입력하세요';

  const dayWordCount = day === 'all' ? wordsByDay.length : wordsByDay.filter(w => w.dayNumber === day).length;

  // ==========================================================================
  // 화면: 설정
  // ==========================================================================
  if (status === 'setup') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-auto">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2d7a7c]" /> 단어 타이핑 게임
            </h2>
            <button onClick={onExit} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 p-5 max-h-[75vh] overflow-y-auto">
            {/* ── 게이미피케이션: 레벨/XP/스트릭 + 오늘의 미션 3개 ── */}
            {gameStats && (() => {
              const lv = computeLevel(gameStats.xp);
              return (
                <div className="rounded-xl bg-gradient-to-br from-[#1e6b73] via-[#2d7a7c] to-[#3d8a8c] p-4 text-white shadow-lg">
                  {/* 레벨 + 스트릭 + XP 바 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-lg">
                      {lv.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">Lv. {lv.level}</span>
                        <span className="text-[11px] opacity-80">{lv.currentLevelXp} / {lv.needed} XP</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-300 to-yellow-200 transition-all" style={{ width: `${lv.percent}%` }} />
                      </div>
                    </div>
                    {gameStats.streakCurrent > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-orange-500/30 px-2.5 py-1">
                        <Flame className="w-3.5 h-3.5 fill-orange-300 text-orange-300" />
                        <span className="text-sm font-bold">{gameStats.streakCurrent}일</span>
                      </div>
                    )}
                  </div>

                  {/* 오늘의 미션 */}
                  <div className="pt-3 border-t border-white/15">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-2 flex items-center gap-1">
                      <Target className="w-3 h-3" /> 오늘의 미션
                    </p>
                    <div className="space-y-1.5">
                      {gameStats.dailyMissions.map(m => (
                        <div key={m.id} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${m.completed ? 'bg-emerald-500/25' : 'bg-white/10'}`}>
                          {m.completed
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                            : <span className="w-4 h-4 rounded-full border border-white/40 shrink-0" />}
                          <span className={`flex-1 text-xs ${m.completed ? 'line-through opacity-70' : ''}`}>{m.label}</span>
                          <span className="text-[10px] opacity-80 shrink-0">
                            {Math.min(m.progress, m.target)}/{m.target}
                          </span>
                          <span className="text-[10px] font-bold text-amber-200 shrink-0">+{m.rewardXp} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

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
                    onClick={() => {
                      // 실패한 소스 캐시 제거 후 재요청 트리거
                      delete sourceCache.current[source];
                      setRetryTick(t => t + 1);
                    }}
                    className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  <button
                    onClick={() => setDay('all')}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      day === 'all'
                        ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-[#2d7a7c]/50'
                    }`}
                  >
                    전체 ({wordsByDay.length})
                  </button>
                  {days.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDay(d.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        day === d.id
                          ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-[#2d7a7c]/50'
                      }`}
                    >
                      {d.name} <span className="opacity-60">({d.count})</span>
                    </button>
                  ))}
                  {!loadingSource && days.length === 0 && !loadError && (
                    <p className="text-xs text-gray-400">이 단어장에 등록된 단어가 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 방향 선택 */}
            <div>
              <p className="mb-2.5 text-xs font-medium text-gray-500">문제 방향</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDirection('kr2en')}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    direction === 'kr2en'
                      ? 'border-[#2d7a7c] bg-[#f0f9f9] text-[#2d7a7c]'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  한글 → 영어
                  <span className="mt-0.5 block text-[10px] font-normal text-gray-400">뜻이 낙하하면 영어로 입력 (첫글자 힌트)</span>
                </button>
                <button
                  onClick={() => setDirection('en2kr')}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    direction === 'en2kr'
                      ? 'border-[#2d7a7c] bg-[#f0f9f9] text-[#2d7a7c]'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  영어 → 한글
                  <span className="mt-0.5 block text-[10px] font-normal text-gray-400">단어가 낙하하면 한글로 입력</span>
                </button>
              </div>
            </div>

            {/* 속도 선택 */}
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Gauge className="h-3.5 w-3.5" /> 낙하 속도 (게임 중에도 변경 가능)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as SpeedLevel[]).map(lv => (
                  <button
                    key={lv}
                    onClick={() => setSpeedLevel(lv)}
                    className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                      speedLevel === lv
                        ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {SPEED_CONFIG[lv].label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={loadingSource || dayWordCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d7a7c] px-6 py-3 text-white transition-colors hover:bg-[#256668] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 fill-white" />
              <span className="text-sm font-semibold">
                게임 시작 {dayWordCount > 0 ? `(${dayWordCount}단어)` : ''}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 화면: 게임오버
  // ==========================================================================
  if (status === 'gameover') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" style={{ animation: 'gameoverPop .4s ease-out' }}>
          <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h2 className="mb-1 text-lg font-bold text-gray-800">게임 종료!</h2>
          <p className="mb-4 text-sm text-gray-500">
            {SOURCES.find(s => s.key === source)?.short} · {day === 'all' ? '전체' : `DAY ${day}`} · {direction === 'kr2en' ? '한글→영어' : '영어→한글'}
          </p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-[#2d7a7c]">{score}</p>
              <p className="text-xs text-gray-500">점수</p>
            </div>
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-[#e67e22]">{bestCombo}</p>
              <p className="text-xs text-gray-500">최고 콤보</p>
            </div>
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-emerald-600">{cleared}</p>
              <p className="text-xs text-gray-500">맞춘 단어</p>
            </div>
          </div>

          {/* XP 획득 + 완료 미션 알림 (게임 종료 useEffect 에서 세팅) */}
          {xpToast && (
            <div className="mb-4 rounded-xl bg-gradient-to-r from-[#1e6b73] to-[#2d7a7c] p-3 text-white shadow-lg" style={{ animation: 'gameoverPop .4s ease-out' }}>
              <div className="flex items-center justify-center gap-2 text-lg font-extrabold">
                <Sparkles className="w-5 h-5 text-amber-300" />
                +{xpToast.amount} XP 획득!
              </div>
              {xpToast.missions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">완료 미션</p>
                  {xpToast.missions.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStatus('setup')}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              설정으로
            </button>
            <button
              onClick={startGame}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2d7a7c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#256668]"
            >
              <RotateCcw className="h-4 w-4" /> 다시하기
            </button>
          </div>
          <button onClick={onExit} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
            훈련 메뉴로 나가기
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 화면: 플레이 중 / 일시정지
  // ==========================================================================
  return (
    <div
      className="tg-root fixed left-0 right-0 top-0 z-50 flex flex-col"
      style={{
        background: fever
          ? 'linear-gradient(180deg,#2a0a3a 0%,#3b1354 50%,#0f1b2e 100%)'
          : 'linear-gradient(180deg,#0b1026 0%,#131a3a 60%,#0f1b1c 100%)',
        transition: 'background 0.6s',
      }}
    >
      <style>{`
        /* 모바일 키보드 노출 시 게임 영역이 밀리도록 dynamic viewport 사용. dvh 미지원은 vh로 fallback. */
        .tg-root { height: 100vh; }
        @supports (height: 100dvh) { .tg-root { height: 100dvh; } }
        @keyframes twinkle { 0%,100% { opacity:.2 } 50% { opacity:1 } }
        @keyframes scoreFloat { 0% { opacity:1; transform:translate(-50%,0) scale(1) } 100% { opacity:0; transform:translate(-50%,-60px) scale(1.3) } }
        @keyframes wordDrop { from { transform:translateX(-50%) scale(.6); opacity:0 } to { transform:translateX(-50%) scale(1); opacity:1 } }
        @keyframes shakeX { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes feverPulse { 0%,100%{opacity:.9} 50%{opacity:1} }
        @keyframes gameoverPop { from { transform:scale(.8); opacity:0 } to { transform:scale(1); opacity:1 } }
        @keyframes cannonFly { from { left:var(--fx); top:var(--fy) } to { left:var(--tx); top:var(--ty) } }
        @keyframes arcY { 0% { transform:translateY(6px) } 45% { transform:translateY(-52px) } 100% { transform:translateY(0) } }
        @keyframes ballDepth { 0% { transform:scale(.65) } 55% { transform:scale(1.2) } 100% { transform:scale(.9) } }
        @keyframes hitPulse { 0%,100% { transform:translateX(-50%) scale(1) } 50% { transform:translateX(-50%) scale(1.08) } }
        @keyframes scoreBump { 0% { transform:scale(1.5); color:#4ade80 } 100% { transform:scale(1) } }
        @keyframes boomFlash { 0% { transform:translate(-50%,-50%) scale(.3); opacity:1 } 100% { transform:translate(-50%,-50%) scale(2.8); opacity:0 } }
        @keyframes ringExpand { 0% { transform:translate(-50%,-50%) scale(.2); opacity:.95 } 100% { transform:translate(-50%,-50%) scale(2); opacity:0 } }
        @keyframes particleFly { from { transform:translate(-50%,-50%) rotate(var(--a)) translateX(0); opacity:1 } to { transform:translate(-50%,-50%) rotate(var(--a)) translateX(var(--d)); opacity:0 } }
        @keyframes recoil { 0% { transform:translateY(0) } 25% { transform:translateY(10px) } 100% { transform:translateY(0) } }
        @keyframes muzzle { 0% { transform:translate(-50%,-100%) scale(.5); opacity:1 } 100% { transform:translate(-50%,-100%) scale(2.1); opacity:0 } }
        @keyframes shakeSmall { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 50%{transform:translateX(4px)} 75%{transform:translateX(-2px)} }
        @keyframes toastPop { 0% { transform:translate(-50%,10px) scale(.7); opacity:0 } 40% { transform:translate(-50%,-4px) scale(1.15); opacity:1 } 100% { transform:translate(-50%,0) scale(1); opacity:1 } }
      `}</style>

      {/* 스트릭 갱신 축하 토스트 (플레이 화면에도 뜸) */}
      {streakToast && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-20 rounded-full bg-orange-500/90 px-4 py-2 text-white font-bold shadow-2xl flex items-center gap-2" style={{ animation: 'toastPop .4s ease-out' }}>
          <Flame className="w-4 h-4 fill-orange-200" />
          {streakToast}일 연속 접속! 🎉
        </div>
      )}

      {/* 별 배경 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`, top: `${s.top}%`,
              width: s.size, height: s.size,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* HUD — 모바일에서 좁아지지 않도록 gap/크기 반응형 */}
      <div className="relative flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 border-b border-white/10 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onExit} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="나가기">
            <X className="h-5 w-5" />
          </button>
          {gameStats && (
            <span className="rounded-full bg-[#2d7a7c]/40 border border-[#2d7a7c]/60 px-2 py-0.5 text-[11px] sm:text-xs font-bold text-emerald-100" title={`Lv. ${computeLevel(gameStats.xp).level} · 총 ${gameStats.xp} XP`}>
              Lv. {computeLevel(gameStats.xp).level}
            </span>
          )}
          <span key={score} className="inline-block text-base sm:text-lg font-bold text-white" style={{ animation: 'scoreBump .35s ease-out' }}>
            {score}<span className="ml-1 text-xs font-normal text-white/50">점</span>
          </span>
          {combo > 1 && (
            <span className={`rounded-full px-2 py-0.5 text-xs sm:text-sm font-semibold ${fever ? 'bg-fuchsia-500/30 text-fuchsia-200' : 'bg-[#e67e22]/20 text-[#f0a860]'}`}>
              🔥 {combo} 콤보{fever ? ' ×2' : ''}
            </span>
          )}
          {gameStats?.streakCurrent && gameStats.streakCurrent > 0 && (
            <span className="hidden sm:flex items-center gap-1 rounded-full bg-orange-500/25 px-2 py-0.5 text-xs font-semibold text-orange-200" title={`연속 접속 ${gameStats.streakCurrent}일 · 최고 ${gameStats.streakBest}일`}>
              <Flame className="w-3 h-3 fill-orange-300" /> {gameStats.streakCurrent}일
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {Array.from({ length: START_LIVES }, (_, i) => (
            <Heart key={i} className={`h-4 w-4 sm:h-5 sm:w-5 transition-all ${i < lives ? 'fill-red-500 text-red-500 scale-100' : 'text-white/20 scale-90'}`} />
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/10 p-0.5">
            {([1, 2, 3, 4] as SpeedLevel[]).map(lv => (
              <button
                key={lv}
                onClick={() => setSpeedLevel(lv)}
                title={SPEED_CONFIG[lv].label}
                aria-label={`속도 ${SPEED_CONFIG[lv].label}`}
                // 모바일 터치 타깃 확대 (h-8 w-8) — 데스크탑은 원래 크기 유지
                className={`h-8 w-8 sm:h-6 sm:w-6 rounded-full text-xs sm:text-[10px] font-bold transition-colors ${
                  speedLevel === lv ? 'bg-[#2d7a7c] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
          <button
            onClick={togglePause}
            className="rounded-full bg-white/10 p-2 sm:p-2 text-white/80 hover:bg-white/20 hover:text-white"
            title={status === 'paused' ? '재개' : '일시정지'}
            aria-label={status === 'paused' ? '재개' : '일시정지'}
          >
            {status === 'paused' ? <Play className="h-5 w-5 sm:h-4 sm:w-4" /> : <Pause className="h-5 w-5 sm:h-4 sm:w-4" />}
          </button>
        </div>
      </div>

      {fever && (
        <div className="relative text-center py-1" style={{ animation: 'feverPulse 1s ease-in-out infinite' }}>
          <span className="inline-flex items-center gap-1 text-xs font-extrabold tracking-widest text-fuchsia-300">
            <Zap className="w-3.5 h-3.5 fill-fuchsia-300" /> FEVER TIME — 점수 2배! <Zap className="w-3.5 h-3.5 fill-fuchsia-300" />
          </span>
        </div>
      )}
      {!fever && <p className="relative px-4 pt-2 text-center text-xs text-white/40">{promptLabel}</p>}

      {/* 게임 영역 — 모바일 키보드가 올라와도 최소 낙하 공간(240px) 확보 */}
      <div
        ref={gameAreaRef}
        className="relative flex-1 overflow-hidden min-h-[240px]"
        style={shake ? { animation: 'shakeX 0.35s ease-out' } : undefined}
      >
        {words.map(w => (
          <div
            key={w.id}
            className="absolute -translate-x-1/2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-base sm:text-lg font-semibold text-gray-800"
            style={{
              left: `${w.x}%`,
              top: `${w.y}px`,
              background: w.hit ? 'linear-gradient(135deg,#fecaca,#f87171)' : CHIP_COLORS[w.colorIdx],
              boxShadow: w.hit
                ? '0 0 22px rgba(248,113,113,.9), 0 4px 10px rgba(0,0,0,.3)'
                : fever
                  ? '0 0 18px rgba(232,121,249,.55), 0 4px 10px rgba(0,0,0,.3)'
                  : combo >= 5
                    ? '0 0 14px rgba(240,168,96,.45), 0 4px 10px rgba(0,0,0,.3)'
                    : '0 4px 10px rgba(0,0,0,.35)',
              animation: w.hit ? 'hitPulse .34s ease-in-out infinite' : 'wordDrop .25s ease-out',
            }}
          >
            <div className="whitespace-nowrap">{w.prompt}</div>
            {w.hint && (
              <div className="mt-1 font-mono text-xs sm:text-sm tracking-wider text-[#2d7a7c]/80">{w.hint}</div>
            )}
          </div>
        ))}

        {/* 대포 포탄 — WAAPI로 좌표 직접 애니메이션 (CSS var 키프레임은 웹뷰에서 무효화될 수 있음) */}
        {shots.map(s => (
          <CannonShotEl key={s.id} shot={s} />
        ))}

        {/* 폭발 이펙트 — 배경 글로우 + 플래시 + 이중 충격파 링 + 원근 파편 16개 */}
        {booms.map(b => (
          <div key={b.id} className="pointer-events-none absolute" style={{ left: `${b.x}%`, top: `${b.y}px` }}>
            {/* 배경 글로우 (뒤쪽, 블러로 원근감) */}
            <div
              className="absolute w-28 h-28 rounded-full blur-md"
              style={{
                background: 'radial-gradient(circle, rgba(249,115,22,.55) 0%, rgba(239,68,68,.25) 55%, transparent 75%)',
                transform: 'translate(-50%,-50%)',
                animation: 'boomFlash .55s ease-out forwards',
              }}
            />
            <div
              className="absolute w-20 h-20 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,244,200,.98) 0%, rgba(251,146,60,.85) 35%, rgba(239,68,68,.35) 65%, rgba(239,68,68,0) 80%)',
                animation: 'boomFlash .45s ease-out forwards',
              }}
            />
            <div
              className="absolute w-20 h-20 rounded-full border-[3px] border-amber-300/80"
              style={{ animation: 'ringExpand .5s ease-out forwards' }}
            />
            <div
              className="absolute w-24 h-24 rounded-full border-2 border-orange-400/50"
              style={{ animation: 'ringExpand .6s ease-out .08s forwards', opacity: 0 }}
            />
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3 + (i % 3) * 2,
                  height: 3 + (i % 3) * 2,
                  background: i % 3 === 0 ? '#fef3c7' : i % 2 ? '#fbbf24' : '#f97316',
                  boxShadow: '0 0 7px rgba(251,146,60,.95)',
                  filter: i % 4 === 3 ? 'blur(1.5px)' : undefined, // 뒤로 날아가는 파편은 흐리게 (원근)
                  animation: `particleFly ${0.4 + (i % 4) * 0.07}s ease-out forwards`,
                  ['--a' as any]: `${i * 22.5}deg`,
                  ['--d' as any]: `${42 + (i % 5) * 12}px`,
                }}
              />
            ))}
          </div>
        ))}

        {/* 대포 — 19세기 야포 스타일. 목표 방향으로 좌우 이동 + 포신 회전 조준.
             SVG 로 리벳/장약/차대/바퀴 스포크까지 상세 렌더 (진짜 대포 느낌). */}
        <div
          className="pointer-events-none absolute bottom-1"
          style={{
            left: `${cannonX}%`,
            transform: 'translateX(-50%)',
            transition: 'left .22s ease-out',
          }}
        >
          {/* 지면 그림자 */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-24 h-3 rounded-[50%] bg-black/55 blur-[3px]" />
          <div style={firing ? { animation: 'recoil .34s ease-out' } : undefined}>
            <svg width="96" height="80" viewBox="0 0 96 80" style={{ overflow: 'visible' }}>
              <defs>
                {/* 포신 실린더 (금속 하이라이트) */}
                <linearGradient id="tg-barrel" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0b1220" />
                  <stop offset="30%" stopColor="#3f4a5c" />
                  <stop offset="50%" stopColor="#93a2b6" />
                  <stop offset="70%" stopColor="#3f4a5c" />
                  <stop offset="100%" stopColor="#0b1220" />
                </linearGradient>
                {/* 포구 (금색) */}
                <linearGradient id="tg-muzzle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="60%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                {/* 차대(나무) */}
                <linearGradient id="tg-carriage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5a2b" />
                  <stop offset="50%" stopColor="#6b3f1e" />
                  <stop offset="100%" stopColor="#3f2410" />
                </linearGradient>
                {/* 바퀴 림 */}
                <radialGradient id="tg-wheel" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#7a4a24" />
                  <stop offset="70%" stopColor="#4a2c14" />
                  <stop offset="100%" stopColor="#1f120a" />
                </radialGradient>
              </defs>

              {/* ---- 차대 (수평 유지) ---- */}
              {/* 뒤쪽 트레일 */}
              <path d="M 30 62 L 66 62 L 78 74 L 18 74 Z" fill="url(#tg-carriage)" stroke="#2b1509" strokeWidth="1" />
              {/* 상단 목재 볼트 라인 */}
              <line x1="24" y1="66" x2="72" y2="66" stroke="#2b1509" strokeWidth="0.6" opacity="0.6" />
              {/* 볼트 리벳 */}
              {[28, 40, 56, 68].map((cx, i) => (
                <circle key={i} cx={cx} cy="66" r="1.2" fill="#3f2410" stroke="#c9a56a" strokeWidth="0.4" />
              ))}
              {/* 축(axle) */}
              <rect x="12" y="70" width="72" height="4" rx="1.5" fill="#2b1509" />

              {/* ---- 바퀴 두 개 (자연스러운 스포크) ---- */}
              {[22, 74].map((cx) => (
                <g key={cx} transform={`translate(${cx} 72)`}>
                  {/* 바퀴 림 */}
                  <circle r="10" fill="url(#tg-wheel)" stroke="#1f120a" strokeWidth="1.2" />
                  {/* 스포크 6개 */}
                  {[0, 60, 120, 180, 240, 300].map(deg => (
                    <line
                      key={deg}
                      x1="0" y1="0"
                      x2={Math.cos((deg * Math.PI) / 180) * 8}
                      y2={Math.sin((deg * Math.PI) / 180) * 8}
                      stroke="#c9a56a" strokeWidth="1.2" strokeLinecap="round"
                    />
                  ))}
                  {/* 허브 */}
                  <circle r="2.4" fill="#c9a56a" stroke="#3f2410" strokeWidth="0.6" />
                  <circle r="0.9" fill="#3f2410" />
                </g>
              ))}

              {/* ---- 포신 그룹 (조준각 회전, 축은 트러니언 지점) ---- */}
              <g style={{
                transform: `rotate(${barrelAngle}deg)`,
                transformOrigin: '48px 56px',
                transition: 'transform .18s ease-out',
              }}>
                {/* 트러니언(회전 축, 금장 힘줄) */}
                <circle cx="48" cy="56" r="4" fill="#c9a56a" stroke="#78350f" strokeWidth="1" />
                <circle cx="48" cy="56" r="1.6" fill="#3f2410" />
                {/* 포신 몸체 (사다리꼴: 뿌리쪽 굵고 포구쪽 좁게 — 실제 야포 형태) */}
                <path d="M 42 56 L 54 56 L 51.5 6 L 44.5 6 Z" fill="url(#tg-barrel)" stroke="#0b1220" strokeWidth="0.8" />
                {/* 포신 밴드(3줄, 강도 보강 링) */}
                {[16, 28, 42].map((y, i) => (
                  <rect key={i} x="41" y={y} width="14" height="2.2" rx="1" fill="#111827" opacity="0.85" />
                ))}
                {/* 포구 링 (금장) */}
                <ellipse cx="48" cy="6" rx="4" ry="1.6" fill="url(#tg-muzzle)" stroke="#78350f" strokeWidth="0.6" />
                {/* 포구 내부 (구멍) */}
                <ellipse cx="48" cy="6" rx="2" ry="0.8" fill="#0b0d12" />
                {/* 후미(브리치) 손잡이 — 화병 모양 */}
                <path d="M 44 58 Q 48 68 52 58" fill="#111827" stroke="#0b1220" strokeWidth="0.6" />

                {/* 발사 시 포구 화염 */}
                {firing && (
                  <>
                    <ellipse cx="48" cy="-2" rx="7" ry="10" fill="#fff4c8" opacity="0.9" style={{ animation: 'muzzle .25s ease-out forwards' }} />
                    <ellipse cx="48" cy="0" rx="4.5" ry="7" fill="#fb923c" opacity="0.9" style={{ animation: 'muzzle .28s ease-out forwards' }} />
                  </>
                )}
              </g>
            </svg>
          </div>
        </div>

        {/* 점수 팝업 */}
        {popups.map(p => (
          <div
            key={p.id}
            className="pointer-events-none absolute text-lg font-extrabold text-emerald-300"
            style={{ left: `${p.x}%`, top: `${p.y}px`, animation: 'scoreFloat 0.8s ease-out forwards' }}
          >
            {p.text}
          </div>
        ))}

        {status === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
            <p className="text-lg font-bold text-white">일시정지</p>
            <div className="flex gap-2">
              <button
                onClick={togglePause}
                className="flex items-center gap-1.5 rounded-lg bg-[#2d7a7c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#256668]"
              >
                <Play className="h-4 w-4 fill-white" /> 계속하기
              </button>
              <button
                onClick={onExit}
                className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                나가기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 인벤토리 3슬롯 + 슬로우 표시 — 하단 입력창 바로 위 */}
      <div className="relative border-t border-white/10 px-4 pt-3 pb-1 flex items-center justify-center gap-2">
        {inventory.map((it, i) => (
          <button
            key={i}
            // onMouseDown 에서 preventDefault → input 이 blur 되지 않아 게임 진행 유지
            onMouseDown={e => e.preventDefault()}
            onClick={() => useItem(i)}
            disabled={!it}
            title={it ? `${ITEM_CONFIG[it].label} — ${ITEM_CONFIG[it].desc}` : '빈 슬롯 (10 콤보 마다 획득)'}
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center text-2xl sm:text-3xl transition-all ${
              it
                ? 'border-amber-300/70 bg-amber-400/10 hover:bg-amber-400/25 hover:scale-110 active:scale-95 cursor-pointer'
                : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'
            }`}
          >
            {it ? ITEM_CONFIG[it].emoji : <span className="text-xs text-white/30">{i + 1}</span>}
            {it && (
              <span className="absolute -bottom-1 -right-1 rounded-full bg-black/70 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center border border-white/20">
                {i + 1}
              </span>
            )}
          </button>
        ))}
        {/* 슬로우 활성 표시 (남은 시간) */}
        {slowUntil > Date.now() && (
          <span className="ml-3 rounded-full bg-sky-500/25 px-2.5 py-1 text-xs font-bold text-sky-200">
            ⏱ SLOW {Math.ceil((slowUntil - Date.now()) / 1000)}s
          </span>
        )}
        {/* 아이템 획득 토스트 (짧게) */}
        {itemToast && (
          <div className="pointer-events-none absolute left-1/2 -top-6 -translate-x-1/2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-lg" style={{ animation: 'toastPop .35s ease-out' }}>
            +{ITEM_CONFIG[itemToast].emoji} {ITEM_CONFIG[itemToast].label} 획득!
          </div>
        )}
      </div>

      {/* 입력창 — 중앙 정렬, 모바일에서도 잘 보이도록 폰트/패딩 확대 */}
      <form onSubmit={handleSubmit} className="relative border-t border-white/10 px-4 py-3 sm:py-4 flex justify-center">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'playing'}
          placeholder={status === 'playing' ? '정답을 입력하고 Enter' : ''}
          // text-base=16px 최소 유지 — iOS Safari 가 16px 미만 input 포커스 시 확대(자동 줌)하는 것을 방지
          className={`w-full max-w-lg rounded-full border-2 bg-white/95 px-5 py-3 sm:px-6 sm:py-3.5 text-center text-base sm:text-lg font-medium text-gray-800 outline-none transition-colors ${
            flash === 'correct' ? 'border-green-400 shadow-[0_0_16px_rgba(74,222,128,.5)]' : flash === 'wrong' ? 'border-red-400 shadow-[0_0_16px_rgba(248,113,113,.5)]' : 'border-transparent focus:border-[#2d7a7c]'
          }`}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
