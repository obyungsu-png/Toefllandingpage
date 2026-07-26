import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Eraser, MoreHorizontal } from 'lucide-react';

/** 펜 색상 5종 (빨강/파랑/검정 + 흰색/살색) */
const PEN_COLORS = [
  { key: 'red', value: '#ef4444', label: '빨강' },
  { key: 'blue', value: '#3b82f6', label: '파랑' },
  { key: 'black', value: '#1f2937', label: '검정' },
  { key: 'white', value: '#ffffff', label: '흰색' },
  { key: 'skin', value: '#fdbcb4', label: '살색' },
];

/** 대표 펜 두께 3종 (하이브리드 방식: 기본 버튼 + 슬라이더) */
const PEN_WIDTHS = [
  { key: 'thin', value: 2, label: '얇게' },
  { key: 'medium', value: 5, label: '중간' },
  { key: 'thick', value: 10, label: '두껍게' },
];

const MIN_WIDTH = 1;
const MAX_WIDTH = 30;

type Tool = 'pen' | 'eraser';

interface DrawingOverlayProps {
  onClose: () => void;
}

/**
 * 전체 화면 필기(펜) 오버레이.
 * - 순수 Canvas API 사용 (외부 라이브러리 없음, 용량 가벼움)
 * - 색 5종 + 두께 하이브리드(대표 버튼 + 슬라이더) + 지우개 모드 + 전체 지우기 + 닫기
 * - 그린 내용은 닫으면 사라짐 (임시 메모용)
 */
export function DrawingOverlay({ onClose }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(PEN_COLORS[0].value);
  const [width, setWidth] = useState(PEN_WIDTHS[1].value);
  const [tool, setTool] = useState<Tool>('pen');
  const [showSlider, setShowSlider] = useState(false);
  const colorRef = useRef(color);
  const widthRef = useRef(width);
  const toolRef = useRef(tool);
  colorRef.current = color;
  widthRef.current = width;
  toolRef.current = tool;

  // 캔버스 초기화 (DPR 대응)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // 포인터 이벤트로 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const applyStrokeStyle = () => {
      if (toolRef.current === 'eraser') {
        // 지우개 모드: destination-out 합성으로 그린 부분만 투명하게 지움
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = widthRef.current * 2.5; // 지우개는 더 굵게
      } else {
        // 펜 모드: 일반 그리기
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth = widthRef.current;
      }
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      drawingRef.current = true;
      lastPosRef.current = getPos(e);
      try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ }
      applyStrokeStyle();
      // 점 찍기
      const p = lastPosRef.current;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.1, p.y + 0.1);
      ctx.stroke();
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current || !lastPosRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      applyStrokeStyle();
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPosRef.current = pos;
    };
    const onUp = () => {
      drawingRef.current = false;
      lastPosRef.current = null;
      // 그리기 종료 후 합성 모드 리셋
      ctx.globalCompositeOperation = 'source-over';
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const clearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 대표 두께 버튼에 표시할 선 미리보기 컴포넌트
  const WidthPreview = ({ value, active }: { value: number; active: boolean }) => (
    <div
      className="rounded-full transition-all"
      style={{
        width: value + 3,
        height: value + 3,
        backgroundColor: active ? '#ffffff' : '#9ca3af',
      }}
    />
  );

  return createPortal(
    <div className="fixed inset-0 z-[110]" style={{ touchAction: 'none' }}>
      {/* 그리기 캔버스 — 배경은 투명, 지문 위에 바로 필기 가능 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          touchAction: 'none',
        }}
      />

      {/* 상단 툴바: 색 5종 + 두께(하이브리드) + 지우개 + 전체 지우기 + 닫기 */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-3 py-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 색상 5종 */}
        {PEN_COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => { setColor(c.value); setTool('pen'); }}
            className={`w-6 h-6 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
              color === c.value && tool === 'pen'
                ? 'border-gray-700 dark:border-gray-200 ring-2 ring-offset-1 ring-gray-400'
                : 'border-gray-300 dark:border-gray-600 ring-1 ring-gray-200 dark:ring-gray-600'
            }`}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

        {/* 두께 — 하이브리드 방식: 대표 버튼 3종 + 더보기(슬라이더) */}
        {PEN_WIDTHS.map((w) => (
          <button
            key={w.key}
            onClick={() => setWidth(w.value)}
            className={`flex items-center justify-center w-8 h-7 rounded-full transition-colors ${
              width === w.value && !showSlider
                ? 'bg-[#1e6b73] '
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={w.label}
          >
            <WidthPreview value={w.value} active={width === w.value && !showSlider} />
          </button>
        ))}

        {/* 더보기(...) 버튼 → 슬라이더 토글 */}
        <button
          onClick={() => setShowSlider((s) => !s)}
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
            showSlider
              ? 'bg-[#1e6b73] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="두께 미세 조절"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* 슬라이더 팝업 (더보기 활성 시) */}
        {showSlider && (
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-full">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 w-3 text-center">
              {width}
            </span>
            <input
              type="range"
              min={MIN_WIDTH}
              max={MAX_WIDTH}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-20 h-1 accent-[#1e6b73]"
              title={`두께 ${width}px`}
            />
            {/* 실시간 미리보기 선 */}
            <div
              className="rounded-full bg-gray-600 dark:bg-gray-300"
              style={{ width: Math.min(width + 4, 24), height: Math.min(width + 4, 24) }}
            />
          </div>
        )}

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

        {/* 지우개 모드 (개별 선 지우기) */}
        <button
          onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
            tool === 'eraser'
              ? 'bg-[#e67e22] text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={tool === 'eraser' ? '지우개 활성 (다시 클릭 시 펜으로)' : '지우개 모드'}
        >
          <Eraser size={16} />
        </button>

        {/* 전체 지우기 */}
        <button
          onClick={clearAll}
          className="flex items-center justify-center w-7 h-7 rounded-full text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="전체 지우기"
        >
          <Trash2 size={16} />
        </button>

        {/* 닫기 */}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="필기 닫기"
        >
          <X size={16} />
        </button>
      </div>

      {/* 하단 안내 (지우개 모드일 때만) */}
      {tool === 'eraser' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#e67e22] text-white text-xs rounded-full shadow-lg">
          지우개 모드 — 지울 부분을 드래그하세요
        </div>
      )}
    </div>,
    document.body
  );
}
