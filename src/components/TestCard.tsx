import { useState } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { TPOTest } from './ContentManagement';

interface TestCardProps {
  number: number;
  onStartTest: (section: string) => void;
  isLocked?: boolean;
  onUnlockClick?: () => void;
  testData?: TPOTest;
  customTitle?: string; // Custom title for the card
}

export function TestCard({ number, onStartTest, isLocked = false, onUnlockClick, testData, customTitle }: TestCardProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const hoverBgClass = 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] shadow-md';
  const defaultBgClass = 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100';
  const buttonHoverClass = 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md transform scale-105';

  const handleSectionClick = (section: string) => {
    if (isLocked && onUnlockClick) {
      onUnlockClick();
    } else {
      onStartTest(section);
    }
  };

  // Check if section has content
  const getSectionQuestionCount = (sectionType: string): number => {
    if (!testData) return 0;
    const section = testData.sections.find(s => s.sectionType === sectionType);
    return section ? section.questions.length : 0;
  };

  const renderSectionRow = (sectionName: string, sectionType: 'Reading' | 'Listening' | 'Writing' | 'Speaking', isLast: boolean = false) => {
    const questionCount = getSectionQuestionCount(sectionType);
    const hasContent = questionCount > 0;

    return (
      <div 
        className={`h-16 sm:h-18 md:h-20 relative ${isLast ? 'rounded-b-[12px]' : 'rounded-[8px]'} shrink-0 w-full cursor-pointer transition-all duration-300 ${
          hoveredSection === sectionName.toLowerCase() ? hoverBgClass : defaultBgClass
        }`}
        onMouseEnter={() => setHoveredSection(sectionName.toLowerCase())}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div className="relative size-full">
          <div className="box-border flex h-full items-center justify-between px-3 sm:px-4 relative w-full">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[14px] sm:text-[15px] md:text-[16px] tracking-wide">
                <p>{sectionName}</p>
              </div>
              {hasContent && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-[10px] sm:text-xs font-medium">{questionCount}Q</span>
                </div>
              )}
            </div>
            <div 
              className={`flex items-center justify-center h-[26px] sm:h-[28px] md:h-[30px] rounded-[13px] sm:rounded-[14px] md:rounded-[15px] w-16 sm:w-18 md:w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                hoveredSection === sectionName.toLowerCase() ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
              }`}
              onClick={() => handleSectionClick(sectionType)}
            >
              <p className="font-['Inter',_sans-serif] font-bold text-[10px] sm:text-[11px] md:text-[12px] text-center">Start Test</p>
            </div>
            {!isLast && <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 right-3" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`bg-white rounded-[12px] shadow-lg border border-gray-200 !w-full max-w-none transition-all duration-300 relative ${
        isLocked ? 'opacity-75' : 'transform hover:scale-105 hover:shadow-xl'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 rounded-[12px]">
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          
          {isHovered && (
            <button
              onClick={onUnlockClick}
              className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white px-6 py-3 rounded-full font-bold shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Unlock Now
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c] h-12 sm:h-14 md:h-16 rounded-t-[12px] shadow-md flex items-center px-3 sm:px-4">
        <p className="font-['Inter',_sans-serif] text-white text-lg sm:text-xl md:text-2xl font-bold tracking-wide">{customTitle || `Test ${number}`}</p>
      </div>

      {/* Reading Section */}
      {renderSectionRow('Reading', 'Reading')}

      {/* Listening Section */}
      {renderSectionRow('Listening', 'Listening')}

      {/* Writing Section */}
      {renderSectionRow('Writing', 'Writing')}

      {/* Speaking Section */}
      {renderSectionRow('Speaking', 'Speaking', true)}
    </div>
  );
}