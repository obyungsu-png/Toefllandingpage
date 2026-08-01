/**
 * speakingRater.ts — 2026 개편 TOEFL Speaking AI 채점 모듈
 * -----------------------------------------------------------------------------
 * 평가 요소 (ETS 2026 Speaking Rubric):
 *   1. Exactness & Recall (Listen & Repeat) — WER 기반 정확도
 *   2. Delivery (전달력)                   — 발음/강세/억양/끊어읽기
 *   3. Fluency (유창성)                     — WPM, 지연음(uh/um), 정적
 *   4. Topic Development (Interview)        — 문맥 적합 자연스러운 답변 확장
 *
 * 파이프라인:
 *   [녹음 Blob] → STT(Whisper) → 텍스트
 *   Q1-Q7 (Listen & Repeat): WER(원본문장 vs STT) → Band
 *   Q8-Q11 (Interview):       LLM rater(STT + 음향메타 + 2026 Rubric) → Band
 *   → 영역별 점수 + 종합 Band → History 전송
 *
 * 채점 트리거: Speaking 100% 완료 시에만 실행 (gradingTrigger.ts).
 */
import { calculateWer, accuracyToBand, bandToRawScore, type WerResult } from './wer';
import { callAi, safeJsonParse, type AiProvider } from './aiClient';
import { fetchAudioBlob, calculateWpm, calculateTotalPause, type SttResult, type SttWord } from '../hooks/useStt';
import type { TPOQuestion } from '../components/ContentManagement';

// ── 타입 정의 ─────────────────────────────────────────────────────────────
export type SpeakingQuestionKind = 'listen-repeat' | 'interview';

export interface ListenRepeatScore {
  questionNumber: number;
  kind: 'listen-repeat';
  /** 원본 정답 문장 */
  reference: string;
  /** STT 변환 텍스트 */
  transcript: string;
  wer: WerResult;
  accuracy: number;
  band: number;
  /** 채점 불가 사유 (STT 실패 등) — UI에서 경고 표시 */
  unavailableReason?: string;
}

export interface InterviewDimensionScore {
  /** 0~6 */
  score: number;
  feedback: string;
}

export interface InterviewScore {
  questionNumber: number;
  kind: 'interview';
  /** 질문/프롬프트 */
  prompt: string;
  /** STT 변환 텍스트 */
  transcript: string;
  /** 음향 메타데이터 */
  wpm: number;
  totalPauseSec: number;
  /** 차원별 평가 */
  dimensions: {
    delivery: InterviewDimensionScore;
    fluency: InterviewDimensionScore;
    topicDevelopment: InterviewDimensionScore;
  };
  /** 종합 Band (0~6) — 3차원 가중평균 */
  band: number;
  /** 종합 피드백 */
  feedback: string;
  unavailableReason?: string;
}

export type SpeakingQuestionScore = ListenRepeatScore | InterviewScore;

export interface SpeakingRaterResult {
  /** 문항별 결과 (Q1~Q11 순) */
  perQuestion: SpeakingQuestionScore[];
  /** Listen & Repeat 평균 Band */
  listenRepeatBand: number;
  /** Interview 평균 Band */
  interviewBand: number;
  /** 전체 종합 Band (0~6) */
  overallBand: number;
  /** Raw 점수 (0~30 환산) */
  rawScore: number;
  /** 요약 피드백 (History 표시용) */
  summaryFeedback: string;
  /** 채점에 사용된 STT 소스 */
  sttSource: 'deepgram' | 'local-whisper' | 'webspeech' | 'mixed' | 'none';
  /** 채점 불가 문항 수 */
  unavailableCount: number;
}

// ── 문항 분류 — Q1~7=Listen&Repeat, Q8~11=Interview ─────────────────────
export function classifySpeakingQuestion(q: TPOQuestion): SpeakingQuestionKind {
  const num = typeof q.questionNumber === 'number'
    ? q.questionNumber
    : Number(String(q.questionNumber).replace(/\D/g, ''));
  if (Number.isNaN(num)) return 'listen-repeat';
  return num <= 7 ? 'listen-repeat' : 'interview';
}

