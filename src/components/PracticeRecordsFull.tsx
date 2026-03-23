import { useState, useMemo } from 'react';
// motion removed - using CSS animations
import { ChevronLeft, BookOpen, Star, Calendar, CheckCircle2, Clock, User, Flame, TrendingUp, RotateCcw, Eye } from 'lucide-react';
import { TestResult } from './HistorySection';

type TimeFilter = 'all' | 'today' | '7days' | '1month' | '3months';
type StatusFilter = 'all' | 'completed' | 'incomplete';

// Sample data for Practice Records when no real results exist
const SAMPLE_PRACTICE_RECORDS: TestResult[] = [
  {
    id: 'pr-sample-1',
    type: 'TPO',
    category: 'Reading',
    testName: 'TPO 75 - Full Practice',
    date: '2026-03-08T14:30:00',
    score: 96,
    totalQuestions: 30,
    correctAnswers: 27,
    wrongAnswers: [
      { questionId: 'q1', questionText: 'The word "ubiquitous" is closest in meaning to', userAnswer: 'rare', correctAnswer: 'widespread', explanation: 'Ubiquitous means existing everywhere.' },
      { questionId: 'q2', questionText: 'Which is true about coral reefs?', userAnswer: 'They grow in cold water', correctAnswer: 'They require warm, shallow water', explanation: 'Coral reefs thrive in warm, shallow waters.' },
      { questionId: 'q3', questionText: 'What can be inferred about migration?', userAnswer: 'All species migrate seasonally', correctAnswer: 'Migration is influenced by multiple factors', explanation: 'Temperature, food, and daylight hours all matter.' },
    ],
    timeSpent: 2340,
  },
];

interface PracticeRecordsFullProps {
  results: TestResult[];
  onBack: () => void;
  onViewResults: (result: TestResult) => void;
  onRetry: (result: TestResult) => void;
  studentName?: string;
  themeColor?: string;
}

// Extended record for display
interface DisplayRecord {
  id: string;
  testName: string;
  date: string;
  timestamp: string;
  sections: {
    name: string;
    status: 'completed' | 'in-progress' | 'not-started';
    correct?: number;
    total?: number;
  }[];
  result: TestResult;
}

export function PracticeRecordsFull({
  results,
  onBack,
  onViewResults,
  onRetry,
  studentName = 'Student',
  themeColor = '#005f61'
}: PracticeRecordsFullProps) {
  // Use sample data as fallback when no real results
  const effectiveResults = results.length > 0 ? results : SAMPLE_PRACTICE_RECORDS;

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeNav, setActiveNav] = useState<'records' | 'bookmarks'>('records');

  // Current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // Calendar data
  const [calYear, setCalYear] = useState(currentYear);
  const [calMonth, setCalMonth] = useState(currentMonth);

  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  // Adjust for Monday start
  const calStartOffset = calFirstDay === 0 ? 6 : calFirstDay - 1;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Convert results to display records
  const displayRecords: DisplayRecord[] = useMemo(() => {
    return effectiveResults.map(r => {
      const date = new Date(r.date);
      const sections: DisplayRecord['sections'] = [];

      // Determine sections based on category
      const allSections = ['Reading', 'Listening', 'Writing', 'Speaking'];
      allSections.forEach(s => {
        if (r.category === s) {
          sections.push({
            name: s,
            status: 'completed',
            correct: r.correctAnswers,
            total: r.totalQuestions
          });
        } else {
          sections.push({
            name: s,
            status: 'not-started'
          });
        }
      });

      return {
        id: r.id,
        testName: r.testName,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        timestamp: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        sections,
        result: r
      };
    });
  }, [effectiveResults]);

  // Filter by time
  const timeFiltered = useMemo(() => {
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

  // Filter by status
  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return timeFiltered;
    return timeFiltered.filter(r => {
      const hasCompleted = r.sections.some(s => s.status === 'completed');
      const allCompleted = r.sections.filter(s => s.status !== 'not-started').every(s => s.status === 'completed');
      if (statusFilter === 'completed') return hasCompleted && allCompleted;
      return !allCompleted;
    });
  }, [timeFiltered, statusFilter]);

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

  const totalStudyMinutes = useMemo(() => {
    return Math.round(effectiveResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / 60);
  }, [effectiveResults]);

  // Dates with practice
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

  return (
    <div className="fixed inset-0 bg-[#f5f7fa] z-50 overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Practice Records</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden md:flex flex-col w-48 bg-white border-r border-gray-200 shrink-0">
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveNav('records')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeNav === 'records'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={{ backgroundColor: activeNav === 'records' ? themeColor : undefined }}
            >
              <BookOpen className="w-4 h-4" />
              Exam Records
            </button>
            <button
              onClick={() => setActiveNav('bookmarks')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeNav === 'bookmarks'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={{ backgroundColor: activeNav === 'bookmarks' ? themeColor : undefined }}
            >
              <Star className="w-4 h-4" />
              Bookmarks
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Filters */}
          <div className="mb-6 space-y-3">
            {/* Time Filter */}
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
            {/* Status Filter */}
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
                  {/* Date Header */}
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {date}
                  </h2>

                  {/* Record Cards */}
                  <div className="space-y-3">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-[fadeSlideUp_0.3s_ease-out]"
                      >
                        <div className="p-4 md:p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Left: Test info */}
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-gray-900 mb-3">
                                {record.testName}
                              </h3>
                              {/* Sections grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
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
                                  onClick={() => onRetry(record.result)}
                                  className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all hover:shadow-md"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  <span className="flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" />
                                    Restart
                                  </span>
                                </button>
                                <button
                                  onClick={() => onViewResults(record.result)}
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
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex flex-col w-72 bg-white border-l border-gray-200 shrink-0 overflow-y-auto">
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
            {/* Calendar Header */}
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

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-xs text-gray-400 font-medium py-1">{d}</span>
              ))}
            </div>

            {/* Calendar Days */}
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

            {/* Legend */}
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
    </div>
  );
}