import { useState } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { LMSContent } from './LMSSection';
import { ListenAndResponse } from './ListenAndResponse';
import { LMSQuestionTrainer } from './LMSQuestionTrainer';

interface DayTrainingInterfaceProps {
  questionType: string;
  skill: string;
  onClose: () => void;
  lmsContents?: LMSContent[];
}

export function DayTrainingInterface({ questionType, skill, onClose, lmsContents = [] }: DayTrainingInterfaceProps) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const levels = [1, 2, 3, 4, 5, 6];
  
  // Days 1-5 for levels 1-5, Days 1-10 for level 6
  const days = selectedLevel === 6 
    ? ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']
    : ['01', '02', '03', '04', '05'];
  
  // Filter LMS contents for current skill, question type, and level
  const getContentForDay = (day: string) => {
    return lmsContents.filter(content => 
      content.skill === skill &&
      content.questionType === questionType &&
      content.level === selectedLevel &&
      content.day === day
    );
  };

  // Day is enabled whenever there's uploaded LMS content for it (works for every question type now)
  const isDayEnabled = (day: string) => {
    return getContentForDay(day).length > 0;
  };

  const handleDayClick = (day: string) => {
    const dayContents = getContentForDay(day);
    if (dayContents.length > 0) {
      setSelectedDay(day);
    } else {
      alert(`DAY ${day}에 업로드된 자료가 없습니다.\nLMS 탭에서 자료를 업로드해주세요.`);
    }
  };

  // 이 DAY의 콘텐츠 중 하나라도 객관식(options)이 있으면 범용 트레이너 사용,
  // 'Listen and Response'이면서 전부 객관식이 아니면 기존 받아쓰기(ListenAndResponse) 화면 사용
  if (selectedDay) {
    const dayContents = lmsContents.filter(content =>
      content.skill === skill &&
      content.questionType === questionType &&
      content.level === selectedLevel &&
      content.day === selectedDay
    );

    const hasAnyOptions = dayContents.some(c => c.options?.length);

    if (questionType === 'Listen and Response' && !hasAnyOptions) {
      return (
        <ListenAndResponse
          level={selectedLevel}
          day={`DAY ${selectedDay}`}
          onBack={() => setSelectedDay(null)}
          lmsContents={dayContents}
        />
      );
    }

    return (
      <LMSQuestionTrainer
        contents={dayContents}
        questionType={questionType}
        level={selectedLevel}
        day={selectedDay}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50">
      {/* Pink Header */}
      <div 
        className="px-3 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(to right, #e91e63, #c2185b)'
        }}
      >
        {/* Decorative circles - left side */}
        <div 
          className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2 w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(2px)'
          }}
        />
        <div 
          className="absolute left-16 sm:left-24 lg:left-32 top-1/2 -translate-y-1/2 w-12 sm:w-16 lg:w-20 h-12 sm:h-16 lg:h-20 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            filter: 'blur(1px)'
          }}
        />
        
        {/* Decorative circle - center */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            filter: 'blur(1.5px)'
          }}
        />
        
        {/* Decorative circles - right side */}
        <div 
          className="absolute right-16 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(2px)'
          }}
        />
        <div 
          className="absolute right-32 top-0 -translate-y-1/2 w-24 h-24 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            filter: 'blur(1px)'
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Back button */}
          <button 
            onClick={onClose}
            className="flex items-center gap-1 sm:gap-2 text-white mb-2 sm:mb-4 hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-['Inter',_sans-serif]">돌아가기</span>
          </button>

          {/* Title */}
          <h1 className="text-white text-lg sm:text-2xl lg:text-3xl mb-1 font-['Inter',_sans-serif] font-bold tracking-wide">
            스터디 허브 토플 Level {selectedLevel}
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/90 text-sm sm:text-base font-['Inter',_sans-serif]">
            {questionType} 프로그램
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-32 sm:w-48 lg:w-64 bg-white border-r border-gray-200 min-h-screen p-3 sm:p-4 lg:p-6">
          {/* Section Title */}
          <h2 className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm lg:text-base">{questionType}</h2>
          
          {/* Levels List */}
          <div className="space-y-1">
            {levels.map(level => (
              <div 
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm rounded cursor-pointer transition-colors ${
                  selectedLevel === level 
                    ? 'bg-gradient-to-r from-[#e91e63] to-[#c2185b] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Level {level}
              </div>
            ))}
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
          {/* Instruction */}
          <h2 className="text-gray-800 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 lg:mb-6">
            학습할 DAY를 선택해주세요
          </h2>

          {/* Days Container - Single Pink Box */}
          <div className="bg-[#fce4ec] rounded-xl sm:rounded-2xl border border-[#f8bbd0] overflow-hidden">
            {days.map((day, dayIndex) => {
              const dayContents = getContentForDay(day);
              const hasContent = dayContents.length > 0;
              const isLast = dayIndex === days.length - 1;
              
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 flex items-center justify-between cursor-pointer transition-all bg-white ${
                    !isLast ? 'border-b border-[#f8bbd0]' : ''
                  } hover:bg-gray-50`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-gray-700 font-semibold text-xs sm:text-sm lg:text-base">DAY {day}</span>
                    {hasContent && (
                      <span className="text-[10px] sm:text-xs bg-[#e91e63] text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold">
                        {dayContents.length}개 자료
                      </span>
                    )}
                    {!isDayEnabled(day) && (
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    )}
                  </div>
                  <ChevronRight 
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    style={{ color: '#e91e63' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}