// ── Listen & Repeat 원본 문장 추출 ───────────────────────────────────────
// scriptText 필드(또는 questionText)를 원본 정답 문장으로 사용.
function getReferenceSentence(q: TPOQuestion): string {
  return (q as any).scriptText || q.questionText || '';
}

// ── 1. Listen & Repeat 채점 (WER 기반) ───────────────────────────────────
export function scoreListenRepeat(
  questionNumber: number,
  reference: string,
  transcript: string,
): ListenRepeatScore {
  // STT 실패/빈 텍스트 → 채점 불가
  if (!transcript || !transcript.trim()) {
    return {
      questionNumber,
      kind: 'listen-repeat',
      reference,
      transcript: transcript || '',
      wer: {
        wer: 1,
        accuracy: 0,
        referenceLength: reference.split(/\s+/).filter(Boolean).length,
        substitutions: 0,
        deletions: 0,
        insertions: 0,
        correct: 0,
        alignment: [],
      },
      accuracy: 0,
      band: 1.0,
      unavailableReason: 'STT 인식 결과가 없습니다. (무음/잡음/네트워크 오류)',
    };
  }
  const wer = calculateWer(reference, transcript);
  const band = accuracyToBand(wer.accuracy);
  return {
    questionNumber,
    kind: 'listen-repeat',
    reference,
    transcript,
    wer,
    accuracy: wer.accuracy,
    band,
  };
}

// ── 2. Interview 채점 (LLM rater — 2026 ETS Rubric) ──────────────────────
const INTERVIEW_SYSTEM_PROMPT = `당신은 2026년 개편 TOEFL iBT Speaking 'Take an Interview' 공식 채점관입니다.
아래 2026 ETS Speaking Rubric 에 따라 학생 답변을 평가하세요.

[평가 요소]
1. Delivery (전달력) — 발음(Phonemes), 문장 강세, 억양, 자연스러운 끊어읽기(Pausing)
2. Fluency (유창성) — WPM(분당 말하기 속도), 불필요한 지연음(uh, um) 및 어색한 정적 유무
3. Topic Development (주제 전개) — 템플릿 암기가 아닌 문맥에 맞는 자연스러운 답변 확장

[채점 기준 — 각 차원 0~6 Band]
- 6.0: 완벽에 가까움. 모호함 없이 명료.
- 5.0: 능숙. 사소한 오류만.
- 4.0: 효과적. 일부 오류/주저함.
- 3.0: 기능적. 잦은 오류/정적.
- 2.0: 발전 필요. 의미 전달 어려움.
- 1.0: 거의 평가 불가.

반드시 JSON 형식으로만 응답하세요 (마크다운 금지):
{
  "delivery": { "score": 0-6, "feedback": "한국어 1~2문장, 학생 답변 근거 발췌" },
  "fluency": { "score": 0-6, "feedback": "한국어 1~2문장, WPM/정적 기반" },
  "topicDevelopment": { "score": 0-6, "feedback": "한국어 1~2문장, 템플릿 의존도 평가" },
  "overallBand": 0-6,
  "summary": "한국어 2~3문장 종합 피드백"
}`;

