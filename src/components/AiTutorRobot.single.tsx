import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react';

/* =========================================================================
 * AI 튜터 3D 로봇 — 단일 파일 버전
 *
 * 원래 3개 파일을 하나로 합친 것:
 *   - AiTutorRobot.tsx   (로봇 컴포넌트)
 *   - AiTutorRobot.css   (스타일/애니메이션 → 아래 문자열로 인라인)
 *   - useDraggableFab.ts (드래그 훅)
 *
 * 의존성: React만 필요. 이미지·외부 라이브러리 없음.
 * 사용법:
 *   import AiTutorRobot, { useDraggableFab } from './AiTutorRobot.single';
 *
 *   const fab = useDraggableFab<HTMLDivElement>();
 *   <div ref={fab.boxRef} style={fab.style}>
 *     <button {...fab.handlers} onClick={() => { if (fab.consumeDrag()) return; openChat(); }}
 *       className={`aibot-btn ${fab.dragging ? 'aibot-dragging' : ''}`}>
 *       <AiTutorRobot size={62} />
 *     </button>
 *   </div>
 * ========================================================================= */

/* ===== 1) CSS (원래 AiTutorRobot.css) ===== */
const AIBOT_CSS = `
.aibot { position: relative; display: block; }
.aibot-still { pointer-events: none; }
.aibot-scene {
  position: absolute; left: 47%; top: 63%;
  transform-style: preserve-3d;
  transform: scale(var(--aibot-scale, 1)) rotateX(-10deg) rotateY(32deg);
}
.aibot-part, .aibot-anim, .aibot-cube { position: absolute; transform-style: preserve-3d; }
.aibot-anim { position: relative; display: block; }
.aibot-look {
  position: relative; display: block; transform-style: preserve-3d;
  transform: rotateY(var(--aibot-yaw, 0deg)) rotateX(var(--aibot-pitch, 9deg));
  transition: transform 0.45s cubic-bezier(0.3, 0.7, 0.3, 1);
}
.aibot-f { position: absolute; box-sizing: border-box; backface-visibility: hidden; }

.aibot-gray .aibot-ft { background: linear-gradient(180deg, #f2f4f6, #e0e4e9); }
.aibot-gray .aibot-bk { background: #c9ced5; }
.aibot-gray .aibot-lf { background: linear-gradient(180deg, #b9c0c9, #9ea6b1); }
.aibot-gray .aibot-rt { background: #d4d9df; }
.aibot-gray .aibot-tp { background: #fafbfc; }
.aibot-gray .aibot-bt { background: #9aa2ad; }
.aibot-hand .aibot-ft { background: #d3d8df; }
.aibot-hand .aibot-bk, .aibot-hand .aibot-rt { background: #c2c8d0; }
.aibot-hand .aibot-lf { background: #a2aab4; }
.aibot-hand .aibot-tp { background: #eceff3; }
.aibot-hand .aibot-bt { background: #8f97a3; }
.aibot-dark .aibot-ft, .aibot-dark .aibot-bk, .aibot-dark .aibot-rt { background: #6b737f; }
.aibot-dark .aibot-lf { background: #535a65; }
.aibot-dark .aibot-tp { background: #7c8591; }
.aibot-dark .aibot-bt { background: #444a53; }
.aibot-laptop .aibot-ft { background: linear-gradient(160deg, #7a838e, #5f6873); }
.aibot-laptop .aibot-bk { background: #262a31; }
.aibot-laptop .aibot-lf { background: #4f5762; }
.aibot-laptop .aibot-rt { background: #69727d; }
.aibot-laptop .aibot-tp { background: #858d98; }
.aibot-laptop .aibot-bt { background: #4a515b; }

.aibot-screen {
  position: absolute; inset: 12%; border-radius: 18%;
  background: #14161c; box-shadow: inset 0 0 0 2px #2a2e38;
  display: flex; align-items: center; justify-content: center; gap: 22%;
}
.aibot-eye { width: 16%; aspect-ratio: 1; background: #fff; transform: rotate(45deg); animation: aibot-blink 4.2s infinite; }
.aibot-brand {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: #fff; font: 800 7px/1 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: -0.15px; white-space: nowrap;
}
.aibot-keys { position: absolute; inset: 18% 12%; display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; }
.aibot-keys i { background: #5d6671; border-radius: 1px; animation: aibot-key 0.6s steps(1) infinite; }
.aibot-keys i:nth-child(3n) { animation-delay: 0.2s; }
.aibot-keys i:nth-child(4n) { animation-delay: 0.4s; }

.aibot-handL { animation: aibot-type 0.36s ease-in-out infinite; }
.aibot-handR { animation: aibot-type 0.36s ease-in-out infinite; animation-delay: 0.18s; }
.aibot-armL { animation: aibot-arm 0.36s ease-in-out infinite; }
.aibot-armR { animation: aibot-arm 0.36s ease-in-out infinite; animation-delay: 0.18s; }
.aibot-head { animation: aibot-bob 1.44s ease-in-out infinite; }
.aibot-lid { transform: rotateX(-12deg); }

@keyframes aibot-type { 0%, 100% { transform: translateY(0); } 45% { transform: translateY(-7px); } }
@keyframes aibot-arm { 0%, 100% { transform: rotateX(0); } 45% { transform: rotateX(13deg); } }
@keyframes aibot-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
@keyframes aibot-blink { 0%, 94%, 100% { transform: scaleY(1) rotate(45deg); } 96% { transform: scaleY(0.12) rotate(45deg); } }
@keyframes aibot-key { 0% { background: #5d6671; } 50% { background: #eef2f7; } }

.aibot-still .aibot-handL, .aibot-still .aibot-handR, .aibot-still .aibot-armL, .aibot-still .aibot-armR,
.aibot-still .aibot-head, .aibot-still .aibot-eye, .aibot-still .aibot-keys i { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .aibot-look { transition: none; }
  .aibot-handL, .aibot-handR, .aibot-armL, .aibot-armR, .aibot-head, .aibot-eye, .aibot-keys i { animation: none; }
}

.aibot-btn {
  width: 62px; height: 62px; padding: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border: 0; background: none; border-radius: 12px;
  transition: transform 0.15s ease;
}
.aibot-btn:hover { transform: translateY(-2px); }
.aibot-btn { touch-action: none; }
.aibot-dragging, .aibot-dragging:hover { cursor: grabbing; transform: scale(1.06); }
.aibot-btn:active { transform: scale(0.96); }
.aibot-btn:focus-visible { outline: 2px solid #2f4a8a; outline-offset: 2px; }
.aibot-avatar { width: 38px; height: 38px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
`;

