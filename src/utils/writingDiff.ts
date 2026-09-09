/**
 * writingDiff.ts
 * ----------------------------------------------------------------------------
 * TPO Writing AI 첨삭 공용 diff/색상 유틸.
 * WritingReviewAiTutor(작성 화면) + WritingReviewHistory(다시보기)에서 공용 사용.
 */

// ── Semantic Color Coding (인사/맺음/동료인용/주장/예시) ───────────────────
export const COLOR_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200',
  green:  'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-200',
  blue:   'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200',
};

export const COLOR_LEGEND: Array<{ color: string; label: string }> = [
  { color: 'yellow', label: '인사/맺음' },
  { color: 'green',  label: '동료 인용' },
  { color: 'blue',   label: '핵심 주장' },
  { color: 'purple', label: '구체적 예시' },
];

// ── 인라인 Diff (LCS 기반, 삽입/삭제 정렬 유지) ────────────────────────────
export interface DiffSegment {
  type: 'same' | 'delete' | 'add';
  text: string;
}

/** 단어 단위 LCS diff — naive zip 방식의 밀림 현상 해결 */
export function renderInlineDiff(original: string, corrected: string): DiffSegment[] {
  const origTokens = (original || '').split(/(\s+)/).filter(t => t.length > 0);
  const corrTokens = (corrected || '').split(/(\s+)/).filter(t => t.length > 0);
  const m = origTokens.length;
  const n = corrTokens.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = origTokens[i] === corrTokens[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const raw: DiffSegment[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (origTokens[i] === corrTokens[j]) {
      raw.push({ type: 'same', text: corrTokens[j] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ type: 'delete', text: origTokens[i] });
      i++;
    } else {
      raw.push({ type: 'add', text: corrTokens[j] });
      j++;
    }
  }
  while (i < m) raw.push({ type: 'delete', text: origTokens[i++] });
  while (j < n) raw.push({ type: 'add', text: corrTokens[j++] });

  const merged: DiffSegment[] = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

// ── Before/After 변경 블록 ────────────────────────────────────────────────
export interface ChangeBlock {
  before: string;
  after: string;
}

export function extractChangeBlocks(segments: DiffSegment[]): ChangeBlock[] {
  const blocks: ChangeBlock[] = [];
  let before = '';
  let after = '';
  const flush = () => {
    const b = before.trim();
    const a = after.trim();
    if (b || a) blocks.push({ before: b, after: a });
    before = '';
    after = '';
  };
  for (const seg of segments) {
    if (seg.type === 'same') {
      if (seg.text.trim() === '') {
        if (before || after) { before += ' '; after += ' '; }
      } else {
        flush();
      }
    } else if (seg.type === 'delete') {
      before += seg.text;
    } else {
      after += seg.text;
    }
  }
  flush();
  return blocks;
}
