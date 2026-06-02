import { useState, useMemo } from 'react';
import { BarChart3, Clock, CheckCircle, XCircle, RotateCcw, ChevronRight, Calendar, Share2, Settings, TrendingUp, ChevronDown, BookOpen, Star, ChevronLeft, CheckCircle2, Flame, Eye, MessageCircle, PanelRightOpen, PanelRightClose, User, Trash2 } from 'lucide-react';
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
  onDeleteResult?: (resultId: string) => void;
  shareConfig?: ShareConfig;
  onShareConfigChange?: (config: ShareConfig) => void;
  studentName?: string;
  advertisements?: any[];
  isLoggedIn?: boolean;
  onRequestLogin?: () => void;
}

type TabType = 'TPO' | 'Test' | 'Training' | 'Wrong Answers' | 'Report';
type NavType = 'records';
type TimeFilter = 'all' | 'today' | '7days' | '1month' | '3months';
type StatusFilter = 'all' | 'completed' | 'incomplete';

// Sample data shown when no real results exist
const SAMPLE_RESULTS: TestResult[] = [];

export function HistorySection({ 
  themeColor = '#005f61',
  results = [],
  tpoTests = [],
  onRetryWrongAnswers,
  onRestartTest,
  onViewDetail,
  onDeleteResult,
  shareConfig,
  onShareConfigChange,
  studentName = 'Student',
  advertisements = [],
  isLoggedIn = true,
  onRequestLogin
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
  const [reviewInitialSection, setReviewInitialSection] = useState<'Reading' | 'Listening' | 'Writing' | 'Speaking'>('Reading');
  const [reviewInitialIndex, setReviewInitialIndex] = useState(0);
  // Score modal section nav state
  const [scoreModalSection, setScoreModalSection] = useState<'Reading' | 'Listening' | 'Writing' | 'Speaking'>('Reading');
  const [scoreModalModule, setScoreModalModule] = useState<1 | 2>(1);

  // Restart confirm modal
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartTarget, setRestartTarget] = useState<TestResult | null>(null);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TestResult | null>(null);

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
  // Don't show sample results to logged-out users
  // Show only this student's own results (matched by ownerName)
  const myResults = isLoggedIn
    ? results.filter(r => r.ownerName === studentName)
    : [];
  const effectiveResults = isLoggedIn ? (myResults.length > 0 ? myResults : SAMPLE_RESULTS) : [];

  // Ads
  const activeAds = (advertisements as Advertisement[])?.filter(ad =>
    ad.isActive && ad.locations?.includes('History')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const tabs: TabType[] = ['TPO', 'Test', 'Training', 'Wrong Answers', 'Report'];

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
    // Determine initial section from result
    const sec = (result.category as any) ||
      (result.testName.includes('Reading') ? 'Reading'
      : result.testName.includes('Listening') ? 'Listening'
      : result.testName.includes('Speaking') ? 'Speaking'
      : result.testName.includes('Writing') ? 'Writing'
      : 'Reading');
    setScoreModalSection(sec);
    setScoreModalModule(1);
    setShowScoreModal(true);
  };

  // Jump to QuestionReviewFull at a specific section + question index
  const handleJumpToQuestion = (section: 'Reading' | 'Listening' | 'Writing' | 'Speaking', index: number) => {
    setReviewInitialSection(section);
    setReviewInitialIndex(index);
    setShowScoreModal(false);
    setShowQuestionReview(true);
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

  const handleDeleteClick = (result: TestResult) => {
    setDeleteTarget(result);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteResult?.(deleteTarget.id);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleBackFromReview = () => {
    setShowQuestionReview(false);
  };

  // Full-screen Question Review
  // Login required guard — History is for registered students only
  if (!isLoggedIn) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#f5f7fa] -mx-2 md:-mx-4 -mb-4 md:-mb-12">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
            <User className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요해요</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            학습 기록(History)은 등록된 학생만 확인할 수 있어요.<br/>
            로그인하시면 본인의 TPO·Test·Training 응시 기록과 점수, 오답 노트를 모두 볼 수 있습니다.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => onRequestLogin?.()}
              className="w-full px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              로그인하기
            </button>
            <p className="text-xs text-gray-400 mt-3">
              계정이 없으신가요? 담당 강사에게 학생 등록을 요청해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showQuestionReview && selectedResult) {
    return (
      <QuestionReviewFull
        result={selectedResult}
        tpoTests={tpoTests}
        onBack={handleBackFromReview}
        themeColor={themeColor}
        initialSection={reviewInitialSection}
        initialIndex={reviewInitialIndex}
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
                                <button
                                  onClick={() => handleDeleteClick(record.result)}
                                  className="px-2 py-1.5 rounded-lg text-xs font-bold border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                                  title="기록 삭제"
                                  aria-label="기록 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
                                    <button
                                      onClick={() => handleDeleteClick(record.result)}
                                      className="px-3 py-2 rounded-lg text-xs font-bold border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all"
                                      title="기록 삭제"
                                      aria-label="기록 삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
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

      {/* Score Results Modal — Section Tabs + Q-number jump */}
      {showScoreModal && selectedResult && (() => {
        const sections: ('Reading' | 'Listening' | 'Writing' | 'Speaking')[] = ['Reading', 'Listening', 'Writing', 'Speaking'];
        const sectionIcons: Record<string, string> = { Reading: '📖', Listening: '🎧', Writing: '✍️', Speaking: '🎤' };
        const sectionColors: Record<string, string> = { Reading: '#3b82f6', Listening: '#8b5cf6', Writing: '#10b981', Speaking: '#f97316' };

        // Find related results for the same TPO
        const testNum = selectedResult.testNumber;
        const testPrefix = selectedResult.testName.replace(/\s*-\s*(Reading|Listening|Writing|Speaking).*/i, '');
        const relatedResults: Record<string, TestResult> = {};
        results.forEach(r => {
          if ((testNum && r.testNumber === testNum) || r.testName.startsWith(testPrefix)) {
            const sec = r.category || (
              r.testName.includes('Reading') ? 'Reading'
              : r.testName.includes('Listening') ? 'Listening'
              : r.testName.includes('Writing') ? 'Writing'
              : r.testName.includes('Speaking') ? 'Speaking' : '');
            if (sec) relatedResults[sec] = r;
          }
        });
        // Also include the selected result itself
        const selfSec = selectedResult.category || (
          selectedResult.testName.includes('Reading') ? 'Reading'
          : selectedResult.testName.includes('Listening') ? 'Listening'
          : selectedResult.testName.includes('Writing') ? 'Writing'
          : selectedResult.testName.includes('Speaking') ? 'Speaking' : 'Reading');
        if (!relatedResults[selfSec]) relatedResults[selfSec] = selectedResult;

        const curResult = relatedResults[scoreModalSection] || null;

        // === Get question count from CMS (TPO data) for accurate question count ===
        // Default counts per section if CMS data unavailable
        const defaultCounts: Record<string, number> = { Reading: 20, Listening: 28, Writing: 2, Speaking: 4 };

        // Pick CMS bank based on test type
        const cmsBanks = [...(tpoTests || [])];
        const cmsTpo = cmsBanks?.find((t: any) => t.testNumber === selectedResult.testNumber);
        const cmsSection = cmsTpo?.sections?.find((s: any) => s.sectionType === scoreModalSection);
        const allCmsQuestions = cmsSection?.questions || [];

        // Reading and Listening have Module 1 / Module 2 split
        const hasModules = scoreModalSection === 'Reading' || scoreModalSection === 'Listening';

        // Filter by module if applicable (CMS uses 'Module 2' string in questionType to mark Module 2)
        const moduleFilteredCmsQuestions = hasModules
          ? allCmsQuestions.filter((q: any) => {
              const isM2 = (q.questionType || '').includes('Module 2');
              return scoreModalModule === 2 ? isM2 : !isM2;
            })
          : allCmsQuestions;

        // Calculate true question count: FillBlanks/Complete Words count as their blank count
        const cmsQuestionCount = moduleFilteredCmsQuestions.reduce((sum: number, q: any) => {
          const qt = (q.questionType || '').toLowerCase();
          const isFillBlanks = qt.includes('complete words') || qt.includes('fill in the blank') || qt.includes('cloze');
          if (isFillBlanks && Array.isArray(q.blanks) && q.blanks.length > 0) {
            return sum + q.blanks.length;
          }
          return sum + 1;
        }, 0);

        // Priority: CMS count > result.totalQuestions > default
        const totalQ = cmsQuestionCount > 0
          ? cmsQuestionCount
          : (hasModules
              ? Math.ceil((curResult?.totalQuestions || defaultCounts[scoreModalSection] || 0) / 2)
              : (curResult?.totalQuestions || defaultCounts[scoreModalSection] || 0));
        const correctQ = curResult?.correctAnswers || 0;
        const wrongQ = Math.max(0, totalQ - correctQ);
        const color = sectionColors[scoreModalSection];

        // Build per-question correctness (use module question offset for accurate Q numbering)
        const moduleOffset = hasModules && scoreModalModule === 2
          ? (allCmsQuestions.filter((q: any) => !(q.questionType || '').includes('Module 2')).length || 0)
          : 0;
        const qList = Array.from({ length: totalQ }, (_, i) => {
          const qNum = i + 1;
          const globalQNum = moduleOffset + qNum;
          const wrong = curResult?.wrongAnswers.find(
            w => w.questionId === String(globalQNum) || parseInt(w.questionId) === globalQNum
          );
          const isWrong = wrong ? true : (curResult ? i >= correctQ : false);
          return { qNum, globalQNum, isWrong, wrong };
        });

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6"
            onClick={() => setShowScoreModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedResult.testName}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedResult.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <button onClick={() => setShowScoreModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Section Tabs */}
              <div className="flex border-b border-gray-100 overflow-x-auto px-2 md:px-4">
                {sections.map(sec => {
                  const isActive = scoreModalSection === sec;
                  const secRes = relatedResults[sec];
                  const sc = sectionColors[sec];
                  // CMS-based question count for this section
                  const secCmsSection = cmsTpo?.sections?.find((s: any) => s.sectionType === sec);
                  const secCmsCount = secCmsSection?.questions?.length || 0;
                  const secTotal = secCmsCount > 0 ? secCmsCount : (secRes?.totalQuestions || defaultCounts[sec] || 0);
                  return (
                    <button key={sec}
                      onClick={() => { setScoreModalSection(sec); setScoreModalModule(1); }}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                        isActive ? '' : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                      style={isActive ? { color: sc, borderBottomColor: sc } : {}}>
                      <span className="text-base">{sectionIcons[sec]}</span>
                      <span>{sec}</span>
                      {secRes ? (
                        <span className="text-[10px] font-normal ml-1 opacity-70">
                          {secRes.correctAnswers}/{secTotal}
                        </span>
                      ) : secCmsCount > 0 && (
                        <span className="text-[10px] font-normal ml-1 opacity-50">
                          —/{secTotal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {!curResult && cmsQuestionCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <span className="text-4xl mb-3">{sectionIcons[scoreModalSection]}</span>
                    <p className="text-sm font-medium">No {scoreModalSection} data</p>
                    <p className="text-xs mt-1">This section has not been completed yet</p>
                  </div>
                ) : (
                  <>
                    {/* Score Summary */}
                    <div className="grid grid-cols-3 gap-3 px-5 md:px-6 pt-5 pb-4">
                      {[
                        { label: 'Total', value: totalQ, color: 'text-gray-800', bg: 'bg-gray-50' },
                        { label: 'Correct', value: correctQ, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Wrong', value: wrongQ, color: 'text-red-500', bg: 'bg-red-50' },
                      ].map(({ label, value, color: c, bg }) => (
                        <div key={label} className={`${bg} rounded-xl py-4 text-center`}>
                          <p className={`text-3xl font-bold ${c}`}>{value}</p>
                          <p className="text-xs text-gray-500 mt-1">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Q-number grid — click to jump to that question in QuestionReviewFull */}
                    <div className="px-5 md:px-6 pb-2">
                      {/* Module toggle for Reading/Listening */}
                      {hasModules && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Module</span>
                          {[1, 2].map(mod => {
                            const isActive = scoreModalModule === mod;
                            return (
                              <button
                                key={mod}
                                onClick={() => setScoreModalModule(mod as 1 | 2)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                  isActive
                                    ? 'text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                                style={isActive ? { backgroundColor: color } : {}}
                              >
                                Module {mod}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        문제를 클릭하면 해당 문제로 바로 이동해요
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {qList.map(({ qNum, globalQNum, isWrong }) => (
                          <button
                            key={qNum}
                            onClick={() => handleJumpToQuestion(scoreModalSection, globalQNum - 1)}
                            className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center transition-all hover:scale-110 shadow-sm ${
                              isWrong
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={`Q${qNum} (전체 ${globalQNum}번) — ${isWrong ? 'Wrong' : 'Correct'} · Click to review`}
                          >
                            {qNum}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wrong answers list */}
                    {curResult && curResult.wrongAnswers.length > 0 && (
                      <div className="px-5 md:px-6 py-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">오답 목록</p>
                        <div className="space-y-2">
                          {curResult.wrongAnswers.map((w, i) => {
                            const isBlank = w.questionId?.startsWith('blank-');
                            const displayNum = isBlank
                              ? parseInt(w.questionId.replace('blank-', '')) || i + 1
                              : parseInt(w.questionId) || i + 1;
                            const idx = displayNum - 1;
                            return (
                              <button key={i}
                                onClick={() => handleJumpToQuestion(scoreModalSection, idx)}
                                className="w-full flex items-center gap-3 bg-red-50 hover:bg-red-100 rounded-xl px-4 py-3 text-left transition-all group">
                                <span className="w-7 h-7 rounded-full bg-red-200 text-red-700 text-xs font-bold flex items-center justify-center shrink-0">
                                  {isBlank ? `B${displayNum}` : displayNum}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700 truncate">{w.questionText || `Question ${w.questionId}`}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    내 답: <span className="text-red-500">{w.userAnswer || 'Omitted'}</span>
                                    {' → '}정답: <span className="text-green-600">{w.correctAnswer}</span>
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400 group-hover:text-gray-600 shrink-0">리뷰 →</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 md:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">문제 번호를 클릭하면 실전 리뷰 화면으로 이동해요</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowScoreModal(false); setReviewInitialSection(scoreModalSection); setReviewInitialIndex(0); setShowQuestionReview(true); }}
                    className="px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:opacity-80"
                    style={{ borderColor: color, color }}>
                    전체 리뷰
                  </button>
                  <button
                    onClick={() => setShowScoreModal(false)}
                    className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                    style={{ backgroundColor: themeColor }}>
                    닫기
                  </button>
                </div>
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

      {/* Delete Confirm Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleDeleteCancel}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900">기록 삭제</h3>
                  <p className="text-xs text-gray-500 mt-0.5">이 작업은 되돌릴 수 없어요</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-bold text-gray-900">{deleteTarget.testName}</span>{' '}
                기록을 삭제할까요?
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(deleteTarget.date).toLocaleString('ko-KR')} · 점수 {deleteTarget.score}점
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleDeleteCancel}
                className="px-5 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}