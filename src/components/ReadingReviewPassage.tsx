import React, { useState, useRef, useEffect } from 'react';
import { ReadingReviewToolbar } from './ReadingReviewToolbar';
import { WordPopup } from './WordPopup';
import { saveHighlight, loadHighlights, deleteAllHighlights, Highlight } from '../utils/readingHighlights';

/**
 * CMS 지문 텍스트 파싱 — JSON 템플릿인 경우 본문 추출
 */
function parsePassageContent(rawPassage: string | null | undefined): string {
  if (!rawPassage) return '';
  try {
    const parsed = JSON.parse(rawPassage);
    if (parsed.fields?.body) return parsed.fields.body;
    if (parsed.passage) return parsed.passage;
    return rawPassage;
  } catch {
    return rawPassage;
  }
}

/**
 * 하이라이트/밑줄을 DOM Range에 적용
 */
function applyHighlightToRange(range: Range, type: 'h' | 'u') {
  const selectedText = range.toString();
  if (!selectedText) return;

  const mark = document.createElement(type === 'h' ? 'mark' : 'u');
  mark.style.backgroundColor = type === 'h' ? '#fff3a3' : 'transparent';
  mark.style.textDecoration = type === 'u' ? 'underline' : 'none';
  mark.style.textDecorationColor = type === 'u' ? '#1e6b73' : '';
  mark.style.textDecorationThickness = type === 'u' ? '2px' : '';

  try {
    range.surroundContents(mark);
  } catch {
    const contents = range.extractContents();
    mark.appendChild(contents);
    range.insertNode(mark);
  }
}

/**
 * 저장된 하이라이트를 DOM에 복원
 */
function restoreHighlights(passageEl: HTMLElement, highlights: Highlight[], passageText: string) {
  if (!highlights.length) return;

  highlights.forEach(h => {
    if (h.end_offset > passageText.length) return;

    const walker = document.createTreeWalker(passageEl, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    let currentOffset = 0;

    while ((node = walker.nextNode() as Text | null)) {
      const nodeText = node.nodeValue || '';
      const relativeStart = h.start_offset - currentOffset;
      const relativeEnd = h.end_offset - currentOffset;

      if (relativeStart >= 0 && relativeEnd <= nodeText.length && relativeEnd > 0) {
        try {
          const range = document.createRange();
          range.setStart(node, relativeStart);
          range.setEnd(node, relativeEnd);

          const mark = document.createElement(h.type === 'h' ? 'mark' : 'u');
          mark.style.backgroundColor = h.type === 'h' ? '#fff3a3' : 'transparent';
          mark.style.textDecoration = h.type === 'u' ? 'underline' : 'none';
          mark.style.textDecorationColor = h.type === 'u' ? '#1e6b73' : '';
          mark.style.textDecorationThickness = h.type === 'u' ? '2px' : '';

          try {
            range.surroundContents(mark);
          } catch {
            const contents = range.extractContents();
            mark.appendChild(contents);
            range.insertNode(mark);
          }
          break;
        } catch {
          break;
        }
      }
      currentOffset += nodeText.length;
    }
  });
}

interface ReadingReviewPassageProps {
  /** CMS 원본 passageText (JSON 템플릿 가능) */
  passageText: string;
  /** Supabase 저장용 테스트 ID (예: 'tpo-1-reading') */
  testId: string;
  /** Supabase 저장용 지문 키 (예: 'reading-m1-academic1') */
  passageKey: string;
  /** 추가 클래스 */
  className?: string;
  /** 최대 높이 (기본값: '70vh') */
  maxHeight?: string;
  /** 커스텀 렌더링 (구조화된 지문 — email/notice 등). 미제공 시 passageText를 plain text로 표시 */
  children?: React.ReactNode;
}

/**
 * 리딩 리뷰 모드용 지문 컴포넌트
 * - 하이라이트 / 밑줄 / 지우기 / 단어 뜻(EN/KO) 기능 포함
 * - Supabase에 하이라이트 저장/로드 (수강권 필요)
 * - QuestionReviewFull.tsx와 동일한 로직 사용
 */
export function ReadingReviewPassage({
  passageText,
  testId,
  passageKey,
  className = '',
  maxHeight = '70vh',
  children,
}: ReadingReviewPassageProps) {
  const [activeTool, setActiveTool] = useState<'highlight' | 'underline' | null>(null);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [popupData, setPopupData] = useState<{ word: string; context: string; x: number; y: number } | null>(null);
  const passageRef = useRef<HTMLDivElement>(null);

  const passageContent = parsePassageContent(passageText);

  // Supabase에서 하이라이트 로드
  useEffect(() => {
    if (!testId || !passageKey) return;

    let cancelled = false;
    loadHighlights(testId, passageKey)
      .then(loaded => {
        if (!cancelled) setHighlights(loaded);
      })
      .catch(() => {
        if (!cancelled) setHighlights([]);
      });

    return () => { cancelled = true; };
  }, [testId, passageKey]);

  // 하이라이트가 로드/변경되면 DOM에 복원
  useEffect(() => {
    if (!passageRef.current) return;
    if (passageContent) {
      restoreHighlights(passageRef.current, highlights, passageContent);
    }
  }, [highlights, passageContent]);

  // 모든 하이라이트 지우기
  const handleClearAll = async () => {
    await deleteAllHighlights(testId, passageKey);
    setHighlights([]);
    // DOM에서 모든 mark/u 태그 제거
    if (passageRef.current) {
      passageRef.current.querySelectorAll('mark, u').forEach(el => {
        const parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
        parent.normalize();
      });
    }
  };

  // 텍스트 선택 처리
  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const words = selectedText.split(/\s+/);

    if (activeTool) {
      // 하이라이트/밑줄 적용
      const type = activeTool === 'highlight' ? 'h' : 'u';

      const startOffset = passageContent.indexOf(selectedText);
      const endOffset = startOffset + selectedText.length;

      if (startOffset === -1) {
        selection.removeAllRanges();
        return;
      }

      applyHighlightToRange(range, type);

      // Supabase에 저장
      saveHighlight({
        test_id: testId,
        passage_key: passageKey,
        start_offset: startOffset,
        end_offset: endOffset,
        type,
      }).then(id => {
        setHighlights(prev => [...prev, {
          id: id || undefined,
          test_id: testId,
          passage_key: passageKey,
          start_offset: startOffset,
          end_offset: endOffset,
          type,
          expires_at: '',
        }]);
      });

      selection.removeAllRanges();
    } else if (words.length === 1) {
      // 단어 팝업 표시
      setPopupData({
        word: selectedText,
        context: passageContent,
        x: e.clientX,
        y: e.clientY,
      });
      selection.removeAllRanges();
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <ReadingReviewToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onClearAll={handleClearAll}
        language={language}
        onLanguageChange={setLanguage}
      />
      <div
        ref={passageRef}
        className="bg-gray-50 rounded-xl border border-gray-200 p-5 overflow-y-auto"
        style={{ maxHeight }}
        onMouseUp={handleMouseUp}
      >
        {children ? (
          children
        ) : (
          <p className="text-[15px] font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
            {passageContent || '지문을 불러올 수 없습니다.'}
          </p>
        )}
      </div>
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
    </div>
  );
}
