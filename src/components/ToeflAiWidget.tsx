import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, Sparkles, Send, Bot, User, Pin, PinOff, X, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

// ───────────────────────────────────────────────────────────────────────────
//  API 설정 — GLM + Claude 듀블 모델 지원
//  - GLM: 직접 호출 (CORS 허용)
//  - Claude: Electron에서는 직접 호출(세션 인터셉터가 CORS+인증 처리),
//           웹에서는 Vercel 서버리스 프록시 경유
// ───────────────────────────────────────────────────────────────────────────
const GLM_API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = 'dc2213720f4b4a88ae06ddbd434ab1dd.qDGcLtBM9gGqp6ff';
const GLM_MODEL = 'glm-4-flash';

// Electron 여부 확인 → Claude 엔드포인트 분기
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron === true;
const CLAUDE_PROXY_ENDPOINT = isElectron
  ? 'https://apiclaude.cc/v1/chat/completions'   // Electron: 세션 인터셉터가 인증+CORS 처리
  : '/api/claude/chat/completions';                // 웹: Vercel 프록시
const CLAUDE_MODEL = 'claude-sonnet-5';

type AiModel = 'glm' | 'claude';

const MODEL_OPTIONS: { key: AiModel; label: string; modelId: string }[] = [
  { key: 'glm', label: 'GLM Flash (빠름)', modelId: GLM_MODEL },
  { key: 'claude', label: 'Claude Sonnet 5', modelId: CLAUDE_MODEL },
];

const BASE_SYSTEM_PROMPT =
  'TOEFL 튜터 AI. 한국어로 간결·실용적으로 답변. 영어 예문+한글 설명. Reading/Listening/Speaking/Writing 전문.';

const OUTPUT_FORMAT_INSTRUCTION =
  '[형식] 마크다운(#,**,*,`) 금지. <b>강조</b>, <u>항목명</u> 사용. 목록은 새 줄만. 줄바꿈으로 구조화.';

// ───────────────────────────────────────────────────────────────────────────
//  문제 데이터 → 컨텍스트 문자열 변환
// ───────────────────────────────────────────────────────────────────────────
function buildQuestionContext(questionData: any, contextLabel?: string): string {
  if (!questionData || typeof questionData !== 'object') return '';
  const q: any = { ...questionData };
  // 노이즈(이미지/오디오 URL, id 등) 제거
  const noisyKeys = [
    'imageUrl', 'introImageUrl', 'audioUrl', 'avatar1ImageUrl', 'avatar2ImageUrl',
    'voiceAvatar', 'materialImage', 'id', 'image', 'audio', 'materialAudioDuration',
    'modelAudioDuration', 'userAudioDuration', 'currentVoice', 'modelLabel',
    'showTextDefault', 'slotCount', 'sentenceEnding', 'words',
  ];
  noisyKeys.forEach((k) => { try { delete q[k]; } catch { /* noop */ } });

  const parts: string[] = [];
  const push = (label: string, val: any) => {
    if (val === undefined || val === null || val === '') return;
    if (Array.isArray(val)) {
      if (val.length === 0) return;
      const arr = val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)));
      parts.push(`${label}: ${arr.join(' | ')}`);
    } else if (typeof val === 'object') {
      // 중첩 객체는 간단히 키=값 직렬화
      const entries = Object.entries(val)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
      if (entries.length) parts.push(`${label}: ${entries.join(', ')}`);
    } else {
      parts.push(`${label}: ${String(val)}`);
    }
  };

  push('영역', contextLabel);
  push('문제 번호', q.questionNumber ?? q.number);
  push('문제 유형', q.questionType);
  push('난이도', q.difficulty);
  push('문제/질문', q.text || q.questionText || q.prompt || q.question || q.stem);
  push('지문', q.passageText || q.passage || q.readingPassage || q.passage_text);
  push('선택지', q.options || q.choices || q.answers || q.answerOptions);
  push('정답', q.correctAnswer || q.answer || q.correctAnswers || q.correct_answer);
  push('빈칸 정답', q.blanks);
  push('해설', q.explanation || q.analysisNote);
  push('번역 노트', q.translationNote);
  push('어휘 노트', q.vocabularyNote);
  push('오디오 스크립트', q.audioText || q.transcript || q.scriptText || q.audio_text);
  push('지문 제목', q.passageTitle || q.interstitialTitle);
  // Writing - Write an Email
  push('이메일 상황', q.emailScenario);
  push('이메일 지시', q.emailInstruction);
  push('이메일 조건', q.emailBullets);
  push('이메일 제목/수신', [q.emailSubject, q.emailTo].filter(Boolean).join(' / '));
  // Writing - Academic Discussion
  push('교수 발언', q.professorName ? `${q.professorName}: ${q.professorMessage}` : q.professorMessage);
  push('학생1 발언', q.student1Name ? `${q.student1Name}: ${q.student1Message}` : q.student1Message);
  push('학생2 발언', q.student2Name ? `${q.student2Name}: ${q.student2Message}` : q.student2Message);

  return parts.join('\n');
}