export async function scoreInterview(
  questionNumber: number,
  prompt: string,
  transcript: string,
  audioMeta: { wpm: number; totalPauseSec: number; durationSec?: number },
  provider: AiProvider = 'claude',
): Promise<InterviewScore> {
  // STT 실패 → 채점 불가
  if (!transcript || !transcript.trim()) {
    return {
      questionNumber,
      kind: 'interview',
      prompt,
      transcript: transcript || '',
      wpm: audioMeta.wpm,
      totalPauseSec: audioMeta.totalPauseSec,
      dimensions: {
        delivery: { score: 1, feedback: '채점 불가: STT 인식 결과 없음' },
        fluency: { score: 1, feedback: '채점 불가: STT 인식 결과 없음' },
        topicDevelopment: { score: 1, feedback: '채점 불가: STT 인식 결과 없음' },
      },
      band: 1.0,
      feedback: 'STT 인식 결과가 없어 채점할 수 없습니다.',
      unavailableReason: 'STT 인식 결과가 없습니다.',
    };
  }

  const userPrompt = `[Interview 질문]
${prompt}

[학생 답변 STT 변환]
${transcript}

[음향 메타데이터]
- WPM(분당 단어 수): ${audioMeta.wpm}
- 총 무음 구간: ${audioMeta.totalPauseSec}초
${audioMeta.durationSec ? `- 오디오 길이: ${audioMeta.durationSec}초` : ''}

위 데이터를 2026 ETS Speaking Rubric 으로 평가해 JSON 으로 응답하세요.`;

  try {
    const raw = await callAi(INTERVIEW_SYSTEM_PROMPT, userPrompt, provider, 1500, 0.3);
    const parsed = safeJsonParse(raw);
    if (!parsed) {
      throw new Error('AI 응답 JSON 파싱 실패');
    }
    const clamp = (v: any) => Math.max(0, Math.min(6, Number(v) || 0));
    const delivery = {
      score: clamp(parsed.delivery?.score),
      feedback: String(parsed.delivery?.feedback || ''),
    };
    const fluency = {
      score: clamp(parsed.fluency?.score),
      feedback: String(parsed.fluency?.feedback || ''),
    };
    const topicDevelopment = {
      score: clamp(parsed.topicDevelopment?.score),
      feedback: String(parsed.topicDevelopment?.feedback || ''),
    };
    // 종합 Band: 명시적 overallBand 우선, 없으면 가중평균 (Delivery 0.34, Fluency 0.33, Topic 0.33)
    const explicitOverall = clamp(parsed.overallBand);
    const weighted = delivery.score * 0.34 + fluency.score * 0.33 + topicDevelopment.score * 0.33;
    const band = explicitOverall > 0 ? explicitOverall : Math.round(weighted * 2) / 2;
    const feedback = String(parsed.summary || '');

    return {
      questionNumber,
      kind: 'interview',
      prompt,
      transcript,
      wpm: audioMeta.wpm,
      totalPauseSec: audioMeta.totalPauseSec,
      dimensions: { delivery, fluency, topicDevelopment },
      band,
      feedback,
    };
  } catch (err: any) {
    return {
      questionNumber,
      kind: 'interview',
      prompt,
      transcript,
      wpm: audioMeta.wpm,
      totalPauseSec: audioMeta.totalPauseSec,
      dimensions: {
        delivery: { score: 1, feedback: 'AI 채점 오류' },
        fluency: { score: 1, feedback: 'AI 채점 오류' },
        topicDevelopment: { score: 1, feedback: 'AI 채점 오류' },
      },
      band: 1.0,
      feedback: `AI 채점 중 오류: ${err?.message || '알 수 없는 오류'}`,
      unavailableReason: `AI 채점 오류: ${err?.message || '오류'}`,
    };
  }
}

