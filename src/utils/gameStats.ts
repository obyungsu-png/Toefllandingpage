/**
 * gameStats.ts — Vocabulary Typing Game 게이미피케이션 유틸
 * -----------------------------------------------------------------------------
 * 서버 kv_store 에 학생별 게임 통계 저장/조회 (key: game_stats_<ownerName>).
 * XP/레벨, 연속 접속 스트릭, 오늘의 미션 3종을 관리한다.
 */
import { SERVER_BASE_URL, getServerHeaders } from './apiConfig';

// ── 타입 ─────────────────────────────────────────────────────────────────────
export type MissionKind =
  | 'combo'      // N 콤보 달성
  | 'score'      // N 점 획득
  | 'plays'      // N 게임 완료
  | 'words'      // N 단어 정답
  | 'bomb'       // Bomb 아이템 N 회 사용
  | 'slow'       // Slow 아이템 N 회 사용
  | 'fever';     // Fever N 회 진입

export interface Mission {
  id: string;
  kind: MissionKind;
  target: number;
  progress: number;
  completed: boolean;
  rewardXp: number;
  label: string; // "50 콤보 달성" 등
}

export interface GameStats {
  xp: number;
  level: number;
  streakCurrent: number;
  streakBest: number;
  lastPlayedDate: string; // YYYY-MM-DD (KST)
  bestScore: number;
  bestCombo: number;
  totalGames: number;
  totalWordsLearned: number;
  dailyMissionsDate: string; // YYYY-MM-DD — 이 날짜와 오늘이 다르면 새로 리롤
  dailyMissions: Mission[];
  updatedAt?: string;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────
/** 다음 레벨까지 필요 XP: level=1 → 100, 2 → 200, 3 → 300 … 누적. */
export function xpToNextLevel(level: number): number {
  return Math.max(1, level) * 100;
}
/** 총 XP 로 현재 레벨과 이번 레벨 내 진행률 계산. */
export function computeLevel(totalXp: number): { level: number; currentLevelXp: number; needed: number; percent: number } {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  let needed = xpToNextLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpToNextLevel(level);
  }
  return {
    level,
    currentLevelXp: remaining,
    needed,
    percent: Math.min(100, Math.round((remaining / needed) * 100)),
  };
}

// ── 오늘 날짜 (KST 기준, YYYY-MM-DD) ─────────────────────────────────────────
export function todayKST(): string {
  const now = new Date();
  // KST 오프셋: UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const kst = new Date(utc + 9 * 60 * 60 * 1000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
/** 두 YYYY-MM-DD 문자열의 차이 (일). a-b. */
function dateDiffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.round((da - db) / (24 * 60 * 60 * 1000));
}

// ── 미션 프리셋 & 랜덤 롤 ────────────────────────────────────────────────────
const MISSION_PRESETS: Omit<Mission, 'id' | 'progress' | 'completed'>[] = [
  { kind: 'combo',  target: 20,   rewardXp: 50,  label: '한 판에서 20 콤보 달성' },
  { kind: 'combo',  target: 40,   rewardXp: 100, label: '한 판에서 40 콤보 달성' },
  { kind: 'score',  target: 500,  rewardXp: 60,  label: '한 판에서 500점 획득' },
  { kind: 'score',  target: 1200, rewardXp: 120, label: '한 판에서 1,200점 획득' },
  { kind: 'plays',  target: 3,    rewardXp: 80,  label: '오늘 3판 완료' },
  { kind: 'plays',  target: 5,    rewardXp: 150, label: '오늘 5판 완료' },
  { kind: 'words',  target: 30,   rewardXp: 70,  label: '오늘 30단어 맞추기' },
  { kind: 'words',  target: 80,   rewardXp: 180, label: '오늘 80단어 맞추기' },
  { kind: 'bomb',   target: 2,    rewardXp: 60,  label: '💣 Bomb 2회 사용' },
  { kind: 'slow',   target: 2,    rewardXp: 50,  label: '⏱ Slow 2회 사용' },
  { kind: 'fever',  target: 1,    rewardXp: 80,  label: '🔥 Fever 진입 1회' },
];

