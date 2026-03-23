import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { BookOpen, Target, BarChart3, Upload, CheckCircle, Zap, Flame, Sparkles, Hash, ArrowRight, Play } from "lucide-react";
// motion removed - using CSS animations
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
  ],
  'Vocabulary': [
    { id: 'word-practice', name: 'Word Practice', icon: BookOpen, description: '단어 암기 및 복습' }
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
  tpoTests?: TPOTest[];
  advertisements?: any[];
  onSaveResult?: (result: any) => void;
  savedConfig?: any;
  onSaveConfig?: (config: any) => void;
  practiceResults?: any[];
}

export function TrainingSection({ 
  uploadedFiles = [], 
  onStartTest = () => {},
  setActiveTab = () => {},
  lmsContents = [],
  tpoTests = [],
  advertisements = [],
  onSaveResult,
  savedConfig,
  onSaveConfig,
  practiceResults = []
}: TrainingSectionProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedSubject, setSelectedSubject] = useState('Reading');
  const [selectedQuestionType, setSelectedQuestionType] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'쉬움' | '보통' | '어려움'>('보통');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState('10문제');
  const [showTrainingInterface, setShowTrainingInterface] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  
  // Year/Month filters for Training
  type YearFilter = 'all' | '2024' | '2025' | '2026';
  type MonthFilter = 'all' | 'jan-mar' | 'apr-jun' | 'jul-sep' | 'oct-dec';
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');

  // Guard to prevent auto-save before config is restored
  const isInitialized = useRef(false);

  // Restore saved config on mount
  useEffect(() => {
    if (savedConfig) {
      if (savedConfig.selectedSubject) setSelectedSubject(savedConfig.selectedSubject);
      if (savedConfig.selectedDifficulty) setSelectedDifficulty(savedConfig.selectedDifficulty);
      if (savedConfig.selectedQuestionCount) setSelectedQuestionCount(savedConfig.selectedQuestionCount);
      if (savedConfig.yearFilter) setYearFilter(savedConfig.yearFilter);
      if (savedConfig.monthFilter) setMonthFilter(savedConfig.monthFilter);
    }
    // Mark as initialized after restore (even if no savedConfig)
    const timer = setTimeout(() => { isInitialized.current = true; }, 100);
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  // Auto-save config when key settings change (only after initialization)
  useEffect(() => {
    if (!isInitialized.current || !onSaveConfig) return;
    onSaveConfig({
      selectedSubject,
      selectedDifficulty,
      selectedQuestionCount,
      yearFilter,
      monthFilter,
      lastUpdated: new Date().toISOString()
    });
  }, [selectedSubject, selectedDifficulty, selectedQuestionCount, yearFilter, monthFilter]);

  const yearOptions: { value: YearFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ];

  const monthOptions: { value: MonthFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'jan-mar', label: '1-3월' },
    { value: 'apr-jun', label: '4-6월' },
    { value: 'jul-sep', label: '7-9월' },
    { value: 'oct-dec', label: '10-12월' },
  ];

  const FilterPill = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
    <button
      className={`px-4 md:px-5 py-1.5 md:py-2 rounded-full font-semibold text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-[#e67e22] text-white shadow-md'
          : 'bg-[#f5f5f5] text-gray-500 border border-gray-200 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  // Filter tpoTests based on year/month selections
  const getFilteredTests = (): TPOTest[] => {
    if (yearFilter === 'all' && monthFilter === 'all') return tpoTests;
    
    return tpoTests.filter(test => {
      if (yearFilter !== 'all') {
        const y = parseInt(yearFilter);
        if (!test.year || test.year !== y) return false;
      }
      if (monthFilter !== 'all' && test.month) {
        const m = test.month;
        if (monthFilter === 'jan-mar' && (m < 1 || m > 3)) return false;
        if (monthFilter === 'apr-jun' && (m < 4 || m > 6)) return false;
        if (monthFilter === 'jul-sep' && (m < 7 || m > 9)) return false;
        if (monthFilter === 'oct-dec' && (m < 10 || m > 12)) return false;
      } else if (monthFilter !== 'all' && !test.month) {
        return false;
      }
      return true;
    });
  };
  
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
    try {
      const subjectRoutes: Record<string, string> = {
        'Reading': '/specialized-training/reading',
        'Listening': '/specialized-training/listening',
        'Writing': '/specialized-training/writing',
        'Speaking': '/specialized-training/speaking',
        'Vocabulary': '/specialized-training/vocabulary'
      };
      navigate(subjectRoutes[subject] || '/specialized-training');
    } catch (e) {
      console.warn('Navigation failed:', e);
    }
  };

  // Filter uploaded training files
  const uploadedTrainingFiles = uploadedFiles.filter(file => 
    file.location === '전문 훈련' && file.status === 'completed'
  );

  // Get uploaded file count for each type
  const getUploadedCountForType = (typeId: string) => {
    return uploadedTrainingFiles.filter(file => file.subcategory === typeId).length;
  };

  // Get questions by difficulty from TPO tests (filtered by year/month)
  const getQuestionsByDifficulty = (
    subject: string,
    questionTypeName: string,
    difficulty: '쉬움' | '보통' | '어려움'
  ): TPOQuestion[] => {
    const allQuestions: TPOQuestion[] = [];
    const filteredTests = getFilteredTests();
    
    // Iterate through filtered TPO tests
    filteredTests.forEach(test => {
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
    if (!selectedQuestionType) return;
    
    // If "Listen and Response" is selected, show the training interface
    if (selectedQuestionType.id === 'detail' && selectedQuestionType.name === 'Listen and Response') {
      setShowTrainingInterface(true);
    } else {
      // For other types, save result and use the original behavior
      const testInfo = {
        title: `${selectedSubject} ${selectedQuestionType.name} 전문훈련`,
        type: selectedSubject,
        source: "전문훈련",
        difficulty: selectedDifficulty,
        questionCount: selectedQuestionCount,
        trainingType: selectedQuestionType.id,
        date: new Date().toISOString().split('T')[0]
      };
      onStartTest(testInfo);
      // Save result to Supabase
      if (onSaveResult) {
        onSaveResult({
          ...testInfo,
          completedAt: new Date().toISOString(),
          status: 'started'
        });
      }
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
            {['Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary'].map((subject) => (
              <button
                key={subject}
                onClick={() => {
                  handleSubjectChange(subject);
                  setSelectedQuestionType(null);
                }}
                className={`px-2 sm:px-4 md:px-6 py-3 font-bold transition-all text-xs sm:text-sm md:text-base ${
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

        {/* ===== Year/Month Filter ===== */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow">
          <div className="space-y-3">
            {/* Row 1: Year */}
            <div className="flex items-center gap-4 md:gap-5">
              <span className="text-sm md:text-base font-bold text-gray-400 shrink-0 w-14">Year</span>
              <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                {yearOptions.map(opt => (
                  <FilterPill
                    key={opt.value}
                    active={yearFilter === opt.value}
                    label={opt.label}
                    onClick={() => setYearFilter(opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Row 2: Month */}
            <div className="flex items-center gap-4 md:gap-5">
              <span className="text-sm md:text-base font-bold text-gray-400 shrink-0 w-14">Month</span>
              <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                {monthOptions.map(opt => (
                  <FilterPill
                    key={opt.value}
                    active={monthFilter === opt.value}
                    label={opt.label}
                    onClick={() => setMonthFilter(opt.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== STEP 2: 문제 유형 선택 ===== */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow">
          <h2 className="text-sm text-[#2d5a5d] mb-3 font-medium">문제 유형 선택</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(questionTypesBySubject[selectedSubject as keyof typeof questionTypesBySubject] || [])?.map((type, index) => {
              const uploadedCount = getUploadedCountForType(type.id);
              const Icon = type.icon;
              const isSelected = selectedQuestionType?.id === type.id;
              
              return (
                <button
                  key={type.id}
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
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== STEP 3 & 4: 난이도 및 문제 수 선택 (문제 유형이 선택되었을 때만 표시) ===== */}
        {selectedQuestionType && (
          <div
            className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm"
            style={{ animation: 'fadeInUp 0.25s ease-out' }}
          >
            {/* Header */}
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-800">{selectedSubject} · {selectedQuestionType.name}</h2>
            </div>

            <div className="space-y-5 p-5">
              {/* 난이도 선택 */}
              <div>
                <p className="mb-2.5 text-xs font-medium text-gray-500">난이도</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {([
                    { key: '쉬움' as const, label: 'Easy', sub: '쉬움' },
                    { key: '보통' as const, label: 'Normal', sub: '보통' },
                    { key: '어려움' as const, label: 'Hard', sub: '어려움' },
                  ]).map((d) => {
                    const stats = getDifficultyStats(selectedSubject, selectedQuestionType.name);
                    const questionCount = stats[d.key];
                    const isActive = selectedDifficulty === d.key;

                    return (
                      <button
                        key={d.key}
                        onClick={() => setSelectedDifficulty(d.key)}
                        className={`rounded-lg border px-3 py-3 text-center transition-colors ${
                          isActive
                            ? 'border-[#2d7a7c] bg-[#f0f9f9] text-[#2d7a7c]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${isActive ? 'text-[#2d7a7c]' : 'text-gray-700'}`}>{d.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{d.sub}</p>
                        {questionCount > 0 && (
                          <p className="text-[10px] text-gray-400 mt-1">{questionCount}문제</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 문제 수 선택 */}
              <div>
                <p className="mb-2.5 text-xs font-medium text-gray-500">문제 수</p>
                <div className="flex gap-2">
                  {[
                    { value: '5문제', num: 5 },
                    { value: '10문제', num: 10 },
                    { value: '15문제', num: 15 },
                    { value: '20문제', num: 20 },
                  ].map((c) => {
                    const isActive = selectedQuestionCount === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => setSelectedQuestionCount(c.value)}
                        className={`flex-1 rounded-lg border px-2 py-2.5 text-center transition-colors ${
                          isActive
                            ? 'border-[#2d7a7c] bg-[#2d7a7c] text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>{c.num}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 선택 요약 */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-gray-50 px-4 py-3">
                {[
                  selectedSubject,
                  selectedQuestionType.name,
                  selectedDifficulty,
                  selectedQuestionCount,
                  ...((yearFilter !== 'all' || monthFilter !== 'all') ? [
                    `${yearFilter !== 'all' ? yearFilter : 'All'} / ${monthFilter !== 'all' ? monthOptions.find(o => o.value === monthFilter)?.label : 'All'}`
                  ] : [])
                ].map((tag, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-600 border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>

              {/* 시작 버튼 */}
              <button
                onClick={handleStartTraining}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d7a7c] px-6 py-3 text-white transition-colors hover:bg-[#256668] active:bg-[#1e5557]"
              >
                <Play className="h-4 w-4 fill-white" />
                <span className="text-sm font-semibold">Start Training</span>
              </button>
            </div>
          </div>
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