/**
 * writingRater.ts — 2026 개편 TOEFL Writing AI 채점 모듈
 * -----------------------------------------------------------------------------
 * 채점 대상: Write an Email (Q1) / Academic Discussion (Q2)
 *
 * 차원별 루브릭 (2026 ETS Writing Rubric):
 *   [Email]
 *     1. Register & Tone (사회언어학적 격식)
 *     2. Task Completion (3 불렛포인트 충족)
 *     3. Email Structure (인사→목적→본문→맺음)
 *     4. Grammar Accuracy (문법/관용)
 *   [Discussion]
 *     1. Peer Engagement (동료 의견 인용/반박)
 *     2. Elaboration (주장 전개 + 예시)
 *     3. Syntactic Complexity (문장 다양성)
 *     4. Grammar Accuracy
 *
 * 입력: 학생 응답(sessionStorage writingResponses) + CMS modelAnswer(참고용)
 * 출력: 차원별 Band + 종합 Band(0~6) + 피드백
 *
 * 채점 트리거: Writing 전체 문항 100% 완료 시 (gradingTrigger.ts).
 */
import { callAi, safeJsonParse, type AiProvider } from './aiClient';
import type { TPOQuestion } from '../components/ContentManagement';

// ── 타입 정의 ─────────────────────────────────────────────────────────────
export interface WritingDimensionScore {
  /** 0~6 */
  score: number;
  feedback: string;
}

export interface WritingQuestionScore {
  questionNumber: number;
  questionType: 'Write an Email' | 'Academic Discussion';
  /** 학생 응답 원문 */
  userResponse: string;
  /** CMS 모범답안 (참고용, 있을 때만) */
  modelAnswer?: string;
  /** 차원별 평가 */
  dimensions: WritingDimensionScore[];
  /** 종합 Band (0~6) */
  band: number;
  /** 종합 피드백 */
  feedback: string;
  /** 채점 불가 사유 */
  unavailableReason?: string;
}

export interface WritingRaterResult {
  perQuestion: WritingQuestionScore[];
  /** 종합 Band (문항 평균) */
  overallBand: number;
  /** Raw 점수 (0~30) */
  rawScore: number;
  /** 요약 피드백 */
  summaryFeedback: string;
  /** 채점 불가 문항 수 */
  unavailableCount: number;
}

// ── 프롬프트 ──────────────────────────────────────────────────────────────
function buildWritingSystemPrompt(questionType: 'Write an Email' | 'Academic Discussion'): string {
  const isEmail = questionType === 'Write an Email';
  const dims = isEmail
    ? `1. registerAndTone (사회언어학적 격식 — 수신자 관계에 맞는 톤)
2. taskCompletion (3개 불렛포인트 요구사항 빠짐없이 충족)
3. emailStructure (인사→목적→본문→향후조치→맺음말 구조 + 문단 구분)
4. grammarAccuracy (시제/수일치/관사/관용표현 정확성)`
    : `1. peerEngagement (동료 의견 유기적 인용/반박하며 토론 흐름에 합류)
2. elaboration (자신의 주장을 구체적 예시로 전개)
3. syntacticComplexity (단순/복합문 다양성, 접속사 활용)
4. grammarAccuracy (문법/관용 정확성)`;

  return `당신은 2026년 개편 TOEFL iBT Writing 공식 채점관입니다.
아래 2026 ETS Writing Rubric 에 따라 학생 응답을 평가하세요.

[문제 유형] ${questionType}
[평가 차원]
${dims}

[채점 기준 — 각 차원 0~6 Band]
- 6.0: 완벽에 가까움. 사소한 오류만.
- 5.0: 능숙. 명확한 구조.
- 4.0: 효과적. 일부 오류.
- 3.0: 기능적. 잦은 오류.
- 2.0: 발전 필요. 의미 전달 어려움.
- 1.0: 거의 평가 불가.

반드시 JSON 형식으로만 응답하세요 (마크다운 금지):
{
  "dimensions": [
    { "score": 0-6, "feedback": "한국어 1~2문장, 학생 글 근거 발췌" }
    // 위 평가 차원 순서대로 4개
  ],
  "overallBand": 0-6,
  "summary": "한국어 2~3문장 종합 피드백 + 개선 방향"
}`;
}

function buildWritingUserPrompt(
  questionType: 'Write an Email' | 'Academic Discussion',
  questionData: TPOQuestion,
  userResponse: string,
  modelAnswer?: string,
): string {
  const q = questionData as any;
  let promptText = `[문제 유형] ${questionType}\n\n[문제 정보]\n`;
  if (questionType === 'Write an Email') {
    promptText += `상황: ${q.emailScenario || ''}\n지시: ${q.emailInstruction || ''}\n`;
    if (q.emailBullets?.length) promptText += `요구사항: ${q.emailBullets.join(' / ')}\n`;
    if (q.emailTo) promptText += `To: ${q.emailTo}\n`;
    if (q.emailSubject) promptText += `Subject: ${q.emailSubject}\n`;
  } else {
    promptText += `질문: ${questionData.questionText || ''}\n`;
    if (q.professorName) promptText += `Professor ${q.professorName}: ${q.professorMessage || ''}\n`;
    if (q.student1Name) promptText += `${q.student1Name}: ${q.student1Message || ''}\n`;
    if (q.student2Name) promptText += `${q.student2Name}: ${q.student2Message || ''}\n`;
  }
  promptText += `\n[학생 응답]\n${userResponse}\n`;
  if (modelAnswer && modelAnswer.trim()) {
    promptText += `\n[참고용 모범답안 — 채점 기준 NOT 학생 답안]\n${modelAnswer}\n`;
  }
  promptText += `\n위 데이터를 2026 ETS Writing Rubric 으로 평가해 JSON 으로 응답하세요.`;
  return promptText;
}

