import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Award, 
  Target, 
  BookOpen, 
  BarChart3, 
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  AlertTriangle,
  Star,
  Zap
} from 'lucide-react';
import { TestResult } from './HistorySection';
import { ShareConfig } from './ShareSettings';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface ReportSectionProps {
  themeColor?: string;
  results: TestResult[];
  shareConfig?: ShareConfig;
  onShareConfigChange?: (config: ShareConfig) => void;
  studentName?: string;
  onOpenShareSettings?: () => void;
}

type MonthData = {
  month: string;
  monthKey: string;
  year: number;
  results: TestResult[];
  totalTests: number;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
};

export function ReportSection({ 
  themeColor = '#005f61',
  results = [],
  shareConfig,
  onShareConfigChange,
  studentName,
  onOpenShareSettings
}: ReportSectionProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [messageToParent, setMessageToParent] = useState('');

  // Build share message
  const buildShareMessage = (monthData: MonthData) => {
    const accuracy = monthData.totalQuestions > 0 ? Math.round((monthData.correctAnswers / monthData.totalQuestions) * 100) : 0;
    const bestScore = monthData.results.length > 0 ? Math.max(...monthData.results.map(r => r.score)) : 0;
    const worstScore = monthData.results.length > 0 ? Math.min(...monthData.results.map(r => r.score)) : 0;
    
    const typeCount = {
      TPO: monthData.results.filter(r => r.type === 'TPO').length,
      Test: monthData.results.filter(r => r.type === 'Test').length,
      Vocabulary: monthData.results.filter(r => r.type === 'Vocabulary').length,
      'Question Types': monthData.results.filter(r => r.type === 'Question Types').length,
    };

    const categoryAvg: { [key: string]: { correct: number; total: number } } = {};
    monthData.results.forEach(r => {
      const cat = r.category || r.type;
      if (!categoryAvg[cat]) categoryAvg[cat] = { correct: 0, total: 0 };
      categoryAvg[cat].correct += r.correctAnswers;
      categoryAvg[cat].total += r.totalQuestions;
    });

    let categoryDetails = '';
    Object.entries(categoryAvg).forEach(([cat, data]) => {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      categoryDetails += `\n  • ${cat}: ${pct}%`;
    });

    return `[${shareConfig?.parentName || 'Parent'}]

${studentName ? `Student: ${studentName}\n` : ''}${monthData.month} Study Report

━━━━━━━━━━━━━━━━
Study Session Summary
━━━━━━━━━━━━━━━━
• TPO Mock Tests: ${typeCount.TPO} times
• Practice Tests: ${typeCount.Test} times
• Vocabulary Study: ${typeCount.Vocabulary} times
• Question Type Practice: ${typeCount['Question Types']} times

━━━━━━━━━━━━━━━━
Score Analysis
━━━━━━━━━━━━━━━━
• Average Score: ${monthData.averageScore}
• Best Score: ${bestScore}
• Lowest Score: ${worstScore}
• Overall Accuracy: ${accuracy}%
• Total Questions: ${monthData.totalQuestions}
• Study Time: ${formatTimeStr(monthData.timeSpent)}

━━━━━━━━━━━━━━━━
Section Performance
━━━━━━━━━━━━━━━━${categoryDetails}
${messageToParent.trim() ? `\n━━━━━━━━━━━━━━━━\nStudent Message\n━━━━━━━━━━━━━━━━\n${messageToParent.trim()}` : ''}

- TOEFL TPO Practice Platform`;
  };

  // Share handlers
  const handleCopyText = (monthData: MonthData) => {
    const text = buildShareMessage(monthData);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Report copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy.');
    });
  };

  const handleShareEmail = (monthData: MonthData) => {
    const text = buildShareMessage(monthData);
    const subject = encodeURIComponent(`${monthData.month} TOEFL Study Report`);
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success('Opening email app.');
  };

  const handleShareWeChat = (monthData: MonthData) => {
    const text = buildShareMessage(monthData);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Report copied! Paste it in WeChat.', {
        description: 'Share your learning progress with parents.'
      });
    }).catch(() => {
      toast.error('Failed to copy.');
    });
  };

  // Group results by month
  const monthlyData = useMemo(() => {
    const grouped: { [key: string]: TestResult[] } = {};
    
    results.forEach(result => {
      const date = new Date(result.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(result);
    });

    const monthsArray: MonthData[] = Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthResults = grouped[monthKey];
        const totalTests = monthResults.length;
        const totalQuestions = monthResults.reduce((sum, r) => sum + r.totalQuestions, 0);
        const correctAnswers = monthResults.reduce((sum, r) => sum + r.correctAnswers, 0);
        const averageScore = Math.round(monthResults.reduce((sum, r) => sum + r.score, 0) / totalTests);
        const timeSpent = monthResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0);

        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          monthKey,
          year: parseInt(year),
          results: monthResults,
          totalTests,
          averageScore,
          totalQuestions,
          correctAnswers,
          timeSpent
        };
      });

    return monthsArray;
  }, [results]);

  const currentMonth = monthlyData[selectedMonthIndex];

  // Category breakdown for area-based performance
  const categoryBreakdown = useMemo(() => {
    if (!currentMonth) return [];
    const breakdown: { [key: string]: { correct: number; total: number; count: number } } = {};
    
    currentMonth.results.forEach(result => {
      const category = result.category || 'General';
      if (!breakdown[category]) breakdown[category] = { correct: 0, total: 0, count: 0 };
      breakdown[category].correct += result.correctAnswers;
      breakdown[category].total += result.totalQuestions;
      breakdown[category].count++;
    });

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      correct: data.correct,
      total: data.total,
      count: data.count
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [currentMonth]);

  // Auto analysis
  const autoAnalysis = useMemo(() => {
    if (!categoryBreakdown.length) return { best: null, worst: null };
    const sorted = [...categoryBreakdown].sort((a, b) => b.accuracy - a.accuracy);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return { best, worst: worst !== best ? worst : null };
  }, [categoryBreakdown]);

  // Overall evaluation
  const overallEval = useMemo(() => {
    if (!currentMonth) return '';
    const accuracy = currentMonth.totalQuestions > 0 
      ? Math.round((currentMonth.correctAnswers / currentMonth.totalQuestions) * 100) : 0;
    
    const typeCount = {
      TPO: currentMonth.results.filter(r => r.type === 'TPO').length,
      Test: currentMonth.results.filter(r => r.type === 'Test').length,
    };

    const bestCat = autoAnalysis.best;
    const worstCat = autoAnalysis.worst;

    let eval_ = `Through ${currentMonth.totalTests} test sessions, a consistent study habit is evident. `;
    eval_ += `With an average accuracy of ${accuracy}%, `;
    if (accuracy >= 80) {
      eval_ += 'scores are being maintained at a stable level. ';
    } else if (accuracy >= 60) {
      eval_ += 'performance is satisfactory, but setting higher goals is recommended. ';
    } else {
      eval_ += 'foundational skills are being built, and consistent practice is needed. ';
    }

    if (bestCat) {
      eval_ += `Outstanding performance of ${bestCat.accuracy}% in the ${bestCat.category} section. `;
    }
    if (worstCat) {
      eval_ += `More focused study in ${worstCat.category} could lead to significant overall improvement.`;
    }

    return eval_;
  }, [currentMonth, autoAnalysis]);

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="flex justify-center mb-4">
          <BarChart3 className="w-16 h-16 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Study Report Available</h3>
        <p className="text-gray-500">Complete a test to view your monthly study report.</p>
      </div>
    );
  }

  if (!currentMonth) return null;

  const accuracy = currentMonth.totalQuestions > 0 
    ? Math.round((currentMonth.correctAnswers / currentMonth.totalQuestions) * 100) : 0;
  const bestScore = Math.max(...currentMonth.results.map(r => r.score));
  const worstScore = Math.min(...currentMonth.results.map(r => r.score));

  const typeCount = {
    TPO: currentMonth.results.filter(r => r.type === 'TPO').length,
    Test: currentMonth.results.filter(r => r.type === 'Test').length,
    'Question Types': currentMonth.results.filter(r => r.type === 'Question Types').length,
    Vocabulary: currentMonth.results.filter(r => r.type === 'Vocabulary').length,
  };

  const formatDate = () => {
    const now = new Date();
    return `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}.`;
  };

  // Get color for progress bar based on accuracy
  const getBarColor = (acc: number) => {
    if (acc >= 80) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (acc >= 60) return 'bg-gradient-to-r from-yellow-400 to-orange-400';
    if (acc >= 40) return 'bg-gradient-to-r from-orange-400 to-red-400';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  // Get badge color
  const getBadgeStyle = (acc: number): { bg: string; text: string; label: string } => {
    if (acc >= 80) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Excellent' };
    if (acc >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Good' };
    if (acc >= 40) return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Fair' };
    return { bg: 'bg-red-100', text: 'text-red-700', label: 'Needs Work' };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-5 pb-8">
      {/* ===== Header Card ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar Icon */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00cfe8] to-[#005f61] flex items-center justify-center shadow-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Study Report</h1>
              <p className="text-xs text-gray-500">Monthly Progress Report</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Generated</p>
            <p className="text-sm font-bold text-gray-700">{formatDate()}</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedMonthIndex(Math.min(selectedMonthIndex + 1, monthlyData.length - 1))}
            disabled={selectedMonthIndex >= monthlyData.length - 1}
            className="text-gray-500 hover:text-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs">Prev</span>
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: themeColor }} />
            <span className="text-base font-bold" style={{ color: themeColor }}>{currentMonth.month}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedMonthIndex(Math.max(selectedMonthIndex - 1, 0))}
            disabled={selectedMonthIndex <= 0}
            className="text-gray-500 hover:text-gray-800"
          >
            <span className="text-xs">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ===== 학습 횟수 요약 ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-lg">📝</span> Study Session Summary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* TPO 모의고사 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <p className="text-[11px] text-blue-600 font-medium mb-1">TPO Mock Tests</p>
            <p className="text-3xl font-extrabold text-blue-700">
              {typeCount.TPO}<span className="text-base font-bold text-blue-500 ml-0.5">x</span>
            </p>
            <p className="text-[10px] text-blue-400 mt-0.5">Avg {typeCount.TPO > 0 ? Math.round(currentMonth.results.filter(r => r.type === 'TPO').reduce((s, r) => s + r.score, 0) / typeCount.TPO) : 0} pts</p>
          </div>
          {/* 실전 테스트 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <p className="text-[11px] text-purple-600 font-medium mb-1">Practice Tests</p>
            <p className="text-3xl font-extrabold text-purple-700">
              {typeCount.Test}<span className="text-base font-bold text-purple-500 ml-0.5">x</span>
            </p>
            <p className="text-[10px] text-purple-400 mt-0.5">Avg {typeCount.Test > 0 ? Math.round(currentMonth.results.filter(r => r.type === 'Test').reduce((s, r) => s + r.score, 0) / typeCount.Test) : 0} pts</p>
          </div>
          {/* 어휘 학습 */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <p className="text-[11px] text-green-600 font-medium mb-1">Vocabulary Study</p>
            <p className="text-3xl font-extrabold text-green-700">
              {typeCount.Vocabulary}<span className="text-base font-bold text-green-500 ml-0.5">x</span>
            </p>
            <p className="text-[10px] text-green-400 mt-0.5">Avg {typeCount.Vocabulary > 0 ? Math.round(currentMonth.results.filter(r => r.type === 'Vocabulary').reduce((s, r) => s + r.score, 0) / typeCount.Vocabulary) : 0} pts</p>
          </div>
          {/* 문제 유형 연습 */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
            <p className="text-[11px] text-amber-600 font-medium mb-1">Question Type Practice</p>
            <p className="text-3xl font-extrabold text-amber-700">
              {typeCount['Question Types']}<span className="text-base font-bold text-amber-500 ml-0.5">x</span>
            </p>
            <p className="text-[10px] text-amber-400 mt-0.5">Avg {typeCount['Question Types'] > 0 ? Math.round(currentMonth.results.filter(r => r.type === 'Question Types').reduce((s, r) => s + r.score, 0) / typeCount['Question Types']) : 0} pts</p>
          </div>
        </div>
      </div>

      {/* ===== 성적 분석 ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-lg">📊</span> Score Analysis
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {/* 평균 점수 */}
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] text-gray-500 mb-1">Avg Score</p>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-800">{currentMonth.averageScore}</p>
          </div>
          {/* 최고 점수 */}
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] text-gray-500 mb-1">Best Score</p>
            <p className="text-2xl md:text-3xl font-extrabold text-blue-600">{bestScore}</p>
          </div>
          {/* 최저 점수 */}
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] text-gray-500 mb-1">Lowest Score</p>
            <p className="text-2xl md:text-3xl font-extrabold text-orange-500">{worstScore}</p>
          </div>
          {/* 전체 정답률 */}
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] text-gray-500 mb-1">Accuracy</p>
            <p className="text-2xl md:text-3xl font-extrabold" style={{ color: themeColor }}>{accuracy}%</p>
          </div>
          {/* 총 문제 수 */}
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] text-gray-500 mb-1">Total Qs</p>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-800">{currentMonth.totalQuestions}</p>
          </div>
          {/* 학습 시간 */}
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <p className="text-[10px] text-gray-500 mb-1">Study Time</p>
            <p className="text-2xl md:text-3xl font-extrabold text-gray-800">{formatTimeShort(currentMonth.timeSpent)}</p>
          </div>
        </div>
      </div>

      {/* ===== 영역별 성적 ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-lg">📚</span> Section Performance
        </h2>
        <div className="space-y-4">
          {categoryBreakdown.length > 0 ? categoryBreakdown.map((item, index) => {
            const badge = getBadgeStyle(item.accuracy);
            return (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{item.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {item.accuracy}% <span className="text-[10px] text-gray-400">({item.count}x)</span>
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getBarColor(item.accuracy)} transition-all duration-700`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            );
          }) : (
            <p className="text-sm text-gray-400 text-center py-4">No section data available.</p>
          )}
        </div>
      </div>

      {/* ===== 자동 분석 ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-lg">⚡</span> Auto Analysis
        </h2>
        <div className="space-y-3">
          {/* 우수 영역 */}
          {autoAnalysis.best && (
            <div className="border-l-4 border-green-500 bg-green-50 rounded-r-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-green-700">Strength: {autoAnalysis.best.category} ({autoAnalysis.best.accuracy}%)</span>
              </div>
              <p className="text-xs text-green-600 leading-relaxed">
                Showing excellent performance in {autoAnalysis.best.category}.
                {autoAnalysis.best.accuracy >= 80 
                  ? ' Consistently maintaining high accuracy with strong skills.' 
                  : ' Good results, but setting higher goals is recommended.'}
              </p>
            </div>
          )}
          {/* 취약 영역 */}
          {autoAnalysis.worst && (
            <div className="border-l-4 border-red-400 bg-red-50 rounded-r-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-600">Weakness: {autoAnalysis.worst.category} ({autoAnalysis.worst.accuracy}%)</span>
              </div>
              <p className="text-xs text-red-500 leading-relaxed">
                Focused study needed in {autoAnalysis.worst.category}. 
                {autoAnalysis.worst.accuracy < 50 
                  ? ` Review the fundamentals of ${autoAnalysis.worst.category} and practice intensively.` 
                  : ` Addressing weaknesses in ${autoAnalysis.worst.category} can boost overall scores.`}
              </p>
            </div>
          )}
          {!autoAnalysis.best && !autoAnalysis.worst && (
            <p className="text-sm text-gray-400 text-center py-4">Not enough data for analysis.</p>
          )}
        </div>
      </div>

      {/* ===== 종합 평가 ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-lg">⭐</span> Overall Evaluation
        </h2>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">{overallEval}</p>
        </div>
      </div>

      {/* ===== 학생 메시지 ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-lg">💬</span> Student Message
        </h2>
        <textarea
          value={messageToParent}
          onChange={(e) => setMessageToParent(e.target.value.slice(0, 500))}
          placeholder="Write a message to share with parents..."
          className="w-full h-28 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#00cfe8]/30 focus:border-[#00cfe8] transition-all text-sm text-gray-700 placeholder-gray-400"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-[10px] text-gray-400">{messageToParent.length}/500 chars</p>
          {messageToParent.length > 0 && (
            <button onClick={() => setMessageToParent('')} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ===== 리포트 공유하기 ===== */}
      <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Share Report</h2>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <button
            onClick={() => handleCopyText(currentMonth)}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs md:text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-md"
            style={{ backgroundColor: '#1e6b73' }}
          >
            <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Copy Text</span>
          </button>
          <button
            onClick={() => handleShareEmail(currentMonth)}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs md:text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-md bg-gradient-to-r from-blue-500 to-blue-600"
          >
            <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Email</span>
          </button>
          <button
            onClick={() => handleShareWeChat(currentMonth)}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-white text-xs md:text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-md bg-gradient-to-r from-green-500 to-green-600"
          >
            <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>SMS/WeChat</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3">
          Share your learning progress with parents.
        </p>
      </div>
    </div>
  );
}

// Helper: format time for share message
function formatTimeStr(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

// Helper: format time short for display
function formatTimeShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h${minutes > 0 ? minutes : ''}`;
  return `${minutes}m`;
}