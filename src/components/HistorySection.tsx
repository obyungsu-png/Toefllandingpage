import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Clock, CheckCircle, XCircle, RotateCcw, ChevronRight, Calendar, Share2, Settings, TrendingUp, ChevronDown, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { ShareSettings, ShareConfig } from './ShareSettings';
import { ReportSection } from './ReportSection';
import { toast } from 'sonner@2.0.3';
import { AdModal } from './AdModal';
import { AdBanner } from './AdBanner';
import { Advertisement } from './AdManagement';

export interface TestResult {
  id: string;
  type: 'TPO' | 'Test' | 'Training' | 'Vocabulary' | 'Question Types';
  category?: string; // e.g., "Reading", "Listening", "Writing", "Speaking"
  testName: string; // e.g., "TPO 75", "Reading - Fill in the Blanks"
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    explanation?: string;
  }[];
  timeSpent?: number; // in seconds
  // Vocabulary specific fields
  vocabularyDay?: number; // e.g., DAY 1, DAY 2
  vocabularyVolume?: number; // e.g., Vol.1, Vol.2
}

interface HistorySectionProps {
  themeColor?: string;
  results: TestResult[];
  onRetryWrongAnswers?: (result: TestResult) => void;
  onViewDetail?: (result: TestResult) => void;
  shareConfig?: ShareConfig;
  onShareConfigChange?: (config: ShareConfig) => void;
  studentName?: string;
  advertisements?: any[];
}

type TabType = 'TPO' | 'Test' | 'Training' | 'Vocabulary' | '틀린문제' | 'Report';

