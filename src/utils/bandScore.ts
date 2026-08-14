/**
 * 2026 TOEFL iBT Band Score (1.0 – 6.0, 0.5 단위)
 *
 * ETS 는 2026-01-21 부터 각 영역을 1~6점 밴드(0.5 단위, 총 11단계)로 환산한다.
 * Reading/Listening 은 정답 개수(raw)를 섹션별 raw max 로 선형 스케일한 뒤 밴드표에 매핑.
 * Speaking/Writing 은 AI 채점의 aiBandScore(0-6) 를 그대로 사용.
 *
 * 단순화 정책 (구현 편의 우선)
 *   A. 모든 문항 1점 균등 — 요약형·표완성 2점 가중치 미반영, correct/total 비율로 raw 스케일
 *   B. 항상 Hard 모듈 가정 — Easy 모듈 상한(Reading raw 15) 미적용
 *   C. Speaking/Writing 은 AI 밴드 그대로 (재환산 없음)
 */

export type Section = 'Reading' | 'Listening' | 'Speaking' | 'Writing';

/** 섹션별 raw 점수 최댓값 (ETS 공식) */
export const SECTION_RAW_MAX: Record<Section, number> = {
  Reading: 22,   // 20문항 + 요약형 2점 포함
  Listening: 30, // 28문항 + 다중선택/표완성 2점 포함
  Speaking: 30,  // AI raw score
  Writing: 30,   // AI raw score
};

/** correct/total → 섹션 raw 로 선형 스케일 (0~SECTION_RAW_MAX) */
export function scaleRawScore(section: Section, correct: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, correct / total));
  return Math.round(ratio * SECTION_RAW_MAX[section]);
}

/** Reading raw(0-22) → 1.0~6.0 밴드 */
export function readingRawToBand(raw: number): number {
  if (raw >= 21) return 6.0;
  if (raw >= 19) return 5.5;
  if (raw >= 16) return 5.0;
  if (raw >= 14) return 4.5;
  if (raw >= 11) return 4.0;
  if (raw >= 8)  return 3.5;
  if (raw >= 5)  return 3.0;
  if (raw >= 4)  return 2.5;
  if (raw >= 3)  return 2.0;
  if (raw >= 2)  return 1.5;
  return 1.0;
}

/** Listening raw(0-30) → 1.0~6.0 밴드 */
export function listeningRawToBand(raw: number): number {
  if (raw >= 28) return 6.0;
  if (raw >= 25) return 5.5;
  if (raw >= 21) return 5.0;
  if (raw >= 18) return 4.5;
  if (raw >= 15) return 4.0;
  if (raw >= 11) return 3.5;
  if (raw >= 7)  return 3.0;
  if (raw >= 5)  return 2.5;
  if (raw >= 3)  return 2.0;
  if (raw >= 1)  return 1.5;
  return 1.0;
}

/** Speaking/Writing AI raw(0-30) → 1.0~6.0 밴드 — 대칭적 매핑, 필요 시 사용 */
export function speakingWritingRawToBand(raw: number): number {
  if (raw >= 29) return 6.0;
  if (raw >= 25) return 5.5;
  if (raw >= 22) return 5.0;
  if (raw >= 19) return 4.5;
  if (raw >= 16) return 4.0;
  if (raw >= 13) return 3.5;
  if (raw >= 10) return 3.0;
  if (raw >= 7)  return 2.5;
  if (raw >= 4)  return 2.0;
  if (raw >= 2)  return 1.5;
  return 1.0;
}

/** 정답/전체 → 밴드 (Reading/Listening 편의 함수) */
export function computeSectionBand(section: Section, correct: number, total: number): number {
  const raw = scaleRawScore(section, correct, total);
  if (section === 'Reading') return readingRawToBand(raw);
  if (section === 'Listening') return listeningRawToBand(raw);
  return speakingWritingRawToBand(raw);
}

/** 밴드 → CEFR 라벨 (End 화면 뱃지와 일관) */
export function getCEFRLevel(band: number): { cefr: string; label: string; color: string; bg: string } {
  if (band >= 6.0) return { cefr: 'C2', label: 'Expert', color: '#7c3aed', bg: '#f3e8ff' };
  if (band >= 5.0) return { cefr: 'C1', label: 'Advanced', color: '#10b981', bg: '#dcfce7' };
  if (band >= 4.0) return { cefr: 'B2', label: 'Upper-Int', color: '#3b82f6', bg: '#dbeafe' };
  if (band >= 3.0) return { cefr: 'B1', label: 'Intermediate', color: '#e67e22', bg: '#fef3c7' };
  if (band >= 2.0) return { cefr: 'A2', label: 'Elementary', color: '#f97316', bg: '#ffedd5' };
  return { cefr: 'A1', label: 'Beginner', color: '#ef4444', bg: '#fee2e2' };
}

/** 0.5 단위 반올림 (0.25 → 0.5, 0.24 → 0.0) */
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** 4영역 밴드 산술평균 → 0.5 반올림 · 하나라도 없으면 null */
export function computeOverallBand(bands: {
  reading?: number | null;
  listening?: number | null;
  speaking?: number | null;
  writing?: number | null;
}): number | null {
  const list = [bands.reading, bands.listening, bands.speaking, bands.writing];
  if (list.some(b => b == null || Number.isNaN(b))) return null;
  const sum = list.reduce<number>((s, b) => s + (b as number), 0);
  return Math.max(1.0, Math.min(6.0, roundToHalf(sum / 4)));
}
