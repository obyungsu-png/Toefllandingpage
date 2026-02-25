import { useState, useRef } from 'react';

interface ResizableReadingLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  zoom?: number;
  onWheel?: (e: React.WheelEvent) => void;
  showDivider?: boolean;
  leftPadding?: string;
}

export function ResizableReadingLayout({ 
  leftContent, 
  rightContent, 
  zoom = 1,
  onWheel,
  showDivider = true,
  leftPadding = 'p-4'
}: ResizableReadingLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    if (!showDivider) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !showDivider) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    // Limit width between 300px and container width - 400px
    if (newWidth >= 300 && newWidth <= containerRect.width - 400) {
      setLeftWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`flex items-start justify-center ${showDivider ? 'gap-0' : 'gap-12'}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left side - Passage */}
      <div className="flex-shrink-0" style={showDivider ? { width: `${leftWidth}px` } : {}}>
        <div className="h-[540px] overflow-hidden bg-white" onWheel={onWheel}>
          <div className={`${leftPadding} h-full overflow-y-auto scrollbar-thin`}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.1s' }}>
              {leftContent}
            </div>
          </div>
        </div>
      </div>

      {/* Draggable divider */}
      {showDivider && (
        <div 
          className="w-1 h-[540px] cursor-col-resize hover:bg-gray-200 transition-colors flex items-center justify-center group"
          onMouseDown={handleMouseDown}
          style={{ userSelect: 'none' }}
        >
          <div className="w-[1px] h-8 bg-gray-200 rounded-full group-hover:bg-gray-400"></div>
        </div>
      )}

      {/* Right side - Question */}
      <div className={`flex-1 max-w-xl ${showDivider ? 'px-6' : ''}`}>
        <div className="h-[540px] overflow-y-auto scrollbar-thin">
          {rightContent}
        </div>
      </div>
    </div>
  );
}