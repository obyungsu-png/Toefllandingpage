import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eraser, Globe } from 'lucide-react';
import { WordPopup } from './WordPopup';
import { SelectionActionPopover, AiTutorAction } from './SelectionActionPopover';
import { saveHighlight, loadHighlights, deleteAllHighlights, Highlight } from '../utils/readingHighlights';

/** 선택 팝오버가 뜨기 위한 최소 선택 길이 (공백 제외 글자 수) */
const MIN_SELECTION_LENGTH = 2;

/** 밑줄/하이라이트 기본 색상 (색상 선택 UI 없이 고정) */
const UNDERLINE_COLOR = '#1e6b73';
const HIGHLIGHT_COLOR = '#fff3a3';

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
function applyHighlightToRange(range: Range, type: 'h' | 'u', color: string) {
  const selectedText = range.toString();
  if (!selectedText) return;

  const mark = document.createElement(type === 'h' ? 'mark' : 'u');
  if (type === 'h') {
    mark.style.backgroundColor = color;
    mark.style.textDecoration = 'none';
  } else {
    mark.style.backgroundColor = 'transparent';
    mark.style.textDecoration = 'underline';
    mark.style.textDecorationColor = color;
    mark.style.textDecorationThickness = '2px';
  }

  try {
    range.surroundContents(mark);
  } catch {
    const contents = range.extractContents();
    mark.appendChild(contents);
    range.insertNode(mark);
  }
}

/**
 * 저장된 하이라이트를 DOM에 복원 — 저장된 색상 정보가 없으므로 type별 기본 색상 사용
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
          if (h.type === 'h') {
            mark.style.backgroundColor = HIGHLIGHT_COLOR;
            mark.style.textDecoration = 'none';
          } else {
            mark.style.backgroundColor = 'transparent';
            mark.style.textDecoration = 'underline';
            mark.style.textDecorationColor = UNDERLINE_COLOR;
            mark.style.textDecorationThickness = '2px';
          }

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

const AI_TUTOR_PROMPTS: Record<AiTutorAction, (text: string) => string> = {
  explain: (t) => `다음 표현을 자세히 설명해줘: "${t}"`,
  translate: (t) => `다음 문장을 자연스럽게 직독직해 번역해줘: "${t}"`,
  analyze: (t) => `다음 문장의 구문(주어/동사/구조)을 분석해줘: "${t}"`,
  rewrite: (t) => `다음 문장을 문법 교정하고 더 쉬운 영어로 다시 써줘: "${t}"`,
};

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
  /** Tools(설정) 드롭다운 표시 여부 — 지우기 / 언어전환. 기본 true, 부모의 Tools 버튼으로 토글 */
  toolsOpen?: boolean;
  /** AI 튜터에게 보낼 프롬프트가 준비되면 호출 — 부모가 ToeflAiWidget을 열고 자동 전송하도록 연결 */
  onAiTutorRequest?: (prompt: string) => void;
}

/**
 * 리딩 리뷰 모드용 지문 컴포넌트
 * - 텍스트를 드래그하면(mouseup/touchend) 선택 영역 위에 플로팅 팝오버가 나타남
 *   (밑줄 / 하이라이트 / 사전 / AI 튜터), 2글자 미만 선택은 무시
 * - 다른 곳 클릭 시 팝오버가 부드럽게 사라짐
 * - Tools 드롭다운(지우기, 언어전환)은 상단 Tools 버튼으로 별도 토글
 * - Supabase에 하이라이트 저장/로드 (수강권 필요)
 */
