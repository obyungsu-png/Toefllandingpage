import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { BookOpen, Target, BarChart3, Upload, CheckCircle, Zap, Play } from "lucide-react";
// motion removed - using CSS animations
import { AdModal } from './AdModal';
import { Advertisement } from './AdManagement';
import { TrainingInterface } from './TrainingInterface';
import { LMSContent } from './LMSSection';
import { TPOTest, TPOQuestion } from './ContentManagement';
import { isCompleteWordsType, getCompleteWordsBlankCount } from '../utils/readingQuestionUtils';

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
    { id: 'listen-repeat', name: 'Listen and Repeat', icon: BookOpen, description: '듣고 따라 말하기' },
    { id: 'take-interview', name: 'Take an Interview', icon: BarChart3, description: '인터뷰 응답 과제' }
  ],
  'Vocabulary': [
    { id: 'word-practice', name: 'Word Practice', icon: BookOpen, description: '단어 암기 및 복습' }
  ]
};

// ============================================================================
// 유형/난이도 매칭 헬퍼
// ============================================================================

/** 난이도 정규화 — '쉬움'/'어려움'이 명시되지 않은 문제는 모두 '보통'으로 간주 */
const normalizeTrainingDifficulty = (difficulty?: string): '쉬움' | '보통' | '어려움' => {
  const d = (difficulty || '').trim();
  if (d === '쉬움' || d === '어려움') return d;
  return '보통';
};

const isDailyLifeTrainingType = (t: string) =>
  t.includes('daily life') || t.includes('read in daily life') ||
  t.includes('notice') || t.includes('email') || t.includes('social media') ||
  t.includes('advertisement') || t.includes('article') || t.includes('form') ||
  t.includes('review') || t.includes('text_message') || t.includes('text-message') ||
  t.includes('실용문');

const isAcademicTrainingType = (t: string) =>
  t.includes('academic reading') || t.includes('academic') ||
  t.includes('reading passage') || t.includes('insert text');