// CSS는 모듈 최초 import 시 한 번만 주입 (여러 번 불려도 중복 방지)
if (typeof document !== 'undefined' && !document.querySelector('[data-aibot-robot]')) {
  const style = document.createElement('style');
  style.setAttribute('data-aibot-robot', '1');
  style.textContent = AIBOT_CSS;
  document.head.appendChild(style);
}

/* ===== 2) 로봇 컴포넌트 (원래 AiTutorRobot.tsx) ===== */
type Variant = 'gray' | 'hand' | 'dark' | 'laptop';
type Vec = [number, number, number];

function Cube({ v, w, h, d, ft, tp }: { v: Variant; w: number; h: number; d: number; ft?: ReactNode; tp?: ReactNode }) {
  const face = (cls: string, fw: number, fh: number, transform: string, children?: ReactNode) => (
    <span className={`aibot-f ${cls}`} style={{ width: fw, height: fh, left: (w - fw) / 2, top: (h - fh) / 2, transform }}>
      {children}
    </span>
  );
  return (
    <span className={`aibot-cube aibot-${v}`} style={{ width: w, height: h, left: -w / 2, top: -h / 2 }}>
      {face('aibot-ft', w, h, `translateZ(${d / 2}px)`, ft)}
      {face('aibot-bk', w, h, `rotateY(180deg) translateZ(${d / 2}px)`)}
      {face('aibot-rt', d, h, `rotateY(90deg) translateZ(${w / 2}px)`)}
      {face('aibot-lf', d, h, `rotateY(-90deg) translateZ(${w / 2}px)`)}
      {face('aibot-tp', w, d, `rotateX(90deg) translateZ(${h / 2}px)`, tp)}
      {face('aibot-bt', w, d, `rotateX(-90deg) translateZ(${h / 2}px)`)}
    </span>
  );
}