// ───────────────────────────────────────────────────────────────────────────
//  리치 텍스트 렌더링 — <b>, <u> 태그 + 잔류 마크다운을 색상/굵기/밑줄로 변환
// ───────────────────────────────────────────────────────────────────────────
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  // <b>..</b>, <u>..</u>, **..**, *..*, `..` 토큰 분할
  const regex = /(<b>[\s\S]*?<\/b>)|(<u>[\s\S]*?<\/u>)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith('<b>')) {
      tokens.push(
        <strong key={`${keyPrefix}-b-${i}`} style={{ color: '#0d9488', fontWeight: 700 }}>
          {m.slice(3, -4)}
        </strong>
      );
    } else if (m.startsWith('<u>')) {
      tokens.push(
        <span key={`${keyPrefix}-u-${i}`} style={{ textDecoration: 'underline', textDecorationColor: '#2563eb', color: '#1d4ed8', fontWeight: 600 }}>
          {m.slice(3, -4)}
        </span>
      );
    } else if (m.startsWith('**')) {
      tokens.push(
        <strong key={`${keyPrefix}-s-${i}`} style={{ color: '#0d9488', fontWeight: 700 }}>
          {m.slice(2, -2)}
        </strong>
      );
    } else if (m.startsWith('*')) {
      tokens.push(
        <em key={`${keyPrefix}-i-${i}`} style={{ fontStyle: 'italic', color: '#475569', fontWeight: 500 }}>
          {m.slice(1, -1)}
        </em>
      );
    } else if (m.startsWith('`')) {
      tokens.push(
        <code key={`${keyPrefix}-c-${i}`} style={{ background: '#e5e7eb', padding: '1px 5px', borderRadius: 4, fontSize: '13px', color: '#be185d' }}>
          {m.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
    i++;
  }
  if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
  return tokens;
}

function renderRichContent(content: string): ReactNode {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: ReactNode[] = [];
  let listType: 'ol' | null = null;

  const flushList = (key: string) => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ol key={key} style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {listBuffer.map((li, i) => (
            <li key={i} style={{ marginBottom: 2 }}>{li}</li>
          ))}
        </ol>
      );
      listBuffer = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    if (hMatch) {
      flushList(`l-${idx}`);
      const level = hMatch[1].length;
      const size = level <= 1 ? 17 : level === 2 ? 16 : 15;
      blocks.push(
        <div key={`h-${idx}`} style={{ fontWeight: 700, fontSize: size, color: '#0f766e', margin: '8px 0 4px' }}>
          {renderInline(hMatch[2], `h-${idx}`)}
        </div>
      );
    } else if (numMatch) {
      listType = 'ol';
      listBuffer.push(renderInline(numMatch[2], `n-${idx}`));
    } else if (trimmed === '') {
      flushList(`l-${idx}`);
      blocks.push(<div key={`sp-${idx}`} style={{ height: 6 }} />);
    } else {
      flushList(`l-${idx}`);
      blocks.push(
        <div key={`p-${idx}`} style={{ margin: '2px 0' }}>
          {renderInline(line, `p-${idx}`)}
        </div>
      );
    }
  });
  flushList('l-final');
  return <>{blocks}</>;
}

