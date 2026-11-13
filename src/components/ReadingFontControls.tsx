import { useReadingFontScale, setReadingFontScale } from '../utils/readingFontScale';

/**
 * 리딩 지문/문제 글자 크기 조절 버튼 — "+" 와 "−" 만 표시.
 * Question 헤더("Question 27 of 35") 오른쪽에 배치한다.
 */
export function ReadingFontControls() {
  const scale = useReadingFontScale();
  return (
    <div className="sm:hidden flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => setReadingFontScale(scale - 0.1)}
        className="h-7 min-w-7 px-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="글자 크기 줄이기"
      >
        −
      </button>
      <button
        onClick={() => setReadingFontScale(scale + 0.1)}
        className="h-7 min-w-7 px-1.5 rounded border border-[#1e6b73] text-sm font-bold text-[#1e6b73] hover:bg-[#eef4f3]"
        aria-label="글자 크기 키우기"
      >
        +
      </button>
    </div>
  );
}
