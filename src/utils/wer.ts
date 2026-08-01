/**
 * wer.ts — Word Error Rate (WER) 계산 유틸리티
 * -----------------------------------------------------------------------------
 * 2026 개편 TOEFL Speaking 'Listen & Repeat' 채점용.
 *
 * WER = (S + D + I) / N
 *   S = substitutions (치환)
 *   D = deletions     (누락)
 *   I = insertions    (삽입)
 *   N = reference(정답) 단어 수
 *
 * 단어 단위 Levenshtein 편집 거리(edit distance) DP로 S/D/I를 역추적.
 * 소문자 정규화 + 문장부호 제거 + 관사/대소문자 무시 옵션 포함.
 */

/** 텍스트를 정규화된 단어 배열로 변환 (소문자, 문장부호 제거, 다중 공백 축약) */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    // 문장부호 제거 — 알파벳/숫자/아포스트로피만 남김
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/** 편집 연산 타입 */
export type EditOp = 'correct' | 'substitution' | 'deletion' | 'insertion';

export interface WerResult {
  /** 0~1 사이 WER (0=완벽, 1=전혀 다름) */
  wer: number;
  /** 0~1 사이 정확도 (1 - WER). 1=완벽 일치 */
  accuracy: number;
  /** 참조(정답) 단어 수 */
  referenceLength: number;
  /** 통계 */
  substitutions: number;
  deletions: number;
  insertions: number;
  correct: number;
  /** 단어별 정렬 결과 (UI 강조용) */
  alignment: EditOp[];
}

/**
 * 단어 배열 간 WER 계산 (Levenshtein DP + 역추적)
 * @param reference 정답 문장 (원본)
 * @param hypothesis 학생 발화 (STT 결과)
 */
export function calculateWer(reference: string, hypothesis: string): WerResult {
  const ref = tokenize(reference);
  const hyp = tokenize(hypothesis);
  const n = ref.length;
  const m = hyp.length;

  // 빈 참조 케이스 — 삽입만 가능
  if (n === 0) {
    return {
      wer: m > 0 ? 1 : 0,
      accuracy: m > 0 ? 0 : 1,
      referenceLength: 0,
      substitutions: 0,
      deletions: 0,
      insertions: m,
      correct: 0,
      alignment: Array.from({ length: m }, () => 'insertion' as EditOp),
    };
  }

  // DP 테이블 — dp[i][j] = ref[0..i-1] 을 hyp[0..j-1] 로 변환하는 최소 비용
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i; // deletion
  for (let j = 0; j <= m; j++) dp[0][j] = j; // insertion

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        // deletion
        dp[i][j - 1] + 1,        // insertion
        dp[i - 1][j - 1] + cost, // substitution/match
      );
    }
  }

  // 역추적으로 S/D/I 집계
  let s = 0, d = 0, ins = 0, c = 0;
  const alignment: EditOp[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + cost) {
        if (cost === 0) { c++; alignment.unshift('correct'); }
        else { s++; alignment.unshift('substitution'); }
        i--; j--;
        continue;
      }
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      d++; alignment.unshift('deletion');
      i--;
    } else {
      ins++; alignment.unshift('insertion');
      j--;
    }
  }

  const errors = s + d + ins;
  const wer = errors / n;
  return {
    wer,
    accuracy: Math.max(0, 1 - wer),
    referenceLength: n,
    substitutions: s,
    deletions: d,
    insertions: ins,
    correct: c,
    alignment,
  };
}

/**
 * WER 정확도 → 2026 TOEFL Speaking Band (0~6) 변환
 * Listen & Repeat는 Exactness & Recall 위주이므로 정확도 기반 산정.
 *   accuracy >= 0.98 → 6.0 (완벽 재현)
 *   accuracy >= 0.90 → 5.0~5.5
 *   accuracy >= 0.80 → 4.0~4.5
 *   accuracy >= 0.65 → 3.0~3.5
 *   accuracy >= 0.50 → 2.0~2.5
 *   그 미만 → 1.0~1.5
 */
export function accuracyToBand(accuracy: number): number {
  if (accuracy >= 0.98) return 6.0;
  if (accuracy >= 0.94) return 5.5;
  if (accuracy >= 0.88) return 5.0;
  if (accuracy >= 0.82) return 4.5;
  if (accuracy >= 0.76) return 4.0;
  if (accuracy >= 0.70) return 3.5;
  if (accuracy >= 0.62) return 3.0;
  if (accuracy >= 0.55) return 2.5;
  if (accuracy >= 0.45) return 2.0;
  if (accuracy >= 0.35) return 1.5;
  return 1.0;
}

/** Raw 점수(0~30 환산) 변환 — band * 5 (6.0 → 30) */
export function bandToRawScore(band: number): number {
  return Math.round(band * 5);
}