// ── 3. 전체 Speaking 세션 채점 오케스트레이터 ────────────────────────────
export interface SpeakingGradingInput {
  /** CMS 질문 배열 (정렬된 상태) */
  questions: TPOQuestion[];
  /** 녹음 URL 맵 — { questionNumber: recordingUrl } */
  recordings: Record<string, string>;
  /** STT 변환 함수 (useStt.transcribe 주입) */
  transcribe: (blob: Blob) => Promise<SttResult | null>;
  /** 진행 상황 콜백 (questionNumber, phase, message) */
  onProgress?: (questionNumber: number, phase: 'fetch' | 'stt' | 'grade', message: string) => void;
  /** AI provider — Interview 채점용 */
  provider?: AiProvider;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function roundHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/**
 * Speaking 전체 세션 채점 실행
 * 모든 문항(Q1~Q11)을 순회하며 STT → 채점 수행.
 */
export async function gradeSpeakingSession(
  input: SpeakingGradingInput,
): Promise<SpeakingRaterResult> {
  const { questions, recordings, transcribe, onProgress, provider = 'claude' } = input;
  const perQuestion: SpeakingQuestionScore[] = [];
  const sttSources: Set<string> = new Set();
  let unavailableCount = 0;

  for (const q of questions) {
    const num = typeof q.questionNumber === 'number'
      ? q.questionNumber
      : Number(String(q.questionNumber).replace(/\D/g, ''));
    if (Number.isNaN(num)) continue;

    const kind = classifySpeakingQuestion(q);
    const recordingUrl = recordings[String(num)];

    // 녹음 없음 → 채점 불가
    if (!recordingUrl) {
      if (kind === 'listen-repeat') {
        perQuestion.push({
          questionNumber: num,
          kind: 'listen-repeat',
          reference: getReferenceSentence(q),
          transcript: '',
          wer: {
            wer: 1, accuracy: 0,
            referenceLength: getReferenceSentence(q).split(/\s+/).filter(Boolean).length,
            substitutions: 0, deletions: 0, insertions: 0, correct: 0, alignment: [],
          },
          accuracy: 0,
          band: 1.0,
          unavailableReason: '녹음이 없습니다.',
        });
      } else {
        perQuestion.push({
          questionNumber: num,
          kind: 'interview',
          prompt: q.questionText || '',
          transcript: '',
          wpm: 0,
          totalPauseSec: 0,
          dimensions: {
            delivery: { score: 1, feedback: '녹음 없음' },
            fluency: { score: 1, feedback: '녹음 없음' },
            topicDevelopment: { score: 1, feedback: '녹음 없음' },
          },
          band: 1.0,
          feedback: '녹음이 없어 채점할 수 없습니다.',
          unavailableReason: '녹음이 없습니다.',
        });
      }
      unavailableCount++;
      continue;
    }

    // 1) 오디오 Blob fetch
    onProgress?.(num, 'fetch', `Q${num} 오디오 로딩 중...`);
    const blob = await fetchAudioBlob(recordingUrl);
    if (!blob) {
      // Blob fetch 실패 → 채점 불가 처리 후 계속
      unavailableCount++;
      perQuestion.push(kind === 'listen-repeat'
        ? {
            questionNumber: num, kind: 'listen-repeat',
            reference: getReferenceSentence(q), transcript: '',
            wer: { wer: 1, accuracy: 0, referenceLength: 0, substitutions: 0, deletions: 0, insertions: 0, correct: 0, alignment: [] },
            accuracy: 0, band: 1.0,
            unavailableReason: '오디오 로딩 실패',
          }
        : {
            questionNumber: num, kind: 'interview',
            prompt: q.questionText || '', transcript: '',
            wpm: 0, totalPauseSec: 0,
            dimensions: {
              delivery: { score: 1, feedback: '오디오 로딩 실패' },
              fluency: { score: 1, feedback: '오디오 로딩 실패' },
              topicDevelopment: { score: 1, feedback: '오디오 로딩 실패' },
            },
            band: 1.0, feedback: '오디오 로딩 실패로 채점 불가.',
            unavailableReason: '오디오 로딩 실패',
          });
      continue;
    }

    // 2) STT
    onProgress?.(num, 'stt', `Q${num} 음성 인식 중...`);
    const sttResult = await transcribe(blob);
    if (!sttResult) {
      unavailableCount++;
      // STT 완전 실패
      perQuestion.push(kind === 'listen-repeat'
        ? {
            questionNumber: num, kind: 'listen-repeat',
            reference: getReferenceSentence(q), transcript: '',
            wer: { wer: 1, accuracy: 0, referenceLength: 0, substitutions: 0, deletions: 0, insertions: 0, correct: 0, alignment: [] },
            accuracy: 0, band: 1.0,
            unavailableReason: 'STT 인식 실패',
          }
        : {
            questionNumber: num, kind: 'interview',
            prompt: q.questionText || '', transcript: '',
            wpm: 0, totalPauseSec: 0,
            dimensions: {
              delivery: { score: 1, feedback: 'STT 실패' },
              fluency: { score: 1, feedback: 'STT 실패' },
              topicDevelopment: { score: 1, feedback: 'STT 실패' },
            },
            band: 1.0, feedback: 'STT 인식 실패로 채점 불가.',
            unavailableReason: 'STT 인식 실패',
          });
      continue;
    }
    sttSources.add(sttResult.source);

    // 3) 채점
    onProgress?.(num, 'grade', `Q${num} 채점 중...`);
    if (kind === 'listen-repeat') {
      const score = scoreListenRepeat(num, getReferenceSentence(q), sttResult.text);
      if (score.unavailableReason) unavailableCount++;
      perQuestion.push(score);
    } else {
      // Interview: 음향 메타데이터 계산 후 LLM rater
      const wpm = calculateWpm(sttResult.words || [], sttResult.duration);
      const totalPauseSec = calculateTotalPause(sttResult.words || []);
      const score = await scoreInterview(
        num, q.questionText || '', sttResult.text,
        { wpm, totalPauseSec, durationSec: sttResult.duration },
        provider,
      );
      if (score.unavailableReason) unavailableCount++;
      perQuestion.push(score);
    }
  }

  // ── 종합 점수 산정 ──
  const lrScores = perQuestion.filter(s => s.kind === 'listen-repeat') as ListenRepeatScore[];
  const ivScores = perQuestion.filter(s => s.kind === 'interview') as InterviewScore[];

  const lrBand = lrScores.length > 0
    ? roundHalf(lrScores.reduce((sum, s) => sum + s.band, 0) / lrScores.length)
    : 0;
  const ivBand = ivScores.length > 0
    ? roundHalf(ivScores.reduce((sum, s) => sum + s.band, 0) / ivScores.length)
    : 0;

  // 전체 Band: Listen&Repeat 50% + Interview 50% (둘 다 있을 때)
  let overallBand: number;
  if (lrScores.length > 0 && ivScores.length > 0) {
    overallBand = roundHalf(lrBand * 0.5 + ivBand * 0.5);
  } else if (lrScores.length > 0) {
    overallBand = lrBand;
  } else if (ivScores.length > 0) {
    overallBand = ivBand;
  } else {
    overallBand = 0;
  }

  const rawScore = bandToRawScore(overallBand);

  // 요약 피드백
  const lrSummary = lrScores.length > 0
    ? `Listen & Repeat 평균 ${lrBand} (정확도 평균 ${Math.round(
        (lrScores.reduce((s, x) => s + x.accuracy, 0) / lrScores.length) * 100,
      )}%)`
    : '';
  const ivSummary = ivScores.length > 0
    ? `Interview 평균 ${ivBand} (Delivery/Fluency/Topic Development 종합)`
    : '';
  const unavailableNote = unavailableCount > 0
    ? ` ⚠️ 채점 불가 ${unavailableCount}문항 (녹음/STT 누락)`
    : '';
  const summaryFeedback = [lrSummary, ivSummary].filter(Boolean).join(' / ') + unavailableNote;

  const sttSource: SpeakingRaterResult['sttSource'] =
    sttSources.size === 0 ? 'none'
    : sttSources.size === 1 ? (Array.from(sttSources)[0] as any)
    : 'mixed';

  return {
    perQuestion,
    listenRepeatBand: lrBand,
    interviewBand: ivBand,
    overallBand,
    rawScore,
    summaryFeedback,
    sttSource,
    unavailableCount,
  };
}

// ── 편의: recordings 맵에서 응답(녹음)된 문항 수 계산 ──
export function countAnswered(recordings: Record<string, string>, questions: TPOQuestion[]): number {
  return questions.filter(q => {
    const num = typeof q.questionNumber === 'number'
      ? q.questionNumber
      : Number(String(q.questionNumber).replace(/\D/g, ''));
    return !Number.isNaN(num) && recordings[String(num)];
  }).length;
}