export function ReadingReviewPassage({
  passageText,
  testId,
  passageKey,
  className = '',
  maxHeight = '70vh',
  children,
  toolsOpen = true,
  onAiTutorRequest,
}: ReadingReviewPassageProps) {
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [dictionaryData, setDictionaryData] = useState<{ word: string; context: string; x: number; y: number } | null>(null);
  const [selectionPopover, setSelectionPopover] = useState<{ text: string; x: number; y: number } | null>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);

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

  const closeSelectionPopover = useCallback(() => {
    setSelectionPopover(null);
    selectionRangeRef.current = null;
  }, []);

  // 드래그 종료(mouseup/touchend) 시에만 팝오버 표시 — 2글자 미만은 무시
  const handleSelectionEnd = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      closeSelectionPopover();
      return;
    }

    const selectedText = selection.toString();
    const trimmed = selectedText.trim();
    if (trimmed.replace(/\s+/g, '').length < MIN_SELECTION_LENGTH) {
      closeSelectionPopover();
      return;
    }

    // 선택 영역이 지문 컨테이너 안에 있는지 확인
    if (!passageRef.current || !passageRef.current.contains(selection.anchorNode)) {
      return;
    }

    const range = selection.getRangeAt(0);
    selectionRangeRef.current = range.cloneRange();
    const rect = range.getBoundingClientRect();

    setSelectionPopover({
      text: trimmed,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  // 지문 바깥(빈 곳) 클릭 시 팝오버 소리 없이 닫기
  useEffect(() => {
    if (!selectionPopover) return;
    const handleOutsideClick = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        closeSelectionPopover();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectionPopover, closeSelectionPopover]);

  const applyAndSave = (type: 'h' | 'u') => {
    const range = selectionRangeRef.current;
    if (!range) return;
    const selectedText = range.toString();
    if (!selectedText) return;

    const startOffset = passageContent.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;
    if (startOffset === -1) return;

    applyHighlightToRange(range, type, type === 'h' ? HIGHLIGHT_COLOR : UNDERLINE_COLOR);

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

    window.getSelection()?.removeAllRanges();
    closeSelectionPopover();
  };

  const handleDictionary = () => {
    if (!selectionPopover) return;
    setDictionaryData({
      word: selectionPopover.text,
      context: passageContent,
      x: selectionPopover.x,
      y: selectionPopover.y + 50,
    });
    window.getSelection()?.removeAllRanges();
    closeSelectionPopover();
  };

  const handleAiTutorAction = (action: AiTutorAction) => {
    if (!selectionPopover) return;
    const prompt = AI_TUTOR_PROMPTS[action](selectionPopover.text);
    onAiTutorRequest?.(prompt);
    window.getSelection()?.removeAllRanges();
    closeSelectionPopover();
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative">
        {/* Tools 드롭다운 — 지우기 / 언어전환 (상단 Tools 버튼으로 토글) */}
        {toolsOpen && (
          <div className="absolute -top-2 right-2 z-10 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md px-2 py-1.5 -translate-y-full">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="모든 밑줄/하이라이트 지우기"
            >
              <Eraser size={14} />
              <span>지우기</span>
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
            <button
              onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="사전 언어 전환"
            >
              <Globe size={14} />
              <span className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200'}`}>EN</span>
              <span className={`px-1.5 py-0.5 rounded ${language === 'ko' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200'}`}>KO</span>
            </button>
          </div>
        )}
        <div
          ref={passageRef}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 overflow-y-auto select-text"
          style={{ maxHeight }}
          onMouseUp={handleSelectionEnd}
          onTouchEnd={handleSelectionEnd}
        >
          {children ? (
            children
          ) : (
            <p className="text-sm md:text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
              {passageContent || '지문을 불러올 수 없습니다.'}
            </p>
          )}
        </div>
      </div>

      {selectionPopover && (
        <SelectionActionPopover
          x={selectionPopover.x}
          y={selectionPopover.y}
          onUnderline={() => applyAndSave('u')}
          onHighlight={() => applyAndSave('h')}
          onDictionary={handleDictionary}
          onAiTutorAction={handleAiTutorAction}
        />
      )}

      {dictionaryData && (
        <WordPopup
          word={dictionaryData.word}
          context={dictionaryData.context}
          language={language}
          x={dictionaryData.x}
          y={dictionaryData.y}
          onClose={() => setDictionaryData(null)}
        />
      )}
    </div>
  );
}