const defaultSuggestedQuestions = [
  '🔍 이 문제에서 정답의 근거가 되는 부분을 찾아줘',
  '❌ 내가 고른 보기가 왜 틀렸어?',
  '✅ 정답과 오답의 차이를 정확히 설명해줘',
  '💡 이 유형 문제를 풀 때 핵심 전략이 뭐야?',
  '📚 이 문제에서 모르는 어휘나 표현을 설명해줘',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ToeflAiWidgetProps {
  /** FAB 버튼 위치 — 기본 우측 하단. 기존 우측 패널과 겹칠 때 'left' 사용 */
  position?: 'left' | 'right';
  /** 현재 리뷰 컨텍스트(예: "Reading · Read an Academic Passage") — 시스템 프롬프트에 주입 */
  contextLabel?: string;
  /** 현재 보고 있는 문제 원본 데이터 — AI가 해당 문제에 대해 답변하도록 컨텍스트로 주입 */
  questionData?: any;
  /** z-index 오버레이 충돌 회피용 */
  zIndex?: number;
  /** 외부에서 열림 상태를 제어할 때 사용 (controlled). 미지정 시 내부 state 사용 */
  open?: boolean;
  /** 열림 상태 변화를 부모에게 알림 */
  onOpenChange?: (open: boolean) => void;
  /** 독립 FAB 버튼 표시 여부. 다른 패널에 통합할 때 false로 설정 */
  showFab?: boolean;
  /** AI 추천 질문 목록. 미지정 시 기본값 사용 */
  suggestedQuestions?: string[];
  /** 열릴 때 자동으로 채팅에 채워 넣고 즉시 전송할 질문 (드래그 선택 → AI 튜터 서브메뉴 클릭 시 사용) */
  initialQuestion?: string;
  /** 패널 고정(pinned) 모드 지원 — Writing 등에서 글 작성하면서 AI 튜터 유지 */
  pinnable?: boolean;
}

export function ToeflAiWidget({ position = 'right', contextLabel, questionData, zIndex = 90, open, onOpenChange, showFab = true, suggestedQuestions: propQuestions, initialQuestion, pinnable = false }: ToeflAiWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [selectedModel, setSelectedModel] = useState<AiModel>('glm');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeQuestions = propQuestions ?? defaultSuggestedQuestions;

  // ── Pinned (고정) 모드: Writing에서 AI 튜터를 띄워놓고 글 작성 ──
  const [pinned, setPinned] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [panelSize, setPanelSize] = useState({ w: 380, h: 480 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // 드래그로 패널 이동
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (!pinned) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: panelPos.x, origY: panelPos.y };
    e.preventDefault();
  }, [pinned, panelPos]);

  useEffect(() => {
    if (!pinned) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPanelPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [pinned]);

  // 리사이즈 (우하단 모서리 드래그)
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    if (!pinned) return;
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: panelSize.w, origH: panelSize.h };
    e.preventDefault();
    e.stopPropagation();
  }, [pinned, panelSize]);

  useEffect(() => {
    if (!pinned) return;
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const dw = e.clientX - resizeRef.current.startX;
      const dh = e.clientY - resizeRef.current.startY;
      setPanelSize({
        w: Math.max(300, resizeRef.current.origW + dw),
        h: Math.max(300, resizeRef.current.origH + dh),
      });
    };
    const onUp = () => { resizeRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [pinned]);

  // 컨텍스트(또는 문제 데이터)가 바뀌면 대화 초기화
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [contextLabel, questionData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: isAiLoading ? 'auto' : 'smooth' });
  }, [chatMessages, isAiLoading, streamingText]);

  const handleSuggestedQuestion = (q: string) => {
    setChatInput(q);
  };

  const lastAutoSentRef = useRef<string | null>(null);
  // 드래그 선택 → AI 튜터 서브메뉴(Explain/Translate/Analyze/Rewrite) 클릭 시
  // initialQuestion이 주어지면 패널이 열리자마자 자동으로 전송
  useEffect(() => {
    if (isOpen && initialQuestion && lastAutoSentRef.current !== initialQuestion) {
      lastAutoSentRef.current = initialQuestion;
      handleSendMessage(initialQuestion);
    }
    if (!isOpen) {
      lastAutoSentRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuestion]);

  const handleSendMessage = async (overrideText?: string) => {
    const userMessage = overrideText ?? chatInput;
    if (!userMessage.trim() || isAiLoading) return;

    setChatInput('');

    const newHistory: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userMessage, timestamp: Date.now() },
    ];
    setChatMessages(newHistory);
    setIsAiLoading(true);
    setStreamingText('');

    const questionContext = buildQuestionContext(questionData, contextLabel);

    const contextParts = [BASE_SYSTEM_PROMPT];
    if (questionContext) {
      contextParts.push(`[문제]\n${questionContext}\n반드시 위 문제 데이터 기반으로 답변. 정답 근거·해설·오답 분석 포함.`);
    } else if (contextLabel) {
      contextParts.push(`[컨텍스트] ${contextLabel}`);
    }
    contextParts.push(OUTPUT_FORMAT_INSTRUCTION);
    const systemPrompt = contextParts.join('\n');

    try {
      const isClaude = selectedModel === 'claude';
      const endpoint = isClaude ? CLAUDE_PROXY_ENDPOINT : GLM_API_ENDPOINT;
      const apiKey = isClaude ? '' : GLM_API_KEY;
      const modelId = isClaude ? CLAUDE_MODEL : GLM_MODEL;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const requestBody: Record<string, any> = {
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...newHistory.slice(-2).map((msg) => ({ role: msg.role, content: msg.content })),
        ],
        max_tokens: 1200,
        temperature: 0.6,
        stream: true,
      };
      // glm-4-flash는 reasoning 파라미터 없음

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('API 호출 횟수가 제한되었어요. 잠시 후 다시 시도해주세요.');
        if (response.status === 401 || response.status === 403) throw new Error('인증 오류가 발생했어요.');
        const errText = await response.text().catch(() => '');
        throw new Error(`서버 오류 (${response.status}): ${errText.slice(0, 100)}`);
      }

      // SSE 스트리밍 읽기
      const reader = response.body?.getReader();
      if (!reader) throw new Error('스트리밍 응답을 읽을 수 없어요.');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setStreamingText(fullText);
            }
          } catch { /* 불완전 JSON — 다음 chunk에서 처리 */ }
        }
      }

      // 스트리밍 완료 → 최종 메시지 저장
      const finalContent = fullText || 'AI 응답을 받지 못했어요. 다시 시도해주세요.';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: finalContent, timestamp: Date.now() }]);
      setStreamingText('');
    } catch (err: any) {
      console.error('TOEFL AI error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message.includes('429')
            ? '⏳ API 사용량이 잠시 제한되었어요. 1~2분 뒤에 다시 시도하거나, Claude 모델로 전환해보세요.'
            : err.message.includes('인증')
            ? '🔑 인증 오류가 발생했어요. 관리자에게 문의해 주세요.'
            : `죄송해요, 오류가 발생했어요: ${err.message}. 잠시 후 다시 시도해주세요.`,
          timestamp: Date.now(),
        },
      ]);
      setStreamingText('');
    } finally {
      setIsAiLoading(false);
    }
  };

  const fabSideClass = position === 'left' ? 'left-6' : 'right-6';

  return (
    <>
      <style>{`
        .toefl-ai-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .toefl-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          flex-shrink: 0;
        }
        .toefl-chat-bubble {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }
        .toefl-chat-bubble.user {
          background-color: #667eea;
          color: white;
          border-bottom-right-radius: 2px;
        }
        .toefl-chat-bubble.ai {
          background-color: #f3f4f6;
          color: #1f2937;
          border-bottom-left-radius: 2px;
        }
        .toefl-ai-fab {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #cfe0ff 0%, #a9c6ff 35%, #8fd6ee 70%, #bfe9ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(102, 126, 234, 0.35);
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .toefl-ai-fab:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 10px 24px rgba(102, 126, 234, 0.45);
        }
        .toefl-ai-fab-eyes {
          display: flex;
          gap: 6px;
        }
        .toefl-ai-fab-eyes span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #2d2d3a;
          display: block;
        }
        .toefl-ai-panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          z-index: ${zIndex};
          animation: toeflAiFadeIn 0.2s ease;
        }
        .toefl-ai-panel {
          position: fixed;
          top: 0;
          ${position === 'left' ? 'left: 0;' : 'right: 0;'}
          height: 100%;
          width: 420px;
          max-width: 100vw;
          background: #fff;
          z-index: ${zIndex + 1};
          box-shadow: ${position === 'left' ? '8px 0 30px rgba(0,0,0,0.15)' : '-8px 0 30px rgba(0,0,0,0.15)'};
          display: flex;
          flex-direction: column;
          animation: ${position === 'left' ? 'toeflAiSlideInLeft' : 'toeflAiSlideInRight'} 0.25s ease;
        }
        @keyframes toeflAiSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes toeflAiSlideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes toeflAiFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .toefl-ai-panel-suggestion {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 4px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          width: 100%;
          text-align: left;
          transition: color 0.15s ease;
        }
        .toefl-ai-panel-suggestion:hover {
          color: #667eea;
        }
        .toefl-ai-panel-suggestion:last-child {
          border-bottom: none;
        }
        .toefl-ai-pinned-panel {
          position: fixed;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .toefl-ai-pinned-header {
          cursor: move;
          user-select: none;
        }
        .toefl-ai-pinned-resize {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 18px;
          height: 18px;
          cursor: nwse-resize;
          background: linear-gradient(135deg, transparent 50%, #cbd5e1 50%);
          border-bottom-right-radius: 12px;
        }
      `}</style>

      {/* AI 도움 버튼 (이모티콘 FAB) — 통합 모드에서는 숨김 */}
      {showFab && (
        <button
          onClick={() => setIsOpen(true)}
          className={`toefl-ai-fab fixed bottom-16 md:bottom-6 ${fabSideClass}`}
          style={{ zIndex }}
          aria-label="AI 튜터에게 물어보세요"
          title="AI 튜터에게 물어보세요"
        >
          <span className="toefl-ai-fab-eyes">
            <span></span>
            <span></span>
          </span>
        </button>
      )}

      {/* AI 패널 (슬라이드인 or 고정 플로팅) */}
      {isOpen && (
        <>
          {/* 오버레이 — pinned 모드에서는 제거 (글 작성 영역 확보) */}
          {!pinned && <div className="toefl-ai-panel-overlay" onClick={() => setIsOpen(false)} />}
          <div
            className={pinned ? 'toefl-ai-pinned-panel' : 'toefl-ai-panel'}
            style={pinned ? {
              right: `${20 + panelPos.x}px`,
              top: `${80 + panelPos.y}px`,
              width: `${panelSize.w}px`,
              height: `${panelSize.h}px`,
              zIndex: zIndex + 1,
            } : undefined}
          >
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${pinned ? 'toefl-ai-pinned-header' : ''}`}
              onMouseDown={onDragStart}
            >
              <div className="flex items-center gap-2">
                {pinned && <GripVertical className="w-4 h-4 text-gray-300" />}
                <span className="toefl-ai-fab" style={{ width: 36, height: 36 }}>
                  <span className="toefl-ai-fab-eyes">
                    <span style={{ width: 3, height: 3 }}></span>
                    <span style={{ width: 3, height: 3 }}></span>
                  </span>
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800">AI 튜터</span>
                  {contextLabel && (
                    <span className="text-[11px] text-gray-400 leading-tight max-w-[260px] truncate">
                      {contextLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Pin/Unpin 버튼 — pinnable일 때만 표시 */}
                {pinnable && (
                  <button
                    onClick={() => setPinned(!pinned)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      pinned
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                    }`}
                    title={pinned ? '고정 해제' : '패널 고정'}
                  >
                    {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    {pinned ? '고정해제' : '고정'}
                  </button>
                )}
                <button
                  onClick={() => { setPinned(false); setIsOpen(false); }}
                  className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  {pinned ? <X className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  {pinned ? '닫기' : '돌아가기'}
                </button>
              </div>
            </div>
            {/* ── 모델 선택 바 ── */}
            <div className="flex items-center gap-1.5 px-5 py-2 border-b bg-gray-50/80">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedModel(opt.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                    selectedModel === opt.key
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-teal-400 hover:text-teal-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {chatMessages.length === 0 ? (
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <p className="text-2xl font-bold text-gray-800 mb-1">hi~</p>
                <p className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-1">
                  TOEFL 학습 도우미예요 <Sparkles className="w-5 h-5 text-yellow-400" />
                </p>
                <p className="text-sm text-gray-500 mt-2 mb-6">
                  문제 풀이, 오답 분석, 어휘·문법, 답안 피드백까지 무엇이든 편하게 물어보세요
                </p>
                <div className="bg-gray-50 rounded-2xl px-4">
                  {activeQuestions.map((q, idx) => (
                    <button key={idx} className="toefl-ai-panel-suggestion" onClick={() => handleSuggestedQuestion(q)}>
                      <span>{q}</span>
                      <span className="text-gray-300">›</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/50">
                <div className="flex flex-col space-y-4">
                  {chatMessages.map((msg, idx) => {
                    const cleanContent = msg.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    return (
                      <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={msg.role === 'user' ? 'toefl-user-avatar' : 'toefl-ai-avatar'}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`toefl-chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                          {msg.role === 'assistant' ? renderRichContent(cleanContent) : cleanContent}
                        </div>
                      </div>
                    );
                  })}
                  {isAiLoading && streamingText && (
                    <div className="flex gap-2 flex-row">
                      <div className="toefl-ai-avatar">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="toefl-chat-bubble ai">
                        {renderRichContent(streamingText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim())}
                      </div>
                    </div>
                  )}
                  {isAiLoading && !streamingText && (
                    <div className="flex gap-2 flex-row">
                      <div className="toefl-ai-avatar animate-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="toefl-chat-bubble ai flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            <div className="p-3 border-t bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="말씀해 주세요..."
                  className="flex-1 text-sm bg-gray-50 focus:bg-white transition-colors"
                  disabled={isAiLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
                  disabled={!chatInput.trim() || isAiLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
            {/* 리사이즈 핸들 — pinned 모드에서만 표시 (우하단 모서리 드래그) */}
            {pinned && <div className="toefl-ai-pinned-resize" onMouseDown={onResizeStart} />}
          </div>
        </>
      )}
    </>
  );
}
