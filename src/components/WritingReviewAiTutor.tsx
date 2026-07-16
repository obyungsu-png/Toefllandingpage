/**
 * WritingReviewAiTutor.tsx
 * -----------------------------------------------------------------------------
 * TOEFL Writing Review용 인터랙티브 AI 튜터 (Email / Academic Discussion)
 *
 * UX 흐름:
 * 1) 좌측: 학생 원본 에세이 (읽기 전용, 하이라이트 표시)
 * 2) 우측: Rewrite 에디터 (학생이 직접 수정)
 * 3) "AI 분석" 버튼 → 점수표 + 항목별 루브릭 + 인라인 Diff(삭제 빨강/추가 초록)
 * 4) 하이라이트 클릭 → 팝업 [문법 오류 설명]/[어휘 추천]/[문장 다듬기]
 * 5) "모범 에세이 생성" → AI 6점 만점 모범 답안을 나란히 비교
 * 6) "첨삭 템플릿 내보내기" → 강사용 PDF/텍스트 리포트
 *
 * 모바일에서는 탭 전환 (원본 / 교정 / 점수).
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, Send, Bot, User, X, Loader2, FileText, Download,
  CheckCircle2, AlertCircle, BookOpen, Wand2, GraduationCap,
  ChevronRight, Lightbulb, ArrowRight, Copy, RotateCcw,
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

interface CorrectionItem {
  original: string;
  corrected: string;
  reason: string;
  category: 'grammar' | 'vocabulary' | 'structure' | 'coherence' | 'task';
  startIndex?: number;
  endIndex?: number;
}

interface RubricScore {
  grammar: number;       // 0-6
  vocabulary: number;    // 0-6
  coherence: number;     // 0-6
  taskCompletion: number; // 0-6
  overall: number;       // 0-6 (2026년 개편 토플 국제표준)
  feedback: string;
}

interface ModelEssay {
  content: string;
  rationale: string;
}

interface AnalysisResult {
  rubric: RubricScore;
  corrections: CorrectionItem[];
  modelEssay: ModelEssay;
  upgradedText: string; // AI가 제안하는 교정 버전 (inline diff용)
}

interface WritingReviewAiTutorProps {
  writingType: WritingType;
  userAnswer: string;           // 학생이 작성한 원본 에세이
  questionData: any;            // CMS 문제 데이터 (컨텍스트용)
  onClose?: () => void;
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
  // 코드블록 ```json ... ``` 제거
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // 첫 { 부터 마지막 } 까지 추출
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

// ── 인라인 Diff 렌더링 ──────────────────────────────────────────────────────
interface DiffSegment {
  type: 'same' | 'delete' | 'add';
  text: string;
}

function renderInlineDiff(original: string, corrected: string): DiffSegment[] {
  // 단어 단위 비교 (간단한 LCS)
  const origWords = original.split(/(\s+)/);
  const corrWords = corrected.split(/(\s+)/);
  const segments: DiffSegment[] = [];

  let i = 0, j = 0;
  while (i < origWords.length || j < corrWords.length) {
    const o = origWords[i] || '';
    const c = corrWords[j] || '';

    if (o === c) {
      if (o) segments.push({ type: 'same', text: o });
      i++; j++;
    } else {
      // 앞으로 orig 단어가 corr에 나타나는지 확인 (삽입 감지)
      const nextOrigInCorr = c.includes(o) || o.includes(c);
      if (nextOrigInCorr && o && c) {
        // 부분 일치 → 단순 치환
        if (o.length < c.length) {
          segments.push({ type: 'delete', text: o });
          segments.push({ type: 'add', text: c });
          i++; j++;
        } else {
          segments.push({ type: 'delete', text: o });
          segments.push({ type: 'add', text: c });
          i++; j++;
        }
      } else {
        if (o) segments.push({ type: 'delete', text: o });
        if (c) segments.push({ type: 'add', text: c });
        i++; j++;
      }
    }
  }

  // 인접한 same 병합
  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.type === 'same' && seg.type === 'same') {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

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
  const [activeCorrectionIdx, setActiveCorrectionIdx] = useState<number | null>(null);
  const [popupTab, setPopupTab] = useState<'grammar' | 'vocabulary' | 'structure'>('grammar');
  const [mobileView, setMobileView] = useState<'original' | 'rewrite' | 'score'>('original');
  const [showModelEssay, setShowModelEssay] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);

  // 학생이 수정할 때마다 실시간 점수 변화 (경량 휴리스틱, 0-6점 기준)
  useEffect(() => {
    if (!analysis) return;
    const oldScore = analysis.rubric.overall;
    const lenDiff = rewrittenText.length - studentText.length;
    const sentences = rewrittenText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    // 6점 만점 기준 보너스 (작게 측정)
    const baseBonus = Math.min(1.5, lenDiff / 100);
    const varietyBonus = Math.min(1, Math.max(0, (sentences - 3) / 2));
    const newScore = Math.min(6, Math.round((oldScore + baseBonus + varietyBonus) * 10) / 10);
    setLiveScore(newScore);
  }, [rewrittenText, analysis, studentText]);

  // ── AI 분석 실행 ──
  const handleAnalyze = async () => {
    if (!rewrittenText.trim()) {
      setError('에세이를 먼저 작성해주세요.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const taskContext = buildTaskContext(writingType, questionData);
      const systemPrompt = `너는 ETS TOEFL iBT 공식 채점관이자 영어 작문 교육 전문가다.
2026년 1월 개편된 토플 시험 기준으로 채점한다.
학생의 ${writingType === 'email' ? 'Write an Email' : 'Academic Discussion'} 답안을 아래 4대 채점 영역으로 분석하라:
1. Grammar Accuracy (문법 정확도, 0-6점)
2. Vocabulary Diversity (어휘 다양성, 0-6점)
3. Coherence & Development (논리적 연결성, 0-6점)
4. Task Completion (과제 수행도, 0-6점)
overall: 0-6점 (2026년 개편 국제표준)

반드시 다음 JSON 형식으로만 응답 (다른 텍스트 절대 금지):
{
  "rubric": {
    "grammar": 숫자,
    "vocabulary": 숫자,
    "coherence": 숫자,
    "taskCompletion": 숫자,
    "overall": 숫자,
    "feedback": "전체 코멘트 (한국어, 2-3문장)"
  },
  "corrections": [
    {
      "original": "학생 원문 일부",
      "corrected": "교정된 표현",
      "reason": "이유 (한국어)",
      "category": "grammar|vocabulary|structure|coherence|task"
    }
  ],
  "upgradedText": "학생 글을 최소한의 수정만 가미해 업그레이드한 전체 텍스트"
}

[문제 컨텍스트]
${taskContext}

[채점 기준 — 2026년 개편 토플 국제표준 6점 만점]
- 6점: 완벽한 통달, 5점: 능숙, 4점: 상, 3점: 중, 2점: 하, 1점: 미흡, 0점: 미응답
- 통합형/토론형 모두 2026년 개편 루브릭 준용
- 문법: 주어-동사 일치, 시제, 관사, 전치사, 복문 구조
- 어휘: 단조로운 단어 반복 감점, 학술 어휘 가산
- 논리: 연결어(Furthermore, However 등) 적절성, 아이디어 전개
- 과제: 이메일의 경우 3개 bullet 모두 충족; 토론은 타인 의견 인용+자기 주장`;

      const userPrompt = `[학생 답안]\n${rewrittenText}`;

      const raw = await callAi(systemPrompt, userPrompt, false, 2500, 0.3);
      const parsed = safeJsonParse(raw);

      if (parsed) {
        // corrections에 인덱스 부여
        const corrections = (parsed.corrections || []).map((c: CorrectionItem, idx: number) => ({
          ...c,
          startIndex: idx,
        }));
        setAnalysis({
          rubric: parsed.rubric,
          corrections,
          modelEssay: { content: '', rationale: '' },
          upgradedText: parsed.upgradedText || rewrittenText,
        });
        setMobileView('score');
      } else {
        // JSON 파싱 실패 → 텍스트로 표시
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

    let text = `═══════════════════════════════════════════════════
  TOEFL Writing Review Report — ${taskName}
  발행일: ${date}
═══════════════════════════════════════════════════

■ 점수 요약 (2026년 개편 토플 국제표준 6점 만점)
  - Grammar Accuracy:     ${analysis.rubric.grammar}/6
  - Vocabulary Diversity: ${analysis.rubric.vocabulary}/6
  - Coherence & Dev:      ${analysis.rubric.coherence}/6
  - Task Completion:      ${analysis.rubric.taskCompletion}/6
  ─────────────────────────────────
  - Total:                ${analysis.rubric.overall}/6

■ 종합 피드백
${analysis.rubric.feedback}

■ 상세 첨삭 (${analysis.corrections.length}건)
`;

    analysis.corrections.forEach((c, i) => {
      text += `
${i + 1}. [${c.category.toUpperCase()}]
   원본:  ${c.original}
   교정:  ${c.corrected}
   이유:  ${c.reason}
`;
    });

    if (analysis.modelEssay.content) {
      text += `
■ AI 모범 에세이
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

■ 업그레이드 버전 (inline diff)
─────────────────────────────────────────
${analysis.upgradedText}
─────────────────────────────────────────
`;
    setExportText(text);
  };

  // ── 렌더링 ──
  const correctionsByCategory = useMemo(() => {
    if (!analysis) return { grammar: [], vocabulary: [], structure: [], coherence: [], task: [] };
    const groups: Record<string, CorrectionItem[]> = { grammar: [], vocabulary: [], structure: [], coherence: [], task: [] };
    for (const c of analysis.corrections) {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    }
    return groups;
  }, [analysis]);

  const diffSegments = useMemo(() => {
    if (!analysis?.upgradedText) return [];
    return renderInlineDiff(rewrittenText, analysis.upgradedText);
  }, [analysis, rewrittenText]);

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
        {/* 좌측: 학생 원본 (또는 인라인 Diff) */}
        <div className={`flex-1 overflow-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${mobileView !== 'original' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <User className="w-4 h-4" /> 학생 원본
            </h3>
            <span className="text-xs text-gray-400">{studentText.trim().split(/\s+/).filter(Boolean).length} 단어</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 min-h-[200px] text-sm md:text-base text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {studentText || '(작성된 답안이 없습니다.)'}
          </div>

          {/* 인라인 Diff (AI 분석 후) */}
          {analysis?.upgradedText && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" /> AI 교정본 (인라인 Diff)
              </h4>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-sm leading-relaxed">
                {diffSegments.map((seg, idx) => {
                  if (seg.type === 'same') return <span key={idx} className="text-gray-800 dark:text-gray-100">{seg.text}</span>;
                  if (seg.type === 'delete') return <span key={idx} className="text-red-600 line-through bg-red-50 dark:bg-red-900/30 px-0.5 rounded">{seg.text}</span>;
                  return <span key={idx} className="text-green-700 dark:text-green-400 underline bg-green-50 dark:bg-green-900/30 px-0.5 rounded">{seg.text}</span>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* 우측: Rewrite 에디터 + 분석/점수 */}
        <div className={`flex-1 overflow-auto p-4 md:p-6 bg-white dark:bg-gray-900 ${mobileView !== 'rewrite' ? 'hidden md:block' : ''}`}>
          {/* 에디터 */}
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
          <textarea
            value={rewrittenText}
            onChange={e => setRewrittenText(e.target.value)}
            placeholder="여기서 에세이를 수정하며 실시간으로 점수를 올려보세요..."
            className="w-full h-64 md:h-80 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 md:p-4 text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#1e6b73] dark:focus:ring-[#2d8a8c]"
          />

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
          {analysis && (mobileView === 'score' || true) && (
            <div className="mt-4 space-y-3">
              {/* 점수표 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-blue-100 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" /> 점수표
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1e6b73]">{analysis.rubric.overall}</span>
                    <span className="text-xs text-gray-400">/6</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {([
                    ['Grammar', analysis.rubric.grammar, '문법 정확도'],
                    ['Vocabulary', analysis.rubric.vocabulary, '어휘 다양성'],
                    ['Coherence', analysis.rubric.coherence, '논리적 연결성'],
                    ['Task', analysis.rubric.taskCompletion, '과제 수행도'],
                  ] as const).map(([key, score, label]) => (
                    <div key={key} className="flex items-center justify-between bg-white/60 dark:bg-gray-900/40 rounded px-2 py-1.5">
                      <span className="text-gray-600 dark:text-gray-300">{label}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1e6b73] rounded-full" style={{ width: `${(score / 6) * 100}%` }} />
                      </div>
                        <span className="font-bold text-gray-700 dark:text-gray-200">{score}/6</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white/40 dark:bg-gray-900/30 rounded p-2">
                  {analysis.rubric.feedback}
                </p>
              </div>

              {/* 첨삭 목록 (카테고리별) */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> 상세 첨삭 ({analysis.corrections.length}건)
                </h4>
                {/* 카테고리 탭 */}
                <div className="flex gap-1 mb-2 flex-wrap">
                  {(['grammar', 'vocabulary', 'structure', 'coherence', 'task'] as const).map(cat => {
                    const items = correctionsByCategory[cat] || [];
                    if (items.length === 0) return null;
                    const labels: Record<string, string> = {
                      grammar: '문법', vocabulary: '어휘', structure: '구조', coherence: '연결성', task: '과제',
                    };
                    return (
                      <button
                        key={cat}
                        onClick={() => setPopupTab(cat as any)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          popupTab === cat
                            ? 'bg-[#1e6b73] text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {labels[cat]} ({items.length})
                      </button>
                    );
                  })}
                </div>

                {/* 첨삭 아이템 */}
                <div className="space-y-2">
                  {(correctionsByCategory[popupTab] || []).map((c, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 hover:border-[#1e6b73] dark:hover:border-[#2d8a8c] cursor-pointer transition-colors"
                      onClick={() => setActiveCorrectionIdx(activeCorrectionIdx === idx ? null : idx)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="text-xs">
                            <span className="text-red-600 dark:text-red-400 line-through">{c.original}</span>
                            <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" />
                            <span className="text-green-700 dark:text-green-400 font-medium">{c.corrected}</span>
                          </div>
                          {activeCorrectionIdx === idx && (
                            <div className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                              <span className="font-bold text-[#1e6b73] dark:text-[#5ab9c0]">이유: </span>{c.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(correctionsByCategory[popupTab] || []).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">이 카테고리에는 첨삭이 없습니다.</p>
                  )}
                </div>
              </div>

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
      `Bullets: ${Array.isArray(q.emailBullets) ? q.emailBullets.join(' / ') : ''}`,
      `To: ${q.emailTo || ''}`,
      `Subject: ${q.emailSubject || ''}`,
    ].filter(Boolean).join('\n');
  }

  // discussion
  return [
    `[Task: Academic Discussion]`,
    `Professor: ${q.professorName || ''}`,
    `Professor Message: ${q.professorMessage || q.questionText || ''}`,
    `Student 1 (${q.student1Name || ''}): ${q.student1Message || ''}`,
    `Student 2 (${q.student2Name || ''}): ${q.student2Message || ''}`,
  ].filter(Boolean).join('\n');
}
