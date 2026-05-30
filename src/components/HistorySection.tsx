import { useState, useMemo } from 'react';
import { BarChart3, Clock, CheckCircle, XCircle, RotateCcw, ChevronRight, Calendar, Share2, Settings, TrendingUp, ChevronDown, BookOpen, Star, ChevronLeft, CheckCircle2, Flame, Eye, MessageCircle, PanelRightOpen, PanelRightClose, User } from 'lucide-react';
import { Button } from './ui/button';
import { ShareSettings, ShareConfig } from './ShareSettings';
import { ReportSection } from './ReportSection';
import { toast } from 'sonner@2.0.3';
import { AdModal } from './AdModal';
import { AdBanner } from './AdBanner';
import { Advertisement } from './AdManagement';
import { QuestionReviewFull } from './QuestionReviewFull';
import { RestartConfirmModal } from './RestartConfirmModal';
import { TestResult } from '../types/testResult';

// Re-export for backward compatibility
export type { TestResult } from '../types/testResult';

interface HistorySectionProps {
  themeColor?: string;
  results: TestResult[];
  tpoTests?: any[];
  onRetryWrongAnswers?: (result: TestResult) => void;
  onRestartTest?: (result: TestResult, startFresh: boolean) => void;
  onViewDetail?: (result: TestResult) => void;
  shareConfig?: ShareConfig;
  onShareConfigChange?: (config: ShareConfig) => void;
  studentName?: string;
  advertisements?: any[];
}

type TabType = 'TPO' | 'Test' | 'Training' | 'Vocabulary' | 'Wrong Answers' | 'Report';
type NavType = 'records';
type TimeFilter = 'all' | 'today' | '7days' | '1month' | '3months';
type StatusFilter = 'all' | 'completed' | 'incomplete';

