/**
 * buildSentenceExplain.ts
 * ----------------------------------------------------------------------------
 * Writing "Build a Sentence" (Q1–Q10) 문제의 정답 문장에 대한 짧은 한국어 해설을
 * GLM/Claude 로 생성하고 localStorage 에 캐시.
 *
 * 형식(참고): 핵심 문법 요점 1~2개 + 오답 유도 단어(버릴 칩) 지적.
 * 예: "빈도부사(rarely)는 동사 앞. for+명사 전치사구 · 버릴 칩: 'lately'"
 *
 * 캐시 키: bs_explain_v1:<questionId 또는 문장 해시>
 *   - 같은 문제 재열람 시 API 호출 절약 + 즉시 표시
 *   - 회원 계정별 분리 (다른 학생의 해설 캐시가 섞이지 않도록 프리픽스에 userName 포함)
 */
import { callAi, readPreferredAiModel } from './aiClient';

const CACHE_PREFIX = 'bs_explain_v1';

function readCurrentUserName(): string {
  try {
    const raw = localStorage.getItem('amx_userName');
    return (raw || '').trim() || 'anon';
  } catch { return 'anon'; }
}

/** FNV-1a 32bit — 짧은 텍스트 해시 (questionId가 없을 때 fallback 키) */
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}

function cacheKey(questionId: string | undefined, correctAnswer: string): string {
  const user = readCurrentUserName();
  const id = (questionId || '').trim() || fnv1a(correctAnswer);
  return `${CACHE_PREFIX}:${user}:${id}`;
}

export function readCachedExplanation(
  questionId: string | undefined,
  correctAnswer: string,
): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(questionId, correctAnswer));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.explanation === 'string') return parsed.explanation;
  } catch { /* ignore */ }
  return null;
}

function writeCachedExplanation(
  questionId: string | undefined,
  correctAnswer: string,
  explanation: string,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      cacheKey(questionId, correctAnswer),
      JSON.stringify({ explanation, savedAt: Date.now() }),
    );
  } catch { /* ignore quota */ }
}

export interface BuildSentenceExplainInput {
  questionId?: string;
  prompt: string;              // Q 아바타의 질문 (예: "Did you find the workshop helpful?")
  words: string[];             // 단어 뱅크 (드래그 가능 단어 + [prefilled] 형태)
  correctAnswer: string;       // 정답 문장 본체 (문장 부호 제외)
  sentenceEnding?: '.' | '?';  // 문장 끝 부호
  userAnswer?: string | null;  // 학생이 실제로 제출한 문장 (있으면 오답 원인 진단 반영)
}

/**
 * 짧은 한국어 해설을 생성. 캐시 우선, 없으면 API 호출 후 캐시.
 */
export async function fetchBuildSentenceExplanation(
  input: BuildSentenceExplainInput,
): Promise<string> {
  const cached = readCachedExplanation(input.questionId, input.correctAnswer);
  if (cached) return cached;

  const fullCorrect = `${input.correctAnswer}${input.sentenceEnding || '.'}`;

  // words에서 [prefilled]는 이미 문장에 박혀 있는 단어 → 드래그 대상 단어만 뽑아서 표시
  const draggableWords = input.words
    .filter(w => !(w.startsWith('[') && w.endsWith(']')))
    .map(w => w.trim())
    .filter(Boolean);

  // 정답 문장에 포함되지 않은 단어 = "버릴 칩" (distractor)
  const correctLower = fullCorrect.toLowerCase().replace(/[.?,!]/g, '');
  const correctTokens = new Set(correctLower.split(/\s+/).filter(Boolean));
  const distractors = draggableWords.filter(w => !correctTokens.has(w.toLowerCase()));

  const systemPrompt = [
    '너는 TOEFL Writing Build-a-Sentence 문제의 짧은 한국어 해설 전문가다.',
    '학생이 어렵게 느끼는 문법 포인트만 콕 집어서 아주 짧게 요약해준다.',
    '',
    '반드시 다음 형식 지침을 따르라:',
    '  1) 총 2줄 이내. 1줄당 30자 이내. 한국어로.',
    '  2) 첫 줄: 정답을 만들기 위한 핵심 문법 규칙 1~2개.',
    '     예) "빈도부사(rarely)는 동사 앞", "for+명사 전치사구", "부정사 to+동사원형".',
    '  3) 두 번째 줄(선택): 오답 유도 단어(버릴 칩)를 "버릴 칩: \'단어1\', \'단어2\'" 형태로.',
    '     버릴 칩이 없으면 두 번째 줄 생략.',
    '  4) 학생이 이해할 수 있게 한국어로만 설명. 영어 단어는 정답에 등장한 단어만 인용.',
    '  5) 인사말·서론·마무리 문장 절대 금지. 문법 요점만.',
    '  6) 마크다운(**, `, 목록, 코드블록) 사용 금지 — 순수 텍스트만.',
    '',
    '반드시 JSON 형식으로만 응답하라. 다른 텍스트 절대 금지:',
    '{ "explanation": "여기에 2줄 이내 해설 (줄바꿈은 \\n으로)" }',
  ].join('\n');

  const userPrompt = [
    `[질문] ${input.prompt}`,
    `[정답 문장] ${fullCorrect}`,
    `[제공된 단어 조각] ${draggableWords.join(' / ')}`,
    distractors.length > 0
      ? `[버릴 칩 후보 — 정답에 안 쓰인 단어] ${distractors.map(d => `'${d}'`).join(', ')}`
      : '[버릴 칩 후보] 없음',
    input.userAnswer ? `[학생 오답] ${input.userAnswer}` : '',
    '',
    '위 정보를 바탕으로 지침에 맞는 짧은 한국어 해설을 JSON으로 응답해줘.',
  ].filter(Boolean).join('\n');

  const provider = readPreferredAiModel();
  const raw = await callAi(systemPrompt, userPrompt, provider, 300, 0.3);

  // JSON 파싱 시도
  let explanation = '';
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    const jsonText = (s !== -1 && e !== -1 && e > s) ? cleaned.slice(s, e + 1) : cleaned;
    const parsed = JSON.parse(jsonText);
    if (parsed && typeof parsed.explanation === 'string') {
      explanation = parsed.explanation.trim();
    }
  } catch {
    // JSON 실패 시 raw 텍스트에서 앞 2줄만 취해서 fallback
    explanation = raw
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join('\n');
  }

  // 최종 정제 — 마크다운 기호 제거, 최대 2줄
  explanation = explanation
    .replace(/[*_`]/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join('\n');

  if (!explanation) {
    throw new Error('해설을 생성하지 못했습니다.');
  }

  writeCachedExplanation(input.questionId, input.correctAnswer, explanation);
  return explanation;
}
