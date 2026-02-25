import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Target, BarChart3, Upload, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { AdBanner } from './AdBanner';
import { AdModal } from './AdModal';
import { Advertisement } from './AdManagement';
import { TrainingInterface } from './TrainingInterface';
import { LMSContent } from './LMSSection';
import { TPOTest, TPOQuestion } from './ContentManagement';

// ============================================================================
// Question Types Data by Subject
// ============================================================================

const questionTypesBySubject = {
  'Reading': [
    { id: 'vocabulary', name: 'Complete Words', icon: BookOpen, description: '단어 의미 파악' },
    { id: 'factual', name: 'Read in Daily Life', icon: Target, description: '사실 정보 찾기' },
    { id: 'inference', name: 'Read an Academic Passage', icon: BookOpen, description: '내용 추론' }
  ],
  'Listening': [
    { id: 'detail', name: 'Listen and Response', icon: BookOpen, description: '세부 정보 이해' },
    { id: 'function', name: 'Short Conversation', icon: BarChart3, description: '대화 기능 파악' },
    { id: 'attitude', name: 'Announcements', icon: BookOpen, description: '화자 태도 파악' },
    { id: 'academic-talk', name: 'Academic Talk', icon: Target, description: '학술 강의 이해' }
  ],
  'Writing': [
    { id: 'build-sentence', name: 'Build a Sentence', icon: BookOpen, description: '문장 구조 만들기 연습' },
    { id: 'write-email', name: 'Write an Email', icon: BarChart3, description: '이메일 작성 연습' },
    { id: 'academic-discussion', name: 'Academic Discussion', icon: BookOpen, description: '학술 토론 작문 과제' }
  ],
  'Speaking': [
    { id: 'independent-task', name: 'Independent Task', icon: BookOpen, description: '독립형 말하기 과제' },
    { id: 'integrated-read', name: 'Integrated (Read)', icon: BarChart3, description: '읽기 통합형 과제' },
    { id: 'integrated-listen', name: 'Integrated (Listen)', icon: BookOpen, description: '듣기 통합형 과제' }
  ]
};

// ============================================================================
// TrainingSection Component
// ============================================================================

interface TrainingSectionProps {
  uploadedFiles?: any[];
  onStartTest?: (testInfo: any) => void;
  setActiveTab?: (tab: string) => void;
  lmsContents?: LMSContent[];
  tpoTests?: TPOTest[]; // Add TPO tests data for difficulty-based filtering
  advertisements?: any[];
}

