import { Highlighter, Underline, Eraser, Globe, Search } from 'lucide-react';
import { useState } from 'react';

interface ReadingReviewToolbarProps {
  activeTool: 'highlight' | 'underline' | null;
  /** 현재 선택된 색상 (하이라이트/밑줄용). 미지정 시 기본값 사용 */
  activeColor?: string;
  onToolChange: (tool: 'highlight' | 'underline' | null, color?: string) => void;
  onClearAll: () => void;
  language: 'en' | 'ko';
  onLanguageChange: (lang: 'en' | 'ko') => void;
  /** 단어 검색 콜백 — 입력 후 Enter 시 호출 */
  onWordSearch?: (word: string) => void;
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
  onWordSearch,
}: ReadingReviewToolbarProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    const word = searchInput.trim();
    if (word && onWordSearch) {
      onWordSearch(word);
      setSearchInput('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      {/* 하이라이트 색상 3종 */}
      <div className="flex items-center gap-1">
        <Highlighter size={14} className="text-gray-500" />
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onToolChange('highlight', color.value)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              activeTool === 'highlight' && activeColor === color.value
                ? 'border-gray-700 scale-110'
                : 'border-gray-300 hover:scale-105'
            }`}
            style={{ backgroundColor: color.value }}
            title={`하이라이트 ${color.name}`}
            aria-label={`하이라이트 ${color.name}`}
          />
        ))}
      </div>

      {/* 밑줄 색상 3종 */}
      <div className="flex items-center gap-1">
        <Underline size={14} className="text-gray-500" />
        {UNDERLINE_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onToolChange('underline', color.value)}
            className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
              activeTool === 'underline' && activeColor === color.value
                ? 'border-gray-700 scale-110'
                : 'border-gray-300 hover:scale-105'
            }`}
            style={{ backgroundColor: color.value }}
            title={`밑줄 ${color.name}`}
            aria-label={`밑줄 ${color.name}`}
          >
            <span className="text-white text-[10px] font-bold">U</span>
          </button>
        ))}
      </div>

      {/* 지우개 버튼 */}
      <button
        onClick={onClearAll}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        title="모두 지우기"
      >
        <Eraser size={14} />
        <span className="hidden sm:inline">지우기</span>
      </button>

      {/* 구분선 */}
      <div className="w-px h-5 bg-gray-200 mx-1"></div>

      {/* 언어 토글 */}
      <button
        onClick={() => onLanguageChange(language === 'en' ? 'ko' : 'en')}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        title="단어 뜻 언어 전환"
      >
        <Globe size={14} />
        <span className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200'}`}>EN</span>
        <span className="text-gray-300">|</span>
        <span className={`px-1.5 py-0.5 rounded ${language === 'ko' ? 'bg-[#1e6b73] text-white' : 'bg-gray-200'}`}>KO</span>
      </button>

      {/* 단어 검색 (onWordSearch가 전달된 경우에만 표시) */}
      {onWordSearch && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <div className="flex items-center gap-1">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="단어 검색"
              className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#1e6b73] w-32"
            />
          </div>
        </>
      )}
    </div>
  );
}