function Part({ at: [x, y, z], rot = '', anim, origin, children }: { at: Vec; rot?: string; anim?: string; origin?: string; children: ReactNode }) {
  return (
    <span className="aibot-part" style={{ transform: `translate3d(${x}px,${y}px,${z}px) ${rot}` }}>
      <span className={`aibot-anim ${anim || ''}`} style={origin ? { transformOrigin: origin } : undefined}>
        {children}
      </span>
    </span>
  );
}

function Arm({ from, to, anim }: { from: Vec; to: Vec; anim?: string }) {
  const [dx, dy, dz] = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.hypot(dx, dy, dz);
  const yaw = (Math.atan2(dx, dz) * 180) / Math.PI;
  const pitch = (Math.atan2(-dy, Math.hypot(dx, dz)) * 180) / Math.PI;
  const mid: Vec = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  return (
    <Part at={mid} rot={`rotateY(${yaw}deg) rotateX(${pitch}deg)`} anim={anim} origin={`50% 50% ${-len / 2}px`}>
      <Cube v="gray" w={8} h={8} d={len} />
    </Part>
  );
}

const FACE = (
  <span className="aibot-screen">
    <span className="aibot-eye" />
    <span className="aibot-eye" />
  </span>
);

const LID_BACK = <span className="aibot-brand">AllMyExam</span>;

const KEYS = (
  <span className="aibot-keys">
    {Array.from({ length: 18 }, (_, i) => <i key={i} />)}
  </span>
);

const LAPTOP: Vec = [0, 10, 28];
const BASE = { w: 42, h: 3, d: 26 };
const LID = { w: 42, h: 28, d: 3 };
const KEY_Y = LAPTOP[1] - BASE.h / 2;
const SHOULDER_X = 22;
const ELBOW: Vec = [SHOULDER_X, 4, 6];
const HAND_L: Vec = [-9, KEY_Y - 4, LAPTOP[2] - 3];
const HAND_R: Vec = [9, KEY_Y - 4, LAPTOP[2] - 3];

