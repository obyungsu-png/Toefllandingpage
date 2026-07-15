import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Headphones, MessageSquare, FileText, Mic, Target, BarChart3, X, Volume2, Pause, Play, Check, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Advertisement } from './AdManagement';
import { AdModal } from './AdModal';
// motion removed - using CSS animations
import { DayTrainingInterface } from "./DayTrainingInterface";
import { LMSContent } from "./LMSSection";
import { SATVocaPage } from "./SATVocaPage";

// Question Type Card Component
function QuestionTypeCard({ 
  type, 
  index, 
  onStartTraining,
  onSelectLevel,
  isLocked = false,
  onUnlockClick
}: { 
  type: any; 
  index: number; 
  onStartTraining: () => void;
  onSelectLevel?: (level: number) => void;
  isLocked?: boolean;
  onUnlockClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = type.icon;
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="rounded-xl transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor: isHovered ? '#E8E8E8' : '#FFFFFF',
        boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)'
      }}
    >
      <div className="p-6 text-center">
        {/* Icon */}
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: isHovered ? '#f5f5f5' : '#e5e5e5' }}
        >
          <Icon className="w-7 h-7" style={{ color: '#2d7a7c' }} />
        </div>
        
        {/* Title */}
        <h3 className="mb-1.5" style={{ color: '#000', fontWeight: 700 }}>
          {type.name}
        </h3>
        
        {/* Description */}
        <p 
          className="text-xs mb-4"
          style={{ 
            color: '#666',
            fontWeight: 700
          }}
        >
          {type.description}
        </p>

        {/* Buttons */}
        {type.hasLevels && onSelectLevel ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(level => (
                <Button
                  key={level}
                  onClick={() => onSelectLevel(level)}
                  className="py-2 rounded transition-all duration-300 text-white text-xs"
                  size="sm"
                  style={{ 
                    backgroundColor: '#357a7e',
                    fontWeight: 700
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d6669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#357a7e';
                  }}
                >
                  Level {level}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <Button
            onClick={onStartTraining}
            className="w-full py-2 rounded transition-all duration-300 shadow-md hover:shadow-lg text-white"
            size="sm"
            style={{ 
              backgroundColor: '#357a7e',
              fontWeight: 700
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2d6669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#357a7e';
            }}
          >
            훈련 시작
          </Button>
        )}
        
        {/* Lock Icon */}
        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
        )}
        
        {/* Unlock Button */}
        {isLocked && onUnlockClick && (
          <Button
            onClick={onUnlockClick}
            className="absolute top-2 right-2 py-1 px-2 rounded bg-gray-200 text-gray-500 hover:bg-gray-300"
            size="xs"
          >
            잠금 해제
          </Button>
        )}
      </div>
    </div>
  );
}

// Question Types Data by Skill
const questionTypesBySkill = {
  Reading: [
    { id: 'vocabulary', name: 'Complete Words', icon: BookOpen, description: '단어 의미 파악' },
    { id: 'factual', name: 'Read in Daily Life', icon: FileText, description: '사실 정보 찾기' },
    { id: 'inference', name: 'Read an Academic Passage', icon: Target, description: '내용 추론' }
  ],
  Listening: [
    { id: 'detail', name: 'Listen and Response', icon: FileText, description: '세부 정보 이해' },
    { id: 'function', name: 'Short Conversation', icon: MessageSquare, description: '발화 기능 파악' },
    { id: 'attitude', name: 'Announcements', icon: Target, description: '화자 태도 이해' },
    { id: 'organization', name: 'Academic Talk', icon: BarChart3, description: '내용 구조 파악' }
  ],
  Speaking: [
    { id: 'listen-repeat', name: 'Listen and Repeat', icon: Headphones, description: '듣고 따라 말하기' },
    { id: 'interview', name: 'Take an Interview', icon: Mic, description: '인터뷰 형식 연습' }
  ],
  Writing: [
    { id: 'build-sentence', name: 'Build a Sentence', icon: FileText, description: '문장 구조 연습' },
    { id: 'write-email', name: 'Write an Email', icon: MessageSquare, description: '이메일 작성 연습' },
    { id: 'academic-discussion', name: 'Academic Discussion', icon: MessageSquare, description: '학술 토론 작문' },
    { id: 'essay-structure', name: 'Essay Structure', icon: BarChart3, description: '에세이 구조' },
    { id: 'paraphrasing', name: 'Paraphrasing', icon: BookOpen, description: '문장 바꿔쓰기' }
  ],
  Vocabulary: [
    { id: 'vocab-test', name: 'Vocabulary Test', icon: BookOpen, description: '어휘 테스트' },
    { id: 'vocab-download', name: 'Download Materials', icon: FileText, description: '자료 다운로드' }
  ]
};

