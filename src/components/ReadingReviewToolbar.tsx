import { Highlighter, Underline, Eraser, Globe } from 'lucide-react';

interface ReadingReviewToolbarProps {
  activeTool: 'highlight' | 'underline' | null;
  onToolChange: (tool: 'highlight' | 'underline' | null) => void;
  onClearAll: () => void;
  language: 'en' | 'ko';
  onLanguageChange: (lang: 'en' | 'ko') => void;
}

export function ReadingReviewToolbar({
  activeTool,
  onToolChange,
  onClearAll,
  language,
  onLanguageChange,
}: ReadingReviewToolbarProps) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
      {/* 하이라이트 버튼 */}
      <button
        onClick={() => onToolChange(activeTool === 'highlight' ? null : 'highlight')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
          activeTool === 'highlight'
            ? 'bg-yellow-300 text-yellow-900'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="하이라이트"
      >
        <Highlighter size={14} />
        <span className="hidden sm:inline">하이라이트</span>
      </button>

      {/* 밑줄 버튼 */}
      <button
        onClick={() => onToolChange(activeTool === 'underline' ? null : 'underline')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
          activeTool === 'underline'
            ? 'bg-blue-200 text-blue-900'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="밑줄"
      >
        <Underline size={14} />
        <span className="hidden sm:inline">밑줄</span>
      </button>

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
    </div>
  );
}