/** 오늘의 미션 3개 랜덤 선택 (kind 중복 최소화). */
export function rollDailyMissions(): Mission[] {
  const pool = [...MISSION_PRESETS];
  // Fisher–Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked: typeof pool = [];
  const usedKinds = new Set<MissionKind>();
  for (const p of pool) {
    if (usedKinds.has(p.kind)) continue;
    usedKinds.add(p.kind);
    picked.push(p);
    if (picked.length === 3) break;
  }
  // kind 3개 미만이면 남은 자리 채우기
  while (picked.length < 3 && pool.length > 0) picked.push(pool[picked.length]);
  return picked.map((p, i) => ({
    ...p,
    id: `${todayKST()}-${p.kind}-${p.target}-${i}`,
    progress: 0,
    completed: false,
  }));
}

// ── 현재 로그인 학생 이름 (localStorage 스냅샷) ───────────────────────────
/** App.tsx 가 로그인 시 저장하는 'amx_userName' 규약을 그대로 재사용. */
export function getCurrentOwnerName(): string {
  try { return localStorage.getItem('amx_userName') || ''; } catch { return ''; }
}

// ── 기본값 ───────────────────────────────────────────────────────────────────
export function defaultStats(): GameStats {
  const today = todayKST();
  return {
    xp: 0,
    level: 1,
    streakCurrent: 0,
    streakBest: 0,
    lastPlayedDate: '',
    bestScore: 0,
    bestCombo: 0,
    totalGames: 0,
    totalWordsLearned: 0,
    dailyMissionsDate: today,
    dailyMissions: rollDailyMissions(),
  };
}

// ── 서버 API ─────────────────────────────────────────────────────────────────
export async function loadGameStats(ownerName: string): Promise<GameStats> {
  if (!ownerName) return defaultStats();
  try {
    const res = await fetch(
      `${SERVER_BASE_URL}/game-stats/${encodeURIComponent(ownerName)}`,
      { method: 'GET', headers: { ...getServerHeaders(), 'Content-Type': 'application/json' } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.stats) return ensureFreshMissions(defaultStats());
    return ensureFreshMissions({ ...defaultStats(), ...(data.stats as GameStats) });
  } catch (err) {
    console.warn('[gameStats] load 실패, 기본값 사용:', err);
    return defaultStats();
  }
}

export async function saveGameStats(ownerName: string, stats: GameStats): Promise<void> {
  if (!ownerName) return;
  try {
    await fetch(
      `${SERVER_BASE_URL}/game-stats/${encodeURIComponent(ownerName)}`,
      {
        method: 'POST',
        headers: { ...getServerHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      },
    );
  } catch (err) {
    console.warn('[gameStats] save 실패:', err);
  }
}

/** 학생 탈퇴/삭제 시 kv_store 의 게임 통계 + 어휘 진행도 등을 서버에서 일괄 제거. */
export async function purgeUserServerData(opts: { ownerName?: string; userId?: string }): Promise<void> {
  const ownerName = opts.ownerName?.trim();
  const userId = opts.userId?.trim();
  if (!ownerName && !userId) return;
  try {
    await fetch(`${SERVER_BASE_URL}/user-data`, {
      method: 'DELETE',
      headers: { ...getServerHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerName, userId }),
    });
  } catch (err) {
    console.warn('[gameStats] purge 실패:', err);
  }
}

/** 학생 탈퇴/브라우저 로컬 저장소에 남아있는 학습 데이터 제거 (SRS 카드/예문 캐시 등). */
export function purgeLocalStudyData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (
        k.startsWith('srs-') ||          // SRS 카드 상태 + 예문 캐시
        k.startsWith('speaking-ai-') ||  // Speaking AI 캐시
        k.startsWith('writing-ai-')      // Writing AI 캐시
      ) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* 무시 */ }
}

// ── 스트릭/미션 리롤 로직 ──────────────────────────────────────────────────
/** 로드 시 오늘 미션이 어제 것이면 새로 리롤. 파괴적이지 않은 sanitizer. */
export function ensureFreshMissions(stats: GameStats): GameStats {
  const today = todayKST();
  if (stats.dailyMissionsDate === today && Array.isArray(stats.dailyMissions) && stats.dailyMissions.length === 3) {
    return stats;
  }
  return { ...stats, dailyMissionsDate: today, dailyMissions: rollDailyMissions() };
}