// Main Component
export function QuestionTypesSection({ 
  activeSkill, 
  setActiveSkill,
  lmsContents = [],
  onTrainingStateChange,
  advertisements,
  onSaveResult,
  savedConfig,
  onSaveConfig,
  practiceResults = []
}: { 
  activeSkill: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Vocabulary';
  setActiveSkill: (skill: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Vocabulary') => void;
  lmsContents?: LMSContent[];
  onTrainingStateChange?: (isTraining: boolean) => void;
  advertisements?: Advertisement[];
  onSaveResult?: (result: any) => void;
  savedConfig?: any;
  onSaveConfig?: (config: any) => void;
  practiceResults?: any[];
}) {
  const skills: ('Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Vocabulary')[] = ['Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary'];
  const currentQuestionTypes = questionTypesBySkill[activeSkill];
  const [showDayTrainingInterface, setShowDayTrainingInterface] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // Guard to prevent auto-save before config is restored
  const isInitialized = useRef(false);

  // Restore saved config on mount
  useEffect(() => {
    if (savedConfig) {
      if (savedConfig.activeSkill && setActiveSkill) {
        setActiveSkill(savedConfig.activeSkill);
      }
    }
    // Mark as initialized after restore
    const timer = setTimeout(() => { isInitialized.current = true; }, 100);
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  // Auto-save config when key settings change (only after initialization)
  useEffect(() => {
    if (!isInitialized.current || !onSaveConfig) return;
    onSaveConfig({
      activeSkill,
      lastUpdated: new Date().toISOString()
    });
  }, [activeSkill]);

  // Get active advertisements for QuestionTypes page
  const activeAds = advertisements?.filter(ad => 
    ad.isActive && ad.locations?.includes('QuestionTypes')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;

  // Handle start training
  const handleStartTraining = (questionType: string) => {
    setSelectedQuestionType(questionType);
    setShowDayTrainingInterface(true);
    if (onTrainingStateChange) {
      onTrainingStateChange(true);
    }
  };

  // Show day training interface if active
  if (showDayTrainingInterface) {
    return (
      <DayTrainingInterface
        questionType={selectedQuestionType}
        skill={activeSkill}
        onClose={() => {
          setShowDayTrainingInterface(false);
          if (onTrainingStateChange) {
            onTrainingStateChange(false);
          }
        }}
        lmsContents={lmsContents}
      />
    );
  }

  // Show SAT Voca Page for Vocabulary skill
  if (activeSkill === 'Vocabulary') {
    return <SATVocaPage testType="SAT" onBack={() => setActiveSkill('Reading')} onSaveResult={onSaveResult} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      {/* Ad Modal */}
      {displayAd && (
        <AdModal 
          ad={displayAd} 
          isOpen={isAdModalOpen} 
          onClose={() => setIsAdModalOpen(false)} 
        />
      )}

      {/* Advertisement Banner - TPO Style */}
      {displayAd && (
        <div className="border-b border-gray-200">
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-3 md:py-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 md:p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              {/* Left Image - Hidden on mobile */}
              {displayAd.imageUrl && (
                <div className="hidden md:block shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                  <img 
                    src={displayAd.imageUrl}
                    alt={displayAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Right Content */}
              <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-3 w-full">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-[#2d5a5d] mb-1 text-sm md:text-base font-bold">{displayAd.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm">
                    {displayAd.content}
                  </p>
                </div>
                {displayAd.buttonText && (
                  <Button
                    onClick={() => setIsAdModalOpen(true)}
                    className="bg-[#f39c12] text-white hover:bg-[#e67e22] transition-colors shadow-md hover:shadow-lg px-4 md:px-5 py-2 md:py-4 shrink-0 rounded-full text-xs md:text-sm w-full md:w-auto"
                  >
                    {displayAd.buttonText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-medium text-gray-800 mb-1 md:mb-2">TOEFL Question Types</h1>
          <p className="text-sm md:text-base text-gray-600">다양한 문제 유형별로 체계적인 훈련을 받으세요.</p>
        </div>

        {/* Skills Navigation */}
        <div className="mb-4 md:mb-6">
          <div className="flex gap-1.5 md:gap-3 items-center">
            {/* Skill Tabs */}
            <div className="grid grid-cols-5 gap-1.5 md:flex md:gap-3 flex-1 min-w-0">
              {skills.map((skill) => (
                <button
                  key={skill}
                  className={`px-1 md:px-6 py-2 md:py-3 rounded-lg font-bold text-[11px] md:text-sm transition-all duration-300 shadow-md text-center ${
                    activeSkill === skill
                      ? 'bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22]'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                  }`}
                  onClick={() => setActiveSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-medium text-[#2d5a5d] mb-2 md:mb-3">{activeSkill} Question Types</h2>
          <p className="text-gray-700 leading-relaxed">
            {activeSkill === 'Reading' && '학술적 지문을 읽고 이해하는 능력을 평가합니다.'}
            {activeSkill === 'Listening' && '강의와 대화를 듣고 이해하는 능력을 평가합니다.'}
            {activeSkill === 'Speaking' && '영어로 효과적으로 말하는 능력을 평가합니다.'}
            {activeSkill === 'Writing' && '학술적 주제에 대해 영어로 글을 쓰는 능력을 평가합니다.'}
            {activeSkill === 'Vocabulary' && '다양한 문제 유형을 통해 어휘 능력을 향상시킵니다.'}
          </p>
        </div>

        {/* Question Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentQuestionTypes.map((type, index) => (
            <QuestionTypeCard
              key={type.id}
              type={type}
              index={index}
              onStartTraining={() => handleStartTraining(type.name)}
              onSelectLevel={type.hasLevels ? (level) => handleLevelSelect(type.name, level) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}