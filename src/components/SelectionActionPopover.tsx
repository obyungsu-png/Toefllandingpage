import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Underline, Highlighter, BookOpen, Bot } from 'lucide-react';

export type AiTutorAction = 'explain' | 'translate' | 'analyze' | 'rewrite';

interface SelectionActionPopoverProps {
  /** 선택 영역 기준 앵커 좌표 (뷰포트 기준, 보통 선택 영역 상단 중앙) */
  x: number;
  y: number;
  onUnderline: () => void;
  onHighlight: () => void;
  onDictionary: () => void;
  onAiTutorAction: (action: AiTutorAction) => void;
}

const AI_TUTOR_ACTIONS: { key: AiTutorAction; label: string }[] = [
  { key: 'explain', label: 'Explain' },
  { key: 'translate', label: 'Translate' },
  { key: 'analyze', label: 'Analyze' },
  { key: 'rewrite', label: 'Rewrite' },
];

/**
 * 텍스트 드래그 선택 시 등장하는 플로팅 액션 팝오버.
 * - 밑줄 / 하이라이트 / 사전 / AI 튜터 4개 버튼
 * - AI 튜터 클릭 시 Explain/Translate/Analyze/Rewrite 서브메뉴가 아래로 슬라이드
 * - fade-in/out 애니메이션, 바깥 클릭 시 부모(ReadingReviewPassage)에서 unmount 처리
 */
export function SelectionActionPopover({
  x,
  y,
  onUnderline,
  onHighlight,
  onDictionary,
  onAiTutorAction,
}: SelectionActionPopoverProps) {
  const [showAiSubmenu, setShowAiSubmenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // fade-in 트리거
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // 화면 경계 보정 (가로 중앙 정렬 + 좌우 클램프, 위쪽 공간 부족 시 아래로)
  useEffect(() => {
    if (!popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    let newX = x - rect.width / 2;
    let newY = y - rect.height - 10;
    if (newX < 8) newX = 8;
    if (newX + rect.width > window.innerWidth - 8) newX = window.innerWidth - rect.width - 8;
    if (newY < 8) newY = y + 20; // 위쪽 공간 부족하면 선택 영역 아래로 표시
    setPos({ x: newX, y: newY });
  }, [x, y, showAiSubmenu]);

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
      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-2 py-1.5">
        <button
          onClick={onUnderline}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="밑줄"
        >
          <Underline size={16} />
        </button>
        <button
          onClick={onHighlight}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="하이라이트"
        >
          <Highlighter size={16} />
        </button>
        <button
          onClick={onDictionary}
          className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="사전"
        >
          <BookOpen size={16} />
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />
        <button
          onClick={() => setShowAiSubmenu((v) => !v)}
          className={`flex items-center gap-1 px-2.5 h-8 rounded-full text-xs font-semibold transition-colors ${
            showAiSubmenu
              ? 'bg-[#1e6b73] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="AI 튜터"
        >
          <Bot size={16} />
          <span>AI 튜터</span>
        </button>
      </div>

      {/* AI 튜터 서브메뉴 — 슬라이드다운 */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: showAiSubmenu ? 60 : 0,
          opacity: showAiSubmenu ? 1 : 0,
          marginTop: showAiSubmenu ? 6 : 0,
        }}
      >
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-2 py-1.5 whitespace-nowrap">
          {AI_TUTOR_ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => onAiTutorAction(a.key)}
              className="px-3 h-8 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-[#1e6b73] hover:text-white transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
