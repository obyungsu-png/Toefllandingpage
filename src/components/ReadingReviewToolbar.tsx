import { Highlighter, Underline, Eraser, Globe } from 'lucide-react';

interface ReadingReviewToolbarProps {
  activeTool: 'highlight' | 'underline' | null;
  /** 현재 선택된 색상 (하이라이트/밑줄용). 미지정 시 기본값 사용 */
  activeColor?: string;
  onToolChange: (tool: 'highlight' | 'underline' | null, color?: string) => void;
  onClearAll: () => void;
  language: 'en' | 'ko';
  onLanguageChange: (lang: 'en' | 'ko') => void;
  /** true일 때만 색상 스와치만 렌더링 (지우기/EN-KO는 외부에서 별도 렌더링) */
  colorsOnly?: boolean;
}

// 하이라이트 색상 3종
export const HIGHLIGHT_COLORS = [
  { name: '노랑', value: '#fff3a3' },
  { name: '초록', value: '#c6f7c6' },
  { name: '핑크', value: '#ffd6e0' },
];

// 밑줄 색상 3종
export const UNDERLINE_COLORS = [
  { name: '파랑', value: '#1e6b73' },
  { name: '보라', value: '#7c3aed' },
  { name: '빨강', value: '#dc2626' },
];

export function ReadingReviewToolbar({
  activeTool,
  activeColor,
  onToolChange,
  onClearAll,
  language,
  onLanguageChange,
  colorsOnly = false,
}: ReadingReviewToolbarProps) {
  // 색상 스와치 전용 컴포넌트 — 외부에서 별도 배치 가능
  if (colorsOnly) {
    return (
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
        {/* 하이라이트 색상 3종 */}
        <div className="flex items-center gap-1">
          <Highlighter size={14} className="text-gray-500 dark:text-gray-400" />
          {HIGHLIGHT_COLORS.map((color) => {
            const isActive = activeTool === 'highlight' && activeColor === color.value;
            return (
              <button
                key={color.value}
                onClick={() => onToolChange(isActive ? null : 'highlight', color.value)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  isActive
                    ? 'border-gray-700 dark:border-gray-200 scale-110'
                    : 'border-gray-300 dark:border-gray-500 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={`하이라이트 ${color.name}${isActive ? ' (다시 누르면 해제)' : ''}`}
                aria-label={`하이라이트 ${color.name}`}
              />
            );
          })}
        </div>
        {/* 밑줄 색상 3종 */}
        <div className="flex items-center gap-1">
          <Underline size={14} className="text-gray-500 dark:text-gray-400" />
          {UNDERLINE_COLORS.map((color) => {
            const isActive = activeTool === 'underline' && activeColor === color.value;
            return (
              <button
                key={color.value}
                onClick={() => onToolChange(isActive ? null : 'underline', color.value)}
                className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
                  isActive
                    ? 'border-gray-700 dark:border-gray-200 scale-110'
                    : 'border-gray-300 dark:border-gray-500 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={`밑줄 ${color.name}${isActive ? ' (다시 누르면 해제)' : ''}`}
                aria-label={`밑줄 ${color.name}`}
              >
                <span className="text-white text-[10px] font-bold">U</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 기본: 전체 툴바 (색상 + 지우기 + EN/KO)
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
      {/* 하이라이트 색상 3종 — 다시 누르면 해제 (토글) */}
      <div className="flex items-center gap-1">
        <Highlighter size={14} className="text-gray-500 dark:text-gray-400" />
        {HIGHLIGHT_COLORS.map((color) => {
          const isActive = activeTool === 'highlight' && activeColor === color.value;
          return (
            <button
              key={color.value}
              onClick={() => onToolChange(isActive ? null : 'highlight', color.value)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                isActive
                  ? 'border-gray-700 dark:border-gray-200 scale-110'
                  : 'border-gray-300 dark:border-gray-500 hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={`하이라이트 ${color.name}${isActive ? ' (다시 누르면 해제)' : ''}`}
              aria-label={`하이라이트 ${color.name}`}
            />
          );
        })}
      </div>

      {/* 밑줄 색상 3종 — 다시 누르면 해제 (토글) */}
      <div className="flex items-center gap-1">
        <Underline size={14} className="text-gray-500 dark:text-gray-400" />
        {UNDERLINE_COLORS.map((color) => {
          const isActive = activeTool === 'underline' && activeColor === color.value;
          return (
            <button
              key={color.value}
              onClick={() => onToolChange(isActive ? null : 'underline', color.value)}
              className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
                isActive
                  ? 'border-gray-700 dark:border-gray-200 scale-110'
                  : 'border-gray-300 dark:border-gray-500 hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={`밑줄 ${color.name}${isActive ? ' (다시 누르면 해제)' : ''}`}
              aria-label={`밑줄 ${color.name}`}
            >
              <span className="text-white text-[10px] font-bold">U</span>
            </button>
          );
        })}
      </div>

      {/* 지우개 버튼 */}
      <button
        onClick={onClearAll}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        title="모두 지우기"
      >
        <Eraser size={14} />
        <span className="hidden sm:inline">지우기</span>
      </button>

      {/* 구분선 */}
      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>

      {/* 언어 토글 */}
      <button
        onClick={() => onLanguageChange(language === 'en' ? 'ko' : 'en')}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="단어 뜻 언어 전환"
      >
        <Globe size={14} />
        <span className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200'}`}>EN</span>
        <span className="text-gray-300 dark:text-gray-500">|</span>
        <span className={`px-1.5 py-0.5 rounded ${language === 'ko' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200'}`}>KO</span>
      </button>
    </div>
  );
}

/** 지우기 + EN/KO 액션 버튼 (다크모드 버튼 오른쪽에 배치용) */
export function ReadingReviewActions({
  onClearAll,
  language,
  onLanguageChange,
}: {
  onClearAll: () => void;
  language: 'en' | 'ko';
  onLanguageChange: (lang: 'en' | 'ko') => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 shadow-sm">
      {/* 지우개 버튼 */}
      <button
        onClick={onClearAll}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        title="모두 지우기"
      >
        <Eraser size={14} />
        <span className="hidden sm:inline">지우기</span>
      </button>
      {/* 구분선 */}
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600"></div>
      {/* 언어 토글 */}
      <button
        onClick={() => onLanguageChange(language === 'en' ? 'ko' : 'en')}
        className="flex items-center gap-1 px-1 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="단어 뜻 언어 전환"
      >
        <Globe size={14} />
        <span className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200'}`}>EN</span>
        <span className="text-gray-300 dark:text-gray-500">|</span>
        <span className={`px-1.5 py-0.5 rounded ${language === 'ko' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-gray-200'}`}>KO</span>
      </button>
    </div>
  );
}
