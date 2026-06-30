import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X, Sparkles, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

// ───────────────────────────────────────────────────────────────────────────
//  API 설정 (참조: AiAssistantWidget.tsx)
//  - GLM(zhipu) chat completions 엔드포인트 사용
//  - API 키/모델만 교체하면 다른 LLM으로 쉽게 교체 가능
// ───────────────────────────────────────────────────────────────────────────
const AI_API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const AI_API_KEY = 'dc2213720f4b4a88ae06ddbd434ab1dd.qDGcLtBM9gGqp6ff';
const AI_MODEL = 'glm-5.2';

const BASE_SYSTEM_PROMPT =
  '당신은 TOEFL 응시자(한국어 사용자)를 위한 전문 튜터 AI입니다. ' +
  'Reading / Listening / Speaking / Writing 영역의 문제 풀이, 오답 분석, 학습 전략, 어휘·문법, ' +
  '에세이/스피킹 답안 피드백 등 TOEFL 학습 전반에 대해 한국어로 친절하고 정확하게 답변해주세요. ' +
  '답변은 간결하고 실용적이며, 가능하면 영어 예문과 한글 설명을 함께 제공해 주세요.';

// ───────────────────────────────────────────────────────────────────────────
//  출력 형식 지시 — 마크다운 기호 대신 <b>, <u> 태그 사용
// ───────────────────────────────────────────────────────────────────────────
const OUTPUT_FORMAT_INSTRUCTION =
  '[출력 형식] 마크다운 기호(#, ##, ###, **, *, `, - 등)를 절대 사용하지 마세요. 대신 아래 규칙을 따르세요:\n' +
  '1) 강조하거나 굵게 표시할 단어/핵심 용어는 <b>단어</b> 로 감싸세요.\n' +
  '2) 항목명이나 라벨(예: 정답, 해설, 핵심 어휘, 오답 이유)은 <u>항목명</u> 으로 밑줄을 표시하세요.\n' +
  '3) 목록은 줄 앞에 "1." "2." 같은 숫자나 "-" 기호 없이, 각 항목을 새 줄로 작성하세요.\n' +
  '4) 제목/소제목은 별도 기호 없이 한 줄로 작성하면 됩니다.\n' +
  '5) 줄바꿈으로만 구조를 표현하세요. 한국어로 친절하게 답변하세요.';

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

const suggestedQuestions = [
  '이 문제를 분석해줘',
  '틀린 이유와 다음에 주의할 점은?',
  '이 지문의 핵심 어휘를 알려줘',
  '스피킹/라이팅 답안을 교정해 줘',
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
}

export function ToeflAiWidget({ position = 'right', contextLabel, questionData, zIndex = 90, open, onOpenChange, showFab = true }: ToeflAiWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = (value: boolean) => {
    setInternalOpen(value);
    onOpenChange?.(value);
  };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 컨텍스트(또는 문제 데이터)가 바뀌면 대화 초기화
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [contextLabel, questionData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  const handleSuggestedQuestion = (q: string) => {
    setChatInput(q);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage = chatInput;
    setChatInput('');

    const newHistory: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userMessage, timestamp: Date.now() },
    ];
    setChatMessages(newHistory);
    setIsAiLoading(true);

    const questionContext = buildQuestionContext(questionData, contextLabel);

    const contextParts = [BASE_SYSTEM_PROMPT];
    if (contextLabel) {
      contextParts.push(`[현재 학습 컨텍스트] ${contextLabel}`);
    }
    if (questionContext) {
      contextParts.push(
        `[현재 사용자가 보고 있는 문제 데이터]\n${questionContext}\n\n` +
          '★ 중요: 사용자가 지금 리뷰(복습) 화면에 있으며, 위 데이터가 화면에 표시된 문제입니다. ' +
          '사용자의 질문은 위 문제와 관련된 것으로 간주하고, 반드시 이 문제 데이터(지문·질문·선택지·정답·해설·스크립트 등)를 먼저 분석한 뒤 답변하세요. ' +
          '사용자가 "이 문제", "이거", "정답 근거", "틀린 이유", "해설해 줘", "왜 틀렸어" 등 모호하게 물어도 모두 위 문제를 가리키는 것입니다. ' +
          '답변할 때는 문제의 구체적 내용(지문 문장, 선택지 텍스트, 정답 등)을 인용하여 근거를 명확히 제시하세요. ' +
          '위 데이터에 없는 정보가 필요할 때만 보편적 TOEFL 지식을 보충하되, 문제 데이터가 항상 우선입니다.\n\n' +
          '◆ "이 문제를 분석해줘"와 같은 분석 요청에는 다음 네 가지를 모두 포함하여 정성껏 풀어주세요:\n' +
          '  1) 분석 — 문제 유형·난이도·요구사항, 이 문제가 무엇을 묻는지, 어떤 능력을 평가하는지\n' +
          '  2) 정답 근거 — 정답이 왜 맞는지 지문/자료의 구체적 문장을 인용하여 단계적으로 증명\n' +
          '  3) 해설 — 핵심 문장과 중요 어휘·표현을 한국어로 풀이하고 의미를 설명\n' +
          '  4) 오답 분석 — 나머지 선택지가 각각 왜 틀렸는지 이유를 짚어주세요\n' +
          '분석은 위 문제 데이터를 바탕으로 작성하고, 일반론만 나열하지 마세요.'
      );
    } else {
      contextParts.push(
        '현재 보고 있는 구체적 문제 데이터가 제공되지 않았으므로, 컨텍스트 라벨과 일반적 TOEFL 지식을 바탕으로 답변하세요.'
      );
    }
    contextParts.push(OUTPUT_FORMAT_INSTRUCTION);
    const systemPrompt = contextParts.join('\n\n');

    try {
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newHistory.map((msg) => ({ role: msg.role, content: msg.content })),
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        const reply = data.choices[0].message.content;
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply, timestamp: Date.now() },
        ]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.error('TOEFL AI error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송해요, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요. 😢',
          timestamp: Date.now(),
        },
      ]);
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
      `}</style>

      {/* AI 도움 버튼 (이모티콘 FAB) — 통합 모드에서는 숨김 */}
      {showFab && (
        <button
          onClick={() => setIsOpen(true)}
          className={`toefl-ai-fab fixed bottom-6 ${fabSideClass}`}
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

      {/* AI 패널 (슬라이드인) */}
      {isOpen && (
        <>
          <div className="toefl-ai-panel-overlay" onClick={() => setIsOpen(false)} />
          <div className="toefl-ai-panel">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
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
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
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
                  {suggestedQuestions.map((q, idx) => (
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
                  {isAiLoading && (
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
          </div>
        </>
      )}
    </>
  );
}
