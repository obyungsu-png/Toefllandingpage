/**
 * weakWords.ts — 학생 약점 단어(놓친/오답) 관리 유틸
 * -----------------------------------------------------------------------------
 * Typing Game 에서 학생이 놓친(miss) 또는 오답(wrong) 낸 단어를 서버(kv_store)
 * 에 누적 저장. SRS 학습이 세션 시작 시 이 목록을 불러와 학습 큐 최상단에
 * 배치해 자동 편입한다.
 *
 * 저장 정책:
 *   - 최대 200개 (서버에서 오래된 것부터 절단)
 *   - 같은 단어는 count 만 증가, missedAt 갱신
 *   - 로그인/등록된 학생만 저장 (ownerName 비어있으면 no-op)
 */
import { SERVER_BASE_URL, getServerHeaders } from './apiConfig';

export interface WeakWord {
  english: string;
  korean: string;
  source?: string;       // 어느 단어장에서 나왔는지 (optional)
  missedAt: string;      // ISO timestamp
  count: number;         // 놓친/틀린 누적 횟수
}

export async function loadWeakWords(ownerName: string): Promise<WeakWord[]> {
  if (!ownerName) return [];
  try {
    const res = await fetch(
      `${SERVER_BASE_URL}/weak-words/${encodeURIComponent(ownerName)}`,
      { method: 'GET', headers: { ...getServerHeaders(), 'Content-Type': 'application/json' } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.words) ? (data.words as WeakWord[]) : [];
  } catch (err) {
    console.warn('[weakWords] load 실패:', err);
    return [];
  }
}

export async function saveWeakWords(ownerName: string, words: WeakWord[]): Promise<void> {
  if (!ownerName) return;
  try {
    await fetch(
      `${SERVER_BASE_URL}/weak-words/${encodeURIComponent(ownerName)}`,
      {
        method: 'POST',
        headers: { ...getServerHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ words }),
      },
    );
  } catch (err) {
    console.warn('[weakWords] save 실패:', err);
  }
}

/**
 * 기존 약점 단어 리스트에 신규 miss/wrong 을 병합.
 * - 같은 english 는 count++ + missedAt 갱신
 * - 새 단어는 뒤에 추가
 * - 최대 200개 (앞부분(오래된) 절단)
 */
export function mergeWeakWords(existing: WeakWord[], additions: Omit<WeakWord, 'missedAt' | 'count'>[]): WeakWord[] {
  const now = new Date().toISOString();
  const map = new Map<string, WeakWord>();
  for (const w of existing) map.set(w.english.toLowerCase(), { ...w });
  for (const a of additions) {
    const key = a.english.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      map.set(key, { ...prev, missedAt: now, count: prev.count + 1, korean: a.korean || prev.korean, source: a.source || prev.source });
    } else {
      map.set(key, { english: a.english, korean: a.korean, source: a.source, missedAt: now, count: 1 });
    }
  }
  // 오래된 것부터 절단 (missedAt 오름차순)
  const arr = [...map.values()].sort((a, b) => a.missedAt.localeCompare(b.missedAt));
  return arr.slice(-200);
}

/** 학생이 정답으로 맞춘 단어는 약점 목록에서 제거 (성공적 학습 반영). */
export function removeFromWeakWords(existing: WeakWord[], english: string): WeakWord[] {
  const key = english.toLowerCase();
  return existing.filter(w => w.english.toLowerCase() !== key);
}