/** CMS 문제의 questionType이 훈련에서 선택한 유형과 일치하는지 판별 */
const matchesTrainingQuestionType = (question: TPOQuestion, typeName: string): boolean => {
  const qt = (question.questionType || '').toLowerCase();
  const target = (typeName || '').toLowerCase();

  // Complete Words — Fill in the Blanks / Cloze 등 모든 변형 자동 인식
  if (target.includes('complete words')) return isCompleteWordsType(question.questionType);
  // Read in Daily Life — Notice / Email / Social Media / Article 등 실용문 전체
  if (target.includes('daily life')) return !isCompleteWordsType(question.questionType) && isDailyLifeTrainingType(qt);
  // Read an Academic Passage
  if (target.includes('academic passage')) {
    return !isCompleteWordsType(question.questionType) && !isDailyLifeTrainingType(qt) && isAcademicTrainingType(qt);
  }
  // Listening 유형 세분 매칭
  if (target.includes('listen and response')) return qt.includes('listen and response') || qt.includes('listen and respond');
  if (target.includes('short conversation')) return qt.includes('short conversation') || qt.includes('campus conversation') || qt.includes('conversation');
  if (target.includes('announcements')) return qt.includes('announcement');
  if (target.includes('academic talk')) return qt.includes('academic talk') || qt.includes('academic lecture') || qt.includes('lecture');
  // Writing
  if (target.includes('build a sentence')) return qt.includes('build a sentence') || qt.includes('sentence');
  if (target.includes('write an email')) return qt.includes('email');
  if (target.includes('academic discussion')) return qt.includes('discussion');
  // Speaking
  if (target.includes('listen and repeat')) return qt.includes('listen and repeat') || qt.includes('repeat') || qt.includes('independent');
  if (target.includes('take an interview')) return qt.includes('interview') || qt.includes('integrated');

  // 기본: 느슨한 포함 매칭
  return qt.includes(target) || target.includes(qt);
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

interface ActiveTrainingSession {
  subject: 'Reading' | 'Listening' | 'Writing' | 'Speaking' | 'Vocabulary';
  questionType: string;
  difficulty: '쉬움' | '보통' | '어려움';
  questions: TPOQuestion[];
  startTime: number;
  sessionTitle: string;
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
  const [activeTrainingSession, setActiveTrainingSession] = useState<ActiveTrainingSession | null>(null);
  const [resumeProgress, setResumeProgress] = useState<any>(null); // 이어풀기용 저장된 progress
  const [showResumeModal, setShowResumeModal] = useState(false);
  
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
  // - 유형 매칭: Complete Words 등 변형 유형 자동 인식 (matchesTrainingQuestionType)
  // - 난이도: 미기입 문제는 '보통'으로 간주 (normalizeTrainingDifficulty)
  // - module 정보 제거: 훈련은 단일 모듈로 진행 (엔진이 module 2로 오분류하지 않도록)
  const getQuestionsByDifficulty = (
    subject: string,
    questionTypeName: string,
    difficulty: '쉬움' | '보통' | '어려움'
  ): TPOQuestion[] => {
    const allQuestions: TPOQuestion[] = [];
    const filteredTests = getFilteredTests();

    filteredTests.forEach(test => {
      const section = test.sections.find(s => s.sectionType === subject);
      if (section) {
        const filteredQuestions = section.questions
          .filter(q =>
            matchesTrainingQuestionType(q, questionTypeName) &&
            normalizeTrainingDifficulty(q.difficulty as string | undefined) === difficulty
          )
          .map(q => ({
            ...q,
            difficulty: normalizeTrainingDifficulty(q.difficulty as string | undefined),
            module: undefined,
            moduleName: undefined,
          } as TPOQuestion));
        allQuestions.push(...filteredQuestions);
      }
    });

    return allQuestions;
  };

  const getSampledQuestions = (
    subject: string,
    questionTypeName: string,
    difficulty: '쉬움' | '보통' | '어려움',
    requestedCount: number
  ) => {
    const pool = [...getQuestionsByDifficulty(subject, questionTypeName, difficulty)];

    for (let index = pool.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
    }

    // Complete Words는 1개 그룹이 여러 빈칸(보통 10문제)을 포함하므로
    // 요청 문제 수에 도달할 때까지 그룹을 누적
    if (questionTypeName.toLowerCase().includes('complete words')) {
      const selected: TPOQuestion[] = [];
      let blankTotal = 0;
      for (const q of pool) {
        if (blankTotal >= requestedCount) break;
        selected.push(q);
        blankTotal += Math.max(1, getCompleteWordsBlankCount(q));
      }
      return selected;
    }

    return pool.slice(0, Math.min(requestedCount, pool.length));
  };

  // Get statistics for difficulty levels
  const getDifficultyStats = (subject: string, questionTypeName: string) => {
    return {
      '쉬움': getQuestionsByDifficulty(subject, questionTypeName, '쉬움').length,
      '보통': getQuestionsByDifficulty(subject, questionTypeName, '보통').length,
      '어려움': getQuestionsByDifficulty(subject, questionTypeName, '어려움').length,
    };
  };

  const handleStartTraining = () => {
    if (!selectedQuestionType) return;
    const totalQuestions = parseInt(selectedQuestionCount, 10) || 0;
    const sampledQuestions = getSampledQuestions(selectedSubject, selectedQuestionType.name, selectedDifficulty, totalQuestions);

    if (sampledQuestions.length === 0) {
      return;
    }

    const sessionTitle = `${selectedSubject} ${selectedQuestionType.name} 전문훈련`;
    setActiveTrainingSession({
      subject: selectedSubject as ActiveTrainingSession['subject'],
      questionType: selectedQuestionType.name,
      difficulty: selectedDifficulty,
      questions: sampledQuestions,
      startTime: Date.now(),
      sessionTitle,
    });
    setShowTrainingInterface(true);

    const testInfo = {
      title: `${selectedSubject} ${selectedQuestionType.name} 전문훈련`,
      type: 'Training',
      category: selectedSubject,
      testName: `${selectedSubject} - ${selectedQuestionType.name} Training`,
      source: '전문훈련',
      difficulty: selectedDifficulty,
      questionCount: `${sampledQuestions.length}문제`,
      totalQuestions: sampledQuestions.length,
      correctAnswers: 0,
      wrongAnswers: [],
      score: 0,
      timeSpent: 0,
      bankType: 'training',
      trainingType: selectedQuestionType.id,
      date: new Date().toISOString(),
      status: 'started'
    };

    onStartTest(testInfo);

    // NOTE: 시작 시에는 저장하지 않음. 완료 시에만 onComplete에서 저장.
    // 이렇게 하면 중간에 종료한 훈련은 History에 쌓이지 않음.
  };

  // 이어풀기: 이전 progress가 localStorage에 있으면 모달 표시
  useEffect(() => {
    if (showTrainingInterface && activeTrainingSession) return;
    try {
      const saved = localStorage.getItem('training_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        // 24시간 지난 progress는 무시
        if (Date.now() - progress.startTime < 86400000) {
          setResumeProgress(progress);
          setShowResumeModal(true);
        } else {
          localStorage.removeItem('training_progress');
        }
      }
    } catch {}
  }, [showTrainingInterface]);

  const handleResumeTraining = () => {
    if (!resumeProgress) return;
    setShowResumeModal(false);
    setActiveTrainingSession({
      subject: resumeProgress.subject,
      questionType: resumeProgress.questionType,
      difficulty: resumeProgress.difficulty,
      questions: resumeProgress.questions,
      startTime: Date.now(),
      sessionTitle: resumeProgress.sessionTitle || '',
    });
    setShowTrainingInterface(true);
  };

  const handleStartFresh = () => {
    localStorage.removeItem('training_progress');
    setResumeProgress(null);
    setShowResumeModal(false);
  };

  // Show training interface if active
  if (showTrainingInterface && activeTrainingSession) {
    return (
      <TrainingInterface
        subject={activeTrainingSession.subject}
        questionType={activeTrainingSession.questionType}
        difficulty={activeTrainingSession.difficulty}
        questions={activeTrainingSession.questions}
        resumeIndex={resumeProgress?.currentIndex || 0}
        resumeCorrectCount={resumeProgress?.correctCount || 0}
        resumeAnswers={resumeProgress?.answers || {}}
        onComplete={(result) => {
          // 완료 시 localStorage 삭제 + completed 저장
          localStorage.removeItem('training_progress');
          setResumeProgress(null);
          onSaveResult?.({
            title: activeTrainingSession.sessionTitle || `${activeTrainingSession.subject} 훈련`,
            type: 'Training',
            category: activeTrainingSession.subject,
            testName: activeTrainingSession.subject,
            date: new Date().toISOString(),
            score: result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0,
            totalQuestions: result.totalQuestions,
            correctAnswers: result.correctCount,
            wrongAnswers: [],
            timeSpent: Math.round((Date.now() - (activeTrainingSession.startTime || Date.now())) / 1000),
            status: 'completed' as const,
            bankType: 'training' as const,
          });
        }}
        onClose={(savedProgress) => {
          if (savedProgress) {
            // 30% 이상 진행했으면 incomplete 저장 + localStorage 저장
            const answeredCount = Object.keys(savedProgress.answers).length;
            if (answeredCount >= savedProgress.questions.length * 0.3) {
              savedProgress.startTime = savedProgress.startTime || Date.now();
              localStorage.setItem('training_progress', JSON.stringify(savedProgress));
              onSaveResult?.({
                title: savedProgress.sessionTitle || `${savedProgress.subject} 훈련`,
                type: 'Training',
                category: savedProgress.subject,
                testName: savedProgress.subject,
                date: new Date().toISOString(),
                score: savedProgress.questions.length > 0 ? Math.round((savedProgress.correctCount / savedProgress.questions.length) * 100) : 0,
                totalQuestions: savedProgress.questions.length,
                correctAnswers: savedProgress.correctCount,
                wrongAnswers: [],
                timeSpent: Math.round((Date.now() - savedProgress.startTime) / 1000),
                status: 'incomplete',
                bankType: 'training' as const,
              });
            }
          }
          setShowTrainingInterface(false);
          setActiveTrainingSession(null);
        }}
      />
    );
  }

  {/* 이어풀기 모달 */}
  {showResumeModal && resumeProgress && (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">⏸️</div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">이전 훈련이 있습니다</h2>
        <p className="text-sm text-gray-500 mb-1">
          {resumeProgress.subject} · {resumeProgress.questionType}
        </p>
        <p className="text-xs text-gray-400 mb-5">
          {resumeProgress.questions.length}문제 중 {Object.keys(resumeProgress.answers).length}문제 풀었습니다
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleResumeTraining}
            className="w-full py-3 rounded-xl font-semibold text-white transition-colors"
            style={{ backgroundColor: '#005f61' }}
          >
            이어풀기
          </button>
          <button
            onClick={handleStartFresh}
            className="w-full py-2.5 rounded-xl font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            처음부터 다시 풀기
          </button>
        </div>
      </div>
    </div>
  )}

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
                  
                  {/* 설명/부제목(Description) 제거 */}
                  
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

              <div className="rounded-lg border border-[#d7ecec] bg-[#f7fbfb] px-4 py-3 text-xs leading-5 text-gray-600">
                {(() => {
                  const availableQuestions = getQuestionsByDifficulty(selectedSubject, selectedQuestionType.name, selectedDifficulty).length;
                  return availableQuestions > 0
                    ? `현재 선택 기준으로 ${availableQuestions}개의 실전형 문제가 연동되어 있습니다. 유형문제 훈련은 이 문제풀에서 비슷한 난이도의 문제를 자동으로 가져옵니다.`
                    : '현재 선택 기준으로 연동된 훈련 문제가 없습니다. 다른 난이도나 유형을 선택해주세요.';
                })()}
              </div>

              {/* 시작 버튼 */}
              <button
                onClick={handleStartTraining}
                disabled={getQuestionsByDifficulty(selectedSubject, selectedQuestionType.name, selectedDifficulty).length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d7a7c] px-6 py-3 text-white transition-colors hover:bg-[#256668] active:bg-[#1e5557] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Play className="h-4 w-4 fill-white" />
                <span className="text-sm font-semibold">Start Training</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export { questionTypesBySubject };