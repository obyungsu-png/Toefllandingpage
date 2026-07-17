import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WordPopup } from './WordPopup';
import { SelectionActionPopover } from './SelectionActionPopover';
import { saveHighlight, loadHighlights, deleteAllHighlights, Highlight } from '../utils/readingHighlights';

/** 선택 팝오버가 뜨기 위한 최소 선택 길이 (공백 제외 글자 수) */
const MIN_SELECTION_LENGTH = 2;

/** 색상 정보가 없는 예전 하이라이트를 위한 타입별 기본 색상 (하위 호환용) */
const DEFAULT_HIGHLIGHT_COLOR = '#fff3a3';
const DEFAULT_UNDERLINE_COLOR = '#1e6b73';

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
 * 컨테이너 내 특정 텍스트 노드+오프셋의 "절대 문자 위치"를 정확히 계산.
 * (기존 passageContent.indexOf(selectedText) 방식은 같은 단어가 지문에
 *  여러 번 나오면 항상 첫 번째 위치를 반환해 잘못된 곳에 하이라이트가
 *  중복 적용되는 버그가 있었음 — TreeWalker로 실제 선택 위치를 정확히 계산)
 */
function getOffsetWithinContainer(container: Node, targetNode: Node, targetOffset: number): number {
  let offset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node === targetNode) {
      return offset + targetOffset;
    }
    offset += node.nodeValue?.length || 0;
  }
  return offset;
}

/**
 * 지문 컨테이너에서 기존 밑줄/하이라이트(mark, u) 태그를 모두 제거해
 * 순수 텍스트 상태로 되돌림. restoreHighlights를 멱등적으로 만들기 위해 사용.
 */
function stripMarks(el: HTMLElement) {
  el.querySelectorAll('mark, u').forEach((node) => {
    const parent = node.parentNode;
    if (!parent) return;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
    parent.normalize();
  });
}

/**
 * 저장된 하이라이트를 DOM에 복원.
 * - 항상 기존 mark/u 태그를 먼저 모두 제거한 뒤 처음부터 다시 그려서
 *   (멱등적으로) 매번 동일한 결과가 나오도록 함 — 이게 없으면 highlights
 *   상태가 바뀔 때마다 이미 그려진 하이라이트가 중복으로 다시 적용되어
 *   "두 군데 밑줄"이 생기는 버그가 있었음.
 * - 색상 정보가 없는 예전 데이터는 타입별 기본 색상으로 대체.
 */
