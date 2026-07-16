import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Underline, Highlighter, BookOpen, Bot, X } from 'lucide-react';

/** 밑줄 색상 3종 */
export const UNDERLINE_COLORS = [
  { key: 'teal', value: '#1e6b73' },
  { key: 'orange', value: '#f59e0b' },
  { key: 'red', value: '#ef4444' },
];

/** 하이라이트 색상 3종 */
export const HIGHLIGHT_COLORS = [
  { key: 'yellow', value: '#fff3a3' },
  { key: 'green', value: '#c8f7c5' },
  { key: 'pink', value: '#ffd6e8' },
];

const DEFAULT_UNDERLINE_KEY = 'toefl_default_underline_color';
const DEFAULT_HIGHLIGHT_KEY = 'toefl_default_highlight_color';

/** AI 튜터 액션 타입 */
export type AiTutorAction = 'explain' | 'translate' | 'analyze' | 'rewrite';

/** AI 튜터 서브메뉴 액션 목록 */
const AI_TUTOR_ACTIONS: { key: AiTutorAction; label: string }[] = [
  { key: 'explain', label: 'Explain' },
  { key: 'translate', label: 'Translate' },
  { key: 'analyze', label: 'Analyze' },
  { key: 'rewrite', label: 'Rewrite' },
];

const GLM_API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = 'dc2213720f4b4a88ae06ddbd434ab1dd.qDGcLtBM9gGqp6ff';
const GLM_MODEL = 'glm-4-flash';

