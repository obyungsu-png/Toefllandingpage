import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Pause, Play, RotateCcw, Gauge, Heart, Trophy, Sparkles, Loader2, Zap } from 'lucide-react';
import { getAllWords } from './vocaWordSets';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';

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
  combo: (n: number) => { // 콤보 5단위마다 팡파레, 단계가 높을수록 화려
    const base = [523, 659, 784, 1047];
    const steps = Math.min(3, Math.floor(n / 5));
    base.slice(0, 2 + steps).forEach((f, i) => tone(f * (steps >= 2 ? 1.0 : 1.0), 0.13, 'triangle', 0.09, i * 0.07));
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
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
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
      filter.frequency.value = 900;
      const ng = ctx.createGain();
      ng.gain.value = 0.12;
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
      // 1) 저음 붐
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.32);
      og.gain.setValueAtTime(0.18, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(og); og.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.36);
      // 2) 화약 버스트 (로우패스 노이즈)
      const len = Math.floor(ctx.sampleRate * 0.22);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1100;
      const ng = ctx.createGain(); ng.gain.value = 0.16;
      noise.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
      noise.start(t);
      // 3) 크래클 (밴드패스 노이즈, 약간 지연)
      const len2 = Math.floor(ctx.sampleRate * 0.14);
      const buf2 = ctx.createBuffer(1, len2, ctx.sampleRate);
      const data2 = buf2.getChannelData(0);
      for (let i = 0; i < len2; i++) data2[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len2, 2);
      const crk = ctx.createBufferSource();
      crk.buffer = buf2;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.8;
      const cg = ctx.createGain(); cg.gain.value = 0.1;
      crk.connect(bp); bp.connect(cg); cg.connect(ctx.destination);
      crk.start(t + 0.04);
      // 4) 스파클 (방산 파편 반짝임)
      [1568, 2093, 2637].forEach((f, i) => tone(f, 0.1, 'triangle', 0.045, 0.05 + i * 0.045));
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