function restoreHighlights(passageEl: HTMLElement, highlights: Highlight[]) {
  stripMarks(passageEl);
  if (!highlights.length) return;

  // 다크모드 감지 — 하이라이트된 텍스트가 다크 배경에서 보이도록 색상 조정
  const isDark = document.documentElement.classList.contains('dark');

  highlights.forEach(h => {
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

          const color = h.color || (h.type === 'h' ? DEFAULT_HIGHLIGHT_COLOR : DEFAULT_UNDERLINE_COLOR);
          const mark = document.createElement(h.type === 'h' ? 'mark' : 'u');
          if (h.type === 'h') {
            mark.style.backgroundColor = color;
            mark.style.textDecoration = 'none';
            // 다크모드에서 밝은 하이라이트 배경 위의 텍스트가 보이도록 어두운 색상 적용
            if (isDark) {
              mark.style.color = '#1a1a1a';
            }
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
  /** Tools(설정) 드롭다운 표시 여부 — 지우기 / 언어전환. 기본 true, 부모의 Tools 버튼으로 토글 */
  toolsOpen?: boolean;
  /** 단어 뜻 언어 (부모에서 관리) */
  language?: 'en' | 'ko';
  /** 언어 전환 콜백 (부모에서 관리) */
  onLanguageChange?: (lang: 'en' | 'ko') => void;
  /** 모두 지우기 콜백 (부모에서 관리) */
  onClearAll?: () => void;
  /** 부모에서 "지우기" 버튼 클릭 시 증가시키는 카운터 — 변경되면 내부 handleClearAll 호출 */
  clearTrigger?: number;
}

/**
 * 리딩 리뷰 모드용 지문 컴포넌트
 * - 텍스트를 드래그하면(mouseup/touchend) 선택 영역 위에 플로팅 팝오버가 나타남
 *   (밑줄 / 하이라이트 / 사전, 각각 3가지 색상 선택 가능), 2글자 미만 선택은 무시
 * - 다른 곳 클릭 시 팝오버가 부드럽게 사라짐
 * - Tools 드롭다운(지우기, 언어전환)은 상단 Tools 버튼으로 별도 토글
 * - Supabase에 하이라이트 저장/로드 (수강권 필요)
 * - AI 튜터 기능은 여기 없음 — 우측 통합 아이콘 바(ReviewAssistantPanel)의
 *   AI 튜터 버튼으로 일원화되어 화면에 AI 튜터 패널이 중복으로 뜨지 않음
 */
export function ReadingReviewPassage({
  passageText,
  testId,
  passageKey,
  className = '',
  maxHeight = '70vh',
  children,
  toolsOpen = true,
  language: languageProp,
  onLanguageChange,
  onClearAll,
  clearTrigger,
}: ReadingReviewPassageProps) {
  // 부모에서 language를 관리하지 않으면 내부 상태 사용 (하위 호환)
  const [internalLanguage, setInternalLanguage] = useState<'en' | 'ko'>('en');
  const language = languageProp ?? internalLanguage;
  const setLanguage = onLanguageChange ?? setInternalLanguage;
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

  // 하이라이트가 로드/변경되면 DOM에 복원 (항상 초기화 후 재적용 — 멱등적)
  useEffect(() => {
    if (!passageRef.current) return;
    restoreHighlights(passageRef.current, highlights);
  }, [highlights, passageContent]);

  // 모든 하이라이트 지우기
  const handleClearAll = async () => {
    await deleteAllHighlights(testId, passageKey);
    setHighlights([]);
    if (passageRef.current) {
      stripMarks(passageRef.current);
    }
  };

  // 부모에서 clearTrigger 변경 시 자동 호출
  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      handleClearAll();
    }
  }, [clearTrigger]);

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

  const applyAndSave = (type: 'h' | 'u', color: string) => {
    const range = selectionRangeRef.current;
    if (!range || !passageRef.current) return;
    const selectedText = range.toString();
    if (!selectedText) return;

    const startOffset = getOffsetWithinContainer(passageRef.current, range.startContainer, range.startOffset);
    const endOffset = getOffsetWithinContainer(passageRef.current, range.endContainer, range.endOffset);
    if (endOffset <= startOffset) return;

    // 낙관적으로 로컬 상태에 먼저 추가 → restoreHighlights 이펙트가 (기존 것을 지우고)
    // 전체를 한 번에 다시 그림. 이 한 경로로만 그리기 때문에 중복 하이라이트가
    // 생길 여지가 없음.
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setHighlights(prev => [...prev, {
      id: tempId,
      test_id: testId,
      passage_key: passageKey,
      start_offset: startOffset,
      end_offset: endOffset,
      type,
      color,
      expires_at: '',
    }]);

    window.getSelection()?.removeAllRanges();
    closeSelectionPopover();

    saveHighlight({
      test_id: testId,
      passage_key: passageKey,
      start_offset: startOffset,
      end_offset: endOffset,
      type,
      color,
    }).then(id => {
      if (!id) return;
      setHighlights(prev => prev.map(h => (h.id === tempId ? { ...h, id } : h)));
    });
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

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative">
        {/* 지우기/EN-KO는 부모 헤더의 ReadingReviewActions로 이동 — 여기서 제거 */}
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
          onUnderline={(color) => applyAndSave('u', color)}
          onHighlight={(color) => applyAndSave('h', color)}
          onDictionary={handleDictionary}
          showAiTutor={true}
          selectedText={selectionPopover.text}
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
          onLanguageChange={setLanguage}
        />
      )}
    </div>
  );
}
