export interface CompleteWordsBlank {
  id: number;
  answer: string;
  maxLength: number;
}

export interface NormalizedCompleteWordsPassage {
  normalizedPassage: string;
  blanks: CompleteWordsBlank[];
  sourceFormat: 'answerLength' | 'bracketSuffix' | 'indexed' | 'cmsBlanks' | 'none';
}

export function isCompleteWordsType(questionType?: string): boolean {
  const t = (questionType || '').toLowerCase();
  return (
    t.includes('complete words') ||
    t.includes('complete the words') ||
    t.includes('fill in the blank') ||
    t.includes('fill in the blanks') ||
    t.includes('cloze') ||
    t.includes('빈칸') ||
    t.includes('fillblanks') ||
    t.includes('fill-in')
  );
}

export function isModule2Question(question: any): boolean {
  const t = (question?.questionType || '').toLowerCase();
  // module/moduleName 필드는 정확히 '2', 'module 2', '모듈 2'인 경우만 Module 2로 분류.
  // 이전의 m.includes('2')는 '12', '20', '30' 등에도 매칭되어 Module 1 문제가
  // 잘못 분류되는 버그가 있었음.
  const m = String(question?.module || question?.moduleName || '').toLowerCase().trim();
  return t.includes('module 2') || m === '2' || m === 'module 2' || m === '모듈 2';
}

export function parseQuestionRange(questionNumber: number | string | undefined): { start: number; end: number } | null {
  if (questionNumber === undefined || questionNumber === null) return null;
  const text = String(questionNumber).trim();
  const range = text.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const start = parseInt(range[1], 10);
    const end = parseInt(range[2], 10);
    if (!Number.isNaN(start) && !Number.isNaN(end)) return { start, end };
  }
  const single = parseInt(text, 10);
  if (!Number.isNaN(single)) return { start: single, end: single };
  return null;
}

export function questionNumberMatches(questionNumber: number | string | undefined, target: number): boolean {
  const range = parseQuestionRange(questionNumber);
  return !!range && target >= range.start && target <= range.end;
}

