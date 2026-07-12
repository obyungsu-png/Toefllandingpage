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
  const m = String(question?.module || question?.moduleName || '').toLowerCase();
  return t.includes('module 2') || m.includes('2') || m.includes('module 2');
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
  if (range) {
    return range.start === range.end ? `Q${range.start}` : `Q${range.start}-Q${range.end}`;
  }
  const count = getCompleteWordsBlankCount(question);
  return count > 1 ? `Q${fallbackStart}-Q${fallbackStart + count - 1}` : `Q${fallbackStart}`;
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
