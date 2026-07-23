import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';

/** 펜 색상 3종 */
const PEN_COLORS = [
  { key: 'red', value: '#ef4444' },
  { key: 'blue', value: '#3b82f6' },
  { key: 'black', value: '#1f2937' },
];

/** 펜 두께 3종 */
const PEN_WIDTHS = [
  { key: 'thin', value: 2 },
  { key: 'medium', value: 4 },
  { key: 'thick', value: 8 },
];

interface DrawingOverlayProps {
  onClose: () => void;
}

/**
 * 전체 화면 필기(펜) 오버레이.
 * - 순수 Canvas API 사용 (외부 라이브러리 없음, 용량 가벼움)
 * - 색 3종 + 두께 3종 + 전체 지우기 + 닫기
 * - 그린 내용은 닫으면 사라짐 (임시 메모용)
 */
export function DrawingOverlay({ onClose }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(PEN_COLORS[0].value);
  const [width, setWidth] = useState(PEN_WIDTHS[1].value);
  const colorRef = useRef(color);
  const widthRef = useRef(width);
  colorRef.current = color;
  widthRef.current = width;

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

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      drawingRef.current = true;
      lastPosRef.current = getPos(e);
      try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ }
      // 점 찍기
      const p = lastPosRef.current;
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = widthRef.current;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.1, p.y + 0.1);
      ctx.stroke();
    };
    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current || !lastPosRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = widthRef.current;
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPosRef.current = pos;
    };
    const onUp = () => {
      drawingRef.current = false;
      lastPosRef.current = null;
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

  return createPortal(
    <div className="fixed inset-0 z-[110]" style={{ touchAction: 'none' }}>
      {/* 그리기 캔버스 — 배경은 투명, 지문 위에 바로 필기 가능 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: 'crosshair', touchAction: 'none' }}
      />

      {/* 상단 툴 바: 색 3종 + 두께 3종 + 전체 지우기 + 닫기 */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-3 py-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {PEN_COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => setColor(c.value)}
            className={`w-6 h-6 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
              color === c.value
                ? 'border-gray-700 dark:border-gray-200 ring-2 ring-offset-1 ring-gray-400'
                : 'border-white dark:border-gray-800 ring-1 ring-gray-200 dark:ring-gray-600'
            }`}
            style={{ backgroundColor: c.value }}
            title={c.key}
          />
        ))}

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

        {PEN_WIDTHS.map((w) => (
          <button
            key={w.key}
            onClick={() => setWidth(w.value)}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
              width === w.value
                ? 'bg-[#1e6b73] text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={`두께 ${w.key}`}
          >
            <span
              className={`rounded-full ${width === w.value ? 'bg-white' : 'bg-gray-600 dark:bg-gray-300'}`}
              style={{ width: w.value + 2, height: w.value + 2 }}
            />
          </button>
        ))}

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

        <button
          onClick={clearAll}
          className="flex items-center justify-center w-7 h-7 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="전체 지우기"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="필기 닫기"
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
}