// Sample data shown when no real results exist
const SAMPLE_RESULTS: TestResult[] = [
  {
    id: 'sample-tpo-1-reading',
    type: 'TPO',
    category: 'Reading',
    testName: 'TPO 1 - Full Test',
    date: '2026-03-09T10:00:00',
    score: 90,
    totalQuestions: 30,
    correctAnswers: 27,
    wrongAnswers: [
      { questionId: 'q1', questionText: 'The word "dramatic" in the passage is closest in meaning to', userAnswer: 'gradual', correctAnswer: 'striking', explanation: 'Dramatic means striking or impressive.' },
      { questionId: 'q2', questionText: 'According to paragraph 2, which of the following is true of the flora?', userAnswer: 'It was diverse', correctAnswer: 'It was limited', explanation: 'The passage states that flora was limited in variety.' },
      { questionId: 'q3', questionText: 'Why does the author mention the Sahara?', userAnswer: 'To give an example', correctAnswer: 'To provide a contrast', explanation: 'The Sahara is used as a contrasting example.' },
    ],
    timeSpent: 1800,
  },
  {
    id: 'sample-tpo-75-reading',
    type: 'TPO',
    category: 'Reading',
    testName: 'TPO 75 - Full Test',
    date: '2026-03-08T14:30:00',
    score: 96,
    totalQuestions: 30,
    correctAnswers: 27,
    wrongAnswers: [
      { questionId: 'q1', questionText: 'The word "ubiquitous" is closest in meaning to', userAnswer: 'rare', correctAnswer: 'widespread', explanation: 'Ubiquitous means existing everywhere.' },
      { questionId: 'q2', questionText: 'Which is true about coral reefs?', userAnswer: 'They grow in cold water', correctAnswer: 'They require warm, shallow water', explanation: 'Coral reefs thrive in warm, shallow waters.' },
      { questionId: 'q3', questionText: 'What can be inferred about migration?', userAnswer: 'All species migrate seasonally', correctAnswer: 'Migration is influenced by multiple factors', explanation: 'Temperature, food, and daylight hours all matter.' },
      { questionId: 'q4', questionText: '"Account for" is closest in meaning to', userAnswer: 'calculate', correctAnswer: 'explain', explanation: '"Account for" means to explain something.' },
    ],
    timeSpent: 2340,
  },
  {
    id: 'sample-listening-1',
    type: 'TPO',
    category: 'Listening',
    testName: 'TPO 75 - Listening Section',
    date: '2026-03-08T11:00:00',
    score: 78,
    totalQuestions: 18,
    correctAnswers: 7,
    wrongAnswers: [
      { questionId: 'l1', questionText: 'Woman: Is the gym open right now?', userAnswer: 'He is tired.', correctAnswer: 'I think so.', explanation: 'The woman is asking about the gym\'s current status. "I think so" directly answers the question.' },
      { questionId: 'l2', questionText: 'What does the professor mainly discuss?', userAnswer: 'The history of architecture', correctAnswer: 'The impact of climate on building design', explanation: 'The lecture focuses on how climate influences architectural decisions.' },
      { questionId: 'l3', questionText: 'Why does the student visit the registrar\'s office?', userAnswer: 'To pay tuition fees', correctAnswer: 'To resolve a scheduling conflict', explanation: 'The student mentions having two classes at the same time.' },
      { questionId: 'l4', questionText: 'What can be inferred about the experiment?', userAnswer: 'It was unsuccessful', correctAnswer: 'It produced unexpected results', explanation: 'The professor says the results surprised the research team.' },
      { questionId: 'l5', questionText: 'What does the man mean when he says "that\'s a stretch"?', userAnswer: 'He needs to exercise', correctAnswer: 'He thinks it\'s an exaggeration', explanation: '"That\'s a stretch" is an idiom meaning something is exaggerated or unlikely.' },
      { questionId: 'l6', questionText: 'According to the lecture, what is true about deep-sea organisms?', userAnswer: 'They rely on sunlight', correctAnswer: 'They use chemosynthesis for energy', explanation: 'Deep-sea organisms near hydrothermal vents use chemosynthesis, not photosynthesis.' },
      { questionId: 'l7', questionText: 'Why does the advisor recommend the summer program?', userAnswer: 'It is less expensive', correctAnswer: 'It fulfills a graduation requirement', explanation: 'The advisor specifically mentions this program satisfies a required credit.' },
      { questionId: 'l8', questionText: 'What is the speaker\'s attitude toward the new policy?', userAnswer: 'Strongly supportive', correctAnswer: 'Cautiously optimistic', explanation: 'The speaker expresses hope but also mentions concerns.' },
      { questionId: 'l9', questionText: 'What does the professor imply about fossil records?', userAnswer: 'They are always accurate', correctAnswer: 'They can be incomplete or misleading', explanation: 'The professor notes gaps and biases in the fossil record.' },
      { questionId: 'l10', questionText: 'Why does the woman say "you\'re telling me"?', userAnswer: 'She wants more information', correctAnswer: 'She strongly agrees', explanation: '"You\'re telling me" is an expression of strong agreement.' },
      { questionId: 'l11', questionText: 'What will the student probably do next?', userAnswer: 'Go to the library', correctAnswer: 'Submit the form online', explanation: 'The advisor tells the student to complete the online submission.' },
    ],
    timeSpent: 419,
  },
  {
    id: 'sample-writing-1',
    type: 'TPO',
    category: 'Writing',
    testName: 'TPO 75 - Writing Section',
    date: '2026-03-07T16:00:00',
    score: 80,
    totalQuestions: 10,
    correctAnswers: 0,
    wrongAnswers: [
      { questionId: 'wr1', questionText: 'Complete the conversation about presentations', userAnswer: 'to give / for it', correctAnswer: 'to send / of it', explanation: 'The correct phrase is "to send you a copy of it".' },
      { questionId: 'wr2', questionText: 'Complete the conversation about the library', userAnswer: 'study', correctAnswer: 'reading', explanation: 'The correct phrase is "reading room" not "study room".' },
    ],
    timeSpent: 331,
  },
  {
    id: 'sample-speaking-1',
    type: 'TPO',
    category: 'Speaking',
    testName: 'TPO 75 - Speaking Section',
    date: '2026-03-07T15:00:00',
    score: 85,
    totalQuestions: 7,
    correctAnswers: 7,
    wrongAnswers: [],
    timeSpent: 118,
  },
  {
    id: 'sample-test-1',
    type: 'Test',
    testName: 'TOEFL Practice Test 1',
    date: '2026-03-08T10:00:00',
    score: 91,
    totalQuestions: 100,
    correctAnswers: 91,
    wrongAnswers: [
      { questionId: 'w1', questionText: 'Summarize the lecture on renewable energy.', userAnswer: '(Incomplete comparison)', correctAnswer: '(Full essay with three points)', explanation: 'Address cost efficiency, reliability, and environmental impact.' },
      { questionId: 'w2', questionText: 'Choose the best way to combine sentences.', userAnswer: 'Although successful, but inconclusive.', correctAnswer: 'Although successful, the results were inconclusive.', explanation: '"Although" and "but" should not be used together.' },
    ],
    timeSpent: 6900,
  },
  {
    id: 'sample-training-1',
    type: 'Training',
    testName: 'Listening - Conversation Practice',
    date: '2026-03-08T09:20:00',
    score: 84,
    totalQuestions: 100,
    correctAnswers: 84,
    wrongAnswers: [
      { questionId: 't1', questionText: 'What does the speaker suggest about the deadline?', userAnswer: 'It can be extended', correctAnswer: 'It is firm and cannot be changed', explanation: '"No exceptions" indicates the deadline is fixed.' },
      { questionId: 't2', questionText: 'What is the purpose of the announcement?', userAnswer: 'To introduce a new professor', correctAnswer: 'To inform about schedule changes', explanation: 'The announcement states changes to the class schedule.' },
    ],
    timeSpent: 1800,
  },
  {
    id: 'sample-vocab-1',
    type: 'Vocabulary',
    testName: 'TOEFL Vocabulary Test',
    date: '2026-03-08T08:00:00',
    score: 88,
    totalQuestions: 100,
    correctAnswers: 88,
    wrongAnswers: [
      { questionId: 'v1', questionText: 'What does "aberration" mean?', userAnswer: 'normal', correctAnswer: 'deviation, anomaly', explanation: 'Aberration refers to a departure from what is normal.' },
      { questionId: 'v2', questionText: 'What does "benevolent" mean?', userAnswer: 'malicious', correctAnswer: 'kind, generous', explanation: 'Benevolent describes a kind and generous character.' },
    ],
    timeSpent: 600,
    vocabularyDay: 3,
    vocabularyVolume: 1,
  },
];

