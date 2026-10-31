/**
 * questionKey.ts — "한 개의 문제" 를 식별하는 canonical key 유틸
 * ---------------------------------------------------------------
 * 포맷: "<family>:<testNumber>:<section>:<questionNumber>"
 *   family  = tpo | test | training
 *   section = reading | listening | writing | speaking
 *
 * 예시 : "tpo:3:reading:4", "test:7:listening:12", "training:2:writing:1"
 */

export type QuestionFamily = 'tpo' | 'test' | 'training';
export type QuestionSection = 'reading' | 'listening' | 'writing' | 'speaking';

export interface QuestionRef {
  family:         QuestionFamily;
  testNumber:     number;
  section:        QuestionSection;
  questionNumber: number;
}

const FAMILIES: readonly QuestionFamily[]  = ['tpo', 'test', 'training'];
const SECTIONS: readonly QuestionSection[] = ['reading', 'listening', 'writing', 'speaking'];

export function isQuestionFamily(v: unknown): v is QuestionFamily {
  return typeof v === 'string' && (FAMILIES as readonly string[]).includes(v);
}
export function isQuestionSection(v: unknown): v is QuestionSection {
  return typeof v === 'string' && (SECTIONS as readonly string[]).includes(v);
}

export function buildQuestionKey(ref: QuestionRef): string {
  return `${ref.family}:${ref.testNumber}:${ref.section}:${ref.questionNumber}`;
}

export function parseQuestionKey(key: string | null | undefined): QuestionRef | null {
  if (!key || typeof key !== 'string') return null;
  const parts = key.split(':');
  if (parts.length !== 4) return null;
  const [family, testStr, section, qStr] = parts;
  if (!isQuestionFamily(family)) return null;
  if (!isQuestionSection(section)) return null;
  const testNumber     = Number(testStr);
  const questionNumber = Number(qStr);
  if (!Number.isFinite(testNumber) || testNumber <= 0) return null;
  if (!Number.isFinite(questionNumber) || questionNumber <= 0) return null;
  return { family, testNumber, section, questionNumber };
}

/** 사용자 표시용 짧은 라벨. 예: "TPO 3 R Q4" */
export function formatQuestionLabel(key: string | QuestionRef): string {
  const ref = typeof key === 'string' ? parseQuestionKey(key) : key;
  if (!ref) return typeof key === 'string' ? key : '';
  const famLabel = ref.family.toUpperCase();
  const secLabel: Record<QuestionSection, string> = {
    reading:   'R',
    listening: 'L',
    writing:   'W',
    speaking:  'S',
  };
  return `${famLabel} ${ref.testNumber} ${secLabel[ref.section]} Q${ref.questionNumber}`;
}

/** 긴 라벨 (전체 섹션명). 예: "TPO 3 · Reading · Q4" */
export function formatQuestionLabelFull(key: string | QuestionRef): string {
  const ref = typeof key === 'string' ? parseQuestionKey(key) : key;
  if (!ref) return typeof key === 'string' ? key : '';
  const famLabel = ref.family.toUpperCase();
  const secLabel: Record<QuestionSection, string> = {
    reading:   'Reading',
    listening: 'Listening',
    writing:   'Writing',
    speaking:  'Speaking',
  };
  return `${famLabel} ${ref.testNumber} · ${secLabel[ref.section]} · Q${ref.questionNumber}`;
}

export const QUESTION_FAMILIES: readonly QuestionFamily[] = FAMILIES;
export const QUESTION_SECTIONS: readonly QuestionSection[] = SECTIONS;
