/**
 * WritingReviewAiTutor.tsx
 * -----------------------------------------------------------------------------
 * 2026년 개편 토플 라이팅 AI 자동 채점 & 피드백 시스템
 * (Write an Email / Academic Discussion)
 *
 * 핵심 기능 (2026 트렌드 반영):
 * 1) 하이브리드 파이프라인 — 1차 정량(로컬 휴리스틱) + 2차 LLM 정성(CoT 기반)
 * 2) 차원별 루브릭 (Explainable AI) — Email/Discussion 각각 4개 차원
 * 3) Semantic Color Coding — 인사/맺음(노랑), 동료 인용(초록), 핵심 주장(파랑), 예시(보라)
 * 4) Tone Meter — 이메일 작성 시 실시간 격식 게이지 (0=캐주얼 ~ 100=포멀)
 * 5) AI 원클릭 문장 업그레이드 — 유치한 문장을 Band 6.0 수준으로 Paraphrase
 * 6) 인라인 Diff, 모범 에세이, 첨삭 리포트 내보내기
 *
 * 점수 체계: 2026년 개편 토플 국제표준 6점 만점 (0.0 ~ 6.0)
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, X, Loader2, FileText, Download,
  CheckCircle2, AlertCircle, BookOpen, Wand2, GraduationCap,
  ArrowRight, Copy, RotateCcw, Gauge,
} from 'lucide-react';

// ── API 설정 (ToeflAiWidget와 동일) ────────────────────────────────────────
const GLM_API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = 'dc2213720f4b4a88ae06ddbd434ab1dd.qDGcLtBM9gGqp6ff';
const GLM_MODEL = 'glm-4-flash';

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron === true;
const CLAUDE_PROXY_ENDPOINT = isElectron
  ? 'https://apiclaude.cc/v1/chat/completions'
  : '/api/claude/chat/completions';
const CLAUDE_MODEL = 'claude-sonnet-5';

// ── 타입 정의 ──────────────────────────────────────────────────────────────
type WritingType = 'email' | 'discussion';

// 2026 스펙: 차원별 평가 (Explainable AI)
type EmailDimensionKey = 'registerAndTone' | 'taskCompletion' | 'emailStructure' | 'grammarAccuracy';
type DiscussionDimensionKey = 'peerEngagement' | 'elaboration' | 'syntacticComplexity' | 'grammarAccuracy';
type DimensionKey = EmailDimensionKey | DiscussionDimensionKey;

interface DimensionScore {
  score: number;     // 0-6
  feedback: string;  // 학생 글에서 근거 문장 발췌 후 개선 방향 (한국어)
}

interface GrammarCorrection {
  original: string;
  corrected: string;
  rule: string; // 문법 규칙 설명 (한국어)
}

interface SemanticHighlight {
  text: string;
  category: 'salutation' | 'signoff' | 'peerQuote' | 'claim' | 'elaboration';
  color: 'yellow' | 'green' | 'blue' | 'purple';
}

interface UpgradeSuggestion {
  original: string;   // 유치하지만 문법적으로 틀리지 않은 학생 문장
  upgraded: string;   // Band 6.0 수준 고급 문장
  reason: string;      // 업그레이드 이유 (한국어)
}

interface RubricScore {
  overall: number;  // 0-6 (2026년 개편 토플 국제표준)
  dimensions: Partial<Record<DimensionKey, DimensionScore>>;
  overallFeedback: string;
}

interface ModelEssay {
  content: string;
  rationale: string;
}

interface AnalysisResult {
  rubric: RubricScore;
  grammarCorrections: GrammarCorrection[];
  modelEssay: ModelEssay;
  upgradedText: string; // AI가 제안하는 교정 버전 (inline diff용)
}

interface WritingReviewAiTutorProps {
  writingType: WritingType;
  userAnswer: string;           // 학생이 작성한 원본 에세이
  questionData: any;            // CMS 문제 데이터 (컨텍스트용)
  onClose?: () => void;
}

// ── 차원 메타데이터 (라벨 + 설명) ────────────────────────────────────────────
// 2026 토플 라이팅 공식 채점 기준 반영
const DIMENSION_META: Record<DimensionKey, { label: string; desc: string; priority: string }> = {
  // ── Email 차원 (Task 1) ──
  registerAndTone: {
    label: '사회언어학적 격식 (Register & Tone)',
    desc: '수신자와의 관계에 맞는 톤앤매너 (Professor=격식 / Peer=반격식)',
    priority: '최우선',
  },
  taskCompletion: {
    label: '과제 완수도 (Task Completion)',
    desc: '3가지 불렛포인트 요구사항 빠짐없이 충족 (누락/모호 서술 감점)',
    priority: '핵심',
  },
  emailStructure: {
    label: '구성 및 일관성 (Organization & Cohesion)',
    desc: '인사말 → 목적 → 본문 → 향후 조치 → 맺음말 구조 + 문단 구분',
    priority: '핵심',
  },
  grammarAccuracy: {
    label: '언어 사용 정확성 (Language Accuracy)',
    desc: '문법 오류(시제/수일치/관사) + 관용 표현(Collocation) 정확성',
    priority: '기본',
  },
  // ── Discussion 차원 (Task 2) ──
  peerEngagement: {
    label: '토론 기여도 및 동료 상호작용 (Contribution & Peer Engagement)',
    desc: 'Andrew/Claire 의견 유기적 인용/반박하며 토론 흐름에 합류',
    priority: '고득점 열쇠',
  },
  elaboration: {
    label: '논증 구체성 및 전개 (Elaboration & Support)',
    desc: '명확한 입장 + 참신한 예시/근거 (개인경험, 사회트렌드, 구체적 시나리오)',
    priority: '핵심',
  },
  syntacticComplexity: {
    label: '구문 및 어휘적 다양성 (Syntactic & Lexical Complexity)',
    desc: 'AWL 학술 어휘(beneficial/detrimental/advocate) + 복문(분사구문/관계대명사절/명사절)',
    priority: '핵심',
  },
};

// 분량 기준 (2026 토플 공식)
const WORD_COUNT_RULE = {
  email: { min: 80, max: 120, desc: '80~120 단어 (분량 준수 중요)' },
  discussion: { min: 100, max: null, desc: '100단어 이상 (풍부한 논증 필요)' },
} as const;

function getDimensionsFor(type: WritingType): DimensionKey[] {
  if (type === 'email') return ['registerAndTone', 'taskCompletion', 'emailStructure', 'grammarAccuracy'];
  return ['peerEngagement', 'elaboration', 'syntacticComplexity', 'grammarAccuracy'];
}

// ── 채점 프롬프트 빌더 (2026 토플 공식 채점 기준 상세 반영) ────────────────────
function buildRubricPrompt(writingType: WritingType): string {
  const dims = getDimensionsFor(writingType);
  const wordRule = WORD_COUNT_RULE[writingType];
  const wordRange = wordRule.max ? `${wordRule.min}~${wordRule.max}단어` : `${wordRule.min}단어 이상`;

  const base = `너는 2026년 개편 TOEFL iBT Writing 공인 채점관이다.
반드시 0.0 ~ 6.0 사이의 점수로 평가하라 (6.0이 만점).
각 차원별 점수 산출 전, 반드시 학생 글에서 근거 문장을 발췌한 뒤(CoT) 점수를 매기고 피드백을 작성하라.

[과제 분량 기준 — 반드시 확인]
${writingType === 'email' ? 'Task 1: Write an Email' : 'Task 2: Academic Discussion'} — ${wordRange}
${wordRule.desc}
분량 미달/초과 시 overall 점수에서 감점 반영.

[평가 차원 — ${writingType === 'email' ? 'Email (Task 1)' : 'Academic Discussion (Task 2)'}]
${dims.map(d => `- ${d} [${DIMENSION_META[d].priority}]: ${DIMENSION_META[d].desc}`).join('\n')}`;

  if (writingType === 'email') {
    return `${base}

[Email 채점 상세 기준 — 2026 토플 공식]

① 사회언어학적 격식 (Register & Tone) — 최우선 차원
수신자와의 '관계'에 맞는 올바른 톤앤매너를 구사했는가?
- 수신자가 교수(Professor)나 대학 행정 직원(Administrator)인 경우:
  * 격식 있는 인사: "Dear Professor [Name]", "Dear Dr. [Name]"
  * 완곡한 부탁 조동사: "I would highly appreciate it if...", "I was wondering if you could..."
  * 격식 있는 맺음말: "Sincerely", "Best regards", "Respectfully yours"
  * 금지 표현 감지 시 registerAndTone 점수를 3.0 이하로 제한: "Hey", "Thanks", "I want", "Can you", "ASAP"
- 수신자가 동료 학생(Classmate/Peer)인 경우:
  * 반격식 톤: "Hi [Name]", "Can you let me know...", "Thanks", "Best"
  * 너무 딱딱하면(Dear Professor 등) 오히려 부자연스러움 → 적절한 캐주얼 톤 필요

② 과제 완수도 (Task Completion) — 핵심 차원
문제에서 요구한 구체적 조건(보통 3가지 불렛포인트)을 빠짐없이 충족했는가?
- 예: "1) 과제 연장 요청 이유, 2) 현재까지의 진행 상황, 3) 구체적인 새로운 제출일 제안"
- 세 가지 중 단 하나라도 누락되거나 모호하게 서술되면 감점
- 누락된 항목당 taskCompletion 점수에서 1.0점 감점 (최소 1.0)
- 모호 서술(예: "I'll submit later"처럼 구체적 날짜 없음)도 미충족으로 간주

③ 구성 및 일관성 (Organization & Cohesion) — 핵심 차원
이메일의 정석적인 구조를 따르고 있는가?
- 필수 구조 흐름: [인사말 ➡️ 메일을 쓰는 목적 ➡️ 상세 본문(이유/대안) ➡️ 향후 조치/기대 ➡️ 맺음말]
- 문단 구분(Paragraph)이 한눈에 들어오도록 구조화되어야 함
- 하나라도 누락 시 emailStructure에서 감점
- 연결어(However, Furthermore, Therefore 등) 적절히 사용하여 일관성 유지

④ 언어 사용의 정확성 (Language Accuracy) — 기본 차원
의미 전달을 방해하는 문법 오류나 어색한 표현이 없는가?
- 단순 오타, 시제 일치, 주어-동사 수 일치 등 기술적 문법 오류 집계
- 격식에 맞는 비즈니스/학술용 관용 표현(Collocation) 정확성 평가
  * 올바른 관용: "take into consideration", "look forward to hearing", "submit a request"
  * 틀린 관용: "take into consider", "look forward to hear", "give a request"
- 오류 1건당 0.5점 감점 (최소 1.0)`;
  }

  return `${base}

[Academic Discussion 채점 상세 기준 — 2026 토플 공식]

① 토론 기여도 및 동료 상호작용 (Contribution & Peer Engagement) — 고득점 열쇠
앞서 발언한 동료 학생들(Andrew, Claire 등)의 의견을 유기적으로 인용/반박하며 토론 흐름에 합류했는가?
- 모범 패턴: "While I understand Andrew's concern about cost, I strongly agree with Claire that..."
  * 동료 의견을 먼저 인정/요약 → 자신의 입장 연결
  * "I agree/disagree with [Name] that..." 형태로 명시적 인용
- 금지 패턴 (감점 대상):
  * 단순히 "I think..." / "In my opinion..." 으로만 시작 (동료 언급 없음)
  * 자기 혼자만의 단독 에세이 형태 (동료 의견 무시)
  * 동료 이름 언급 없이 "Some people say..." 식의 회피
- 단독 에세이 형태 감지 시 peerEngagement 점수를 3.0 이하로 제한

② 논증의 구체성 및 전개 (Elaboration & Support) — 핵심 차원
본인의 입장을 명확히 하고, 이를 뒷받침하는 구체적이고 참신한 예시/근거를 제시했는가?
- 고득점(5~6점 밴드) 요건:
  * 개인적 경험: "In my experience as a university student..."
  * 사회적 트렌드: "With the rise of remote learning..."
  * 구체적인 시나리오: "For instance, if a student were to..."
- 감점 대상:
  * 막연하고 뻔한 주장: "It is good", "I think it is bad"
  * 예시 없는 단정: "This is always true"
  * 논리 전개 없는 주장 나열
- 입장 표명 후 구체적 예시/논리적 전개가 부족하면 elaboration 점수를 3.0 이하로 제한

③ 구문 및 어휘적 다양성 (Syntactic & Lexical Complexity) — 핵심 차원
대학 세미나 수준에 걸맞은 학술용 단어(AWL)와 복잡한 문장 구조를 활용했는가?
- 어휘 업그레이드 (기초 → 학술):
  * good → beneficial, advantageous, favorable
  * bad → detrimental, adverse, unfavorable
  * think → advocate, argue, contend, maintain
  * help → facilitate, assist, enable
  * important → crucial, pivotal, significant
  * problem → challenge, issue, concern
- 복문(Complex Sentence) 구조 적절히 섞여야 함:
  * 분사구문: "Taking into consideration...,"
  * 관계대명사절: "students who..., which means..."
  * 명사절: "What I believe is that..."
  * 부사절: "Although..., while..., whereas..."
- 기초 어휘(good, bad, think, help 등) 비율이 80% 이상이면 syntacticComplexity 감점
- 학술 대체 어휘는 upgradedSentences로 제안

④ 언어 사용의 정확성 (Language Accuracy) — 기본 차원
- 주어-동사 일치, 시제 일관성, 관사(a/an/the) 오류 집계
- 오류 1건당 0.5점 감점 (최소 1.0)`;
}

// ── 헬퍼: API 호출 (GLM/Claude 공통) ────────────────────────────────────────
async function callAi(
  systemPrompt: string,
  userPrompt: string,
  useClaude: boolean = false,
  maxTokens: number = 2000,
  temperature: number = 0.4,
): Promise<string> {
  const endpoint = useClaude ? CLAUDE_PROXY_ENDPOINT : GLM_API_ENDPOINT;
  const apiKey = useClaude ? '' : GLM_API_KEY;
  const modelId = useClaude ? CLAUDE_MODEL : GLM_MODEL;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI 분석 오류 (${response.status}): ${errText.slice(0, 100)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── 헬퍼: JSON 안전 파싱 ────────────────────────────────────────────────────
function safeJsonParse(text: string): any | null {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── 인라인 Diff 렌더링 (LCS 기반 — 삽입/삭제 시에도 정렬 유지) ────────────
interface DiffSegment {
  type: 'same' | 'delete' | 'add';
  text: string;
}

// 단어 단위 LCS diff — naive zip 방식의 밀림 현상 해결
function renderInlineDiff(original: string, corrected: string): DiffSegment[] {
  const origTokens = original.split(/(\s+)/).filter(t => t.length > 0);
  const corrTokens = corrected.split(/(\s+)/).filter(t => t.length > 0);
  const m = origTokens.length;
  const n = corrTokens.length;

  // LCS 길이 DP 테이블
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = origTokens[i] === corrTokens[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // 백트래킹으로 diff 세그먼트 생성
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

  // 인접한 동일 타입 세그먼트 병합 (공백 토큰 포함)
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

// diff 세그먼트 → Before/After 변경 블록 목록 (읽기 쉬운 카드 표시용)
interface ChangeBlock {
  before: string;
  after: string;
}

function extractChangeBlocks(segments: DiffSegment[]): ChangeBlock[] {
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
      // 공백만 있는 same 세그먼트는 블록을 끊지 않고 유지 → 구(phrase) 단위 변경으로 묶임
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

// ── 색상 클래스 매핑 (Semantic Color Coding) ────────────────────────────────
const COLOR_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200',
  green:  'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-200',
  blue:   'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200',
};

const COLOR_LEGEND: Array<{ color: string; label: string }> = [
  { color: 'yellow', label: '인사/맺음' },
  { color: 'green',  label: '동료 인용' },
  { color: 'blue',   label: '핵심 주장' },
  { color: 'purple', label: '구체적 예시' },
];

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export function WritingReviewAiTutor({
  writingType,
  userAnswer,
  questionData,
  onClose,
}: WritingReviewAiTutorProps) {
  const [studentText, setStudentText] = useState(userAnswer || '');
  const [rewrittenText, setRewrittenText] = useState(userAnswer || '');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const [mobileView, setMobileView] = useState<'original' | 'rewrite' | 'score'>('original');
  const [showModelEssay, setShowModelEssay] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);

  // 2026 트렌드 상태
  const [semanticHighlights, setSemanticHighlights] = useState<SemanticHighlight[]>([]);
  const [upgradeSuggestions, setUpgradeSuggestions] = useState<UpgradeSuggestion[]>([]);
  const [activeUpgradeIdx, setActiveUpgradeIdx] = useState<number | null>(null);

  // 학생이 수정할 때마다 실시간 점수 변화 (경량 휴리스틱, 0-6점 기준)
  useEffect(() => {
    if (!analysis) return;
    const oldScore = analysis.rubric.overall;
    const lenDiff = rewrittenText.length - studentText.length;
    const sentences = rewrittenText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const baseBonus = Math.min(1.5, lenDiff / 100);
    const varietyBonus = Math.min(1, Math.max(0, (sentences - 3) / 2));
    const newScore = Math.min(6, Math.round((oldScore + baseBonus + varietyBonus) * 10) / 10);
    setLiveScore(newScore);
  }, [rewrittenText, analysis, studentText]);

  // ── AI 분석 실행 (하이브리드: 1차 정량 + 2차 LLM 정성) ──
  const handleAnalyze = async () => {
    if (!rewrittenText.trim()) {
      setError('에세이를 먼저 작성해주세요.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setSemanticHighlights([]);
    setUpgradeSuggestions([]);
    setActiveUpgradeIdx(null);

    try {
      const taskContext = buildTaskContext(writingType, questionData);
      const rubricPrompt = buildRubricPrompt(writingType);
      const dims = getDimensionsFor(writingType);

      // 1차 정량 분석 (로컬 휴리스틱 — 즉시, 2026 토플 공식 기준)
      const wordCount = rewrittenText.trim().split(/\s+/).filter(Boolean).length;
      const lowerText = rewrittenText.toLowerCase();
      const rule = WORD_COUNT_RULE[writingType];
      const wordCountStatus = rule.max
        ? (wordCount < rule.min ? `미달 (-${rule.min - wordCount}단어)` : wordCount > rule.max ? `초과 (+${wordCount - rule.max}단어)` : '적정')
        : (wordCount < rule.min ? `미달 (-${rule.min - wordCount}단어)` : '적정');

      // Email: 수신자별 격식 키워드 (2026 공식 기준)
      const casualHits = (lowerText.match(/\b(hey|thanks|gonna|wanna|ok|cool|stuff|yeah|asap|can you)\b/g) || []).length;
      const formalHits = (lowerText.match(/\b(dear|sincerely|regards|would (highly )?appreciate|kindly|respectfully|yours truly|i was wondering if)\b/g) || []).length;

      // Discussion: 동료 인용 패턴 (고득점 열쇠)
      const peerQuoteHits = (lowerText.match(/\b(while i (understand|agree|disagree)|i (strongly )?(agree|disagree) with|i see (your|andrew's|claire's) point|as (andrew|claire) (mentioned|suggested|argued|pointed out))\b/g) || []).length;
      const aloneEssayHits = (lowerText.match(/\b(i think|in my opinion|i believe|personally)\b/g) || []).length;

      // 연결어
      const transitionHits = (lowerText.match(/\b(however|furthermore|consequently|therefore|moreover|in contrast|for instance|to illustrate|as a result|nevertheless|nonetheless)\b/g) || []).length;

      // 학술 어휘 (AWL) — 2026 기준 확장
      const academicWordHits = (lowerText.match(/\b(beneficial|detrimental|adverse|unfavorable|advantageous|favorable|advocate|argue|contend|maintain|facilitate|assist|enable|crucial|pivotal|significant|subsequently|nevertheless|implementation|environment|demonstrate|challenge|concern)\b/g) || []).length;
      // 기초 어휘 (감점 대상) — 2026 기준 확장
      const basicWordHits = (lowerText.match(/\b(good|bad|big|small|happy|sad|thing|stuff|think|help|important|problem|a lot|really|very)\b/g) || []).length;
      const basicWordRatio = basicWordHits / Math.max(wordCount, 1);

      // 복문 구조 감지 (분사구문/관계대명사절/명사절/부사절)
      const complexSentenceHits = (rewrittenText.match(/\b(Taking|Considering|Given|Based on|Although|While|Whereas|Since|Because|If|Unless|When|Whenever)\b/g) || []).length
        + (rewrittenText.match(/\b(who|which|that|whose|whom)\b/g) || []).length
        + (rewrittenText.match(/\b(What I|Whether|Why|How)\s+(believe|think|argue|is that)\b/gi) || []).length;

      const uniqueWords = new Set(rewrittenText.toLowerCase().match(/[a-z]+/g) || []).size;
      const lexicalDiversity = uniqueWords / Math.max(wordCount, 1);

      // 2차 LLM 정성 분석 — CoT 기반 JSON
      const systemPrompt = `${rubricPrompt}

[문제 컨텍스트]
${taskContext}

[1차 정량 분석 결과 — 참고용]
- 단어 수: ${wordCount} (기준: ${rule.max ? `${rule.min}~${rule.max}` : `${rule.min}+`}단어) → ${wordCountStatus}
${writingType === 'email'
  ? `- Casual 표현: ${casualHits}회 (hey, thanks, gonna, wanna, ok, asap... — Professor 수신 시 감점 대상)
- Formal 표현: ${formalHits}회 (dear, sincerely, would appreciate, i was wondering if...)`
  : `- 동료 인용 패턴: ${peerQuoteHits}회 (While I agree with... / I disagree with [Name] that...)
- 단독 에세이 패턴: ${aloneEssayHits}회 (I think / In my opinion... — 동료 언급 없으면 감점)`}
- 연결어: ${transitionHits}회 (however, furthermore, consequently, therefore...)
- 학술 어휘(AWL): ${academicWordHits}회 / 기초 어휘: ${basicWordHits}회 (비율 ${(basicWordRatio * 100).toFixed(1)}%)
- 복문 구조: ${complexSentenceHits}회 (분사구문/관계대명사절/명사절/부사절)
- 어휘 다양성(Lexical Diversity): ${lexicalDiversity.toFixed(2)} (1.0에 가까울수록 다양)

반드시 다음 JSON 형식으로만 응답 (다른 텍스트 절대 금지):
{
  "rubric": {
    "overall": 숫자(0-6, 소수점 1자리),
    "overallFeedback": "전체 코멘트 (한국어, 2-3문장)",
    "dimensions": {
${dims.map(d => `      "${d}": { "score": 숫자(0-6), "feedback": "한국어 피드백 — 학생 글에서 근거 문장을 발췌한 뒤 개선 방향 제시" }`).join(',\n')}
    }
  },
  "grammarCorrections": [
    { "original": "학생 원문 일부", "corrected": "교정된 표현", "rule": "문법 규칙 설명 (한국어)" }
  ],
  "semanticHighlights": [
    { "text": "하이라이트할 학생 글의 정확한 문장/구절 (원문과 동일하게)", "category": "salutation|signoff|peerQuote|claim|elaboration", "color": "yellow|green|blue|purple" }
  ],
  "upgradedSentences": [
    { "original": "유치하지만 문법적으로 틀리지 않은 학생 문장", "upgraded": "Band 6.0 수준 고급 문장으로 Paraphrase", "reason": "업그레이드 이유 (한국어)" }
  ],
  "upgradedText": "학생 글을 최소한의 수정만 가미해 업그레이드한 전체 텍스트"
}

[semanticHighlights 카테고리 매핑]
- salutation/signoff: 인사/맺음 (노랑 yellow) — Email 전용
- peerQuote: 동료 의견 인용 (초록 green) — Discussion 전용
- claim: 핵심 주장 (파랑 blue)
- elaboration: 구체적 예시/논리 (보라 purple)

[upgradedSentences 선정 기준]
- 문법적으로 틀리지 않았지만 어휘/구문이 유치한(Band 3.0-4.0 수준) 학생 문장만 선정
- 문법 오류는 grammarCorrections에서 처리하므로 여기서 중복하지 말 것
- Band 6.0 수준의 학술적/격식 있는 표현으로 Paraphrase`;

      const userPrompt = `[학생 답안]\n${rewrittenText}`;

      const raw = await callAi(systemPrompt, userPrompt, false, 3000, 0.3);
      const parsed = safeJsonParse(raw);

      if (parsed && parsed.rubric) {
        setAnalysis({
          rubric: {
            overall: Number(parsed.rubric.overall ?? 0),
            dimensions: parsed.rubric.dimensions || {},
            overallFeedback: parsed.rubric.overallFeedback || '',
          },
          grammarCorrections: Array.isArray(parsed.grammarCorrections) ? parsed.grammarCorrections : [],
          modelEssay: { content: '', rationale: '' },
          upgradedText: parsed.upgradedText || rewrittenText,
        });
        if (Array.isArray(parsed.semanticHighlights)) setSemanticHighlights(parsed.semanticHighlights);
        if (Array.isArray(parsed.upgradedSentences)) setUpgradeSuggestions(parsed.upgradedSentences);
        setMobileView('score');
      } else {
        setError('AI 분석 결과를 불러왔으나 형식 오류가 발생했어요. 다시 시도해주세요.');
      }
    } catch (err: any) {
      setError(err.message || 'AI 분석 중 오류가 발생했어요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── 모범 에세이 생성 ──
  const handleGenerateModel = async () => {
    setIsGeneratingModel(true);
    setError(null);
    try {
      const taskContext = buildTaskContext(writingType, questionData);
      const systemPrompt = `너는 TOEFL iBT 만점 작문 전문가다.
2026년 개편 토플 기준 6점 만점 모범 에세이를 작성하라.
학생의 주장과 논리적 뼈대를 유지하되, 6점 만점 기준 모범 에세이를 작성하라.
한국어 설명 없이 영어 에세이 본문만 제공. 150-200단어 이내.`;

      const userPrompt = `[문제 컨텍스트]\n${taskContext}\n\n[학생 원본]\n${rewrittenText}\n\n[요청] 학생의 주장을 유지하되 6점 만점 기준 모범 답안을 작성해줘.`;

      const content = await callAi(systemPrompt, userPrompt, false, 1500, 0.5);
      setAnalysis(prev => prev ? {
        ...prev,
        modelEssay: { content, rationale: '학생 원본의 논리를 유지하되 어휘/문법/구조를 승급시킨 모범 답안입니다.' },
      } : null);
      setShowModelEssay(true);
    } catch (err: any) {
      setError(err.message || '모범 에세이 생성 중 오류가 발생했어요.');
    } finally {
      setIsGeneratingModel(false);
    }
  };

  // ── 첨삭 템플릿 내보내기 ──
  const handleExportTemplate = () => {
    if (!analysis) return;
    const date = new Date().toLocaleDateString('ko-KR');
    const taskName = writingType === 'email' ? 'Write an Email' : 'Academic Discussion';
    const dims = getDimensionsFor(writingType);

    let text = `═══════════════════════════════════════════════════
  TOEFL Writing Review Report — ${taskName}
  발행일: ${date}
  (2026년 개편 토플 국제표준 6점 만점)
═══════════════════════════════════════════════════

■ 종합 점수: ${analysis.rubric.overall}/6

■ 차원별 점수 (Explainable AI)
${dims.map(d => {
  const score = analysis.rubric.dimensions[d];
  const label = DIMENSION_META[d].label;
  const s = score?.score ?? '-';
  const fb = score?.feedback || '(피드백 없음)';
  return `  - ${label}: ${s}/6\n    ${fb}`;
}).join('\n')}

■ 종합 피드백
${analysis.rubric.overallFeedback}

■ 문법 교정 (${analysis.grammarCorrections.length}건)
`;
    analysis.grammarCorrections.forEach((c, i) => {
      text += `
${i + 1}. 원본: ${c.original}
   교정: ${c.corrected}
   규칙: ${c.rule}
`;
    });

    if (upgradeSuggestions.length > 0) {
      text += `
■ AI 문장 업그레이드 제안 (${upgradeSuggestions.length}건)
`;
      upgradeSuggestions.forEach((u, i) => {
        text += `
${i + 1}. 원본: ${u.original}
   업그레이드: ${u.upgraded}
   이유: ${u.reason}
`;
      });
    }

    if (analysis.modelEssay.content) {
      text += `
■ AI 모범 에세이 (6점 만점 기준)
─────────────────────────────────────────
${analysis.modelEssay.content}
─────────────────────────────────────────
`;
    }

    text += `
■ 학생 원본
─────────────────────────────────────────
${rewrittenText}
─────────────────────────────────────────

■ 업그레이드 버전 (inline diff 기준)
─────────────────────────────────────────
${analysis.upgradedText}
─────────────────────────────────────────
`;
    setExportText(text);
  };

  // ── Tone Meter (이메일 전용 실시간 격식 게이지) ──
  // 2026 토플 공식: Professor 수신 시 격식 표현 필수, Peer 수신 시 반격식
  const toneScore = useMemo(() => {
    if (writingType !== 'email') return null;
    const lower = rewrittenText.toLowerCase();
    // 캐주얼 표현 (Professor 수신 시 감점 대상)
    const casual = (lower.match(/\b(hey|thanks|gonna|wanna|ok|cool|stuff|yeah|hi there|i want|can you|asap)\b/g) || []).length;
    // 격식 표현 (Professor 수신 시 요구)
    const formal = (lower.match(/\b(dear|sincerely|regards|would (highly )?appreciate|kindly|respectfully|yours truly|i was wondering if)\b/g) || []).length;
    const total = casual + formal;
    if (total === 0) return 50; // 중립
    return Math.round((formal / total) * 100);
  }, [rewrittenText, writingType]);

  // ── 분량 기준 위반 감지 (UI 경고용) ──
  const wordCountViolation = useMemo(() => {
    const wc = rewrittenText.trim().split(/\s+/).filter(Boolean).length;
    const rule = WORD_COUNT_RULE[writingType];
    if (rule.max) {
      if (wc < rule.min) return { status: 'under', diff: rule.min - wc, rule };
      if (wc > rule.max) return { status: 'over', diff: wc - rule.max, rule };
    } else {
      if (wc < rule.min) return { status: 'under', diff: rule.min - wc, rule };
    }
    return null;
  }, [rewrittenText, writingType]);

  // ── Semantic Highlight 적용된 원본 텍스트 ──
  const highlightedOriginal = useMemo(() => {
    if (!semanticHighlights.length) return null;
    const segments: Array<{ text: string; color: string | null }> = [];
    let remaining = studentText;
    while (remaining.length > 0) {
      let bestMatch: { text: string; color: string } | null = null;
      let bestIdx = Infinity;
      for (const hl of semanticHighlights) {
        const idx = remaining.indexOf(hl.text);
        if (idx !== -1 && idx < bestIdx) {
          bestIdx = idx;
          bestMatch = { text: hl.text, color: hl.color };
        }
      }
      if (!bestMatch) {
        segments.push({ text: remaining, color: null });
        break;
      }
      if (bestIdx > 0) segments.push({ text: remaining.slice(0, bestIdx), color: null });
      segments.push({ text: bestMatch.text, color: bestMatch.color });
      remaining = remaining.slice(bestIdx + bestMatch.text.length);
    }
    return segments;
  }, [semanticHighlights, studentText]);

  const diffSegments = useMemo(() => {
    if (!analysis?.upgradedText) return [];
    return renderInlineDiff(rewrittenText, analysis.upgradedText);
  }, [analysis, rewrittenText]);

  // Before/After 변경 블록 — 카드 목록으로 읽기 쉽게 표시
  const changeBlocks = useMemo(() => extractChangeBlocks(diffSegments), [diffSegments]);

  // Tone Meter 상태 분류
  const toneLabel = toneScore !== null
    ? toneScore >= 70 ? 'Formal' : toneScore >= 40 ? 'Neutral' : 'Casual'
    : null;
  const toneColor = toneScore !== null
    ? toneScore >= 70 ? 'text-green-600 dark:text-green-400'
      : toneScore >= 40 ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400'
    : '';

  return (
    <div className="fixed inset-0 z-[80] bg-white dark:bg-gray-900 flex flex-col">
      {/* ── 헤더 ── */}
      <div className="bg-[#1e6b73] text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          <h2 className="font-bold text-base md:text-lg">
            Writing AI 튜터 — {writingType === 'email' ? 'Email' : 'Academic Discussion'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {analysis && (
            <button
              onClick={handleExportTemplate}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">첨삭 리포트</span>
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 모바일 탭 ── */}
      <div className="md:hidden flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {(['original', 'rewrite', 'score'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMobileView(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              mobileView === tab
                ? 'text-[#1e6b73] border-b-2 border-[#1e6b73] bg-white dark:bg-gray-900'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab === 'original' ? '원본' : tab === 'rewrite' ? '수정' : '점수'}
          </button>
        ))}
      </div>

      {/* ── 본문 (좌우 분할 / 모바일 탭) ── */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* 좌측: 학생 원본 (Semantic Color Coding + 인라인 Diff) */}
        <div className={`flex-1 overflow-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${mobileView !== 'original' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" /> 학생 원본
              {semanticHighlights.length > 0 && (
                <span className="text-xs font-normal text-gray-500 ml-1">(Semantic Highlight 적용됨)</span>
              )}
            </h3>
            <span className="text-xs text-gray-400">{studentText.trim().split(/\s+/).filter(Boolean).length} 단어</span>
          </div>

          {/* Semantic Color Coding 범례 */}
          {semanticHighlights.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              {COLOR_LEGEND.map(legend => (
                <span key={legend.color} className={`px-2 py-0.5 rounded ${COLOR_CLASSES[legend.color]} font-medium`}>
                  {legend.label}
                </span>
              ))}
            </div>
          )}

          {/* 학생 원본 — Semantic Highlight 적용 */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 min-h-[200px] text-sm md:text-base text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {highlightedOriginal
              ? highlightedOriginal.map((seg, idx) =>
                  seg.color
                    ? <span key={idx} className={`px-1 rounded ${COLOR_CLASSES[seg.color]}`}>{seg.text}</span>
                    : <span key={idx}>{seg.text}</span>
                )
              : (studentText || '(작성된 답안이 없습니다.)')
            }
          </div>

          {/* AI 교정본 — 교정된 전체 텍스트 + 변경 포인트 카드 (일반 영어 첨삭 형식) */}
          {analysis?.upgradedText && (
            <div className="mt-4 space-y-3">
              {/* 교정된 전체 텍스트 — 변경된 부분만 초록 하이라이트, 깔끔하게 읽기 가능 */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5" /> AI 교정본
                  <span className="font-normal text-gray-400">(초록 = 수정/추가된 표현)</span>
                </h4>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-sm leading-7">
                  {diffSegments.map((seg, idx) => {
                    if (seg.type === 'delete') return null; // 삭제된 부분은 아래 변경 포인트에서 확인
                    if (seg.type === 'add') {
                      return (
                        <mark key={idx} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-0.5 rounded font-medium">
                          {seg.text}
                        </mark>
                      );
                    }
                    return <span key={idx} className="text-gray-800 dark:text-gray-100">{seg.text}</span>;
                  })}
                </div>
              </div>

              {/* 변경 포인트 — Before → After 카드 목록 */}
              {changeBlocks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                    변경 포인트 ({changeBlocks.length}건)
                  </h4>
                  <div className="space-y-2">
                    {changeBlocks.map((block, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        {block.before && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-red-500 mr-1">Before</span>
                            <span className="line-through decoration-red-400">{block.before}</span>
                          </div>
                        )}
                        <div className={`text-sm font-medium text-green-700 dark:text-green-400 ${block.before ? 'mt-1' : ''}`}>
                          <ArrowRight className="w-3 h-3 inline mr-1" />
                          {block.after || '(삭제됨)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우측: Rewrite 에디터 + 분석/점수 */}
        <div className={`flex-1 overflow-auto p-4 md:p-6 bg-white dark:bg-gray-900 ${mobileView !== 'rewrite' ? 'hidden md:block' : ''}`}>
          {/* 에디터 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> Rewrite (수정하기)
            </h3>
            {liveScore !== null && analysis && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">실시간:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${liveScore > analysis.rubric.overall ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30' : 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700'}`}>
                  {liveScore}/6
                </span>
                {liveScore > analysis.rubric.overall && (
                  <span className="text-green-600 text-xs">+{(liveScore - analysis.rubric.overall).toFixed(1)}점 상승</span>
                )}
              </div>
            )}
          </div>

          {/* Tone Meter (이메일 전용) */}
          {toneScore !== null && (
            <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-3 border border-blue-100 dark:border-gray-600">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
                  <Gauge className="w-3.5 h-3.5" /> Tone Meter (실시간 격식)
                </div>
                <span className={`text-xs font-bold ${toneColor}`}>{toneLabel} ({toneScore})</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 overflow-hidden">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-gray-800 dark:bg-white rounded-full shadow-md transition-all duration-300"
                  style={{ left: `calc(${toneScore}% - 2px)` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Casual</span>
                <span>Neutral</span>
                <span>Formal</span>
              </div>
            </div>
          )}

          <textarea
            value={rewrittenText}
            onChange={e => setRewrittenText(e.target.value)}
            placeholder="여기서 에세이를 수정하며 실시간으로 점수를 올려보세요..."
            className={`w-full h-48 md:h-64 bg-gray-50 dark:bg-gray-800 border rounded-lg p-3 md:p-4 text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#1e6b73] dark:focus:ring-[#2d8a8c] ${
              wordCountViolation ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
            }`}
          />

          {/* 분량 기준 표시 (2026 토플 공식) */}
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              분량 기준: {WORD_COUNT_RULE[writingType].desc}
            </span>
            <span className={`font-medium ${
              wordCountViolation
                ? wordCountViolation.status === 'under' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {rewrittenText.trim().split(/\s+/).filter(Boolean).length} 단어
              {wordCountViolation && (
                <span className="ml-1">
                  ({wordCountViolation.status === 'under' ? `미달 -${wordCountViolation.diff}` : `초과 +${wordCountViolation.diff}`})
                </span>
              )}
            </span>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !rewrittenText.trim()}
              className="flex items-center gap-1.5 bg-[#1e6b73] hover:bg-[#155a62] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAnalyzing ? 'AI 분석 중...' : 'AI 분석'}
            </button>
            <button
              onClick={handleGenerateModel}
              disabled={isGeneratingModel || !analysis}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingModel ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              모범 에세이
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 점수표 + 루브릭 */}
          {analysis && (
            <div className="mt-4 space-y-3">
              {/* 점수표 — 차원별 (Explainable AI) */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-blue-100 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" /> 점수표 (6점 만점)
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1e6b73]">{analysis.rubric.overall}</span>
                    <span className="text-xs text-gray-400">/6</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {getDimensionsFor(writingType).map(key => {
                    const dim = analysis.rubric.dimensions[key];
                    const meta = DIMENSION_META[key];
                    const score = dim?.score ?? 0;
                    // priority별 배지 색상
                    const priorityBadge = meta.priority === '최우선' || meta.priority === '고득점 열쇠'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      : meta.priority === '핵심'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
                    return (
                      <div key={key} className="bg-white/60 dark:bg-gray-900/40 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{meta.label}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${priorityBadge}`}>{meta.priority}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{meta.desc}</div>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2">
                            <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div className="h-full bg-[#1e6b73] rounded-full transition-all" style={{ width: `${(score / 6) * 100}%` }} />
                            </div>
                            <span className="font-bold text-xs text-gray-700 dark:text-gray-200 w-7 text-right">{score}/6</span>
                          </div>
                        </div>
                        {dim?.feedback && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-1 pl-2 border-l-2 border-[#1e6b73]/30">
                            {dim.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {analysis.rubric.overallFeedback && (
                  <p className="mt-3 text-xs text-gray-700 dark:text-gray-200 leading-relaxed bg-white/60 dark:bg-gray-900/40 rounded p-2 border-l-2 border-[#1e6b73]">
                    <span className="font-bold text-[#1e6b73] dark:text-[#5ab9c0]">종합: </span>
                    {analysis.rubric.overallFeedback}
                  </p>
                )}
              </div>

              {/* 문법 교정 목록 (단일 목록) */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> 문법 교정 ({analysis.grammarCorrections.length}건)
                </h4>
                <div className="space-y-2">
                  {analysis.grammarCorrections.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">문법 오류가 감지되지 않았어요.</p>
                  )}
                  {analysis.grammarCorrections.map((c, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 hover:border-[#1e6b73] dark:hover:border-[#2d8a8c] transition-colors"
                    >
                      <div className="text-xs">
                        <span className="text-red-600 dark:text-red-400 line-through">{c.original}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" />
                        <span className="text-green-700 dark:text-green-400 font-medium">{c.corrected}</span>
                      </div>
                      <div className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                        <span className="font-bold text-[#1e6b73] dark:text-[#5ab9c0]">규칙: </span>{c.rule}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 원클릭 문장 업그레이드 (2026 트렌드 킬러 기능) */}
              {upgradeSuggestions.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4" /> AI 문장 업그레이드 제안 ({upgradeSuggestions.length}건)
                  </h4>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 italic">
                    문법적으로 틀리지 않았지만 유치한 문장을 Band 6.0 수준으로 업그레이드합니다. 카드를 클릭하면 상세 이유를 볼 수 있어요.
                  </p>
                  <div className="space-y-2">
                    {upgradeSuggestions.map((u, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveUpgradeIdx(activeUpgradeIdx === idx ? null : idx)}
                        className={`bg-white dark:bg-gray-900 rounded-lg p-2.5 border cursor-pointer transition-all ${
                          activeUpgradeIdx === idx
                            ? 'border-purple-400 dark:border-purple-600 shadow-sm'
                            : 'border-purple-100 dark:border-gray-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-xs">
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="text-xs font-bold text-gray-500">원문: </span>
                            <span className="line-through text-gray-500">{u.original}</span>
                          </div>
                          <div className="mt-1 text-purple-700 dark:text-purple-400 font-medium">
                            <ArrowRight className="w-3 h-3 inline mr-1" />
                            {u.upgraded}
                          </div>
                        </div>
                        {activeUpgradeIdx === idx && (
                          <div className="mt-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 p-2 rounded border-l-2 border-purple-400">
                            <span className="font-bold">업그레이드 이유: </span>{u.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 모범 에세이 */}
              {showModelEssay && analysis.modelEssay.content && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> AI 모범 에세이 (6점 만점 기준)
                  </h4>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 italic">{analysis.modelEssay.rationale}</p>
                  <div className="bg-white dark:bg-gray-900 rounded p-3 text-sm text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap border border-purple-100 dark:border-gray-700">
                    {analysis.modelEssay.content}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 첨삭 리포트 내보내기 모달 ── */}
      {exportText && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={() => setExportText(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> 첨삭 리포트
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportText);
                    alert('복사되었습니다!');
                  }}
                  className="flex items-center gap-1 text-xs bg-[#1e6b73] text-white px-2 py-1 rounded hover:bg-[#155a62] transition-colors"
                >
                  <Copy className="w-3 h-3" /> 복사
                </button>
                <button onClick={() => setExportText(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{exportText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 헬퍼: 문제 데이터 → 컨텍스트 문자열 ──────────────────────────────────────
function buildTaskContext(writingType: WritingType, questionData: any): string {
  if (!questionData) return writingType === 'email' ? 'Write an Email task' : 'Academic Discussion task';
  const q = { ...questionData };
  // 노이즈 키 제거
  ['imageUrl', 'audioUrl', 'id', 'introImageUrl', 'introAudioUrl'].forEach(k => delete q[k]);

  if (writingType === 'email') {
    return [
      `[Task: Write an Email]`,
      `Scenario: ${q.emailScenario || ''}`,
      `Instruction: ${q.emailInstruction || ''}`,
      `Bullets (Required Points): ${Array.isArray(q.emailBullets) ? q.emailBullets.join(' / ') : ''}`,
      `To: ${q.emailTo || ''}`,
      `Subject: ${q.emailSubject || ''}`,
    ].filter(Boolean).join('\n');
  }

  // discussion
  return [
    `[Task: Academic Discussion]`,
    `Professor: ${q.professorName || ''}`,
    `Professor Message: ${q.professorMessage || q.questionText || ''}`,
    `Student 1 (${q.student1Name || 'Andrew'}): ${q.student1Message || ''}`,
    `Student 2 (${q.student2Name || 'Claire'}): ${q.student2Message || ''}`,
  ].filter(Boolean).join('\n');
}