export function TrainingSection({ 
  uploadedFiles = [], 
  onStartTest = () => {},
  setActiveTab = () => {},
  lmsContents = [],
  tpoTests = [],
  advertisements = []
}: TrainingSectionProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedSubject, setSelectedSubject] = useState('Reading');
  const [selectedQuestionType, setSelectedQuestionType] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'쉬움' | '보통' | '어려움'>('보통');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState('10문제');
  const [showTrainingInterface, setShowTrainingInterface] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  
  const themeColor = '#2d7a7c';
  
  // Get active advertisements for Training page
  const activeAds = (advertisements as Advertisement[])?.filter(ad => 
    ad.isActive && ad.locations?.includes('Training')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;

  // State to manage ad modal visibility
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  
  // Sync URL with selected subject
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/listening')) {
      setSelectedSubject('Listening');
    } else if (path.includes('/reading')) {
      setSelectedSubject('Reading');
    } else if (path.includes('/writing')) {
      setSelectedSubject('Writing');
    } else if (path.includes('/speaking')) {
      setSelectedSubject('Speaking');
    } else if (path.includes('/vocabulary')) {
      setSelectedSubject('Vocabulary');
    }
  }, [location]);
  
  // Update URL when subject changes
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    const subjectRoutes: Record<string, string> = {
      'Reading': '/specialized-training/reading',
      'Listening': '/specialized-training/listening',
      'Writing': '/specialized-training/writing',
      'Speaking': '/specialized-training/speaking',
      'Vocabulary': '/specialized-training/vocabulary'
    };
    navigate(subjectRoutes[subject] || '/specialized-training');
  };

  // Filter uploaded training files
  const uploadedTrainingFiles = uploadedFiles.filter(file => 
    file.location === '전문 훈련' && file.status === 'completed'
  );

  // Get uploaded file count for each type
  const getUploadedCountForType = (typeId: string) => {
    return uploadedTrainingFiles.filter(file => file.subcategory === typeId).length;
  };

  // Get questions by difficulty from TPO tests
  const getQuestionsByDifficulty = (
    subject: string,
    questionTypeName: string,
    difficulty: '쉬움' | '보통' | '어려움'
  ): TPOQuestion[] => {
    const allQuestions: TPOQuestion[] = [];
    
    // Iterate through all TPO tests
    tpoTests.forEach(test => {
      // Find section matching the subject
      const section = test.sections.find(s => s.sectionType === subject);
      if (section) {
        // Filter questions by type and difficulty
        const filteredQuestions = section.questions.filter(q => 
          q.questionType === questionTypeName && 
          q.difficulty === difficulty
        );
        allQuestions.push(...filteredQuestions);
      }
    });
    
    return allQuestions;
  };

  // Get statistics for difficulty levels
  const getDifficultyStats = (subject: string, questionTypeName: string) => {
    return {
      '쉬움': getQuestionsByDifficulty(subject, questionTypeName, '쉬움').length,
      '보통': getQuestionsByDifficulty(subject, questionTypeName, '보통').length,
      '어려움': getQuestionsByDifficulty(subject, questionTypeName, '어려움').length,
    };
  };

  // Handle level selection
  const handleLevelSelect = (questionType: string, level: number) => {
    setSelectedLevel(level);
    setShowTrainingInterface(true);
  };

  // Handle start training - modified to show interface for Listen and Response
  const handleStartTraining = () => {
    // If "Listen and Response" is selected, show the training interface
    if (selectedQuestionType.id === 'detail' && selectedQuestionType.name === 'Listen and Response') {
      setShowTrainingInterface(true);
    } else {
      // For other types, use the original behavior
      onStartTest({
        title: `${selectedSubject} ${selectedQuestionType.name} 전문훈련`,
        type: selectedSubject,
        source: "전문훈련",
        difficulty: selectedDifficulty,
        questionCount: selectedQuestionCount,
        trainingType: selectedQuestionType.id,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  // Show training interface if active
  if (showTrainingInterface) {
    return (
      <TrainingInterface
        questionType={selectedQuestionType?.name || ''}
        level={selectedLevel}
        onClose={() => setShowTrainingInterface(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-24 md:pb-0">
      {/* Ad Modal */}
      {displayAd && (
        <AdModal 
          ad={displayAd} 
          isOpen={isAdModalOpen} 
          onClose={() => setIsAdModalOpen(false)} 
        />
      )}

      {/* Advertisement Banner */}
      {displayAd && (
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4">
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
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* ===== HEADER ===== */}
        <div className="mb-4">
          <h1 className="text-2xl text-[#2d5a5d] mb-1">전문 훈련</h1>
          <p className="text-sm text-gray-600 mb-6">체계적인 전문 훈련을 통해 실력을 한 단계 향상시키세요.</p>
          {uploadedTrainingFiles.length > 0 && (
            <p className="text-xs text-[#e67e22] mt-1 mb-4">
              📁 업로드된 전문 훈련 자료 {uploadedTrainingFiles.length}개가 추가되었습니다.
            </p>
          )}
          
          {/* Tabs for Subject Selection */}
          <div className="flex gap-2 border-b-2 border-gray-200">
            {['Reading', 'Listening', 'Writing', 'Speaking'].map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  handleSubjectChange(subject);
                  setSelectedQuestionType(null);
                }}
                className={`px-3 sm:px-6 py-3 font-bold transition-all text-sm sm:text-base ${
                  selectedSubject === subject
                    ? 'border-b-4 -mb-0.5'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={{
                  borderColor: selectedSubject === subject ? themeColor : 'transparent',
                  color: selectedSubject === subject ? themeColor : undefined
                }}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* ===== STEP 2: 문제 유형 선택 ===== */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow">
          <h2 className="text-sm text-[#2d5a5d] mb-3 font-medium">문제 유형 선택</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {questionTypesBySubject[selectedSubject]?.map((type, index) => {
              const uploadedCount = getUploadedCountForType(type.id);
              const Icon = type.icon;
              const isSelected = selectedQuestionType?.id === type.id;
              
              return (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedQuestionType(type)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-left relative ${
                    isSelected
                      ? 'border-[#2d7a7c] bg-[#2d7a7c]/10 shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#2d7a7c]/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-[#2d7a7c]' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#2d7a7c]'}`} />
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-[#2d7a7c]" />
                    )}
                  </div>
                  
                  <h3 className={`text-sm mb-1 font-medium ${isSelected ? 'text-[#2d7a7c]' : 'text-[#2d5a5d]'}`}>
                    {type.name}
                  </h3>
                  
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {type.description}
                  </p>
                  
                  {uploadedCount > 0 && (
                    <div className="inline-block">
                      <span className="text-xs bg-[#e67e22]/10 text-[#e67e22] px-2 py-0.5 rounded">
                        <Upload className="w-3 h-3 inline-block mr-0.5" />
                        {uploadedCount}개
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ===== STEP 3 & 4: 난이도 및 문제 수 선택 (문제 유형이 선택되었을 때만 표시) ===== */}
        {selectedQuestionType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow"
          >
            <h2 className="text-sm text-[#2d5a5d] mb-4 font-medium">3. 훈련 설정</h2>
            
            <div className="space-y-4">
              {/* 난이도 선택 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">난이도</label>
                <div className="grid grid-cols-3 gap-3">
                  {['쉬움', '보통', '어려움'].map((difficulty) => {
                    const stats = selectedQuestionType ? getDifficultyStats(selectedSubject, selectedQuestionType.name) : { '쉬움': 0, '보통': 0, '어려움': 0 };
                    const questionCount = stats[difficulty as '쉬움' | '보통' | '어려움'];
                    
                    return (
                      <button
                        key={difficulty}
                        onClick={() => setSelectedDifficulty(difficulty as '쉬움' | '보통' | '어려움')}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                          selectedDifficulty === difficulty
                            ? 'border-[#2d7a7c] bg-[#2d7a7c]/10 text-[#2d7a7c]'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-[#2d7a7c]/50'
                        }`}
                      >
                        {selectedDifficulty === difficulty && (
                          <CheckCircle className="w-4 h-4 mx-auto mb-1 text-[#2d7a7c]" />
                        )}
                        <div className="text-sm font-medium">{difficulty}</div>
                        {questionCount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {questionCount}문제 사용 가능
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 문제 수 선택 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">문제 수</label>
                <div className="grid grid-cols-4 gap-3">
                  {['5문제', '10문제', '15문제', '20문제'].map((count) => (
                    <button
                      key={count}
                      onClick={() => setSelectedQuestionCount(count)}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        selectedQuestionCount === count
                          ? 'border-[#2d7a7c] bg-[#2d7a7c]/10 text-[#2d7a7c]'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-[#2d7a7c]/50'
                      }`}
                    >
                      {selectedQuestionCount === count && (
                        <CheckCircle className="w-4 h-4 mx-auto mb-1 text-[#2d7a7c]" />
                      )}
                      <div className="text-sm font-medium">{count}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 선택 요약 */}
              <div className="bg-gradient-to-r from-[#2d7a7c]/10 to-[#1e6b73]/10 rounded-lg p-4 border border-[#2d7a7c]/30">
                <h3 className="text-sm font-medium text-[#2d5a5d] mb-2">선택한 설정</h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <span className="text-xs text-gray-500">과목</span>
                    <p className="font-medium">{selectedSubject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">문제 유형</span>
                    <p className="font-medium">{selectedQuestionType.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">난이도</span>
                    <p className="font-medium">{selectedDifficulty}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">문제 수</span>
                    <p className="font-medium">{selectedQuestionCount}</p>
                  </div>
                </div>
              </div>

              {/* 시작 버튼 */}
              <Button
                onClick={handleStartTraining}
                className="w-full py-4 bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#005f61] hover:to-[#004d56] transition-all duration-300 shadow-md transform hover:scale-105"
              >
                훈련 시작하기
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {uploadedTrainingFiles.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center shadow">
            <Target className="w-10 h-10 text-[#2d7a7c]/30 mx-auto mb-3" />
            <h3 className="text-sm text-[#2d5a5d] mb-2 font-medium">업로드된 전문 훈련 자료가 없습니다</h3>
            <p className="text-xs text-gray-600 mb-3">
              업로드 탭에서 전문 훈련용 자료를 업로드하면 개인 맞춤형 훈련을 받을 수 있습니다.
            </p>
            <Button
              onClick={() => setActiveTab('업로드')}
              className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white px-5 py-2 rounded-lg hover:from-[#005f61] hover:to-[#004d56] transition-all duration-300 shadow-md"
            >
              전문 훈련 자료 업로드하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export { questionTypesBySubject };