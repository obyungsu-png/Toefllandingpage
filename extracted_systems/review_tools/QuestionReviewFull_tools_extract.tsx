/**
 * ── QuestionReviewFull.tsx 내 Review Tools 관련 핵심 로직 ──
 * 
 * 원본 파일: src/components/QuestionReviewFull.tsx (약 1900줄)
 * 
 * 이 파일은 View Results 페이지에서 하이라이트/밑줄/단어 팝업 도구를
 * 구동하는 핵심 상태와 핸들러만 추출한 것입니다.
 */

import { useState, useRef } from 'react';
import { ReadingReviewToolbar } from './ReadingReviewToolbar';
import { WordPopup } from './WordPopup';
import { saveHighlight, loadHighlights, deleteAllHighlights, Highlight } from '../utils/readingHighlights';

// ── Tools + 다크모드 상태 ──
const [activeTool, setActiveTool] = useState<'highlight' | 'underline' | null>(null);
const [activeColor, setActiveColor] = useState<string>('#fff3a3');
const [toolsOpen, setToolsOpen] = useState(false);
const [darkMode, setDarkMode] = useState(false);
const [language, setLanguage] = useState<'en' | 'ko'>(() => {
  return (localStorage.getItem('wordLookupLanguage') as 'en' | 'ko') || 'en';
});
const [popupData, setPopupData] = useState<{ word: string; context?: string; x: number; y: number } | null>(null);
const [highlights, setHighlights] = useState<Highlight[]>([]);
const passageRef = useRef<HTMLDivElement | null>(null);

// ── 단어 뜻 언어 전환 ──
const handleLanguageChange = (lang: 'en' | 'ko') => {
  setLanguage(lang);
  localStorage.setItem('wordLookupLanguage', lang);
};

// ── 툴 + 색상 변경 ──
const handleToolChange = (tool: 'highlight' | 'underline' | null, color?: string) => {
  setActiveTool(tool);
  if (color) setActiveColor(color);
};

// ── 하이라이트/밑줄 모두 지우기 ──
const handleClearAllHighlights = async () => {
  setActiveTool(null);
  // DOM에서 <mark>, <u> 제거
  if (passageRef.current) {
    const marks = passageRef.current.querySelectorAll('mark, u');
    marks.forEach(m => {
      const parent = m.parentNode;
      if (parent) {
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
        parent.normalize();
      }
    });
  }
  // Supabase에서 삭제
  if (currentTestId && currentPassageKey) {
    await deleteAllHighlights(currentTestId, currentPassageKey);
  }
  setHighlights([]);
};

// ── 지문 mouseup 핸들러 (하이라이트/밑줄/단어팝업) ──
const handlePassageMouseUp = async (
  e: React.MouseEvent,
  passageText: string,
  testId: string,
  passageKey: string
) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  const range = selection.getRangeAt(0);
  const words = selectedText.split(/\s+/);

  if (activeTool) {
    // 하이라이트/밑줄 적용
    const type = activeTool === 'highlight' ? 'h' : 'u';
    const passageContent = parsePassageContent(passageText);
    const startOffset = passageContent.indexOf(selectedText);

    // DOM에 항상 적용
    applyHighlightToRange(range, type, activeColor);

    // Supabase 저장 (offset 찾은 경우만)
    if (startOffset !== -1) {
      const endOffset = startOffset + selectedText.length;
      await saveHighlight({
        test_id: testId,
        passage_key: passageKey,
        start_offset: startOffset,
        end_offset: endOffset,
        type,
      });
    }
    selection.removeAllRanges();
  } else if (words.length === 1) {
    // 단어 팝업
    const passageContent = parsePassageContent(passageText);
    setPopupData({
      word: selectedText,
      context: passageContent,
      x: e.clientX,
      y: e.clientY + 20,
    });
    selection.removeAllRanges();
  }
};

// ── Tools 툴바 + 다크모드 토글 렌더링 (Q pills와 같은 줄) ──
{activeSection === 'Reading' && (
  <>
    <button onClick={() => setToolsOpen(!toolsOpen)} className={...}>Tools</button>
    <button onClick={() => setDarkMode(!darkMode)} className={...}>
      {darkMode ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  </>
)}

// 하위 도구 모음 (Tools 열렸을 때 별도 줄에 표시)
{toolsOpen && (
  <ReadingReviewToolbar
    activeTool={activeTool}
    activeColor={activeColor}
    onToolChange={handleToolChange}
    onClearAll={handleClearAllHighlights}
    language={language}
    onLanguageChange={handleLanguageChange}
  />
)}

// WordPopup (createPortal로 document.body에 렌더링)
{popupData && (
  <WordPopup
    word={popupData.word}
    context={popupData.context}
    language={language}
    x={popupData.x}
    y={popupData.y}
    onClose={() => setPopupData(null)}
  />
)}