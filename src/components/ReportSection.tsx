import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  Award, 
  Target, 
  BookOpen, 
  BarChart3, 
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Share2
} from 'lucide-react';
import { TestResult, ShareConfig } from './HistorySection';
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

  // Share report function
  const handleShareReport = (monthData: MonthData) => {
    if (!shareConfig || (!shareConfig.wechatEnabled && !shareConfig.smsEnabled)) {
      toast.error('공유 설정을 먼저 활성화해주세요.', {
        description: 'History 페이지에서 공유 설정을 완료해주세요.'
      });
      onOpenShareSettings?.();
      return;
    }

    const accuracy = Math.round((monthData.correctAnswers / monthData.totalQuestions) * 100);
    const bestScore = Math.max(...monthData.results.map(r => r.score));
    const worstScore = Math.min(...monthData.results.map(r => r.score));
    
    // Count by type
    const typeCount = {
      TPO: monthData.results.filter(r => r.type === 'TPO').length,
      Test: monthData.results.filter(r => r.type === 'Test').length,
      Training: monthData.results.filter(r => r.type === 'Training').length,
      Vocabulary: monthData.results.filter(r => r.type === 'Vocabulary').length,
      'Question Types': monthData.results.filter(r => r.type === 'Question Types').length,
    };
    
    // Count by category (Reading, Listening, Writing, Speaking)
    const categoryCount: { [key: string]: number } = {};
    monthData.results.forEach(r => {
      if (r.category) {
        categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
      }
    });
    
    // Calculate average by category
    const categoryAvg: { [key: string]: number } = {};
    const categoryCorrect: { [key: string]: number } = {};
    const categoryTotal: { [key: string]: number } = {};
    monthData.results.forEach(r => {
      if (r.category) {
        categoryCorrect[r.category] = (categoryCorrect[r.category] || 0) + r.correctAnswers;
        categoryTotal[r.category] = (categoryTotal[r.category] || 0) + r.totalQuestions;
      }
    });
    Object.keys(categoryCorrect).forEach(cat => {
      categoryAvg[cat] = Math.round((categoryCorrect[cat] / categoryTotal[cat]) * 100);
    });
    
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
      }
      return `${minutes}분`;
    };

    // Build detailed message
    let typeDetails = '';
    if (typeCount.TPO > 0) typeDetails += `\n  • TPO: ${typeCount.TPO}개`;
    if (typeCount.Test > 0) typeDetails += `\n  • 실전 테스트: ${typeCount.Test}개`;
    if (typeCount.Training > 0) typeDetails += `\n  • 전문 훈련: ${typeCount.Training}개`;
    if (typeCount.Vocabulary > 0) typeDetails += `\n  • 단어 학습: ${typeCount.Vocabulary}개`;
    if (typeCount['Question Types'] > 0) typeDetails += `\n  • 문제 유형: ${typeCount['Question Types']}개`;
    
    let categoryDetails = '';
    if (Object.keys(categoryAvg).length > 0) {
      categoryDetails = '\n\n📚 영역별 성적';
      Object.keys(categoryAvg).sort().forEach(cat => {
        categoryDetails += `\n  • ${cat}: ${categoryAvg[cat]}% (${categoryCount[cat]}회)`;
      });
    }

    const message = `[${shareConfig.parentName || '부모님'}께]

${studentName ? `👨‍🎓 학생: ${studentName}
` : ''}📅 ${monthData.month} 토플 학습 리포트

━━━━━━━━━━━━━━━━
📊 월간 종합 통계
━━━━━━━━━━━━━━━━
✅ 완료한 테스트: ${monthData.totalTests}개
📈 평균 점수: ${monthData.averageScore}점
🎯 정답률: ${accuracy}%
🏆 최고 점수: ${bestScore}점
📉 최저 점수: ${worstScore}점
⏱️ 총 학습 시간: ${formatTime(monthData.timeSpent)}

━━━━━━━━━━━━━━━━
📝 학습 유형별 분석
━━━━━━━━━━━━━━━━${typeDetails}${categoryDetails}

━━━━━━━━━━━━━━━━
💡 종합 평가
━━━━━━━━━━━━━━━━
${accuracy >= 80 ? '🌟 훌륭합니다! 꾸준히 우수한 성적을 유지하고 있습니다.' : accuracy >= 60 ? '👍 잘하고 있습니다! 조금만 더 노력하면 더 좋은 결과를 얻을 수 있습니다.' : '💪 계속 노력하세요! 꾸준한 학습이 실력 향상의 지름길입니다.'}

${monthData.totalTests >= 20 ? '학습량이 매우 충분합니다! ✨' : monthData.totalTests >= 10 ? '적절한 학습량을 유지하고 있습니다. 👏' : '학습량을 조금 더 늘려보세요. 📚'}

계속해서 좋은 성과를 내고 있습니다! 💪${messageToParent.trim() ? `