export function AiTutorRobot({ size = 62, still = false }: { size?: number; still?: boolean }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const sceneStyle = { '--aibot-scale': size / 112 } as CSSProperties;

  useEffect(() => {
    const el = rootRef.current;
    if (still || !el || !window.matchMedia?.('(hover: hover)').matches) return;
    let timer = 0;
    const reset = () => {
      window.clearTimeout(timer);
      el.style.removeProperty('--aibot-yaw');
      el.style.removeProperty('--aibot-pitch');
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      el.style.setProperty('--aibot-yaw', `${-15 + nx * 45}deg`);
      el.style.setProperty('--aibot-pitch', `${8 - ny * 22}deg`);
      window.clearTimeout(timer);
      timer = window.setTimeout(reset, 1200);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', reset);
    return () => {
      reset();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', reset);
    };
  }, [still]);

  return (
    <span ref={rootRef} className={`aibot ${still ? 'aibot-still' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <span className="aibot-scene" style={sceneStyle}>
        <Part at={[-8, 24, 1]}><Cube v="gray" w={15} h={12} d={16} /></Part>
        <Part at={[8, 24, 1]}><Cube v="gray" w={15} h={12} d={16} /></Part>
        <Part at={[0, 3, 0]}><Cube v="gray" w={36} h={30} d={26} /></Part>
        <Part at={[0, -15, 0]}><Cube v="dark" w={14} h={6} d={14} /></Part>
        <Part at={[0, -38, 0]} anim="aibot-head">
          <span className="aibot-look"><Cube v="gray" w={54} h={42} d={44} ft={FACE} /></span>
        </Part>
        <Arm from={[-SHOULDER_X, -8, 2]} to={[-ELBOW[0], ELBOW[1], ELBOW[2]]} />
        <Arm from={[SHOULDER_X, -8, 2]} to={ELBOW} />
        <Part at={LAPTOP}><Cube v="laptop" w={BASE.w} h={BASE.h} d={BASE.d} tp={KEYS} /></Part>
        <Part at={[LAPTOP[0], KEY_Y - LID.h / 2, LAPTOP[2] + BASE.d / 2 - LID.d / 2]} anim="aibot-lid" origin={`0 ${LID.h / 2}px`}>
          <Cube v="laptop" w={LID.w} h={LID.h} d={LID.d} ft={LID_BACK} />
        </Part>
        <Arm from={[-ELBOW[0], ELBOW[1], ELBOW[2]]} to={HAND_L} anim="aibot-armL" />
        <Arm from={ELBOW} to={HAND_R} anim="aibot-armR" />
        <Part at={HAND_L} anim="aibot-handL"><Cube v="hand" w={11} h={7} d={11} /></Part>
        <Part at={HAND_R} anim="aibot-handR"><Cube v="hand" w={11} h={7} d={11} /></Part>
      </span>
    </span>
  );
}

/* ===== 3) 드래그 훅 (원래 useDraggableFab.ts) ===== */
const STORAGE_KEY = 'aiTutorFabPos';
const MARGIN = 4;
const DRAG_THRESHOLD = 5;

type Pos = { right: number; bottom: number };

function loadPos(): Pos | null {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (v && Number.isFinite(v.right) && Number.isFinite(v.bottom)) return { right: v.right, bottom: v.bottom };
  } catch {
    // 저장소를 못 쓰면 기본 위치
  }
  return null;
}

function savePos(p: Pos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // 저장 못 해도 이번 화면에서는 옮긴 자리에 둔다
  }
}

function clampPos(p: Pos, w: number, h: number): Pos {
  const maxRight = Math.max(MARGIN, window.innerWidth - w - MARGIN);
  const maxBottom = Math.max(MARGIN, window.innerHeight - h - MARGIN);
  return {
    right: Math.round(Math.min(Math.max(p.right, MARGIN), maxRight)),
    bottom: Math.round(Math.min(Math.max(p.bottom, MARGIN), maxBottom)),
  };
}

export function useDraggableFab<T extends HTMLElement>() {
  const boxRef = useRef<T>(null);
  const [pos, setPos] = useState<Pos | null>(loadPos);
  const [dragging, setDragging] = useState(false);
  const posRef = useRef(pos);
  const drag = useRef<{ x: number; y: number; start: Pos; w: number; h: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  const update = (p: Pos) => {
    posRef.current = p;
    setPos(p);
  };

  useEffect(() => {
    const fit = () => {
      const el = boxRef.current;
      const p = posRef.current;
      if (!el || !p) return;
      const r = el.getBoundingClientRect();
      const c = clampPos(p, r.width, r.height);
      if (c.right !== p.right || c.bottom !== p.bottom) update(c);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    justDragged.current = false;
    if (e.button !== 0 || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      start: { right: window.innerWidth - r.right, bottom: window.innerHeight - r.bottom },
      w: r.width,
      h: r.height,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      setDragging(true);
    }
    update(clampPos({ right: d.start.right - dx, bottom: d.start.bottom - dy }, d.w, d.h));
  };

  const onPointerEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    justDragged.current = true;
    setDragging(false);
    if (posRef.current) savePos(posRef.current);
  };

  const consumeDrag = () => {
    const was = justDragged.current;
    justDragged.current = false;
    return was;
  };

  const style: CSSProperties | undefined = pos ? { right: pos.right, bottom: pos.bottom, left: 'auto', top: 'auto' } : undefined;

  return {
    boxRef,
    style,
    dragging,
    consumeDrag,
    handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
  };
}

export default AiTutorRobot;