export function HistorySection({ 
  themeColor = '#005f61',
  results = [],
  onRetryWrongAnswers,
  onViewDetail,
  shareConfig,
  onShareConfigChange,
  studentName,
  advertisements = []
}: HistorySectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('TPO');
  const [showShareSettings, setShowShareSettings] = useState(false);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'monthly'>('monthly'); // New state for view mode
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null); // Track expanded months

  // Get active advertisements for History page
  const activeAds = (advertisements as Advertisement[])?.filter(ad => 
    ad.isActive && ad.locations?.includes('History')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;

  // State to manage ad modal visibility
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // Share result function
  const handleShareResult = (result: TestResult) => {
    if (!shareConfig || (!shareConfig.wechatEnabled && !shareConfig.smsEnabled)) {
      toast.error('공유 설정을 먼저 활성화해주세요.');
      setShowShareSettings(true);
      return;
    }

    // Simulate sharing
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const message = `[${shareConfig.parentName || '부모님'}]\n\n학생의 토플 테스트 결과가 나왔습니다.\n\n테스트: ${result.testName}\n점수: ${result.score}점\n정답률: ${result.correctAnswers}/${result.totalQuestions} (${Math.round((result.correctAnswers / result.totalQuestions) * 100)}%)\n날짜: ${formatDate(result.date)}\n\n- 托福TPO 在선모考练습평台`;

    let shareMethod = [];
    if (shareConfig.wechatEnabled) shareMethod.push('WeChat');
    if (shareConfig.smsEnabled) shareMethod.push('SMS');

    toast.success(
      `${shareMethod.join(' 및 ')}로 결과를 전송했습니다!`,
      {
        description: `${shareConfig.wechatEnabled ? shareConfig.wechatId || '위챗 ID' : ''}${shareConfig.wechatEnabled && shareConfig.smsEnabled ? ', ' : ''}${shareConfig.smsEnabled ? shareConfig.parentPhone || '부모님 전화번호' : ''}로 전송되었습니다.`
      }
    );

    console.log('Sharing result:', message);
  };

  // Filter results by tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'TPO':
        return results.filter(r => r.type === 'TPO');
      case 'Test':
        return results.filter(r => r.type === 'Test');
      case 'Training':
        return results.filter(r => r.type === 'Training');
      case 'Vocabulary':
        return results.filter(r => r.type === 'Vocabulary');
      case '틀린문제':
        return results.filter(r => r.wrongAnswers.length > 0);
      case 'Report':
        return results;
      default:
        return results;
    }
  };

  const filteredResults = getFilteredResults();

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date simple (yyyy-mm-dd)
  const formatDateSimple = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');
  };

  // Format time
  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}분 ${secs}초`;
  };

  // Calculate accuracy percentage
  const getAccuracy = (result: TestResult) => {
    return Math.round((result.correctAnswers / result.totalQuestions) * 100);
  };

  // Get accuracy color - simplified and modern
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#1e40af'; // Deep blue for excellent
    if (accuracy >= 60) return themeColor; // Teal for good
    if (accuracy >= 40) return '#000000'; // Black for average
    return '#dc2626'; // Red for needs improvement
  };

  const tabs: TabType[] = ['TPO', 'Test', 'Training', 'Vocabulary', '틀린문제', 'Report'];

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedResultId(expandedResultId === id ? null : id);
  };

  // Group results by month
  const groupByMonth = (results: TestResult[]) => {
    const grouped: { [key: string]: TestResult[] } = {};
    
    results.forEach(result => {
      const date = new Date(result.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(result);
    });
    
    // Sort by month (newest first)
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // Format month key to readable format
  const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${month}월`;
  };

  // Get month statistics
  const getMonthStats = (monthResults: TestResult[]) => {
    const totalTests = monthResults.length;
    const avgAccuracy = Math.round(monthResults.reduce((sum, r) => sum + getAccuracy(r), 0) / totalTests);
    const totalCorrect = monthResults.reduce((sum, r) => sum + r.correctAnswers, 0);
    const totalWrong = monthResults.reduce((sum, r) => sum + r.wrongAnswers.length, 0);
    
    // Count by type
    const typeCount = {
      TPO: monthResults.filter(r => r.type === 'TPO').length,
      Test: monthResults.filter(r => r.type === 'Test').length,
      Training: monthResults.filter(r => r.type === 'Training').length,
      Vocabulary: monthResults.filter(r => r.type === 'Vocabulary').length,
      'Question Types': monthResults.filter(r => r.type === 'Question Types').length,
    };
    
    return { totalTests, avgAccuracy, totalCorrect, totalWrong, typeCount };
  };

  const groupedByMonth = viewMode === 'monthly' ? groupByMonth(filteredResults) : [];

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-12">
      {/* Ad Modal */}
      {displayAd && (
        <AdModal
          ad={displayAd}
          isOpen={isAdModalOpen}
          onClose={() => setIsAdModalOpen(false)}
        />
      )}

      {/* Advertisement Banner - TPO Style */}
      {displayAd && activeTab !== 'Report' && (
        <div className="border-b border-gray-200 -mx-2 md:-mx-4 mb-4 md:mb-8">
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

      {/* Header */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-gray-900">
          연습 기록
        </h1>
        <p className="text-gray-600 text-xs md:text-base">
          완료한 테스트 결과와 분석을 확인
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-4 mb-4 md:mb-6 border-b-2 border-gray-200 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 md:px-6 py-2 md:py-3 whitespace-nowrap transition-all font-bold text-xs md:text-base flex-shrink-0 ${
              activeTab === tab
                ? 'border-b-2 -mb-0.5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderColor: activeTab === tab ? themeColor : 'transparent',
              color: activeTab === tab ? themeColor : undefined
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Navigation Breadcrumb */}
      {activeTab !== 'Report' && filteredResults.length > 0 && (
        <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">연습 기록</span>
            <ChevronRight className="w-4 h-4" />
            <span style={{ color: themeColor }}>{activeTab}</span>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: viewMode === 'list' ? themeColor : undefined
              }}
            >
              리스트
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'monthly'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: viewMode === 'monthly' ? themeColor : undefined
              }}
            >
              월별보기
            </button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {activeTab === 'Report' ? (
        <ReportSection 
          themeColor={themeColor}
          results={results}
          shareConfig={shareConfig}
          onShareConfigChange={onShareConfigChange}
          studentName={studentName}
          onOpenShareSettings={() => setShowShareSettings(true)}
        />
      ) : filteredResults.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <BarChart3 className="w-16 h-16 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            {activeTab} 기록이 없습니다
          </h3>
          <p className="text-gray-500">
            테스트를 완료하면 여기에서 결과를 확인할 수 있습니다.
          </p>
        </div>
      ) : viewMode === 'monthly' ? (
        // Monthly View
        <div className="space-y-6">
          {groupedByMonth.map(([monthKey, monthResults]) => {
            const stats = getMonthStats(monthResults);
            const isMonthExpanded = expandedMonth === monthKey;
            
            return (
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* Month Header */}
                <div 
                  className="p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: `2px solid ${themeColor}` }}
                  onClick={() => setExpandedMonth(isMonthExpanded ? null : monthKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6" style={{ color: themeColor }} />
                      <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                        {formatMonthKey(monthKey)}
                      </h2>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform ${isMonthExpanded ? 'rotate-180' : ''}`}
                      style={{ color: themeColor }}
                    />
                  </div>
                  
                  {/* Month Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-200">
                      <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalTests}</p>
                      <p className="text-xs text-gray-600">총 테스트</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-200">
                      <p className="text-lg md:text-2xl font-bold" style={{ color: themeColor }}>
                        {stats.avgAccuracy}%
                      </p>
                      <p className="text-xs text-gray-600">평균 정답률</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-200">
                      <p className="text-lg md:text-2xl font-bold text-blue-600">{stats.typeCount.TPO}</p>
                      <p className="text-xs text-gray-600">TPO</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-200">
                      <p className="text-lg md:text-2xl font-bold text-green-600">{stats.typeCount.Training}</p>
                      <p className="text-xs text-gray-600">Training</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center border border-gray-200">
                      <p className="text-lg md:text-2xl font-bold text-purple-600">{stats.typeCount.Vocabulary}</p>
                      <p className="text-xs text-gray-600">단어</p>
                    </div>
                  </div>
                </div>
                
                {/* Expandable Results */}
                <AnimatePresence>
                  {isMonthExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 md:p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                          {monthResults.map((result, index) => {
                            const accuracy = getAccuracy(result);
                            const accuracyColor = getAccuracyColor(accuracy);
                            const isExpanded = expandedResultId === result.id;
                            
                            return (
                              <motion.div
                                key={result.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-xl transition-all overflow-hidden"
                                style={{
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), -4px 0 6px -1px rgba(0, 0, 0, 0.1), 4px 0 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              >
                                {/* Result Card - Same as list view */}
                                <div className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      <span className="text-xs text-gray-600">
                                        {formatDateSimple(result.date)}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span 
                                        className="text-xl font-bold"
                                        style={{ color: accuracyColor }}
                                      >
                                        {result.score}
                                      </span>
                                      <span className="text-xs text-gray-600">점</span>
                                    </div>
                                  </div>
                                  
                                  {result.category && (
                                    <div className="mb-2">
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {result.category}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <h3 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2">
                                    {result.testName}
                                  </h3>
                                  
                                  <div className="space-y-2">
                                    <Button
                                      className="w-full text-white text-xs py-2.5"
                                      style={{ backgroundColor: themeColor }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(result.id);
                                      }}
                                    >
                                      내용분석
                                    </Button>
                                  </div>
                                </div>

                                {/* Expanded View */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="border-t border-gray-200 overflow-hidden"
                                    >
                                      <div className="p-4">
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                              <CheckCircle className="w-3 h-3" style={{ color: themeColor }} />
                                              <span className="text-sm font-bold text-gray-900">{result.correctAnswers}</span>
                                            </div>
                                            <span className="text-xs text-gray-600">정답</span>
                                          </div>
                                          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                              <XCircle className="w-3 h-3 text-red-600" />
                                              <span className="text-sm font-bold text-red-600">{result.wrongAnswers.length}</span>
                                            </div>
                                            <span className="text-xs text-gray-600">오답</span>
                                          </div>
                                          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                              <Clock className="w-3 h-3 text-gray-700" />
                                              <span className="text-xs font-bold text-gray-900">{formatTime(result.timeSpent)}</span>
                                            </div>
                                            <span className="text-xs text-gray-600">시간</span>
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mb-3">
                                          <Button
                                            onClick={() => onViewDetail?.(result)}
                                            variant="outline"
                                            className="w-full flex items-center justify-center gap-1 text-xs py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                                          >
                                            <BarChart3 className="w-3 h-3" />
                                            <span>해설</span>
                                          </Button>
                                          {result.wrongAnswers.length > 0 && (
                                            <Button
                                              onClick={() => onRetryWrongAnswers?.(result)}
                                              className="w-full flex items-center justify-center gap-1 text-white text-xs py-2"
                                              style={{ backgroundColor: themeColor }}
                                            >
                                              <RotateCcw className="w-3 h-3" />
                                              <span>재도전</span>
                                            </Button>
                                          )}
                                          <Button
                                            onClick={() => handleShareResult(result)}
                                            className="w-full flex items-center justify-center gap-1 text-white text-xs py-2"
                                            style={{ backgroundColor: '#1e40af' }}
                                          >
                                            <Share2 className="w-3 h-3" />
                                            <span>공유</span>
                                          </Button>
                                        </div>

                                        {result.wrongAnswers.length > 0 && (
                                          <div className="pt-3 border-t border-gray-200">
                                            <p className="text-xs font-bold text-gray-900 mb-2">틀린 문제 미리보기</p>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                              {result.wrongAnswers.slice(0, 3).map((wrong, idx) => (
                                                <div key={idx} className="text-xs bg-gray-50 rounded p-2 border border-gray-200">
                                                  <p className="text-gray-800 mb-1 font-medium line-clamp-1">{wrong.questionText}</p>
                                                  <div className="flex flex-col gap-1">
                                                    <span className="text-red-600 font-medium">내 답: {wrong.userAnswer}</span>
                                                    <span className="text-gray-900 font-medium">정답: {wrong.correctAnswer}</span>
                                                  </div>
                                                </div>
                                              ))}
                                              {result.wrongAnswers.length > 3 && (
                                                <p className="text-xs text-gray-500 text-center py-1">
                                                  +{result.wrongAnswers.length - 3}개 더보기
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // List View - Original grid view
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {filteredResults.map((result, index) => {
            const accuracy = getAccuracy(result);
            const accuracyColor = getAccuracyColor(accuracy);
            const isExpanded = expandedResultId === result.id;
            
            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl transition-all overflow-hidden"
                style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), -4px 0 6px -1px rgba(0, 0, 0, 0.1), 4px 0 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Compact Card View */}
                <div className="p-4">
                  {/* Header: Date and Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {formatDateSimple(result.date)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span 
                        className="text-xl font-bold"
                        style={{ color: accuracyColor }}
                      >
                        {result.score}
                      </span>
                      <span className="text-xs text-gray-600">점</span>
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  {result.category && (
                    <div className="mb-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {result.category}
                      </span>
                    </div>
                  )}
                  
                  {/* Test Name */}
                  <h3 className="text-sm font-bold text-gray-900 mb-3 line-clamp-2">
                    {result.testName}
                  </h3>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      className="w-full text-white text-xs py-2.5"
                      style={{ backgroundColor: themeColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(result.id);
                      }}
                    >
                      내용분석
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-xs py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(result.id);
                      }}
                    >
                      {isExpanded ? '닫기' : '닫기'}
                    </Button>
                  </div>
                </div>

                {/* Expanded View */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 overflow-hidden"
                    >
                      <div className="p-4">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <CheckCircle className="w-3 h-3" style={{ color: themeColor }} />
                              <span className="text-sm font-bold text-gray-900">{result.correctAnswers}</span>
                            </div>
                            <span className="text-xs text-gray-600">정답</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span className="text-sm font-bold text-red-600">{result.wrongAnswers.length}</span>
                            </div>
                            <span className="text-xs text-gray-600">오답</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Clock className="w-3 h-3 text-gray-700" />
                              <span className="text-xs font-bold text-gray-900">{formatTime(result.timeSpent)}</span>
                            </div>
                            <span className="text-xs text-gray-600">시간</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 mb-3">
                          <Button
                            onClick={() => onViewDetail?.(result)}
                            variant="outline"
                            className="w-full flex items-center justify-center gap-1 text-xs py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <BarChart3 className="w-3 h-3" />
                            <span>해설</span>
                          </Button>
                          {result.wrongAnswers.length > 0 && (
                            <Button
                              onClick={() => onRetryWrongAnswers?.(result)}
                              className="w-full flex items-center justify-center gap-1 text-white text-xs py-2"
                              style={{ backgroundColor: themeColor }}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>재도전</span>
                            </Button>
                          )}
                          <Button
                            onClick={() => handleShareResult(result)}
                            className="w-full flex items-center justify-center gap-1 text-white text-xs py-2"
                            style={{ backgroundColor: '#1e40af' }}
                          >
                            <Share2 className="w-3 h-3" />
                            <span>공유</span>
                          </Button>
                        </div>

                        {/* Wrong Answers Preview */}
                        {result.wrongAnswers.length > 0 && (
                          <div className="pt-3 border-t border-gray-200">
                            <p className="text-xs font-bold text-gray-900 mb-2">틀린 문제 미리보기</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {result.wrongAnswers.slice(0, 3).map((wrong, idx) => (
                                <div key={idx} className="text-xs bg-gray-50 rounded p-2 border border-gray-200">
                                  <p className="text-gray-800 mb-1 font-medium line-clamp-1">{wrong.questionText}</p>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-red-600 font-medium">내 답: {wrong.userAnswer}</span>
                                    <span className="text-gray-900 font-medium">정답: {wrong.correctAnswer}</span>
                                  </div>
                                </div>
                              ))}
                              {result.wrongAnswers.length > 3 && (
                                <p className="text-xs text-gray-500 text-center py-1">
                                  +{result.wrongAnswers.length - 3}개 더보기
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary Statistics - Simplified Modern Design */}
      {results.length > 0 && activeTab !== 'Report' && (
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-6 text-gray-900">
            전체 통계
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                {results.length}
              </p>
              <p className="text-sm text-gray-600">총 테스트</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                {Math.round(results.reduce((sum, r) => sum + getAccuracy(r), 0) / results.length)}
                <span className="text-xl text-gray-600">%</span>
              </p>
              <p className="text-sm text-gray-600">평균 정답률</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                {results.reduce((sum, r) => sum + r.correctAnswers, 0)}
              </p>
              <p className="text-sm text-gray-600">총 정답</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                {results.reduce((sum, r) => sum + r.wrongAnswers.length, 0)}
              </p>
              <p className="text-sm text-gray-600">총 오답</p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}