export function normalizeCompleteWordsPassage(
  rawPassage: string = '',
  cmsBlanks?: Array<{ answer?: string; maxLength?: number }>
): NormalizedCompleteWordsPassage {
  const raw = rawPassage || '';
  const mappedCmsBlanks = (cmsBlanks || []).map((blank, i) => ({
    id: i,
    answer: String(blank?.answer || ''),
    maxLength: Number(blank?.maxLength) || String(blank?.answer || '').length || 5,
  }));

  // 1) Canonical explicit answer-length format: los[ses:3]
  if (/\[[^\]]+?:\d+\]/.test(raw)) {
    const blanks: CompleteWordsBlank[] = [];
    let idx = 0;
    const normalizedPassage = raw.replace(/\[([^\]]+?):(\d+)\]/g, (_match, answer, maxLen) => {
      const ans = String(answer).trim();
      blanks.push({ id: idx, answer: ans, maxLength: parseInt(maxLen, 10) || ans.length || 5 });
      return `[${idx++}]`;
    });
    return { normalizedPassage, blanks, sourceFormat: 'answerLength' };
  }

  // 2) Already indexed format: los[0] + optional blanks array
  if (/\[\d+\]/.test(raw)) {
    const ids: number[] = [];
    raw.replace(/\[(\d+)\]/g, (_match, idText) => {
      ids.push(parseInt(idText, 10));
      return '';
    });
    const blanks = ids.map((id, i) => {
      const cms = mappedCmsBlanks[id] || mappedCmsBlanks[i];
      return {
        id,
        answer: cms?.answer || '',
        maxLength: cms?.maxLength || 5,
      };
    });
    return { normalizedPassage: raw, blanks, sourceFormat: 'indexed' };
  }

  // 3) Teacher-friendly legacy suffix format: los[ses]
  // Only call this helper for Complete Words content, so bracket suffixes are safe here.
  if (/\[[A-Za-z][A-Za-z\s'-]*\]/.test(raw)) {
    const blanks: CompleteWordsBlank[] = [];
    let idx = 0;
    const normalizedPassage = raw.replace(/\[([A-Za-z][A-Za-z\s'-]*)\]/g, (_match, answer) => {
      const ans = String(answer).trim();
      blanks.push({ id: idx, answer: ans, maxLength: ans.length || 5 });
      return `[${idx++}]`;
    });
    return { normalizedPassage, blanks, sourceFormat: 'bracketSuffix' };
  }

  if (mappedCmsBlanks.length > 0) {
    return { normalizedPassage: raw, blanks: mappedCmsBlanks, sourceFormat: 'cmsBlanks' };
  }

  return { normalizedPassage: raw, blanks: [], sourceFormat: 'none' };
}

export function getCompleteWordsBlankCount(question: any): number {
  if (!question) return 0;
  const parsed = normalizeCompleteWordsPassage(question.passageText || '', question.blanks);
  if (parsed.blanks.length > 0) return parsed.blanks.length;
  const range = parseQuestionRange(question.questionNumber);
  if (range && range.end > range.start) return range.end - range.start + 1;
  return 0;
}

export function getReadingQuestionTotal(sectionData: any): number {
  const questions = sectionData?.questions || [];
  if (!Array.isArray(questions) || questions.length === 0) return 20;

  const total = questions.reduce((sum: number, q: any) => {
    if (isCompleteWordsType(q?.questionType)) {
      return sum + Math.max(1, getCompleteWordsBlankCount(q));
    }
    return sum + 1;
  }, 0);

  return total > 0 ? total : 20;
}

export function findCompleteWordsQuestionForNumber(sectionData: any, target: number, module?: 1 | 2): any | null {
  const questions = sectionData?.questions || [];
  if (!Array.isArray(questions)) return null;

  return questions.find((q: any) => {
    if (!isCompleteWordsType(q?.questionType)) return false;
    if (module === 2 && !isModule2Question(q)) return false;
    if (module === 1 && isModule2Question(q)) return false;
    return questionNumberMatches(q?.questionNumber, target);
  }) || null;
}

export function getQuestionRangeLabel(question: any, fallbackStart = 1): string {
  const range = parseQuestionRange(question?.questionNumber);
  // Complete Words 문제는 questionNumber가 단일 숫자("1")여도 blanks 개수로 범위 표시
  // → Q1-Q10, Q11-Q20 형태로 통일
  if (range && range.start === range.end && isCompleteWordsType(question?.questionType)) {
    const blankCount = getCompleteWordsBlankCount(question);
    if (blankCount > 1) {
      return `Q${range.start}-Q${range.start + blankCount - 1}`;
    }
  }
  if (range) {
    return range.start === range.end ? `Q${range.start}` : `Q${range.start}-Q${range.end}`;
  }
  const count = getCompleteWordsBlankCount(question);
  return count > 1 ? `Q${fallbackStart}-Q${fallbackStart + count - 1}` : `Q${fallbackStart}`;
}

/**
 * 목록 내 위치를 기준으로 순차 번호 라벨을 계산.
 * Complete Words(빈칸넣기)는 10문제(빈칸 수)만큼 번호를 차지하고,
 * 다음 문제는 그 뒤부터 이어진다.
 * 예) [CW(10 blanks), CW(10 blanks), CW(10 blanks), MC]
 *     → Q1-Q10, Q11-Q20, Q21-Q30, Q31
 * 반환값: question.id → 라벨 문자열 Map.
 */
export function computeSequentialLabels(questions: any[]): Map<string, string> {
  const labels = new Map<string, string>();
  if (!Array.isArray(questions)) return labels;
  const sorted = [...questions].sort((a, b) => {
    const ra = parseQuestionRange(a?.questionNumber);
    const rb = parseQuestionRange(b?.questionNumber);
    return (ra?.start ?? 0) - (rb?.start ?? 0);
  });
  let cursor = 1;
  for (const q of sorted) {
    const key = String(q?.id ?? '');
    const isCW = isCompleteWordsType(q?.questionType);
    const count = isCW ? Math.max(1, getCompleteWordsBlankCount(q)) : 1;
    const label = count > 1 ? `Q${cursor}-Q${cursor + count - 1}` : `Q${cursor}`;
    if (key) labels.set(key, label);
    cursor += count;
  }
  return labels;
}

/**
 * 한 질문의 sequential 라벨을 조회. Map에 없으면 questionNumber 기반 fallback.
 */
export function getSequentialLabel(question: any, labels?: Map<string, string>): string {
  const key = String(question?.id ?? '');
  if (labels && key && labels.has(key)) return labels.get(key)!;
  return getQuestionRangeLabel(question);
}

/**
 * 단일 문제의 "문제 수"를 반환.
 * Complete Words (Q1-Q10)는 10문제로 계산. 일반 문제는 1문제.
 */
export function getQuestionCount(question: any): number {
  // questionNumber가 "1-10" 형태면 범위로 계산
  const range = parseQuestionRange(question?.questionNumber);
  if (range && range.end > range.start) {
    return range.end - range.start + 1;
  }
  // Complete Words의 경우 blanks 개수로 계산
  if (isCompleteWordsType(question?.questionType) && Array.isArray(question?.blanks)) {
    const blankCount = question.blanks.length;
    if (blankCount > 1) return blankCount;
  }
  return 1;
}

/**
 * 문제 배열의 총 문제 수를 반환.
 * Complete Words (Q1-Q10)는 10문제로 계산.
 */
export function getTotalQuestionCount(questions: any[]): number {
  if (!Array.isArray(questions)) return 0;
  return questions.reduce((sum, q) => sum + getQuestionCount(q), 0);
}

/**
 * 전역 연속 번호 슬롯 — 엔진 표시 순서(Module 1 → Module 2, questionNumber 오름차순)로
 * CMS 질문을 전개하고, Complete Words는 빈칸 수만큼 번호를 확장한다.
 * 예) TPO1 Reading: [CW(1-10), CW(11-20), DL 21~28, AC 29~33 | CW-M2(34-43), AC-M2 44~48]
 * → History 모달 원형 개수/오답 매핑과 엔진 채점이 모두 이 슬롯을 기준으로 삼는다.
 */
export interface GlobalSlot {
  question: any;
  /** 전역 시작 번호 (1-based, 섹션 전체 기준) */
  start: number;
  /** 이 질문이 차지하는 문제 수 (CW는 빈칸 수, 그 외 1) */
  count: number;
  isCompleteWords: boolean;
  isModule2: boolean;
}

export function buildGlobalSlots(questions: any[]): GlobalSlot[] {
  if (!Array.isArray(questions)) return [];
  const sorted = [...questions].sort((a, b) => {
    const am = isModule2Question(a) ? 1 : 0;
    const bm = isModule2Question(b) ? 1 : 0;
    if (am !== bm) return am - bm;
    return (parseQuestionRange(a?.questionNumber)?.start ?? 0) - (parseQuestionRange(b?.questionNumber)?.start ?? 0);
  });
  const slots: GlobalSlot[] = [];
  let cursor = 1;
  for (const q of sorted) {
    const isCW = isCompleteWordsType(q?.questionType);
    const count = isCW ? Math.max(1, getCompleteWordsBlankCount(q)) : 1;
    slots.push({ question: q, start: cursor, count, isCompleteWords: isCW, isModule2: isModule2Question(q) });
    cursor += count;
  }
  return slots;
}

/** 특정 모듈의 슬롯만 필터 (Module 1 = isModule2 false) */
export function getModuleSlots(slots: GlobalSlot[], module: 1 | 2): GlobalSlot[] {
  return slots.filter(s => (module === 2 ? s.isModule2 : !s.isModule2));
}

/** 모듈의 문제 수 (CW 빈칸 확장 포함) */
export function getModuleQuestionCount(slots: GlobalSlot[], module: 1 | 2): number {
  return getModuleSlots(slots, module).reduce((sum, s) => sum + s.count, 0);
}
