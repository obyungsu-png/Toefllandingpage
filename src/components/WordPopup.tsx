import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getWordDefinitions, WordDefinition } from '../utils/dictionaryApi';
import { translateWord, WordTranslation } from '../utils/wordTranslate';

interface WordPopupProps {
  word: string;
  context?: string;
  language: 'en' | 'ko';
  x: number;
  y: number;
  onClose: () => void;
  /** 팝업 안에서 EN/KO를 바로 전환할 수 있게 하는 콜백 (선택).
   *  제공되면 헤더에 작은 EN/KO 토글 버튼이 표시됨. */
  onLanguageChange?: (language: 'en' | 'ko') => void;
}

export function WordPopup({ word, context, language, x, y, onClose, onLanguageChange }: WordPopupProps) {
  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState<WordDefinition[]>([]);
  const [translation, setTranslation] = useState<WordTranslation | null>(null);
  const [error, setError] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setDefinitions([]);
    setTranslation(null);

    (async () => {
      const isPhrase = word.trim().includes(' ');
      if (language === 'en' && !isPhrase) {
        const defs = await getWordDefinitions(word);
        if (cancelled) return;
        if (defs.length === 0) setError(true);
        else setDefinitions(defs);
      } else {
        const trans = await translateWord(word, context);
        if (cancelled) return;
        if (!trans) setError(true);
        else setTranslation(trans);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [word, language, context]);

  // 팝업 위치 조정 (화면 경계 + AI 튜터 위젯 영역 회피)
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;
      // 오른쪽 경계 — 팝업이 오른쪽을 넘어가면 왼쪽으로 밀되, 단어 위치 근처 유지
      if (x + rect.width > window.innerWidth - 20) {
        newX = Math.max(20, window.innerWidth - rect.width - 20);
      }
      // 아래쪽 경계 — 위로 표시 (단어 위에 표시)
      if (y + rect.height > window.innerHeight - 20) {
        newY = Math.max(20, y - rect.height - 40);
      }
      // AI 튜터 FAB 위젯 영역 (우측 하단)과 겹치지 않도록 위로 밀어올림
      // FAB: right-6 (24px from right), bottom-16 mobile / bottom-6 desktop, 56x56px
      const isMobile = window.innerWidth < 768;
      const fabSize = 56;
      const fabRight = 24;
      const fabBottom = isMobile ? 64 : 24; // bottom-16 = 64px, bottom-6 = 24px
      const fabLeft = window.innerWidth - fabRight - fabSize;
      const fabTop = window.innerHeight - fabBottom - fabSize;
      const pad = 8;
      const overlapX = newX + rect.width > fabLeft - pad;
      const overlapY = newY + rect.height > fabTop - pad;
      if (overlapX && overlapY) {
        // 위로 밀어올림 — AI 튜터 FAB 위쪽에 표시
        newY = Math.max(20, fabTop - rect.height - pad);
      }
      setAdjustedPos({ x: Math.max(20, newX), y: Math.max(20, newY) });
    }
  }, [x, y, loading]);

  // 팝업 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // mouseup 이벤트 직후 바로 닫히는 것 방지 — 약간 지연
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md"
      style={{ left: adjustedPos.x, top: adjustedPos.y, minWidth: 300 }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{word}</span>
          {language === 'en' && definitions[0]?.phonetic && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{definitions[0].phonetic}</span>
          )}
          {translation?.partOfSpeech && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">{translation.partOfSpeech}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onLanguageChange && (
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  language === 'en'
                    ? 'bg-[#1e6b73] text-white'
                    : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ko')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  language === 'ko'
                    ? 'bg-[#1e6b73] text-white'
                    : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                KO
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* 내용 */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-[#1e6b73] rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">검색 중...</span>
        </div>
      ) : error ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">이 단어의 정의를 찾을 수 없습니다.</p>
      ) : translation ? (
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">뜻:</span>
            <span className="text-base font-semibold text-[#1e6b73] dark:text-[#4fd1c5]">{translation?.koreanMeaning}</span>
          </div>
          {translation?.englishExplanation && (
            <p className="text-xs text-gray-600 dark:text-gray-300 italic">{translation.englishExplanation}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {definitions.map((def, i) => (
            <div key={i} className="text-sm">
              <span className="text-xs text-gray-400 dark:text-gray-500 italic mr-1">{def.partOfSpeech}</span>
              <span className="text-gray-800 dark:text-gray-100">{def.definition}</span>
              {def.example && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5">"{def.example}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
