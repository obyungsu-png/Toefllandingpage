import { useEffect, useState } from 'react';

// 리딩 지문 글자 크기 배율 — 여러 화면(지문 뷰, Question 헤더의 +/− 버튼)이
// 동일한 값을 공유하도록 하는 모듈 스토어. localStorage 에 저장해 문제 간에도 유지.

type Listener = (scale: number) => void;

let scale = 1;
if (typeof window !== 'undefined') {
  const v = parseFloat(window.localStorage.getItem('readingFontScale') || '');
  if (Number.isFinite(v) && v >= 0.8 && v <= 2) scale = v;
}

const listeners = new Set<Listener>();

export function getReadingFontScale(): number {
  return scale;
}

export function setReadingFontScale(next: number): void {
  scale = Math.min(2, Math.max(0.8, Math.round(next * 10) / 10));
  try { window.localStorage.setItem('readingFontScale', String(scale)); } catch { /* ignore */ }
  listeners.forEach((l) => l(scale));
}

export function useReadingFontScale(): number {
  const [s, setS] = useState<number>(scale);
  useEffect(() => {
    listeners.add(setS);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}