━━━━━━━━━━━━━━━━
💌 ${studentName || '학생'}의 메시지
━━━━━━━━━━━━━━━━
${messageToParent.trim()}` : ''}

━━━━━━━━━━━━━━━━
托福TPO 在선모考연습평台`;

    let shareMethod = [];
    if (shareConfig.wechatEnabled) shareMethod.push('WeChat');
    if (shareConfig.smsEnabled) shareMethod.push('SMS');

    toast.success(
      `${shareMethod.join(' 및 ')}로 월간 리포트를 전송했습니다!`,
      {
        description: `${shareConfig.wechatEnabled ? shareConfig.wechatId || '위챗 ID' : ''}${shareConfig.wechatEnabled && shareConfig.smsEnabled ? ', ' : ''}${shareConfig.smsEnabled ? shareConfig.parentPhone || '부모님 전화번호' : ''}로 전송되었습니다.`
      }
    );

    console.log('Sharing report:', message);
  };

  // Group results by month
  const monthlyData = useMemo(() => {
    const grouped: { [key: string]: TestResult[] } = {};
    
    results.forEach(result => {
      const date = new Date(result.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(result);
    });

    // Convert to array and sort by date (latest first)
    const monthsArray: MonthData[] = Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthResults = grouped[monthKey];
        
        const totalTests = monthResults.length;
        const totalQuestions = monthResults.reduce((sum, r) => sum + r.totalQuestions, 0);
        const correctAnswers = monthResults.reduce((sum, r) => sum + r.correctAnswers, 0);
        const averageScore = Math.round(
          monthResults.reduce((sum, r) => sum + r.score, 0) / totalTests
        );
        const timeSpent = monthResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0);

        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long'
          }),
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

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!currentMonth) return [];

    const breakdown: { [key: string]: { correct: number; total: number } } = {};
    
    currentMonth.results.forEach(result => {
      const category = result.category || result.type;
      if (!breakdown[category]) {
        breakdown[category] = { correct: 0, total: 0 };
      }
      breakdown[category].correct += result.correctAnswers;
      breakdown[category].total += result.totalQuestions;
    });

    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      accuracy: Math.round((data.correct / data.total) * 100),
      correct: data.correct,
      total: data.total
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [currentMonth]);

  // Calculate weekly progress
  const weeklyProgress = useMemo(() => {
    if (!currentMonth) return [];

    const weeks: { [key: number]: { tests: number; avgScore: number; scores: number[] } } = {};
    
    currentMonth.results.forEach(result => {
      const date = new Date(result.date);
      const weekNumber = Math.ceil(date.getDate() / 7);
      
      if (!weeks[weekNumber]) {
        weeks[weekNumber] = { tests: 0, avgScore: 0, scores: [] };
      }
      weeks[weekNumber].tests++;
      weeks[weekNumber].scores.push(result.score);
    });

    return Object.entries(weeks).map(([week, data]) => ({
      week: `${week}주차`,
      tests: data.tests,
      avgScore: Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length)
    }));
  }, [currentMonth]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="flex justify-center mb-4">
          <BarChart3 className="w-16 h-16 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">
          학습 리포트가 없습니다
        </h3>
        <p className="text-gray-500">
          테스트를 완료하면 월별 학습 리포트를 확인할 수 있습니다.
        </p>
      </div>
    );
  }

  if (!currentMonth) {
    return null;
  }

  return (
    <>
      {/* Month Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedMonthIndex(Math.min(selectedMonthIndex + 1, monthlyData.length - 1))}
            disabled={selectedMonthIndex >= monthlyData.length - 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">이전 달</span>
          </Button>

          <div className="text-center flex-1">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Calendar className="w-5 h-5" style={{ color: themeColor }} />
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: themeColor }}>
                {currentMonth.month}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              총 {currentMonth.totalTests}개의 테스트 완료
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleShareReport(currentMonth)}
              className="flex items-center gap-2 text-white"
              style={{ backgroundColor: '#1e40af' }}
              size="sm"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">공유</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonthIndex(Math.max(selectedMonthIndex - 1, 0))}
              disabled={selectedMonthIndex <= 0}
              className="flex items-center gap-2"
            >
              <span className="hidden md:inline">다음 달</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics - With Deep Blue Accent */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4"
          style={{ borderColor: '#1e40af' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 md:w-8 md:h-8" style={{ color: '#1e40af' }} />
            <div>
              <p className="text-xs md:text-sm text-gray-600">평균 점수</p>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: '#1e40af' }}>
                {currentMonth.averageScore}
                <span className="text-lg text-gray-600">%</span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4"
          style={{ borderColor: themeColor }}
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-gray-800" />
            <div>
              <p className="text-xs md:text-sm text-gray-600">정답률</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {Math.round((currentMonth.correctAnswers / currentMonth.totalQuestions) * 100)}
                <span className="text-lg text-gray-600">%</span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-gray-900"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-gray-800" />
            <div>
              <p className="text-xs md:text-sm text-gray-600">총 문제</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">
                {currentMonth.totalQuestions}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4"
          style={{ borderColor: '#1e40af' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 md:w-8 md:h-8" style={{ color: '#1e40af' }} />
            <div>
              <p className="text-xs md:text-sm text-gray-600">학습 시간</p>
              <p className="text-xl md:text-2xl font-bold" style={{ color: '#1e40af' }}>
                {formatTime(currentMonth.timeSpent)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown - Simplified */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Target className="w-5 h-5" style={{ color: themeColor }} />
            영역별 정확도
          </h3>
          <div className="space-y-5">
            {categoryBreakdown.map((item, index) => (
              <div key={item.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">{item.category}</span>
                  <span className="font-bold text-gray-900">
                    {item.accuracy}% <span className="text-sm text-gray-600">({item.correct}/{item.total})</span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.accuracy}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: item.accuracy >= 70 ? '#1e40af' : item.accuracy >= 50 ? themeColor : '#ef4444'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Progress - Simplified */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <TrendingUp className="w-5 h-5" style={{ color: themeColor }} />
            주간 진행률
          </h3>
          <div className="space-y-5">
            {weeklyProgress.map((week, index) => (
              <div key={week.week} className="flex items-center gap-4">
                <div className="w-20 text-sm font-bold text-gray-800">
                  {week.week}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">{week.tests}개 테스트</span>
                    <span className="text-sm font-bold text-gray-900">
                      {week.avgScore}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${week.avgScore}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Type Distribution - Simplified */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <BarChart3 className="w-5 h-5" style={{ color: themeColor }} />
            테스트 유형 분포
          </h3>
          <div className="space-y-4">
            {['TPO', 'Test', 'Training', 'Vocabulary'].map(type => {
              const typeResults = currentMonth.results.filter(r => r.type === type);
              const percentage = Math.round((typeResults.length / currentMonth.totalTests) * 100);
              
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-800">{type}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {typeResults.length}개 <span className="text-gray-600">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: '#ef4444' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements - Simplified with minimal color */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Award className="w-5 h-5" style={{ color: themeColor }} />
            이달의 성취
          </h3>
          <div className="space-y-4">
            {/* Best Score */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-l-4" style={{ borderColor: '#1e40af' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">최고 점수</p>
                  <p className="text-3xl font-bold" style={{ color: '#1e40af' }}>
                    {Math.max(...currentMonth.results.map(r => r.score))}
                    <span className="text-xl text-gray-600">%</span>
                  </p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {Math.max(...currentMonth.results.map(r => r.score)) >= 90 
                  ? "우수한 성적입니다! 최상위권 실력을 보여주고 있습니다." 
                  : Math.max(...currentMonth.results.map(r => r.score)) >= 80 
                  ? "훌륭한 점수입니다! 꾸준히 노력하면 더 좋은 결과를 얻을 수 있습니다." 
                  : Math.max(...currentMonth.results.map(r => r.score)) >= 70
                  ? "좋은 성적입니다! 조금만 더 노력하면 우수한 점수를 받을 수 있습니다."
                  : "성실하게 학습하고 있습니다. 계속 노력하면 실력이 향상될 것입니다."}
              </p>
            </div>

            {/* Total Correct Answers */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4" style={{ borderColor: themeColor }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">총 정답 수</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {currentMonth.correctAnswers}
                    <span className="text-xl text-gray-600">개</span>
                  </p>
                </div>
                <div className="text-4xl">✓</div>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {currentMonth.correctAnswers >= 500
                  ? "매우 많은 문제를 정확하게 풀었습니다. 뛰어난 집중력과 이해력을 보여줍니다."
                  : currentMonth.correctAnswers >= 300
                  ? "충분한 양의 문제를 정확하게 풀고 있습니다. 꾸준한 학습 태도가 돋보입니다."
                  : currentMonth.correctAnswers >= 100
                  ? "적절한 양의 문제를 풀며 실력을 쌓고 있습니다. 지속적인 연습이 필요합니다."
                  : "학습량을 조금 더 늘리면 더 빠른 실력 향상을 기대할 수 있습니다."}
              </p>
            </div>

            {/* Consistency */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-900">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">꾸준함</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {currentMonth.totalTests}
                    <span className="text-xl text-gray-600">일</span>
                  </p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {currentMonth.totalTests >= 25
                  ? "매일 학습하는 훌륭한 습관을 가지고 있습니다. 이 꾸준함이 큰 성과로 이어질 것입니다."
                  : currentMonth.totalTests >= 20
                  ? "거의 매일 학습하고 있습니다. 규칙적인 학습 패턴이 잘 형성되어 있습니다."
                  : currentMonth.totalTests >= 15
                  ? "주 3-4회 학습하고 있습니다. 조금 더 자주 학습하면 더 좋은 효과를 볼 수 있습니다."
                  : currentMonth.totalTests >= 10
                  ? "주 2-3회 학습하고 있습니다. 학습 빈도를 늘려 더 효과적인 학습이 되도록 독려해주세요."
                  : "학습 빈도가 낮습니다. 규칙적인 학습 습관을 만들어주는 것이 필요합니다."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message to Parent Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
          <Share2 className="w-5 h-5" style={{ color: themeColor }} />
          부모님께 전달할 메시지
        </h3>
        <div className="space-y-3">
          <textarea
            value={messageToParent}
            onChange={(e) => setMessageToParent(e.target.value)}
            placeholder="부모님께 전달하고 싶은 말씀을 자유롭게 작성해주세요.&#10;예시: 이번 달에는 Listening 영역에 집중했습니다. 다음 달에는 Speaking 연습을 더 많이 하겠습니다."
            className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#1e40af] transition-colors text-sm"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {messageToParent.length}/500자
            </p>
            {messageToParent.length > 0 && (
              <button
                onClick={() => setMessageToParent('')}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                지우기
              </button>
            )}
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 p-4 rounded-lg" style={{ borderColor: '#1e40af' }}>
            <p className="text-xs text-gray-600 leading-relaxed">
              💡 <strong>TIP:</strong> 이 메시지는 '공유' 버튼을 눌렀을 때 월간 리포트와 함께 부모님께 전송됩니다. 
              이번 달 학습 경험이나 다음 달 계획, 어려웠던 점 등을 자유롭게 작성해보세요.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}