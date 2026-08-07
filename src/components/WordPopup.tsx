import { useState, useEffect, useRef, useMemo } from 'react';
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

/**
 * 사전 검색용 정규화 — 대소문자·구두점·문장 부호 무시.
 * "Running," "RUNNING." "running" 모두 동일 키로 취급되어야 함.
 * NFKC 로 유니코드 호환 문자 정규화 후 소문자화 + 구두점/따옴표 제거.
 */
function normalizeLookupWord(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  try { s = s.normalize('NFKC'); } catch { /* ignore */ }
  s = s.toLowerCase();
  // 문장 끝 구두점, 스마트 따옴표, 따옴표, 괄호 등 제거 — 알파벳/공백/'/− 만 유지
  s = s.replace(/[^a-z0-9가-힣\s'\-]/g, '').trim();
  return s;
}

export function WordPopup({ word, context, language, x, y, onClose, onLanguageChange }: WordPopupProps) {
  const [loading, setLoading] = useState(true);
  const [definitions, setDefinitions] = useState<WordDefinition[]>([]);
  const [translation, setTranslation] = useState<WordTranslation | null>(null);
  const [error, setError] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  // 조회용 정규화된 단어 — 대소문자 무관 매칭 보장 (특히 EN 영영 사전).
  const normalized = useMemo(() => normalizeLookupWord(word), [word]);
  const displayWord = normalized || word.trim();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setDefinitions([]);
    setTranslation(null);

    if (!normalized) {
      setError(true);
      setLoading(false);
      return;
    }

    const isPhrase = normalized.includes(' ');
    // 정규화된 단어로 사전 + 번역을 병렬 조회.
    // - EN 모드: 사전(영영 정의) + 번역(한글 뜻) 둘 다 표시 → 사용자에게 더 유용.
    // - KO 모드: 번역만 표시.
    const transPromise = translateWord(normalized, context);
    const dictPromise = (language === 'en' && !isPhrase)
      ? getWordDefinitions(normalized)
      : Promise.resolve<WordDefinition[]>([]);

    // 번역 도착 시 즉시 표시 (Google 번역은 보통 200~500ms).
    transPromise.then((trans) => {
      if (cancelled) return;
      if (trans) {
        setTranslation(trans);
        setLoading(false);
      }
    });

    // 사전 정의 도착 시 표시 (번역과 함께 노출).
    dictPromise.then((defs) => {
      if (cancelled) return;
      if (defs.length > 0) {
        setDefinitions(defs);
        setLoading(false);
      }
    });

    Promise.allSettled([transPromise, dictPromise]).then(([tr, dr]) => {
      if (cancelled) return;
      const trans = tr.status === 'fulfilled' ? tr.value : null;
      const defs = dr.status === 'fulfilled' ? dr.value : [];
      if (!trans && defs.length === 0) {
        setError(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [normalized, language, context]);

  // 팝업 위치 조정 (화면 경계 + AI 튜터 위젯 영역 회피)
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;
      if (x + rect.width > window.innerWidth - 20) {
        newX = Math.max(20, window.innerWidth - rect.width - 20);
      }
      if (y + rect.height > window.innerHeight - 20) {
        newY = Math.max(20, y - rect.height - 40);
      }
      const isMobile = window.innerWidth < 768;
      const fabSize = 56;
      const fabRight = 24;
      const fabBottom = isMobile ? 64 : 24;
      const fabLeft = window.innerWidth - fabRight - fabSize;
      const fabTop = window.innerHeight - fabBottom - fabSize;
      const pad = 8;
      const overlapX = newX + rect.width > fabLeft - pad;
      const overlapY = newY + rect.height > fabTop - pad;
      if (overlapX && overlapY) {
        newY = Math.max(20, fabTop - rect.height - pad);
      }
      setAdjustedPos({ x: Math.max(20, newX), y: Math.max(20, newY) });
    }
  }, [x, y, loading]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const hasDefs = definitions.length > 0;
  const hasTrans = !!translation;

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md"
      style={{ left: adjustedPos.x, top: adjustedPos.y, minWidth: 320 }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{displayWord}</span>
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

      {/* 내용 — EN 모드에서는 한글 뜻 + 영영 정의 함께 노출, KO 모드에서는 한글 뜻만 */}
      {loading && !hasDefs && !hasTrans ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-[#1e6b73] rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">검색 중...</span>
        </div>
      ) : error && !hasDefs && !hasTrans ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">이 단어의 정의를 찾을 수 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {/* 한글 뜻 (있으면 항상 상단 노출) */}
          {hasTrans && (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-[#1e6b73] dark:text-[#4fd1c5] uppercase tracking-wide">뜻</span>
                <span className="text-base font-semibold text-[#1e6b73] dark:text-[#4fd1c5]">
                  {translation?.koreanMeaning}
                </span>
              </div>
              {translation?.englishExplanation && translation.englishExplanation !== displayWord && (
                <p className="text-xs text-gray-600 dark:text-gray-300 italic pl-6">
                  {translation.englishExplanation}
                </p>
              )}
            </div>
          )}

          {/* 영영 사전 정의 (EN 모드) — 한글 뜻 아래에 함께 표시 */}
          {hasDefs && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                English Definitions
              </div>
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
        </div>
      )}
    </div>,
    document.body
  );
}