export function HistorySection({ 
  themeColor = '#005f61',
  results = [],
  tpoTests = [],
  onRetryWrongAnswers,
  onRestartTest,
  onViewDetail,
  shareConfig,
  onShareConfigChange,
  studentName = 'Student',
  advertisements = []
}: HistorySectionProps) {
  // Navigation & Tab state
  const [activeNav, setActiveNav] = useState<NavType>('records');
  const [activeTab, setActiveTab] = useState<TabType>('TPO');
  const [showShareSettings, setShowShareSettings] = useState(false);

  // Right sidebar toggle
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Filter states
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Question review full screen
  const [showQuestionReview, setShowQuestionReview] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [activeScoreTab, setActiveScoreTab] = useState<'overview' | 'questions'>('overview');

  // Restart confirm modal
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartTarget, setRestartTarget] = useState<TestResult | null>(null);

  // Calendar state
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const [calYear, setCalYear] = useState(currentYear);
  const [calMonth, setCalMonth] = useState(currentMonth);

  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calStartOffset = calFirstDay === 0 ? 6 : calFirstDay - 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Effective results (fallback to samples)
  const effectiveResults = results.length > 0 ? results : SAMPLE_RESULTS;

  // Ads
  const activeAds = (advertisements as Advertisement[])?.filter(ad =>
    ad.isActive && ad.locations?.includes('History')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const tabs: TabType[] = ['TPO', 'Test', 'Training', 'Vocabulary', 'Wrong Answers', 'Report'];

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: '7days', label: '7 Days' },
    { key: '1month', label: '1 Month' },
    { key: '3months', label: '3 Months' },
  ];

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'incomplete', label: 'Incomplete' },
  ];

  // Filter results by active tab
  const getTabFiltered = () => {
    let filtered: TestResult[] = [];
    switch (activeTab) {
      case 'TPO':
        filtered = effectiveResults.filter(r => r.type === 'TPO');
        break;
      case 'Test':
        filtered = effectiveResults.filter(r => r.type === 'Test');
        break;
      case 'Training':
        filtered = effectiveResults.filter(r => r.type === 'Training');
        break;
      case 'Vocabulary':
        filtered = effectiveResults.filter(r => r.type === 'Vocabulary');
        break;
      case 'Wrong Answers':
        filtered = effectiveResults.filter(r => r.wrongAnswers && r.wrongAnswers.length > 0);
        break;
      case 'Report':
        filtered = effectiveResults;
        break;
      default:
        filtered = effectiveResults;
    }
    if (filtered.length === 0) {
      switch (activeTab) {
        case 'TPO': return SAMPLE_RESULTS.filter(r => r.type === 'TPO');
        case 'Test': return SAMPLE_RESULTS.filter(r => r.type === 'Test');
        case 'Training': return SAMPLE_RESULTS.filter(r => r.type === 'Training');
        case 'Vocabulary': return SAMPLE_RESULTS.filter(r => r.type === 'Vocabulary');
        case 'Wrong Answers': return SAMPLE_RESULTS.filter(r => r.wrongAnswers && r.wrongAnswers.length > 0);
        default: return SAMPLE_RESULTS;
      }
    }
    return filtered;
  };

  const tabFiltered = getTabFiltered();

  // Convert to display records with sections
  interface DisplayRecord {
    id: string;
    testName: string;
    date: string;
    timestamp: string;
    category?: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    sections: {
      name: string;
      status: 'completed' | 'in-progress' | 'not-started';
      correct?: number;
      total?: number;
    }[];
    result: TestResult;
  }

  const displayRecords: DisplayRecord[] = useMemo(() => {
    return tabFiltered.map(r => {
      const date = new Date(r.date);
      const sections: DisplayRecord['sections'] = [];
      const allSections = ['Reading', 'Listening', 'Writing', 'Speaking'];
      allSections.forEach(s => {
        if (r.category === s) {
          sections.push({ name: s, status: 'completed', correct: r.correctAnswers, total: r.totalQuestions });
        } else {
          sections.push({ name: s, status: 'not-started' });
        }
      });

      return {
        id: r.id,
        testName: r.testName,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        timestamp: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        category: r.category,
        score: r.score,
        correctAnswers: r.correctAnswers,
        totalQuestions: r.totalQuestions,
        sections,
        result: r,
      };
    });
  }, [tabFiltered]);

  // Apply time filter
  const timeFilteredRecords = useMemo(() => {
    const nowMs = Date.now();
    return displayRecords.filter(r => {
      if (timeFilter === 'all') return true;
      const rDate = new Date(r.result.date).getTime();
      const diffDays = (nowMs - rDate) / (1000 * 60 * 60 * 24);
      switch (timeFilter) {
        case 'today': return diffDays < 1;
        case '7days': return diffDays < 7;
        case '1month': return diffDays < 30;
        case '3months': return diffDays < 90;
        default: return true;
      }
    });
  }, [displayRecords, timeFilter]);

  // Apply status filter
  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return timeFilteredRecords;
    return timeFilteredRecords.filter(r => {
      const hasCompleted = r.sections.some(s => s.status === 'completed');
      const allCompleted = r.sections.filter(s => s.status !== 'not-started').every(s => s.status === 'completed');
      if (statusFilter === 'completed') return hasCompleted && allCompleted;
      return !allCompleted;
    });
  }, [timeFilteredRecords, statusFilter]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const grouped: { [key: string]: DisplayRecord[] } = {};
    filteredRecords.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredRecords]);

  // Study stats
  const totalStudyDays = useMemo(() => {
    const dates = new Set(effectiveResults.map(r => {
      const d = new Date(r.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    return dates.size;
  }, [effectiveResults]);

  // Calendar practice dates
  const practiceDates = useMemo(() => {
    const dates = new Set<string>();
    effectiveResults.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        dates.add(String(d.getDate()));
      }
    });
    return dates;
  }, [effectiveResults, calYear, calMonth]);

  // Tab count badges
  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'TPO': return effectiveResults.filter(r => r.type === 'TPO').length;
      case 'Test': return effectiveResults.filter(r => r.type === 'Test').length;
      case 'Training': return effectiveResults.filter(r => r.type === 'Training').length;
      case 'Vocabulary': return effectiveResults.filter(r => r.type === 'Vocabulary').length;
      case 'Wrong Answers': return effectiveResults.filter(r => r.wrongAnswers && r.wrongAnswers.length > 0).length;
      case 'Report': return 0;
      default: return 0;
    }
  };

  // Handlers
  const handleShareResult = (result: TestResult) => {
    if (!shareConfig || (!shareConfig.wechatEnabled && !shareConfig.smsEnabled)) {
      toast.error('Please enable sharing settings first.');
      setShowShareSettings(true);
      return;
    }
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const message = `[${shareConfig.parentName || 'Parent'}]\n\nStudent's TOEFL test result:\n\nTest: ${result.testName}\nScore: ${result.score}\nAccuracy: ${result.correctAnswers}/${result.totalQuestions} (${Math.round((result.correctAnswers / result.totalQuestions) * 100)}%)\nDate: ${formatDate(result.date)}\n\n- TOEFL TPO Practice Platform`;
    let shareMethod = [];
    if (shareConfig.wechatEnabled) shareMethod.push('WeChat');
    if (shareConfig.smsEnabled) shareMethod.push('SMS');
    toast.success(`Result sent via ${shareMethod.join(' and ')}!`, {
      description: `Sent to ${shareConfig.wechatEnabled ? shareConfig.wechatId || 'WeChat ID' : ''}${shareConfig.wechatEnabled && shareConfig.smsEnabled ? ', ' : ''}${shareConfig.smsEnabled ? shareConfig.parentPhone || 'Parent Phone' : ''}.`
    });
    console.log('Sharing result:', message);
  };

  const handleViewResults = (result: TestResult) => {
    setSelectedResult(result);
    setShowScoreModal(true);
    setExpandedQuestion(null);
    setActiveScoreTab('overview');
  };

  const handleRestartClick = (result: TestResult) => {
    setRestartTarget(result);
    setShowRestartModal(true);
  };

  const handleRestartContinue = (result: TestResult) => {
    setShowRestartModal(false);
    setRestartTarget(null);
    onRestartTest?.(result, false);
    onRetryWrongAnswers?.(result);
  };

  const handleRestartFresh = (result: TestResult) => {
    setShowRestartModal(false);
    setRestartTarget(null);
    onRestartTest?.(result, true);
    onRetryWrongAnswers?.(result);
  };

  const handleBackFromReview = () => {
    setShowQuestionReview(false);
  };

  // Full-screen Question Review
  if (showQuestionReview && selectedResult) {
    return (
      <QuestionReviewFull
        result={selectedResult}
        tpoTests={tpoTests}
        onBack={handleBackFromReview}
        themeColor={themeColor}
      />
    );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-[#f5f7fa] overflow-hidden flex flex-col -mx-2 md:-mx-4 -mb-4 md:-mb-12">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Ad Modal */}
      {displayAd && (
        <AdModal
          ad={displayAd}
          isOpen={isAdModalOpen}
          onClose={() => setIsAdModalOpen(false)}
        />
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Practice Records</h1>
        <div className="flex items-center gap-2">

          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              showRightSidebar
                ? 'text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={{ backgroundColor: showRightSidebar ? themeColor : undefined }}
            title={showRightSidebar ? 'Hide profile panel' : 'Show profile panel'}
          >
            <User className="w-3.5 h-3.5" />
            {studentName}
            {showRightSidebar ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden md:flex flex-col w-52 bg-white border-r border-gray-200 shrink-0 overflow-y-auto">
          {/* Primary Nav */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveNav('records')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-white`}
              style={{ backgroundColor: themeColor }}
            >
              <BookOpen className="w-4 h-4" />
              Exam Records
            </button>
          </nav>

          {/* Divider */}
          <div className="mx-3 border-t border-gray-200" />

          {/* Category Tabs in Sidebar */}
          {activeNav === 'records' && (
            <nav className="p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-3 mb-2">Categories</p>
              {tabs.map(tab => {
                const count = getTabCount(tab);
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-opacity-10'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{
                      backgroundColor: isActive ? `${themeColor}15` : undefined,
                      color: isActive ? themeColor : undefined,
                      borderLeft: isActive ? `3px solid ${themeColor}` : '3px solid transparent',
                    }}
                  >
                    <span>{tab}</span>
                    {count > 0 && tab !== 'Report' && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          isActive ? 'text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                        style={{ backgroundColor: isActive ? themeColor : undefined }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Mobile Tab Bar (horizontal, shown only on small screens) */}
        <div className="md:hidden flex flex-col w-full">
          {/* Mobile horizontal category tabs */}
          <div className="bg-white border-b border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
            {tabs.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive ? 'text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                  style={{ backgroundColor: isActive ? themeColor : undefined }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Mobile main content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'Report' ? (
              <ReportSection
                themeColor={themeColor}
                results={results}
                shareConfig={shareConfig}
                onShareConfigChange={onShareConfigChange}
                studentName={studentName}
                onOpenShareSettings={() => setShowShareSettings(true)}
              />
            ) : (
              <>
                {/* Filters */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Time</span>
                    {timeFilters.map(f => (
                      <button
                        key={f.key}
                        onClick={() => setTimeFilter(f.key)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          timeFilter === f.key ? 'text-white' : 'bg-white text-gray-600 border border-gray-300'
                        }`}
                        style={{ backgroundColor: timeFilter === f.key ? themeColor : undefined }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">Status</span>
                    {statusFilters.map(f => (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          statusFilter === f.key ? 'text-white' : 'bg-white text-gray-600 border border-gray-300'
                        }`}
                        style={{ backgroundColor: statusFilter === f.key ? themeColor : undefined }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile record cards */}
                {groupedByDate.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-sm">No records found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedByDate.map(([date, records]) => (
                      <div key={date}>
                        <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {date}
                        </h2>
                        <div className="space-y-2">
                          {records.map(record => (
                            <div key={record.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-900 flex-1 mr-2">{record.testName}</h3>
                                <span className="text-xs text-gray-500">{record.timestamp}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 mb-3">
                                {record.sections.map(section => (
                                  <div key={section.name} className="text-center">
                                    <p className="text-xs text-gray-600 mb-0.5">{section.name}</p>
                                    {section.status === 'completed' ? (
                                      <p className="text-xs font-bold" style={{ color: themeColor }}>{section.correct}/{section.total}</p>
                                    ) : (
                                      <p className="text-xs text-gray-400">--</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRestartClick(record.result)}
                                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  Restart
                                </button>
                                <button
                                  onClick={() => handleViewResults(record.result)}
                                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold border-2"
                                  style={{ borderColor: themeColor, color: themeColor }}
                                >
                                  View Results
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Desktop Main Content (hidden on mobile) */}
        <div className="hidden md:block flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'Report' ? (
            <ReportSection
              themeColor={themeColor}
              results={results}
              shareConfig={shareConfig}
              onShareConfigChange={onShareConfigChange}
              studentName={studentName}
              onOpenShareSettings={() => setShowShareSettings(true)}
            />
          ) : (
            <>
              {/* Filters */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 font-medium mr-1">Time Period</span>
                  {timeFilters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setTimeFilter(f.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        timeFilter === f.key
                          ? 'text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: timeFilter === f.key ? themeColor : undefined }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 font-medium mr-1">Status</span>
                  {statusFilters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        statusFilter === f.key
                          ? 'text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: statusFilter === f.key ? themeColor : undefined }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Records grouped by date */}
              {groupedByDate.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No records found</p>
                  <p className="text-gray-400 text-sm mt-1">Complete a test to see your records here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedByDate.map(([date, records]) => (
                    <div key={date}>
                      <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {date}
                      </h2>
                      <div className="space-y-3">
                        {records.map((record) => (
                          <div
                            key={record.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-[fadeSlideUp_0.3s_ease-out]"
                            style={{ animation: 'fadeSlideUp 0.3s ease-out' }}
                          >
                            <div className="p-4 lg:p-5">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                {/* Left: Test info */}
                                <div className="flex-1">
                                  <h3 className="text-base font-bold text-gray-900 mb-3">
                                    {record.testName}
                                  </h3>
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                                    {record.sections.map(section => (
                                      <div key={section.name} className="text-center">
                                        <p className="text-sm font-medium text-gray-800 mb-1">{section.name}</p>
                                        {section.status === 'completed' ? (
                                          <p className="text-sm font-bold" style={{ color: themeColor }}>
                                            {section.correct} / {section.total}
                                          </p>
                                        ) : section.status === 'in-progress' ? (
                                          <p className="text-sm font-bold text-orange-500">In Progress</p>
                                        ) : (
                                          <p className="text-sm text-gray-400">--</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Right: timestamp and actions */}
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <span className="text-xs text-gray-500">{record.timestamp}</span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRestartClick(record.result)}
                                      className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all hover:shadow-md"
                                      style={{ backgroundColor: themeColor }}
                                    >
                                      <span className="flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3" />
                                        Restart
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => handleViewResults(record.result)}
                                      className="px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all hover:shadow-md"
                                      style={{ borderColor: themeColor, color: themeColor }}
                                    >
                                      <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        View Results
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Hidden on mobile & tablet, toggleable on desktop */}
        <>
          {showRightSidebar && (
            <div
              className="hidden lg:flex flex-col bg-white border-l border-gray-200 shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
              style={{ width: 288 }}
            >
              <div className="w-72 overflow-y-auto h-full">
                {/* User Profile Card */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: themeColor }}
                    >
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{studentName}</p>
                      <p className="text-xs text-gray-500">Test Date: --</p>
                      <p className="text-xs text-gray-500">Goal Score: --</p>
                    </div>
                  </div>

                  {/* Study Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Today</p>
                      <p className="text-base font-bold" style={{ color: themeColor }}>
                        {Math.round(effectiveResults.filter(r => {
                          const d = new Date(r.date);
                          return d.toDateString() === now.toDateString();
                        }).reduce((s, r) => s + (r.timeSpent || 0), 0) / 60)}min
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-base font-bold" style={{ color: themeColor }}>
                        {totalStudyDays} Days
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Streak</p>
                      <p className="text-base font-bold" style={{ color: themeColor }}>
                        {Math.min(totalStudyDays, 7)} Days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Calendar */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                        else setCalMonth(calMonth - 1);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-sm px-1"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-bold text-gray-900">
                      {calYear} {monthNames[calMonth]}
                    </span>
                    <button
                      onClick={() => {
                        if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                        else setCalMonth(calMonth + 1);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-sm px-1"
                    >
                      ›
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <span key={i} className="text-xs text-gray-400 font-medium py-1">{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {Array.from({ length: calStartOffset }).map((_, i) => (
                      <span key={`empty-${i}`} className="py-1.5" />
                    ))}
                    {Array.from({ length: calDaysInMonth }, (_, i) => i + 1).map(day => {
                      const isToday = calYear === currentYear && calMonth === currentMonth && day === currentDay;
                      const hasPractice = practiceDates.has(String(day));
                      return (
                        <span
                          key={day}
                          className={`py-1.5 text-xs rounded-full relative ${
                            isToday
                              ? 'font-bold text-white'
                              : hasPractice
                              ? 'font-bold'
                              : 'text-gray-700'
                          }`}
                          style={{
                            backgroundColor: isToday ? themeColor : undefined,
                            color: hasPractice && !isToday ? themeColor : undefined
                          }}
                        >
                          {day}
                          {hasPractice && !isToday && (
                            <span
                              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{ backgroundColor: themeColor }}
                            />
                          )}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" style={{ color: themeColor }} />
                      Practiced
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      Exam Day
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      </div>

      {/* Share Settings Modal */}
      {showShareSettings && (
        <ShareSettings
          themeColor={themeColor}
          config={shareConfig || { enabled: false, wechatEnabled: false, smsEnabled: false, autoSend: false }}
          onSave={(config) => {
            onShareConfigChange?.(config);
            setShowShareSettings(false);
          }}
          onClose={() => setShowShareSettings(false)}
        />
      )}

      {/* Score Results Modal - Modern Design */}
      {showScoreModal && selectedResult && (() => {
        const section = selectedResult.category
          || (selectedResult.testName.includes('Reading') ? 'Reading'
          : selectedResult.testName.includes('Listening') ? 'Listening'
          : selectedResult.testName.includes('Speaking') ? 'Speaking'
          : selectedResult.testName.includes('Writing') ? 'Writing'
          : 'General');
        const scorePercent = selectedResult.totalQuestions > 0
          ? Math.round((selectedResult.correctAnswers / selectedResult.totalQuestions) * 100)
          : 0;
        const wrongCount = selectedResult.totalQuestions - selectedResult.correctAnswers;
        const timeMin = selectedResult.timeSpent ? Math.floor(selectedResult.timeSpent / 60) : 0;
        const timeSec = selectedResult.timeSpent ? selectedResult.timeSpent % 60 : 0;
        const sectionColors: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
          Reading: { bg: 'bg-blue-50', text: 'text-blue-600', ring: '#3b82f6', icon: '📖' },
          Listening: { bg: 'bg-purple-50', text: 'text-purple-600', ring: '#8b5cf6', icon: '🎧' },
          Writing: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: '#10b981', icon: '✍️' },
          Speaking: { bg: 'bg-orange-50', text: 'text-orange-600', ring: '#f97316', icon: '🎤' },
          General: { bg: 'bg-gray-50', text: 'text-gray-600', ring: '#6b7280', icon: '📝' },
        };
        const sc = sectionColors[section] || sectionColors.General;
        const circumference = 2 * Math.PI * 54;
        const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6" onClick={() => setShowScoreModal(false)}>
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
              style={{ animation: 'fadeSlideUp 0.3s ease-out' }}
            >
              {/* Header */}
              <div className="relative px-5 md:px-8 pt-6 pb-4" style={{ background: `linear-gradient(135deg, ${sc.ring}15, ${sc.ring}08)` }}>
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{sc.icon}</span>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Test Results</h2>
                </div>
                <p className="text-sm text-gray-500">{selectedResult.testName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedResult.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-5 md:px-8">
                {[
                  { key: 'overview' as const, label: 'Score' },
                  { key: 'questions' as const, label: 'Questions' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveScoreTab(tab.key)}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                      activeScoreTab === tab.key
                        ? `border-current ${sc.text}`
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {activeScoreTab === 'overview' ? (
                  <div className="px-5 md:px-8 py-6">
                    {/* Score Circle + Stats */}
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                      {/* Donut */}
                      <div className="relative w-36 h-36 shrink-0">
                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                          <circle
                            cx="60" cy="60" r="54" fill="none"
                            stroke={sc.ring}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-gray-800">{scorePercent}%</span>
                          <span className="text-xs text-gray-400 font-medium">Score</span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                        <div className="bg-gray-50 rounded-2xl p-4 text-center">
                          <p className="text-2xl font-bold text-gray-800">{selectedResult.totalQuestions}</p>
                          <p className="text-xs text-gray-500 mt-1">Total</p>
                        </div>
                        <div className="bg-green-50 rounded-2xl p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{selectedResult.correctAnswers}</p>
                          <p className="text-xs text-gray-500 mt-1">Correct</p>
                        </div>
                        <div className="bg-red-50 rounded-2xl p-4 text-center">
                          <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
                          <p className="text-xs text-gray-500 mt-1">Wrong</p>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{timeMin > 0 ? `${timeMin}m` : `${timeSec}s`}</p>
                          <p className="text-xs text-gray-500 mt-1">Time</p>
                        </div>
                      </div>
                    </div>

                    {/* Section Score Bar */}
                    <div className={`${sc.bg} rounded-2xl p-5`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{sc.icon}</span>
                          <span className={`font-bold ${sc.text}`}>{section}</span>
                        </div>
                        <span className={`text-2xl font-black ${sc.text}`}>{selectedResult.score}</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${scorePercent}%`, backgroundColor: sc.ring }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{selectedResult.correctAnswers}/{selectedResult.totalQuestions} correct answers</p>
                    </div>

                    {/* Wrong Answers Summary */}
                    {wrongCount > 0 && (
                      <div className="mt-5">
                        <p className="text-sm font-semibold text-gray-700 mb-3">❌ Wrong Answers ({wrongCount})</p>
                        <div className="space-y-2">
                          {selectedResult.wrongAnswers.slice(0, 5).map((w, i) => (
                            <div key={i} className="flex items-start gap-3 bg-red-50/50 rounded-xl px-4 py-3">
                              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm text-gray-700 line-clamp-1">{w.questionText}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Your: <span className="text-red-500">{w.userAnswer || 'Omitted'}</span>
                                  {' → '}
                                  Correct: <span className="text-green-600">{w.correctAnswer}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                          {wrongCount > 5 && (
                            <button
                              onClick={() => setActiveScoreTab('questions')}
                              className={`w-full text-center text-sm font-medium ${sc.text} py-2 hover:underline`}
                            >
                              + {wrongCount - 5} more → View all questions
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Questions Tab */
                  <div className="px-5 md:px-8 py-4">
                    <div className="space-y-2">
                      {Array.from({ length: selectedResult.totalQuestions }, (_, i) => {
                        const qNum = i + 1;
                        const wrong = selectedResult.wrongAnswers.find(
                          (w, wi) => w.questionId === String(qNum) || w.questionId === `q${qNum}` || wi === i - selectedResult.correctAnswers
                        );
                        const isWrong = !!wrong || i >= selectedResult.correctAnswers;
                        const isExpanded = expandedQuestion === i;

                        return (
                          <div key={qNum} className={`rounded-xl border transition-all ${isExpanded ? 'border-gray-200 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                            <button
                              onClick={() => setExpandedQuestion(isExpanded ? null : i)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left"
                            >
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isWrong ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                              }`}>
                                {qNum}
                              </span>
                              <span className="flex-1 text-sm text-gray-700 truncate">
                                {wrong?.questionText || (isWrong ? 'Question ' + qNum : 'Question ' + qNum)}
                              </span>
                              {isWrong ? (
                                <X className="w-4 h-4 text-red-400 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              )}
                              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                                {wrong ? (
                                  <>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Question</p>
                                      <p className="text-sm text-gray-800">{wrong.questionText}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-red-50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-red-400 mb-1">Your Answer</p>
                                        <p className="text-sm text-red-600 font-medium">{wrong.userAnswer || 'Omitted'}</p>
                                      </div>
                                      <div className="bg-green-50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-green-500 mb-1">Correct Answer</p>
                                        <p className="text-sm text-green-700 font-medium">{wrong.correctAnswer}</p>
                                      </div>
                                    </div>
                                    {wrong.explanation && (
                                      <div className="bg-blue-50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-blue-500 mb-1">💡 Explanation</p>
                                        <p className="text-sm text-gray-700">{wrong.explanation}</p>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <p className="text-sm font-medium">Correct! Well done.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-5 md:px-8 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: themeColor }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Restart Confirm Modal */}
      {showRestartModal && restartTarget && (
        <RestartConfirmModal
          themeColor={themeColor}
          result={restartTarget}
          onContinue={handleRestartContinue}
          onStartFresh={handleRestartFresh}
          onClose={() => {
            setShowRestartModal(false);
            setRestartTarget(null);
          }}
        />
      )}
    </div>
  );
}