import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Underline, Highlighter, BookOpen } from 'lucide-react';

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
}

type ActivePanel = 'underline' | 'highlight' | null;

/** 짧게 탭 vs 길게 누르기(long-press) vs 더블 탭을 구분하는 제스처 훅.
 *  - 짧게 탭(mouse click / touch tap): onTap() 즉시 실행 (기본 색상 적용)
 *  - 길게 누르기(≈420ms 이상 유지) 또는 빠르게 두 번 탭: onHoldOrDoubleTap() 실행 (색상 선택 패널 오픈) */
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
    if (longPressFiredRef.current) return; // 이미 길게 누르기로 처리됨

    const now = Date.now();
    const sinceLastTap = now - lastTapAtRef.current;
    if (sinceLastTap < 320 && sinceLastTap > 0) {
      // 더블 탭 — 단일 탭 타이머 취소하고 색상 패널 오픈
      clearSingleTapTimer();
      lastTapAtRef.current = 0;
      onHoldOrDoubleTap();
      return;
    }
    lastTapAtRef.current = now;

    // 더블 탭 여부를 기다렸다가 단일 탭 실행 (그동안 더블탭 안 들어오면)
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
 * - 밑줄 / 하이라이트 / 사전 3개 버튼
 * - 밑줄·하이라이트는 "가볍게 탭"하면 마지막에 쓴 기본 색상으로 즉시 적용됨
 *   (색상 창이 뜨지 않아 빠르게 필기 가능)
 * - "길게 누르기" 또는 "빠르게 두 번 탭"하면 3가지 색상 스와치가 아래로
 *   슬라이드되며 등장 — 새 색을 고르면 그 색이 다음부터의 새 기본 색이 됨
 * - fade-in/out 애니메이션, 바깥 클릭 시 부모(ReadingReviewPassage)에서 unmount 처리
 * - AI 튜터 기능은 여기 없음 (우측 통합 아이콘 바의 AI 튜터로 일원화)
 */
export function SelectionActionPopover({
  x,
  y,
  onUnderline,
  onHighlight,
  onDictionary,
}: SelectionActionPopoverProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

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
  }, [x, y, activePanel]);

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
      </div>

      {/* 색상 스와치 서브패널 — 슬라이드다운 (길게 누르기/더블탭 시에만 등장) */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: activePanel ? 48 : 0,
          opacity: activePanel ? 1 : 0,
          marginTop: activePanel ? 6 : 0,
        }}
      >
        {activePanel === 'underline' && (
          <ColorSwatchRow colors={UNDERLINE_COLORS} current={defaultUnderline} onPick={pickUnderlineColor} />
        )}
        {activePanel === 'highlight' && (
          <ColorSwatchRow colors={HIGHLIGHT_COLORS} current={defaultHighlight} onPick={pickHighlightColor} />
        )}
      </div>
    </div>,
    document.body
  );
}
