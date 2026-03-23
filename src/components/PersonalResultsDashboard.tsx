import { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  Target,
  Clock,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from './ui/button';

// Types for different test results
export interface VocabularyResult {
  id: string;
  date: string;
  dayRange: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  testType: 'multiple' | 'subjective' | 'mixed';
  wrongWords: string[];
  timeSpent: number; // in minutes
}

export interface TPOResult {
  id: string;
  date: string;
  tpoNumber: number;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  details?: {
    correctAnswers: number;
    totalQuestions: number;
  };
}

export interface TestResult {
  id: string;
  date: string;
  testName: string;
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
}

export interface TrainingResult {
  id: string;
  date: string;
  trainingType: string;
  completed: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
}

interface PersonalResultsDashboardProps {
  studentId: string;
  studentName: string;
  vocabularyResults: VocabularyResult[];
  tpoResults: TPOResult[];
  testResults: TestResult[];
  trainingResults: TrainingResult[];
  onClose: () => void;
}

export function PersonalResultsDashboard({
  studentId,
  studentName,
  vocabularyResults,
  tpoResults,
  testResults,
  trainingResults,
  onClose
}: PersonalResultsDashboardProps) {
  const themeColor = '#3B4A8C';
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'vocabulary' | 'tpo' | 'test' | 'training'>('overview');

  // Get available months from all results
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    [...vocabularyResults, ...tpoResults, ...testResults, ...trainingResults].forEach(result => {
      const date = new Date(result.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    const sortedMonths = Array.from(months).sort().reverse();
    return sortedMonths;
  }, [vocabularyResults, tpoResults, testResults, trainingResults]);

  // Set default month to latest
  useState(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  });

  // Filter results by selected month
  const filterByMonth = <T extends { date: string }>(results: T[]) => {
    if (!selectedMonth) return results;
    return results.filter(result => {
      const date = new Date(result.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  };

  const filteredVocabulary = useMemo(() => filterByMonth(vocabularyResults), [vocabularyResults, selectedMonth]);
  const filteredTPO = useMemo(() => filterByMonth(tpoResults), [tpoResults, selectedMonth]);
  const filteredTest = useMemo(() => filterByMonth(testResults), [testResults, selectedMonth]);
  const filteredTraining = useMemo(() => filterByMonth(trainingResults), [trainingResults, selectedMonth]);

  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    const vocabAvg = filteredVocabulary.length > 0 
      ? filteredVocabulary.reduce((sum, r) => sum + r.percentage, 0) / filteredVocabulary.length 
      : 0;
    
    const tpoAvg = filteredTPO.length > 0 
      ? filteredTPO.reduce((sum, r) => sum + r.percentage, 0) / filteredTPO.length 
      : 0;
    
    const testAvg = filteredTest.length > 0 
      ? filteredTest.reduce((sum, r) => sum + r.percentage, 0) / filteredTest.length 
      : 0;
    
    const trainingAvg = filteredTraining.length > 0 
      ? filteredTraining.reduce((sum, r) => sum + r.percentage, 0) / filteredTraining.length 
      : 0;

    const totalTime = [
      ...filteredVocabulary,
      ...filteredTPO,
      ...filteredTest,
      ...filteredTraining
    ].reduce((sum, r) => sum + r.timeSpent, 0);

    const totalTests = filteredVocabulary.length + filteredTPO.length + filteredTest.length + filteredTraining.length;

    return {
      vocabularyAvg: Math.round(vocabAvg),
      tpoAvg: Math.round(tpoAvg),
      testAvg: Math.round(testAvg),
      trainingAvg: Math.round(trainingAvg),
      totalTime: Math.round(totalTime),
      totalTests,
      overallAvg: Math.round((vocabAvg + tpoAvg + testAvg + trainingAvg) / 4)
    };
  }, [filteredVocabulary, filteredTPO, filteredTest, filteredTraining]);

  // Format month display
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (direction === 'prev' && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: themeColor }}>
              개인 학습 분석 리포트
            </h1>
            <p className="text-gray-600 text-lg">
              {studentName}님의 학습 현황
            </p>
          </div>
          <Button onClick={onClose} variant="outline" className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            돌아가기
          </Button>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="w-6 h-6" style={{ color: themeColor }} />
              <h2 className="text-xl font-bold" style={{ color: themeColor }}>
                분석 기간 선택
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigateMonth('prev')}
                variant="outline"
                disabled={availableMonths.indexOf(selectedMonth) === availableMonths.length - 1}
                className="w-10 h-10 p-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="min-w-[180px] text-center">
                <p className="text-2xl font-bold" style={{ color: themeColor }}>
                  {selectedMonth ? formatMonth(selectedMonth) : '데이터 없음'}
                </p>
              </div>
              
              <Button
                onClick={() => navigateMonth('next')}
                variant="outline"
                disabled={availableMonths.indexOf(selectedMonth) === 0}
                className="w-10 h-10 p-0"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="rounded-xl p-6 shadow-lg text-white"
            style={{ backgroundColor: themeColor }}
          >
            <Award className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-sm opacity-90 mb-1">종합 평균 점수</p>
            <p className="text-4xl font-bold">{monthlyStats.overallAvg}%</p>
          </div>

          <div
            className="bg-white rounded-xl p-6 shadow-lg border-2"
            style={{ borderColor: themeColor }}
          >
            <FileText className="w-8 h-8 mb-3" style={{ color: themeColor }} />
            <p className="text-sm text-gray-600 mb-1">총 시험 횟수</p>
            <p className="text-4xl font-bold" style={{ color: themeColor }}>
              {monthlyStats.totalTests}
            </p>
          </div>

          <div
            className="bg-white rounded-xl p-6 shadow-lg border-2"
            style={{ borderColor: themeColor }}
          >
            <Clock className="w-8 h-8 mb-3" style={{ color: themeColor }} />
            <p className="text-sm text-gray-600 mb-1">총 학습 시간</p>
            <p className="text-4xl font-bold" style={{ color: themeColor }}>
              {Math.floor(monthlyStats.totalTime / 60)}
              <span className="text-xl">h</span> {monthlyStats.totalTime % 60}
              <span className="text-xl">m</span>
            </p>
          </div>

          <div
            className="bg-white rounded-xl p-6 shadow-lg border-2"
            style={{ borderColor: themeColor }}
          >
            <TrendingUp className="w-8 h-8 mb-3" style={{ color: themeColor }} />
            <p className="text-sm text-gray-600 mb-1">학습 진척도</p>
            <p className="text-4xl font-bold" style={{ color: themeColor }}>
              {monthlyStats.totalTests > 0 ? '활발' : '시작'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="flex border-b">
            {[
              { key: 'overview', label: '종합 분석', icon: BarChart3 },
              { key: 'vocabulary', label: '어휘 시험', icon: BookOpen },
              { key: 'tpo', label: 'TPO 시험', icon: FileText },
              { key: 'test', label: '문제 연습', icon: Target },
              { key: 'training', label: '트레이닝', icon: Award }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeTab === tab.key ? themeColor : 'white',
                  color: activeTab === tab.key ? 'white' : '#6b7280',
                  borderBottom: activeTab === tab.key ? 'none' : '2px solid #e5e7eb'
                }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {activeTab === 'overview' && (
            <OverviewTab
              vocabularyAvg={monthlyStats.vocabularyAvg}
              tpoAvg={monthlyStats.tpoAvg}
              testAvg={monthlyStats.testAvg}
              trainingAvg={monthlyStats.trainingAvg}
              vocabularyCount={filteredVocabulary.length}
              tpoCount={filteredTPO.length}
              testCount={filteredTest.length}
              trainingCount={filteredTraining.length}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'vocabulary' && (
            <VocabularyTab
              results={filteredVocabulary}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'tpo' && (
            <TPOTab
              results={filteredTPO}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'test' && (
            <TestTab
              results={filteredTest}
              themeColor={themeColor}
            />
          )}

          {activeTab === 'training' && (
            <TrainingTab
              results={filteredTraining}
              themeColor={themeColor}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  vocabularyAvg,
  tpoAvg,
  testAvg,
  trainingAvg,
  vocabularyCount,
  tpoCount,
  testCount,
  trainingCount,
  themeColor
}: {
  vocabularyAvg: number;
  tpoAvg: number;
  testAvg: number;
  trainingAvg: number;
  vocabularyCount: number;
  tpoCount: number;
  testCount: number;
  trainingCount: number;
  themeColor: string;
}) {
  const categories = [
    { label: '어휘 시험', avg: vocabularyAvg, count: vocabularyCount, color: '#10B981' },
    { label: 'TPO 시험', avg: tpoAvg, count: tpoCount, color: '#3B82F6' },
    { label: '문제 연습', avg: testAvg, count: testCount, color: '#F59E0B' },
    { label: '트레이닝', avg: trainingAvg, count: trainingCount, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
        카테고리별 성과 분석
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => (
          <div
            key={category.label}
            className="border-2 rounded-xl p-6"
            style={{ borderColor: category.color }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: category.color }}>
              {category.label}
            </h3>
            
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">평균 점수</p>
                <p className="text-4xl font-bold" style={{ color: category.color }}>
                  {category.avg}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">시험 횟수</p>
                <p className="text-3xl font-bold" style={{ color: category.color }}>
                  {category.count}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ backgroundColor: category.color, width: `${category.avg}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Performance Indicator */}
      <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: `${themeColor}10` }}>
        <h3 className="text-xl font-bold mb-3" style={{ color: themeColor }}>
          종합 평가
        </h3>
        <p className="text-gray-700 leading-relaxed">
          {vocabularyCount + tpoCount + testCount + trainingCount === 0 
            ? '아직 학습 기록이 없습니다. 지금 시작해보세요!'
            : `이번 달 총 ${vocabularyCount + tpoCount + testCount + trainingCount}개의 시험을 완료했습니다. ${
                (vocabularyAvg + tpoAvg + testAvg + trainingAvg) / 4 >= 80 
                  ? '우수한 성적입니다! 계속해서 좋은 페이스를 유지하세요.' 
                  : (vocabularyAvg + tpoAvg + testAvg + trainingAvg) / 4 >= 60
                    ? '좋은 진전을 보이고 있습니다. 조금만 더 노력하면 목표에 도달할 수 있습니다!'
                    : '꾸준한 학습이 필요합니다. 매일 조금씩 공부하는 습관을 만들어보세요.'
              }`
          }
        </p>
      </div>
    </div>
  );
}

// Vocabulary Tab Component
function VocabularyTab({ results, themeColor }: { results: VocabularyResult[]; themeColor: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
        어휘 시험 상세 결과
      </h2>

      {results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          이번 달 어휘 시험 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="border-2 rounded-xl p-6 hover:shadow-lg transition-shadow"
              style={{ borderColor: '#e5e7eb' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: themeColor }}>
                    {result.dayRange}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(result.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold mb-1" style={{ 
                    color: result.percentage >= 80 ? '#10B981' : result.percentage >= 60 ? '#F59E0B' : '#EF4444' 
                  }}>
                    {result.percentage}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {result.correctAnswers} / {result.totalQuestions} 정답
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">시험 유형</p>
                  <p className="font-bold" style={{ color: themeColor }}>
                    {result.testType === 'multiple' ? '객관식' : result.testType === 'subjective' ? '주관식' : '혼합형'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">소요 시간</p>
                  <p className="font-bold" style={{ color: themeColor }}>
                    {result.timeSpent}분
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">오답 수</p>
                  <p className="font-bold" style={{ color: '#EF4444' }}>
                    {result.wrongWords.length}개
                  </p>
                </div>
              </div>

              {result.wrongWords.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-bold text-gray-700 mb-2">틀린 단어:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.wrongWords.map((word, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${result.percentage}%`,
                    backgroundColor: result.percentage >= 80 ? '#10B981' : result.percentage >= 60 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// TPO Tab Component
function TPOTab({ results, themeColor }: { results: TPOResult[]; themeColor: string }) {
  // Group by TPO number and section
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: TPOResult[] } = {};
    results.forEach(result => {
      const key = `TPO ${result.tpoNumber}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(result);
    });
    return groups;
  }, [results]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
        TPO 시험 상세 결과
      </h2>

      {results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          이번 달 TPO 시험 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([tpoName, tpoResults], index) => (
            <div
              key={tpoName}
              className="border-2 rounded-xl p-6"
              style={{ borderColor: themeColor }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: themeColor }}>
                {tpoName}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tpoResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 bg-gray-50 rounded-lg border-2"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5" style={{ color: themeColor }} />
                      <h4 className="font-bold" style={{ color: themeColor }}>
                        {result.section}
                      </h4>
                    </div>
                    
                    <div className="text-center py-3">
                      <p className="text-3xl font-bold mb-1" style={{
                        color: result.percentage >= 80 ? '#10B981' : result.percentage >= 60 ? '#F59E0B' : '#EF4444'
                      }}>
                        {result.percentage}%
                      </p>
                      <p className="text-sm text-gray-600">
                        {result.score} / {result.maxScore}
                      </p>
                    </div>

                    {result.details && (
                      <div className="text-center pt-2 border-t">
                        <p className="text-xs text-gray-600">
                          정답: {result.details.correctAnswers} / {result.details.totalQuestions}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t text-center">
                      <p className="text-xs text-gray-600">
                        {new Date(result.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.timeSpent}분
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Test Tab Component
function TestTab({ results, themeColor }: { results: TestResult[]; themeColor: string }) {
  // Group by category
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: TestResult[] } = {};
    results.forEach(result => {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category].push(result);
    });
    return groups;
  }, [results]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
        문제 연습 상세 결과
      </h2>

      {results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          이번 달 문제 연습 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([category, categoryResults], index) => (
            <div
              key={category}
              className="border-2 rounded-xl p-6"
              style={{ borderColor: '#F59E0B' }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#F59E0B' }}>
                {category}
              </h3>

              <div className="space-y-3">
                {categoryResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold mb-1" style={{ color: themeColor }}>
                        {result.testName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(result.date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">점수</p>
                        <p className="text-xl font-bold" style={{
                          color: result.percentage >= 80 ? '#10B981' : result.percentage >= 60 ? '#F59E0B' : '#EF4444'
                        }}>
                          {result.score}/{result.maxScore}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">정답률</p>
                        <p className="text-xl font-bold" style={{
                          color: result.percentage >= 80 ? '#10B981' : result.percentage >= 60 ? '#F59E0B' : '#EF4444'
                        }}>
                          {result.percentage}%
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">소요시간</p>
                        <p className="text-sm font-bold text-gray-700">
                          {result.timeSpent}분
                        </p>
                      </div>

                      {result.percentage >= 80 ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Training Tab Component
function TrainingTab({ results, themeColor }: { results: TrainingResult[]; themeColor: string }) {
  // Group by training type
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: TrainingResult[] } = {};
    results.forEach(result => {
      if (!groups[result.trainingType]) {
        groups[result.trainingType] = [];
      }
      groups[result.trainingType].push(result);
    });
    return groups;
  }, [results]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: themeColor }}>
        트레이닝 상세 결과
      </h2>

      {results.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          이번 달 트레이닝 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([trainingType, trainingResults], index) => (
            <div
              key={trainingType}
              className="border-2 rounded-xl p-6"
              style={{ borderColor: '#8B5CF6' }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#8B5CF6' }}>
                {trainingType}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainingResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 bg-gray-50 rounded-lg border-2 hover:shadow-md transition-shadow"
                    style={{ borderColor: result.completed ? '#10B981' : '#EF4444' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {result.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <p className="font-bold text-gray-700">
                          {result.completed ? '완료' : '미완료'}
                        </p>
                      </div>
                      <p className="text-2xl font-bold" style={{
                        color: result.percentage >= 80 ? '#10B981' : result.percentage >= 60 ? '#F59E0B' : '#EF4444'
                      }}>
                        {result.percentage}%
                      </p>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">점수</span>
                        <span className="font-bold">{result.score} / {result.maxScore}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">소요 시간</span>
                        <span className="font-bold">{result.timeSpent}분</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-600 text-center">
                        {new Date(result.date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ 
                          width: `${result.percentage}%`,
                          backgroundColor: result.percentage >= 80 ? '#10B981' : result.percentage >= 60 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