// ── 단일 문항 채점 ─────────────────────────────────────────────────────────
export async function scoreWritingQuestion(
  questionNumber: number,
  questionType: 'Write an Email' | 'Academic Discussion',
  questionData: TPOQuestion,
  userResponse: string,
  modelAnswer?: string,
  provider: AiProvider = 'claude',
): Promise<WritingQuestionScore> {
  // 빈 응답 → 채점 불가
  if (!userResponse || !userResponse.trim()) {
    const dimNames = questionType === 'Write an Email'
      ? ['registerAndTone', 'taskCompletion', 'emailStructure', 'grammarAccuracy']
      : ['peerEngagement', 'elaboration', 'syntacticComplexity', 'grammarAccuracy'];
    return {
      questionNumber,
      questionType,
      userResponse: userResponse || '',
      modelAnswer,
      dimensions: dimNames.map(name => ({ score: 1, feedback: `채점 불가: 응답 없음 (${name})` })),
      band: 1.0,
      feedback: '학생 응답이 없어 채점할 수 없습니다.',
      unavailableReason: '학생 응답 없음',
    };
  }

  try {
    const systemPrompt = buildWritingSystemPrompt(questionType);
    const userPrompt = buildWritingUserPrompt(questionType, questionData, userResponse, modelAnswer);
    const raw = await callAi(systemPrompt, userPrompt, provider, 1800, 0.3);
    const parsed = safeJsonParse(raw);
    if (!parsed) throw new Error('AI 응답 JSON 파싱 실패');

    const clamp = (v: any) => Math.max(0, Math.min(6, Number(v) || 0));
    const dims: WritingDimensionScore[] = Array.isArray(parsed.dimensions)
      ? parsed.dimensions.slice(0, 4).map((d: any) => ({
          score: clamp(d?.score),
          feedback: String(d?.feedback || ''),
        }))
      : [];
    // 차원이 4개 미만이면 채움
    while (dims.length < 4) dims.push({ score: 1, feedback: '평가 누락' });

    const explicitOverall = clamp(parsed.overallBand);
    const avg = dims.reduce((s, d) => s + d.score, 0) / dims.length;
    const band = explicitOverall > 0 ? explicitOverall : Math.round(avg * 2) / 2;
    const feedback = String(parsed.summary || '');

    return {
      questionNumber,
      questionType,
      userResponse,
      modelAnswer,
      dimensions: dims,
      band,
      feedback,
    };
  } catch (err: any) {
    const dimNames = questionType === 'Write an Email'
      ? ['registerAndTone', 'taskCompletion', 'emailStructure', 'grammarAccuracy']
      : ['peerEngagement', 'elaboration', 'syntacticComplexity', 'grammarAccuracy'];
    return {
      questionNumber,
      questionType,
      userResponse,
      modelAnswer,
      dimensions: dimNames.map(name => ({ score: 1, feedback: `AI 채점 오류 (${name})` })),
      band: 1.0,
      feedback: `AI 채점 중 오류: ${err?.message || '알 수 없는 오류'}`,
      unavailableReason: `AI 채점 오류: ${err?.message || '오류'}`,
    };
  }
}

// ── 전체 Writing 세션 채점 ─────────────────────────────────────────────────
export interface WritingGradingInput {
  /** CMS Writing 문항 배열 */
  questions: TPOQuestion[];
  /** 학생 응답 맵 — { questionNumber: responseText } */
  responses: Record<string, string>;
  /** 진행 콜백 */
  onProgress?: (questionNumber: number, message: string) => void;
  /** AI provider */
  provider?: AiProvider;
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export async function gradeWritingSession(
  input: WritingGradingInput,
): Promise<WritingRaterResult> {
  const { questions, responses, onProgress, provider = 'claude' } = input;
  const perQuestion: WritingQuestionScore[] = [];
  let unavailableCount = 0;

  for (const q of questions) {
    const num = typeof q.questionNumber === 'number'
      ? q.questionNumber
      : Number(String(q.questionNumber).replace(/\D/g, ''));
    if (Number.isNaN(num)) continue;
    // Write an Email / Academic Discussion 만 채점
    const qType = q.questionType;
    if (qType !== 'Write an Email' && qType !== 'Academic Discussion') continue;

    const userResponse = responses[String(num)] || '';
    onProgress?.(num, `Q${num} (${qType}) 채점 중...`);

    const score = await scoreWritingQuestion(
      num,
      qType as any,
      q,
      userResponse,
      (q as any).modelAnswer,
      provider,
    );
    if (score.unavailableReason) unavailableCount++;
    perQuestion.push(score);
  }

  const overallBand = perQuestion.length > 0
    ? roundHalf(perQuestion.reduce((s, q) => s + q.band, 0) / perQuestion.length)
    : 0;
  const rawScore = Math.round(overallBand * 5); // band * 5 → 0~30
  const dimLabels = perQuestion.map(q =>
    `Q${q.questionNumber} ${q.questionType}: Band ${q.band}`,
  ).join(' / ');
  const unavailableNote = unavailableCount > 0 ? ` ⚠️ 채점 불가 ${unavailableCount}문항` : '';
  const summaryFeedback = `${dimLabels}${unavailableNote}`;

  return {
    perQuestion,
    overallBand,
    rawScore,
    summaryFeedback,
    unavailableCount,
  };
}
