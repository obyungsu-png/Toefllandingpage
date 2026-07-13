import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Advertisement } from './AdManagement';
import { AdModal } from './AdModal';
import { formatTestLabel } from '../utils/testLabel';

type TestSetRange = '1-5';
type YearFilter = 'all' | '2024' | '2025' | '2026';
type MonthFilter = 'all' | 'jan-mar' | 'apr-jun' | 'jul-sep' | 'oct-dec';

interface TPOTest {
  id: string;
  testNumber: number;
  testType: 'TPO' | 'Test';
  year?: number;
  month?: number;
  isOfficial?: boolean;
  reading?: {
    passages: any[];
    questions: any[];
  };
  listening?: any;
  speaking?: any;
  writing?: any;
}

interface TestPageProps {
  isMobile: boolean;
  isLoading?: boolean;
  activeTestSetRange: TestSetRange;
  setActiveTestSetRange: (range: TestSetRange) => void;
  testTests: TPOTest[];
  isContentLocked: (index: number, freeCount: number) => boolean;
  setActiveTab: (tab: string) => void;
  setCurrentTest: (test: { tpoNumber: number; section: string }) => void;
  setTestBankType: (type: string) => void;
  setShowListeningIntro: (show: boolean | string) => void;
  setShowReadingIntro: (show: boolean) => void;
  setShowWritingIntro: (show: boolean) => void;
  setShowSpeakingIntro: (show: boolean) => void;
  setShowToeflTest: (show: boolean) => void;
  onStartTest?: (testNumber: number, section: string) => void;
  onReviewTest?: (testNumber: number, section: string) => void;
  TestCard: any;
  advertisements?: Advertisement[];
}

export function TestPage({
  isMobile,
  isLoading = false,
  activeTestSetRange,
  setActiveTestSetRange,
  testTests,
  isContentLocked,
  setActiveTab,
  setCurrentTest,
  setTestBankType,
  setShowListeningIntro,
  setShowReadingIntro,
  setShowWritingIntro,
  setShowSpeakingIntro,
  setShowToeflTest,
  onStartTest,
  onReviewTest,
  TestCard,
  advertisements
}: TestPageProps) {
  
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 한 페이지에 4개씩 표시

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, monthFilter]);

  const allTestNumbers = useMemo(() => {
    // Dynamically generate test numbers based on actual Test data
    const maxTestNumber = testTests.reduce((max, test) => {
      if (test.testType === 'Test' && test.testNumber > max) {
        return test.testNumber;
      }
      return max;
    }, 0);
    
    // Generate array [1, 2, 3, ..., maxTestNumber]
    return Array.from({ length: maxTestNumber }, (_, i) => i + 1);
  }, [testTests]);

  const getFilteredTestNumbers = (): number[] => {
    let numbers = allTestNumbers;

    if (yearFilter !== 'all' || monthFilter !== 'all') {
      numbers = numbers.filter(num => {
        const testData = testTests.find(t => t.testNumber === num);
        
        if (yearFilter !== 'all') {
          const y = parseInt(yearFilter);
          if (!testData?.year || testData.year !== y) return false;
        }

        if (monthFilter !== 'all' && testData?.month) {
          const m = testData.month;
          if (monthFilter === 'jan-mar' && (m < 1 || m > 3)) return false;
          if (monthFilter === 'apr-jun' && (m < 4 || m > 6)) return false;
          if (monthFilter === 'jul-sep' && (m < 7 || m > 9)) return false;
          if (monthFilter === 'oct-dec' && (m < 10 || m > 12)) return false;
        } else if (monthFilter !== 'all' && !testData?.month) {
          return false;
        }

        return true;
      });
    }

    return numbers;
  };

  const filteredNumbers = getFilteredTestNumbers();

  const activeAds = advertisements?.filter(ad => 
    ad.isActive && ad.locations?.includes('Test')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;

  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

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

  return (
    <div className="bg-white relative shrink-0 w-full shadow-sm pb-24 md:pb-0">
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
        <div className="border-b border-gray-200">
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-3 md:py-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 md:p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              {displayAd.imageUrl && (
                <div className="hidden md:block shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                  <img 
                    src={displayAd.imageUrl}
                    alt={displayAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-3 w-full">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-[#2d5a5d] mb-1 text-sm md:text-base font-bold">{displayAd.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm">{displayAd.content}</p>
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

      {/* Filter Section */}
      <div className="border-b border-gray-200">
        <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-4 md:py-5 space-y-4">
          {/* Row 1: Year */}
          <div className="flex items-center gap-4 md:gap-5">
            <span className="text-sm md:text-base font-bold text-gray-400 shrink-0 w-12">Year</span>
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
            <span className="text-sm md:text-base font-bold text-gray-400 shrink-0 w-12">Month</span>
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

      {/* Test Cards Grid */}
      <div className="!w-full py-4 md:py-8">
        <div className="!w-full md:max-w-7xl md:mx-auto px-3 md:px-8">
          {filteredNumbers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {isLoading ? (
                <>
                  <p className="text-lg font-medium">Loading tests...</p>
                  <p className="text-sm mt-1">Fetching the latest test list.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No tests found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 !w-full">
              {filteredNumbers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((number, index) => {
                const testData = testTests.find(t => t.testNumber === number);
                
                const handleStartTest = (section: string) => {
                  if (onStartTest) { onStartTest(number, section); return; }
                  // fallback
                  setCurrentTest({ tpoNumber: number, section });
                  setTestBankType('test');
                  
                  if (section === 'Listening') {
                    setShowListeningIntro(true);
                  } else if (section === 'Reading') {
                    setShowReadingIntro(true);
                  } else if (section === 'Writing') {
                    setShowWritingIntro(true);
                  } else if (section === 'Speaking') {
                    setShowSpeakingIntro(true);
                  } else {
                    setShowToeflTest(true);
                  }
                };

                const handleReviewTest = (section: string) => {
                  if (onReviewTest) {
                    onReviewTest(number, section);
                    return;
                  }

                  handleStartTest(section);
                };
                
                return (
                  <div key={number} className="w-full max-w-full">
                    <TestCard
                      number={number}
                      customTitle={formatTestLabel(testData as any, testTests as any, `Test ${number}`)}
                      isLocked={isContentLocked(index, 3)}
                      onUnlockClick={() => setActiveTab('Pricing')}
                      testData={testData}
                      onStartTest={handleStartTest}
                      onReviewTest={handleReviewTest}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredNumbers.length > itemsPerPage && (
        <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-center items-center gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#2d7a7c] text-white hover:bg-[#1e5a5c] shadow-md'
              }`}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              이전
            </button>
            
            {Array.from({ length: Math.ceil(filteredNumbers.length / itemsPerPage) }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                  currentPage === pageNum
                    ? 'bg-[#e67e22] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                currentPage * itemsPerPage >= filteredNumbers.length
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#2d7a7c] text-white hover:bg-[#1e5a5c] shadow-md'
              }`}
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredNumbers.length / itemsPerPage), prev + 1))}
              disabled={currentPage * itemsPerPage >= filteredNumbers.length}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="pb-12">
        <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 font-['Inter',_sans-serif]">
              Showing Test 1-{allTestNumbers.length} • Total: {allTestNumbers.length} Real Tests Available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}