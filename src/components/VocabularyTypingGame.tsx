import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Pause, Play, RotateCcw, Gauge, Heart, Trophy } from 'lucide-react';
import { getAllWords, SATWord } from './vocaWordSets';

// ============================================================================
// 데이터 준비
// ============================================================================
// vocaWordSets.ts의 DB는 실제로 400단어(=DAY 1~10)만 실제 데이터이고,
// DAY 11~50은 실제 단어가 부족해 "_11_3" 같은 접미사가 붙은 가짜(재사용) 단어로
// 채워진다. 게임에 이상한 정답("accomplish_11_3")이 나오지 않도록,
// 그런 접미사가 붙은 항목은 제외하고 "진짜" 단어만 사용한다.
const CLEAN_WORDS: SATWord[] = getAllWords().filter((w) => !w.english.includes('_'));
const WORDS_PER_DAY = 40;
export const TYPING_GAME_TOTAL_DAYS = Math.max(1, Math.floor(CLEAN_WORDS.length / WORDS_PER_DAY));

function wordsForDay(day: number | 'all'): SATWord[] {
  if (day === 'all') return CLEAN_WORDS;
  const start = (day - 1) * WORDS_PER_DAY;
  return CLEAN_WORDS.slice(start, start + WORDS_PER_DAY);
}

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
  x: number; // 좌우 위치(%)
  y: number; // 위에서부터 px
  speed: number; // px / frame(60fps 기준)
}

const SPEED_CONFIG: Record<SpeedLevel, { label: string; fallSpeed: number; spawnMs: number }> = {
  1: { label: '느림', fallSpeed: 0.55, spawnMs: 2600 },
  2: { label: '보통', fallSpeed: 0.9, spawnMs: 2000 },
  3: { label: '빠름', fallSpeed: 1.4, spawnMs: 1500 },
  4: { label: '매우 빠름', fallSpeed: 2.1, spawnMs: 1100 },
};

const START_LIVES = 5;