/** 오늘 처음 플레이할 때 스트릭 갱신. 반환은 새로운 stats 와 이번 접속의 신규 스트릭 여부. */
export function bumpStreakOnLogin(stats: GameStats): { stats: GameStats; incremented: boolean } {
  const today = todayKST();
  if (stats.lastPlayedDate === today) {
    return { stats, incremented: false };
  }
  let nextStreak: number;
  if (!stats.lastPlayedDate) {
    nextStreak = 1;
  } else {
    const diff = dateDiffDays(today, stats.lastPlayedDate);
    nextStreak = diff === 1 ? stats.streakCurrent + 1 : 1;
  }
  return {
    stats: {
      ...stats,
      lastPlayedDate: today,
      streakCurrent: nextStreak,
      streakBest: Math.max(stats.streakBest, nextStreak),
    },
    incremented: true,
  };
}

// ── XP/미션 진행 갱신 헬퍼 ─────────────────────────────────────────────────
/** 여러 이벤트를 한 세션 끝에 batch 로 반영하기 위한 누적 델타. */
export interface SessionDelta {
  score: number;                 // 이 판 최종 점수
  bestCombo: number;             // 이 판 최고 콤보
  wordsCorrect: number;          // 이 판 정답 단어 수
  bombsUsed: number;
  slowsUsed: number;
  feversEntered: number;
  completedGame: boolean;        // 게임오버까지 도달했는지
}

/**
 * 세션 종료 시 stats 에 델타 반영.
 * - XP: 단어당 10 + 콤보 5+ 보너스 5 + Fever 진입 50 + 게임완료 30
 * - 미션 진행도 갱신
 * - bestScore/bestCombo/totalGames/totalWordsLearned 갱신
 */
export function applySessionDelta(stats: GameStats, d: SessionDelta): { stats: GameStats; xpGained: number; completedMissions: Mission[] } {
  let xpGained = 0;
  xpGained += d.wordsCorrect * 10;
  if (d.bestCombo >= 5) xpGained += 20;
  xpGained += d.feversEntered * 50;
  if (d.completedGame) xpGained += 30;

  const missions = stats.dailyMissions.map(m => {
    if (m.completed) return m;
    let inc = 0;
    if (m.kind === 'combo') inc = d.bestCombo >= m.target ? m.target : 0; // 한 판 기준 최고 콤보로 판정 (누적 아님)
    if (m.kind === 'score') inc = d.score >= m.target ? m.target : 0;
    if (m.kind === 'plays') inc = d.completedGame ? 1 : 0;
    if (m.kind === 'words') inc = d.wordsCorrect;
    if (m.kind === 'bomb')  inc = d.bombsUsed;
    if (m.kind === 'slow')  inc = d.slowsUsed;
    if (m.kind === 'fever') inc = d.feversEntered;
    // combo/score 는 세팅형(달성=한 방에), 나머지는 누적형
    const nextProgress = (m.kind === 'combo' || m.kind === 'score')
      ? Math.max(m.progress, inc)
      : m.progress + inc;
    return {
      ...m,
      progress: Math.min(m.target, nextProgress),
      completed: nextProgress >= m.target,
    };
  });

  const newlyCompleted = missions.filter((m, i) => m.completed && !stats.dailyMissions[i].completed);
  const missionRewardXp = newlyCompleted.reduce((s, m) => s + m.rewardXp, 0);
  xpGained += missionRewardXp;

  const newXp = stats.xp + xpGained;
  const { level } = computeLevel(newXp);

  return {
    stats: {
      ...stats,
      xp: newXp,
      level,
      bestScore: Math.max(stats.bestScore, d.score),
      bestCombo: Math.max(stats.bestCombo, d.bestCombo),
      totalGames: stats.totalGames + (d.completedGame ? 1 : 0),
      totalWordsLearned: stats.totalWordsLearned + d.wordsCorrect,
      dailyMissions: missions,
    },
    xpGained,
    completedMissions: newlyCompleted,
  };
}