/** AI 튜터 API 호출 — 선택 텍스트에 대해 액션별 응답 생성 */
async function callAiTutor(action: AiTutorAction, selectedText: string): Promise<string> {
  const prompts: Record<AiTutorAction, string> = {
    explain: `다음 TOEFL 지문의 선택된 텍스트를 간결하게 설명해줘 (3~5줄, 한국어): "${selectedText}"`,
    translate: `다음 텍스트를 한국어로 자연스럽게 번역해줘 (직역+의역 병기, 3~4줄): "${selectedText}"`,
    analyze: `다음 TOEFL 텍스트의 문법 구조와 핵심 포인트를 분석해줘 (3~5줄, 한국어): "${selectedText}"`,
    rewrite: `다음 텍스트를 더 쉬운 영어로 paraphrase해줘. 한국어 설명도 한 줄 추가: "${selectedText}"`,
  };
  const resp = await fetch(GLM_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GLM_API_KEY}` },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages: [
        { role: 'system', content: 'TOEFL 튜터. 핵심만 간결하게 답변. 마크다운 금지. 줄바꿈으로 구조화.' },
        { role: 'user', content: prompts[action] },
      ],
      max_tokens: 400,
      temperature: 0.5,
    }),
  });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const json = await resp.json();
  return json.choices?.[0]?.message?.content?.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || '응답을 받지 못했습니다.';
}

/** localStorage에 저장된 '기본 색상' 읽기 — 없으면 팔레트의 첫 색상 */
function readDefaultColor(storageKey: string, fallback: string): string {
  try {
    return localStorage.getItem(storageKey) || fallback;
  } catch {
    return fallback;
  }
}

function writeDefaultColor(storageKey: string, color: string) {
  try {
    localStorage.setItem(storageKey, color);
  } catch { /* noop */ }
}

interface SelectionActionPopoverProps {
  /** 선택 영역 기준 앵커 좌표 (뷰포트 기준, 보통 선택 영역 상단 중앙) */
  x: number;
  y: number;
  onUnderline: (color: string) => void;
  onHighlight: (color: string) => void;
  onDictionary: () => void;
  /** AI 튜터 버튼 표시 여부 — Reading에서만 true */
  showAiTutor?: boolean;
  /** 드래그로 선택된 텍스트 — AI 튜터 컨텍스트로 사용 */
  selectedText?: string;
}

type ActivePanel = 'underline' | 'highlight' | 'ai' | null;

/** 짧게 탭 vs 길게 누르기(long-press) vs 더블 탭을 구분하는 제스처 훅. */
function useTapOrHold(onTap: () => void, onHoldOrDoubleTap: () => void) {
  const pressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const lastTapAtRef = useRef(0);
  const singleTapTimerRef = useRef<number | null>(null);

  const clearPressTimer = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };
  const clearSingleTapTimer = () => {
    if (singleTapTimerRef.current !== null) {
      window.clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    longPressFiredRef.current = false;
    clearPressTimer();
    pressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      onHoldOrDoubleTap();
    }, 420);
  }, [onHoldOrDoubleTap]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    clearPressTimer();
    if (longPressFiredRef.current) return;

    const now = Date.now();
    const sinceLastTap = now - lastTapAtRef.current;
    if (sinceLastTap < 320 && sinceLastTap > 0) {
      clearSingleTapTimer();
      lastTapAtRef.current = 0;
      onHoldOrDoubleTap();
      return;
    }
    lastTapAtRef.current = now;

    clearSingleTapTimer();
    singleTapTimerRef.current = window.setTimeout(() => {
      onTap();
      lastTapAtRef.current = 0;
    }, 320);
  }, [onTap, onHoldOrDoubleTap]);

  const onPointerLeave = useCallback(() => {
    clearPressTimer();
  }, []);

  useEffect(() => () => { clearPressTimer(); clearSingleTapTimer(); }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

/**
 * 텍스트 드래그 선택 시 등장하는 플로팅 액션 팝오버.
 * - 밑줄 / 하이라이트 / 사전 / AI 튜터 4개 버튼
 * - AI 튜터 클릭 시 Explain/Translate/Analyze/Rewrite 서브메뉴가 아래로 슬라이드
 * - 서브메뉴 클릭 시 말풍선 형태로 AI 응답 표시
 */
export function SelectionActionPopover({
  x,
  y,
  onUnderline,
  onHighlight,
  onDictionary,
  showAiTutor = false,
  selectedText = '',
}: SelectionActionPopoverProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // AI 튜터 말풍선 상태
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState<AiTutorAction | null>(null);

  const [defaultUnderline, setDefaultUnderline] = useState(() =>
    readDefaultColor(DEFAULT_UNDERLINE_KEY, UNDERLINE_COLORS[0].value)
  );
  const [defaultHighlight, setDefaultHighlight] = useState(() =>
    readDefaultColor(DEFAULT_HIGHLIGHT_KEY, HIGHLIGHT_COLORS[0].value)
  );

  // fade-in 트리거
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // 화면 경계 보정
  useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    let newX = x - rect.width / 2;
    let newY = y - rect.height - 10;
    if (newX < 8) newX = 8;
    if (newX + rect.width > window.innerWidth - 8) newX = window.innerWidth - rect.width - 8;
    if (newY < 8) newY = y + 20;
    setPos({ x: newX, y: newY });
  }, [x, y, activePanel, aiResponse]);

  const tapUnderline = useCallback(() => onUnderline(defaultUnderline), [onUnderline, defaultUnderline]);
  const holdUnderline = useCallback(() => setActivePanel('underline'), []);
  const tapHighlight = useCallback(() => onHighlight(defaultHighlight), [onHighlight, defaultHighlight]);
  const holdHighlight = useCallback(() => setActivePanel('highlight'), []);

  const underlineGesture = useTapOrHold(tapUnderline, holdUnderline);
  const highlightGesture = useTapOrHold(tapHighlight, holdHighlight);

  const pickUnderlineColor = (color: string) => {
    writeDefaultColor(DEFAULT_UNDERLINE_KEY, color);
    setDefaultUnderline(color);
    onUnderline(color);
    setActivePanel(null);
  };
  const pickHighlightColor = (color: string) => {
    writeDefaultColor(DEFAULT_HIGHLIGHT_KEY, color);
    setDefaultHighlight(color);
    onHighlight(color);
    setActivePanel(null);
  };

  // AI 튜터 액션 실행
  const handleAiAction = async (action: AiTutorAction) => {
    if (!selectedText.trim()) return;
    setAiAction(action);
    setAiLoading(true);
    setAiResponse(null);
    setActivePanel(null); // 서브메뉴 닫기
    try {
      const response = await callAiTutor(action, selectedText);
      setAiResponse(response);
    } catch (err) {
      setAiResponse('AI 응답을 가져오는 데 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  const closeAiBubble = () => {
    setAiResponse(null);
    setAiAction(null);
  };

  const ColorSwatchRow = ({
    colors,
    current,
    onPick,
  }: {
    colors: { key: string; value: string }[];
    current: string;
    onPick: (color: string) => void;
  }) => (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-3 py-2 whitespace-nowrap">
      {colors.map((c) => (
        <button
          key={c.key}
          onClick={() => onPick(c.value)}
          className={`w-6 h-6 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
            current === c.value
              ? 'border-gray-700 dark:border-gray-200 ring-2 ring-offset-1 ring-gray-400'
              : 'border-white dark:border-gray-800 ring-1 ring-gray-200 dark:ring-gray-600'
          }`}
          style={{ backgroundColor: c.value }}
          title={c.key}
        />
      ))}
    </div>
  );

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[95] transition-all duration-150 ease-out"
      style={{
        left: pos.x,
        top: pos.y,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.97)',
      }}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* 메인 툴바 */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-2 py-1.5">
        <button
          {...underlineGesture}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors select-none ${
            activePanel === 'underline'
              ? 'bg-[#1e6b73] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="밑줄 (탭: 즉시 적용 · 길게 누르기/더블탭: 색상 변경)"
        >
          <Underline size={16} />
          <span
            className="absolute bottom-1 w-3 h-[3px] rounded-full"
            style={{ backgroundColor: defaultUnderline }}
          />
        </button>
        <button
          {...highlightGesture}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors select-none ${
            activePanel === 'highlight'
              ? 'bg-[#1e6b73] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="하이라이트 (탭: 즉시 적용 · 길게 누르기/더블탭: 색상 변경)"
        >
          <Highlighter size={16} />
          <span
            className="absolute bottom-1 w-3 h-[3px] rounded-full"
            style={{ backgroundColor: activePanel === 'highlight' ? 'white' : defaultHighlight }}
          />
        </button>
        <button
          onClick={onDictionary}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="사전"
        >
          <BookOpen size={16} />
        </button>
        {/* AI 튜터 버튼 — showAiTutor가 true일 때만 표시 */}
        {showAiTutor && (
          <button
            onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              activePanel === 'ai'
                ? 'bg-[#667eea] text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="AI 튜터"
          >
            <Bot size={16} />
          </button>
        )}
      </div>

      {/* 색상 스와치 서브패널 */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: activePanel === 'underline' || activePanel === 'highlight' ? 48 : 0,
          opacity: activePanel === 'underline' || activePanel === 'highlight' ? 1 : 0,
          marginTop: activePanel === 'underline' || activePanel === 'highlight' ? 6 : 0,
        }}
      >
        {activePanel === 'underline' && (
          <ColorSwatchRow colors={UNDERLINE_COLORS} current={defaultUnderline} onPick={pickUnderlineColor} />
        )}
        {activePanel === 'highlight' && (
          <ColorSwatchRow colors={HIGHLIGHT_COLORS} current={defaultHighlight} onPick={pickHighlightColor} />
        )}
      </div>

      {/* AI 튜터 서브메뉴 — Explain / Translate / Analyze / Rewrite */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: activePanel === 'ai' ? 120 : 0,
          opacity: activePanel === 'ai' ? 1 : 0,
          marginTop: activePanel === 'ai' ? 6 : 0,
        }}
      >
        <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 min-w-[140px]">
          {AI_TUTOR_ACTIONS.map((action) => (
            <button
              key={action.key}
              onClick={() => handleAiAction(action.key)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#667eea]/10 dark:hover:bg-[#667eea]/20 rounded-lg transition-colors text-left"
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#667eea]/20 text-[#667eea] text-xs font-bold">
                {action.label[0]}
              </span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI 튜터 말풍선 응답 — 사전 팝업 스타일 */}
      {(aiLoading || aiResponse) && (
        <div
          className="mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 max-w-sm relative"
          style={{ minWidth: 280 }}
        >
          {/* 말풍선 꼬리 (위쪽 삼각형) */}
          <div
            className="absolute -top-2 left-6 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700"
            style={{ transform: 'rotate(45deg)' }}
          />

          {/* 헤더 */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#667eea] text-white">
                <Bot size={14} />
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                AI 튜터 · {aiAction && AI_TUTOR_ACTIONS.find(a => a.key === aiAction)?.label}
              </span>
            </div>
            <button
              onClick={closeAiBubble}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>

          {/* 선택된 텍스트 미리보기 */}
          <div className="mb-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
              "{selectedText.length > 80 ? selectedText.slice(0, 80) + '...' : selectedText}"
            </p>
          </div>

          {/* 응답 내용 */}
          {aiLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-[#667eea] rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">분석 중...</span>
            </div>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {aiResponse}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