function playBeep(correct: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = correct ? 880 : 220;
    gain.gain.value = 0.07;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    const dur = correct ? 0.12 : 0.22;
    osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch {
    /* 오디오를 지원하지 않는 환경이면 그냥 무시 */
  }
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function VocabularyTypingGame({ onExit }: { onExit: () => void }) {
  const [day, setDay] = useState<number | 'all'>(1);
  const [direction, setDirection] = useState<Direction>('kr2en');
  const [speedLevel, setSpeedLevel] = useState<SpeedLevel>(2);

  const [status, setStatus] = useState<GameStatus>('setup');
  const [words, setWords] = useState<FallingWord[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextIdRef = useRef(0);
  const poolRef = useRef<SATWord[]>([]);
  const recentRef = useRef<string[]>([]); // 최근에 낸 단어(직전 중복 방지용)
  const speedLevelRef = useRef(speedLevel);
  const comboRef = useRef(0);

  useEffect(() => { speedLevelRef.current = speedLevel; }, [speedLevel]);

  // 속도를 바꾸면 이미 떨어지고 있는 단어들의 속도도 즉시 반영
  useEffect(() => {
    if (status !== 'playing') return;
    setWords((prev) => prev.map((w) => ({ ...w, speed: SPEED_CONFIG[speedLevel].fallSpeed })));
  }, [speedLevel, status]);

  const startGame = () => {
    poolRef.current = wordsForDay(day);
    recentRef.current = [];
    setWords([]);
    setScore(0);
    setLives(START_LIVES);
    setCombo(0);
    comboRef.current = 0;
    setBestCombo(0);
    setInput('');
    setFlash(null);
    lastSpawnRef.current = 0;
    setStatus('playing');
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const spawnWord = useCallback(() => {
    const pool = poolRef.current;
    if (pool.length === 0) return;

    let candidate = pool[Math.floor(Math.random() * pool.length)];
    // 최근에 낸 단어와 겹치지 않도록 몇 번만 재시도 (풀이 작으면 포기하고 그냥 씀)
    let tries = 0;
    while (recentRef.current.includes(candidate.english) && tries < 8 && pool.length > 3) {
      candidate = pool[Math.floor(Math.random() * pool.length)];
      tries += 1;
    }
    recentRef.current.push(candidate.english);
    if (recentRef.current.length > Math.min(8, Math.max(3, pool.length - 1))) {
      recentRef.current.shift();
    }

    const prompt = direction === 'kr2en' ? candidate.korean : candidate.english;
    const answer = direction === 'kr2en' ? candidate.english : candidate.korean;
    const altAnswers =
      direction === 'kr2en'
        ? (candidate.synonyms || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    setWords((prev) => [
      ...prev,
      {
        id: nextIdRef.current++,
        prompt,
        answer,
        altAnswers,
        x: 6 + Math.random() * 80,
        y: -12,
        speed: SPEED_CONFIG[speedLevelRef.current].fallSpeed,
      },
    ]);
  }, [direction]);

  // 게임 루프 (playing 상태일 때만 동작, paused/gameover면 자동 정지)
  useEffect(() => {
    if (status !== 'playing') return;

    lastFrameRef.current = performance.now();
    lastSpawnRef.current = performance.now() - SPEED_CONFIG[speedLevelRef.current].spawnMs + 400; // 시작하고 곧 한 단어 등장

    const tick = (now: number) => {
      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;

      if (now - lastSpawnRef.current > SPEED_CONFIG[speedLevelRef.current].spawnMs) {
        lastSpawnRef.current = now;
        spawnWord();
      }

      const areaHeight = gameAreaRef.current?.clientHeight || 420;
      setWords((prev) => {
        const kept: FallingWord[] = [];
        let missed = 0;
        for (const w of prev) {
          const ny = w.y + w.speed * (dt / 16.6);
          if (ny > areaHeight - 36) {
            missed += 1;
          } else {
            kept.push({ ...w, y: ny });
          }
        }
        if (missed > 0) {
          comboRef.current = 0;
          setCombo(0);
          setLives((l) => {
            const nl = Math.max(0, l - missed);
            if (nl === 0) setStatus('gameover');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'playing' || !input.trim()) return;
    const typed = input.trim().toLowerCase();

    let matched = false;
    setWords((prev) => {
      const idx = prev.findIndex(
        (w) => w.answer.trim().toLowerCase() === typed || w.altAnswers.some((a) => a.toLowerCase() === typed)
      );
      if (idx === -1) return prev;
      matched = true;
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });

    if (matched) {
      playBeep(true);
      setFlash('correct');
      comboRef.current += 1;
      setCombo(comboRef.current);
      setBestCombo((b) => Math.max(b, comboRef.current));
      setScore((s) => s + 10 + Math.min(20, comboRef.current * 2));
    } else {
      playBeep(false);
      setFlash('wrong');
      comboRef.current = 0;
      setCombo(0);
    }
    setInput('');
    window.setTimeout(() => setFlash(null), 220);
  };

  const togglePause = () => setStatus((s) => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));

  const promptLabel = direction === 'kr2en' ? '한글 뜻을 보고 영어 단어를 입력하세요' : '영어 단어를 보고 한글 뜻을 입력하세요';

  // ==========================================================================
  // 화면: 설정
  // ==========================================================================
  if (status === 'setup') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-800">🎮 단어 타이핑 게임</h2>
            <button onClick={onExit} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 p-5">
            {/* DAY 선택 */}
            <div>
              <p className="mb-2.5 text-xs font-medium text-gray-500">DAY 선택 (단어 출처)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDay('all')}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    day === 'all'
                      ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#2d7a7c]/50'
                  }`}
                >
                  전체 ({CLEAN_WORDS.length}단어)
                </button>
                {Array.from({ length: TYPING_GAME_TOTAL_DAYS }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDay(d)}
                    className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                      day === d
                        ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-[#2d7a7c]/50'
                    }`}
                  >
                    DAY {d}
                  </button>
                ))}
              </div>
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
                  <span className="mt-0.5 block text-[10px] font-normal text-gray-400">뜻이 내려오면 영어로 입력</span>
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
                  <span className="mt-0.5 block text-[10px] font-normal text-gray-400">단어가 내려오면 한글로 입력</span>
                </button>
              </div>
            </div>

            {/* 속도 선택 */}
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Gauge className="h-3.5 w-3.5" /> 낙하 속도 (게임 중에도 변경 가능)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as SpeedLevel[]).map((lv) => (
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d7a7c] px-6 py-3 text-white transition-colors hover:bg-[#256668]"
            >
              <Play className="h-4 w-4 fill-white" />
              <span className="text-sm font-semibold">게임 시작</span>
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h2 className="mb-1 text-lg font-bold text-gray-800">게임 종료!</h2>
          <p className="mb-4 text-sm text-gray-500">DAY {day === 'all' ? '전체' : day} · {direction === 'kr2en' ? '한글→영어' : '영어→한글'}</p>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-[#2d7a7c]">{score}</p>
              <p className="text-xs text-gray-500">점수</p>
            </div>
            <div className="rounded-lg bg-gray-50 py-3">
              <p className="text-2xl font-bold text-[#2d7a7c]">{bestCombo}</p>
              <p className="text-xs text-gray-500">최고 콤보</p>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f1b1c]">
      {/* HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">
            {score}<span className="ml-1 text-xs font-normal text-white/50">점</span>
          </span>
          {combo > 1 && <span className="rounded-full bg-[#e67e22]/20 px-2 py-0.5 text-xs font-semibold text-[#f0a860]">🔥 {combo} 콤보</span>}
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: START_LIVES }, (_, i) => (
            <Heart key={i} className={`h-4 w-4 ${i < lives ? 'fill-red-500 text-red-500' : 'text-white/20'}`} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* 속도 조절 (게임 중에도 변경 가능) */}
          <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
            {([1, 2, 3, 4] as SpeedLevel[]).map((lv) => (
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

      <p className="px-4 pt-2 text-center text-xs text-white/40">{promptLabel}</p>

      {/* 게임 영역 */}
      <div ref={gameAreaRef} className="relative flex-1 overflow-hidden">
        {words.map((w) => (
          <div
            key={w.id}
            className="absolute -translate-x-1/2 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-lg"
            style={{ left: `${w.x}%`, top: `${w.y}px` }}
          >
            {w.prompt}
          </div>
        ))}

        {status === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
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

      {/* 입력창 */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== 'playing'}
          placeholder={status === 'playing' ? '정답을 입력하고 Enter' : ''}
          className={`w-full rounded-xl border-2 bg-white/95 px-4 py-3 text-center text-base font-medium text-gray-800 outline-none transition-colors ${
            flash === 'correct' ? 'border-green-400' : flash === 'wrong' ? 'border-red-400' : 'border-transparent focus:border-[#2d7a7c]'
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