const SPEED_CONFIG: Record<SpeedLevel, { label: string; fallSpeed: number; spawnMs: number }> = {
  1: { label: '느림', fallSpeed: 0.38, spawnMs: 3000 },
  2: { label: '보통', fallSpeed: 0.6, spawnMs: 2400 },
  3: { label: '빠름', fallSpeed: 0.9, spawnMs: 1900 },
  4: { label: '매우 빠름', fallSpeed: 1.35, spawnMs: 1500 },
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

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function VocabularyTypingGame({ onExit }: { onExit: () => void }) {
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
  const [booms, setBooms] = useState<Boom[]>([]);
  const [firing, setFiring] = useState(false);

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
  const sourceCache = useRef<Partial<Record<SourceKey, { words: (GameWord & { dayNumber: number })[]; days: DayInfo[] }>>>({});

  useEffect(() => { speedLevelRef.current = speedLevel; }, [speedLevel]);

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
  }, [source]);

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
  useEffect(() => {
    if (status !== 'playing') return;
    setWords(prev => prev.map(w => ({ ...w, speed: SPEED_CONFIG[speedLevel].fallSpeed })));
  }, [speedLevel, status]);

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
          const ny = w.y + w.speed * (dt / 16.6);
          if (ny > areaHeight - 36) missed += 1;
          else kept.push({ ...w, y: ny });
        }
        if (missed > 0) {
          sfx.miss();
          comboRef.current = 0;
          setCombo(0);
          setFever(false);
          setShake(true);
          window.setTimeout(() => setShake(false), 350);
          setLives(l => {
            const nl = Math.max(0, l - missed);
            if (nl === 0) {
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

  // 대포 발사 — 포탄이 날아가 목표 지점에서 폭발 + 점수 팝업
  const fireCannon = (target: { x: number; y: number }, gainText: string) => {
    const areaH = gameAreaRef.current?.clientHeight || 420;
    const id = popupIdRef.current++;
    setShots(prev => [...prev, { id, fx: '50%', fy: `${areaH - 52}px`, tx: `${target.x}%`, ty: `${target.y}px` }]);
    setFiring(true);
    sfx.cannon();
    window.setTimeout(() => sfx.whoosh(), 60);
    window.setTimeout(() => {
      setShots(prev => prev.filter(s => s.id !== id));
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
      window.setTimeout(() => setBooms(prev => prev.filter(b => b.id !== bid)), 550);
    }, 280);
    window.setTimeout(() => setFiring(false), 340);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'playing' || !input.trim()) return;
    const typed = input.trim().toLowerCase();

    let matchedAt: { x: number; y: number } | null = null;
    setWords(prev => {
      const idx = prev.findIndex(
        w => w.answer.trim().toLowerCase() === typed || w.altAnswers.some(a => a.toLowerCase() === typed)
      );
      if (idx === -1) return prev;
      matchedAt = { x: prev[idx].x, y: prev[idx].y };
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });

    if (matchedAt) {
      comboRef.current += 1;
      const c = comboRef.current;
      setCombo(c);
      setBestCombo(b => Math.max(b, c));
      const isFever = c >= FEVER_COMBO;
      if (isFever && !fever) {
        setFever(true);
        sfx.fever();
      } else if (c % 5 === 0) {
        sfx.combo(c);
      } // 일반 정답음은 대포 발사음(fireCannon)이 대신함
      const gain = (10 + Math.min(20, c * 2)) * (isFever ? 2 : 1);
      setScore(s => s + gain);
      setCleared(n => n + 1);
      setFlash('correct');
      fireCannon(matchedAt as { x: number; y: number }, `+${gain}`);
    } else {
      sfx.wrong();
      comboRef.current = 0;
      setCombo(0);
      setFever(false);
      setFlash('wrong');
    }
    setInput('');
    window.setTimeout(() => setFlash(null), 220);
  };

  const togglePause = () => setStatus(s => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));

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
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{loadError}</p>
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
          <div className="mb-5 grid grid-cols-3 gap-2">
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
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: fever
          ? 'linear-gradient(180deg,#2a0a3a 0%,#3b1354 50%,#0f1b2e 100%)'
          : 'linear-gradient(180deg,#0b1026 0%,#131a3a 60%,#0f1b1c 100%)',
        transition: 'background 0.6s',
      }}
    >
      <style>{`
        @keyframes twinkle { 0%,100% { opacity:.2 } 50% { opacity:1 } }
        @keyframes scoreFloat { 0% { opacity:1; transform:translate(-50%,0) scale(1) } 100% { opacity:0; transform:translate(-50%,-60px) scale(1.3) } }
        @keyframes wordDrop { from { transform:translateX(-50%) scale(.6); opacity:0 } to { transform:translateX(-50%) scale(1); opacity:1 } }
        @keyframes shakeX { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes feverPulse { 0%,100%{opacity:.9} 50%{opacity:1} }
        @keyframes gameoverPop { from { transform:scale(.8); opacity:0 } to { transform:scale(1); opacity:1 } }
        @keyframes cannonFly { from { left:var(--fx); top:var(--fy) } to { left:var(--tx); top:var(--ty) } }
        @keyframes arcY { 0% { transform:translateY(6px) } 45% { transform:translateY(-48px) } 100% { transform:translateY(0) } }
        @keyframes boomFlash { 0% { transform:translate(-50%,-50%) scale(.3); opacity:1 } 100% { transform:translate(-50%,-50%) scale(2.8); opacity:0 } }
        @keyframes ringExpand { 0% { transform:translate(-50%,-50%) scale(.2); opacity:.95 } 100% { transform:translate(-50%,-50%) scale(2); opacity:0 } }
        @keyframes particleFly { from { transform:translate(-50%,-50%) rotate(var(--a)) translateX(0); opacity:1 } to { transform:translate(-50%,-50%) rotate(var(--a)) translateX(var(--d)); opacity:0 } }
        @keyframes recoil { 0% { transform:translateX(-50%) translateY(0) } 25% { transform:translateX(-50%) translateY(10px) } 100% { transform:translateX(-50%) translateY(0) } }
        @keyframes muzzle { 0% { transform:translate(-50%,-100%) scale(.5); opacity:1 } 100% { transform:translate(-50%,-100%) scale(2.1); opacity:0 } }
        @keyframes shakeSmall { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 50%{transform:translateX(4px)} 75%{transform:translateX(-2px)} }
      `}</style>

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

      {/* HUD */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">
            {score}<span className="ml-1 text-xs font-normal text-white/50">점</span>
          </span>
          {combo > 1 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${fever ? 'bg-fuchsia-500/30 text-fuchsia-200' : 'bg-[#e67e22]/20 text-[#f0a860]'}`}>
              🔥 {combo} 콤보{fever ? ' ×2' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: START_LIVES }, (_, i) => (
            <Heart key={i} className={`h-4 w-4 transition-all ${i < lives ? 'fill-red-500 text-red-500 scale-100' : 'text-white/20 scale-90'}`} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
            {([1, 2, 3, 4] as SpeedLevel[]).map(lv => (
              <button
                key={lv}
                onClick={() => setSpeedLevel(lv)}
                title={SPEED_CONFIG[lv].label}
                className={`h-6 w-6 rounded-full text-[10px] font-bold transition-colors ${
                  speedLevel === lv ? 'bg-[#2d7a7c] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
          <button
            onClick={togglePause}
            className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white"
            title={status === 'paused' ? '재개' : '일시정지'}
          >
            {status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
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

      {/* 게임 영역 */}
      <div
        ref={gameAreaRef}
        className="relative flex-1 overflow-hidden"
        style={shake ? { animation: 'shakeX 0.35s ease-out' } : undefined}
      >
        {words.map(w => (
          <div
            key={w.id}
            className="absolute -translate-x-1/2 rounded-xl px-3.5 py-2 text-sm font-semibold text-gray-800"
            style={{
              left: `${w.x}%`,
              top: `${w.y}px`,
              background: CHIP_COLORS[w.colorIdx],
              boxShadow: fever
                ? '0 0 18px rgba(232,121,249,.55), 0 4px 10px rgba(0,0,0,.3)'
                : combo >= 5
                  ? '0 0 14px rgba(240,168,96,.45), 0 4px 10px rgba(0,0,0,.3)'
                  : '0 4px 10px rgba(0,0,0,.35)',
              animation: 'wordDrop .25s ease-out',
            }}
          >
            <div className="whitespace-nowrap">{w.prompt}</div>
            {w.hint && (
              <div className="mt-0.5 font-mono text-[11px] tracking-wider text-[#2d7a7c]/80">{w.hint}</div>
            )}
          </div>
        ))}

        {/* 대포 포탄 — 외곽 div는 직선 이동, 낶은 span이 포물선 궤적 + 잔상 */}
        {shots.map(s => (
          <div
            key={s.id}
            className="pointer-events-none absolute"
            style={{
              left: s.fx, top: s.fy,
              animation: 'cannonFly .3s linear forwards',
              ['--fx' as any]: s.fx, ['--fy' as any]: s.fy, ['--tx' as any]: s.tx, ['--ty' as any]: s.ty,
            }}
          >
            <span
              className="block w-4 h-4 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #fff7d6, #fbbf24 45%, #b45309 85%)',
                boxShadow: '0 0 14px rgba(251,191,36,.95), 0 0 34px rgba(249,115,22,.6), -10px 8px 16px rgba(249,115,22,.35)',
                animation: 'arcY .3s ease-in-out forwards',
              }}
            />
            {/* 궤적 잔상 */}
            <span
              className="block absolute left-1 top-1 w-2 h-2 rounded-full bg-amber-400/70 blur-[2px]"
              style={{ animation: 'arcY .3s ease-in-out .04s forwards' }}
            />
          </div>
        ))}

        {/* 폭발 이펙트 — 플래시 + 충격파 링 + 파편 16개 */}
        {booms.map(b => (
          <div key={b.id} className="pointer-events-none absolute" style={{ left: `${b.x}%`, top: `${b.y}px` }}>
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
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3 + (i % 3) * 2,
                  height: 3 + (i % 3) * 2,
                  background: i % 3 === 0 ? '#fef3c7' : i % 2 ? '#fbbf24' : '#f97316',
                  boxShadow: '0 0 7px rgba(251,146,60,.95)',
                  animation: `particleFly ${0.4 + (i % 4) * 0.07}s ease-out forwards`,
                  ['--a' as any]: `${i * 22.5}deg`,
                  ['--d' as any]: `${42 + (i % 5) * 12}px`,
                }}
              />
            ))}
          </div>
        ))}

        {/* 대포 (하단 중앙) — 금속 포신 + 금장 포구 + 바퀴 + 장갑판 */}
        <div
          className="pointer-events-none absolute bottom-1 left-1/2"
          style={firing ? { animation: 'recoil .34s ease-out' } : { transform: 'translateX(-50%)' }}
        >
          {firing && (
            <div
              className="absolute -top-3 left-1/2 w-10 h-10 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,246,200,1) 0%, rgba(251,191,36,.8) 40%, rgba(249,115,22,0) 75%)',
                animation: 'muzzle .25s ease-out forwards',
              }}
            />
          )}
          <div className="relative flex flex-col items-center">
            {/* 포구 (금장 링) */}
            <div
              className="z-10 w-7 h-3 rounded-full"
              style={{ background: 'linear-gradient(180deg,#fde68a,#b45309)', boxShadow: '0 1px 3px rgba(0,0,0,.7), inset 0 1px 1px rgba(255,255,255,.5)' }}
            />
            {/* 포신 */}
            <div
              className="-mt-0.5 w-6 h-11"
              style={{
                background: 'linear-gradient(90deg,#111827 0%,#4b5563 30%,#9ca3af 50%,#4b5563 70%,#111827 100%)',
                borderRadius: '10px 10px 4px 4px',
                boxShadow: 'inset 0 -4px 6px rgba(0,0,0,.6), 0 2px 4px rgba(0,0,0,.5)',
              }}
            />
            {/* 장갑판 (리벳) */}
            <div
              className="-mt-1 w-14 h-4 rounded-md flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(180deg,#6b7280,#374151)', boxShadow: '0 2px 4px rgba(0,0,0,.5)' }}
            >
              {[0, 1, 2, 3].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-gray-300/80" style={{ boxShadow: 'inset 0 -1px 1px rgba(0,0,0,.6)' }} />
              ))}
            </div>
            {/* 바퀴 */}
            <div className="-mt-1 flex items-center gap-6">
              {[0, 1].map(i => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'radial-gradient(circle,#4b5563 30%,#1f2937 70%)', border: '2px solid #6b7280', boxShadow: '0 2px 3px rgba(0,0,0,.6)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                </div>
              ))}
            </div>
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

      {/* 입력창 — 중앙 정렬, 적절한 너비로 제한 */}
      <form onSubmit={handleSubmit} className="relative border-t border-white/10 px-4 py-3 flex justify-center">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={status !== 'playing'}
          placeholder={status === 'playing' ? '정답을 입력하고 Enter' : ''}
          className={`w-full max-w-md rounded-full border-2 bg-white/95 px-5 py-2.5 text-center text-sm font-medium text-gray-800 outline-none transition-colors ${
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
