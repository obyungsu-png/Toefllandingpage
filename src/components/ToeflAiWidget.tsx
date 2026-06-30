import { useState, useEffect, useRef } from 'react';
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
const AI_MODEL = 'glm-z1-flash';

const BASE_SYSTEM_PROMPT =
  '당신은 TOEFL 응시자(한국어 사용자)를 위한 전문 튜터 AI입니다. ' +
  'Reading / Listening / Speaking / Writing 영역의 문제 풀이, 오답 분석, 학습 전략, 어휘·문법, ' +
  '에세이/스피킹 답안 피드백 등 TOEFL 학습 전반에 대해 한국어로 친절하고 정확하게 답변해주세요. ' +
  '답변은 간결하고 실용적이며, 가능하면 영어 예문과 한글 설명을 함께 제공해 주세요.';

const suggestedQuestions = [
  '이 문제의 정답 근거를 해설해 줘',
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
  /** z-index 오버레이 충돌 회피용 */
  zIndex?: number;
}

export function ToeflAiWidget({ position = 'right', contextLabel, zIndex = 90 }: ToeflAiWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 컨텍스트가 바뀌면 대화 초기화
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [contextLabel]);

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

    const systemPrompt = contextLabel
      ? `${BASE_SYSTEM_PROMPT}\n\n[현재 학습 컨텍스트] ${contextLabel}\n사용자가 보고 있는 문제/영역과 관련된 질문일 경우, 해당 컨텍스트를 반영하여 답변해 주세요.`
      : BASE_SYSTEM_PROMPT;

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

      {/* AI 도움 버튼 (이모티콘 FAB) */}
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
                          {msg.role === 'assistant'
                            ? cleanContent.split('\n').map((line, i) => (
                                <span key={i}>
                                  {line}
                                  {i < cleanContent.split('\n').length - 1 && <br />}
                                </span>
                              ))
                            : cleanContent}
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
