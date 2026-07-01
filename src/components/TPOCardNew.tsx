import { useState } from 'react';
import { Lock, CheckCircle2, CalendarDays } from 'lucide-react';
import { TPOTest } from './ContentManagement';

interface TPOCardProps {
  number: number;
  onStartTest: (section: string) => void;
  onContinueTest?: (section: string) => void;
  isLocked?: boolean;
  onUnlockClick?: () => void;
  testData?: TPOTest;
  bankType?: string;
}

export function TPOCard({ number, onStartTest, onContinueTest, isLocked = false, onUnlockClick, testData, bankType = 'tpo' }: TPOCardProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const dateMemo = testData?.dateMemo;

  const hoverBgClass = 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] shadow-md';
  const defaultBgClass = 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100';
  const buttonHoverClass = 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md transform scale-105';
  const continueHoverClass = 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white shadow-md transform scale-105';

  const handleSectionClick = (section: string) => {
    if (isLocked && onUnlockClick) {
      onUnlockClick();
    } else {
      localStorage.removeItem(`tpo_progress_${bankType}_${number}_${section}`);
      onStartTest(section);
    }
  };

  const handleContinueClick = (section: string) => {
    if (isLocked && onUnlockClick) {
      onUnlockClick();
      return;
    }
    const saved = localStorage.getItem(`tpo_progress_${bankType}_${number}_${section}`);
    if (!saved) {
      alert('저장된 진행 상황이 없습니다. Start를 눌러 새로 시작하세요.');
      return;
    }
    if (onContinueTest) {
      onContinueTest(section);
    } else {
      onStartTest(section);
    }
  };

  const hasSavedProgress = (section: string) => !!localStorage.getItem(`tpo_progress_${bankType}_${number}_${section}`);

  const getSectionQuestionCount = (sectionType: string): number => {
    if (!testData) return 0;
    const section = testData.sections.find(s => s.sectionType === sectionType);
    return section ? section.questions.length : 0;
  };

  const renderSectionRow = (sectionName: string, sectionType: 'Reading' | 'Listening' | 'Writing' | 'Speaking', isLast: boolean = false) => {
    const questionCount = getSectionQuestionCount(sectionType);
    const hasContent = questionCount > 0;
    const hasProgress = hasSavedProgress(sectionType);

    return (
      <div 
        className={`h-10 sm:h-14 md:h-18 lg:h-20 relative ${isLast ? 'rounded-b-[12px]' : 'rounded-[8px]'} shrink-0 w-full cursor-pointer transition-all duration-300 ${
          hoveredSection === sectionName.toLowerCase() ? hoverBgClass : defaultBgClass
        }`}
        onMouseEnter={() => setHoveredSection(sectionName.toLowerCase())}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div className="relative size-full">
          <div className="box-border flex h-full items-center justify-between px-2 sm:px-3 md:px-4 relative w-full">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[11px] sm:text-[13px] md:text-[15px] lg:text-[16px] tracking-wide">
                <p>{sectionName}</p>
              </div>
              {hasContent && (
                <div className="flex items-center gap-0.5 sm:gap-1 text-green-600">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span className="text-[8px] sm:text-[10px] md:text-xs font-medium">{questionCount}Q</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {hasProgress && (
                <div 
                  className={`flex items-center justify-center h-[18px] sm:h-[22px] md:h-[26px] lg:h-[28px] rounded-[9px] sm:rounded-[11px] md:rounded-[13px] lg:rounded-[14px] px-1.5 sm:px-2 md:px-3 transition-all duration-300 cursor-pointer shadow-sm ${
                    hoveredSection === sectionName.toLowerCase() ? continueHoverClass : 'bg-[#E6F7F5] text-[#0D9488] hover:bg-[#CCEFEC]'
                  }`}
                  onClick={() => handleContinueClick(sectionType)}
                >
                  <p className="font-['Inter',_sans-serif] font-bold text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-center">Continue</p>
                </div>
              )}
              <div 
                className={`flex items-center justify-center h-[18px] sm:h-[22px] md:h-[26px] lg:h-[28px] rounded-[9px] sm:rounded-[11px] md:rounded-[13px] lg:rounded-[14px] px-1.5 sm:px-2 md:px-3 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === sectionName.toLowerCase() ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleSectionClick(sectionType)}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px] text-center">Start</p>
              </div>
            </div>
            {!isLast && <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-2 sm:left-3 right-2 sm:right-3" />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`bg-white rounded-[12px] shadow-lg border border-gray-200 w-full transition-all duration-300 relative ${
        isLocked ? 'opacity-75' : 'transform hover:scale-105 hover:shadow-xl'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c] h-9 sm:h-12 md:h-14 lg:h-16 relative rounded-t-[12px] shadow-md">
        <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-2 sm:px-4 py-0 right-0 top-0">
          <div className="basis-0 content-stretch flex flex-col grow h-9 sm:h-12 md:h-14 lg:h-16 items-start justify-start min-h-px min-w-px relative shrink-0">
            <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[14px] sm:text-[18px] md:text-[22px] lg:text-[24px] text-white w-full tracking-wide">
              <p className="leading-[36px] sm:leading-[48px] md:leading-[56px] lg:leading-[64px]">TPO {number}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Memo - read only, managed by admin via CMS */}
      {dateMemo && !/demonstration/i.test(dateMemo) && (
        <div className="px-3 sm:px-4 py-1.5 bg-[#f0fafa] border-b border-[#d1e8e8] flex items-center gap-1.5">
          <CalendarDays className="w-3 h-3 text-[#2d7a7c] shrink-0" />
          <span className="text-[10px] sm:text-xs text-[#2d7a7c] font-medium">{dateMemo}</span>
        </div>
      )}

      {renderSectionRow('Reading', 'Reading')}
      {renderSectionRow('Listening', 'Listening')}
      {renderSectionRow('Writing', 'Writing')}
      {renderSectionRow('Speaking', 'Speaking', true)}
    </div>
  );
}