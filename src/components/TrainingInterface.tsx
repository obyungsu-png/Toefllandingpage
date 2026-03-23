import { useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { ListenAndResponse } from "./ListenAndResponse";

interface TrainingInterfaceProps {
  questionType: string;
  level: number;
  onClose: () => void;
}

export function TrainingInterface({ questionType, level, onClose }: TrainingInterfaceProps) {
  const [selectedLesson, setSelectedLesson] = useState<number | null>(level);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Generate 6 levels (changed from 15)
  const lessons = Array.from({ length: 6 }, (_, i) => i + 1);
  
  // Parts data for the main content
  const partsData = [
    { part: 1, days: ['DAY 01', 'DAY 02', 'DAY 03', 'DAY 04', 'DAY 05'] },
    { part: 2, days: ['DAY 06', 'DAY 07', 'DAY 08', 'DAY 09'] },
    { part: 3, days: ['DAY 10', 'DAY 11', 'DAY 12', 'DAY 13'] },
    { part: 4, days: ['DAY 14', 'DAY 15', 'DAY 16', 'DAY 17', 'DAY 18', 'DAY 19', 'DAY 20'] }
  ];

  // Check if a day is enabled (only Level 1, DAY 01 is enabled)
  const isDayEnabled = (day: string) => {
    return selectedLesson === 1 && day === 'DAY 01';
  };

  // If a day is selected, show the ListenAndResponse component
  if (selectedDay) {
    return (
      <ListenAndResponse
        level={selectedLesson || level}
        day={selectedDay}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e91e63] to-[#c2185b] px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 mb-2 sm:mb-4 text-xs sm:text-sm"
        >
          ← 돌아가기
        </button>
        <h1 className="text-white text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2">
          스터디 허브 토플 Level {selectedLesson || level}
        </h1>
        <p className="text-white/90 text-sm sm:text-base lg:text-lg">
          발아쓰기&쉐도잉 프로그램
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-32 sm:w-40 lg:w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-2 sm:p-3 lg:p-4">
            <h2 className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">Activities & Games</h2>
            
            {/* Level dropdown indicator - emphasized */}
            <div className="mb-2 sm:mb-3 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 bg-gradient-to-r from-[#e91e63] to-[#c2185b] border-2 border-[#c2185b] rounded-lg text-white shadow-md">
              <div className="text-center text-xs sm:text-sm lg:text-base">Level {selectedLesson || level}</div>
            </div>
            
            {/* Lessons list - changed to Level */}
            <div className="space-y-1">
              {lessons.map(lesson => (
                <div 
                  key={lesson}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded cursor-pointer transition-colors ${
                    selectedLesson === lesson 
                      ? 'bg-gradient-to-r from-[#e91e63] to-[#c2185b] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Level {lesson}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-3 sm:p-6 lg:p-8">
            <h2 className="text-gray-700 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 lg:mb-6">
              학습할 DAY를 선택해주세요
            </h2>
            
            <div className="max-w-2xl space-y-1">
              {partsData.map(({ part, days }) => (
                <div key={part}>
                  {days.map((day, index) => (
                    <div 
                      key={day}
                      className="flex items-center justify-between border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => isDayEnabled(day) && setSelectedDay(day)}
                    >
                      <div className="flex items-center gap-4">
                        {index === 0 && (
                          <div className="text-[#e91e63] w-16 text-center">
                            Part {part}
                          </div>
                        )}
                        {index !== 0 && <div className="w-16"></div>}
                        <span className="text-gray-800">{day}</span>
                      </div>
                      {isDayEnabled(day) ? (
                        <ChevronRight className="w-5 h-5 text-[#e91e63] group-hover:translate-x-1 transition-transform" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}