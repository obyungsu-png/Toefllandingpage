import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Bookmark, Check } from 'lucide-react';

// Module-level cache to persist mobile tab state across component remounts
// (inline component definitions in App.tsx cause remounts on parent state changes)
let _mobileTabCache: 'passage' | 'questions' = 'passage';

interface ResizableReadingLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  zoom?: number;
  onWheel?: (e: React.WheelEvent) => void;
  showDivider?: boolean;
  leftPadding?: string;
  /** Title shown above the reading layout (e.g., "Read a notice.") */
  passageTitle?: string;
  /** Brief summary shown in collapsed passage header on questions tab */
  passageSummary?: React.ReactNode;
  /** Callback when user presses back on mobile */
  onBack?: () => void;
  /** Callback when user submits on mobile */
  onSubmit?: () => void;
  /** Callback to go to next question */
  onNext?: () => void;
  /** Callback to go to previous question */
  onPrev?: () => void;
  /** Question info like "1/2" */
  questionInfo?: string;
  /** 왼쪽 지문 영역 초기 너비 (px). 기본 600. Daily Life 등에서 넓게 설정. */
  initialLeftWidth?: number;
}

export function ResizableReadingLayout({
  leftContent,
  rightContent,
  zoom = 1,
  onWheel,
  showDivider = true,
  leftPadding = 'p-4',
  passageTitle,
  passageSummary,
  onBack,
  onSubmit,
  onNext,
  onPrev,
  questionInfo,
  initialLeftWidth = 600,
}: ResizableReadingLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobileTabState, setMobileTabState] = useState<'passage' | 'questions'>(_mobileTabCache);
  const mobileTab = mobileTabState;
  const setMobileTab = (tab: 'passage' | 'questions') => {
    _mobileTabCache = tab;
    setMobileTabState(tab);
  };
  const [passageExpanded, setPassageExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setWindowWidth(window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Timer for questions tab
  useEffect(() => {
    if (!isMobile || mobileTab !== 'questions') return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isMobile, mobileTab]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleMouseDown = () => {
    if (!showDivider) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !showDivider) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    // Limit width between 280px and container width - 380px (양쪽으로 약간 더 넓게)
    if (newWidth >= 280 && newWidth <= containerRect.width - 380) {
      setLeftWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile tab-based layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full relative">
        {/* Mobile Tab Header — back arrow removed, just Passage/Questions tabs */}
        <div className="flex items-center border-b border-gray-200 bg-white sticky top-0 z-10 px-1">
          <button 
            onClick={() => { setMobileTab('passage'); setPassageExpanded(false); }}
            className={`flex-1 py-3 text-center text-base font-bold transition-colors ${
              mobileTab === 'passage' 
                ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]' 
                : 'text-gray-400'
            }`}
          >
            Passage
          </button>
          <button 
            onClick={() => setMobileTab('questions')}
            className={`flex-1 py-3 text-center text-base font-bold transition-colors ${
              mobileTab === 'questions' 
                ? 'text-[#1e6b73] border-b-2 border-[#1e6b73]' 
                : 'text-gray-400'
            }`}
          >
            Questions
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white scrollbar-thin pb-4">
          {mobileTab === 'passage' ? (
            /* Passage View - larger text */
            <div className="p-4">
              {passageTitle && (
                <h2 className="text-2xl font-bold text-black mb-4 font-['Inter',_sans-serif]">
                  {passageTitle}
                </h2>
              )}
              <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.1s' }}>
                {leftContent}
              </div>
            </div>
          ) : (
            /* Questions View */
            <div className="p-4">
              {/* Collapsed/Expandable passage area - no border on mobile */}
              {(passageSummary || leftContent) && (
                <div className="mb-3">
                  {!passageExpanded ? (
                    /* Collapsed summary - no border */
                    <div 
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer"
                      onClick={() => setPassageExpanded(true)}
                    >
                      <div className="text-base text-gray-700 font-['Inter',_sans-serif] line-clamp-2">
                        {passageSummary}
                      </div>
                    </div>
                  ) : (
                    /* Expanded: show full passage content - no border, no background */
                    <div className="mobile-expanded-passage max-h-[50vh] overflow-y-auto scrollbar-thin">
                      <div className="text-base text-gray-800 font-['Inter',_sans-serif]">
                        {leftContent}
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => setPassageExpanded(!passageExpanded)}
                    className="flex items-center gap-1 text-[#1e6b73] text-sm mt-1.5 ml-auto"
                  >
                    {passageExpanded ? 'Collapse' : 'Expand'}
                    {passageExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Question info */}
              {questionInfo && (
                <div className="text-[#1e6b73] text-lg font-bold mb-2 font-['Inter',_sans-serif]">
                  {questionInfo}
                </div>
              )}

              {/* Question content */}
              {rightContent}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop side-by-side layout (unchanged)
  return (
    <div
      ref={containerRef}
      className={`flex flex-col md:flex-row items-start justify-center h-full ${showDivider ? 'gap-0' : 'gap-2 md:gap-8'}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left side - Passage */}
      <div className="w-full md:flex-shrink-0" style={showDivider ? { width: windowWidth < 768 ? '100%' : `${leftWidth}px` } : {}}>
        <div className="h-[50vh] md:h-[540px] overflow-hidden bg-white" onWheel={onWheel}>
          <div className={`p-2 md:p-3 h-full overflow-y-auto scrollbar-thin`}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.1s' }}>
              {leftContent}
            </div>
          </div>
        </div>
      </div>

      {/* Draggable divider */}
      {showDivider && (
        <div
          className="hidden md:flex w-1 h-[540px] cursor-col-resize hover:bg-gray-200 transition-colors items-center justify-center group"
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        >
          <div className="w-[1px] h-8 bg-gray-200 rounded-full group-hover:bg-gray-400"></div>
        </div>
      )}

      {/* Right side - Question */}
      <div className={`w-full md:flex-1 md:max-w-2xl mt-4 md:mt-0 ${showDivider ? 'px-2 md:px-4' : ''}`}>
        <div className="h-[40vh] md:h-[540px] overflow-y-auto scrollbar-thin">
          {rightContent}
        </div>
      </div>
    </div>
  );
}