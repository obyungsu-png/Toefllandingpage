import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Advertisement } from './AdManagement';
import { AdModal } from './AdModal';
import { TPOTest } from './ContentManagement';
import { TPOCardMobileCompact } from './TPOCardMobileCompact';
import { computeChronoDisplayNumbers, effectiveDay } from '../utils/testLabel';


type TestSetRange = '1-5' | '1-4' | '5-8' | '9-12' | '13-16' | '17-20';

interface TPOPageProps {
  isMobile: boolean;
  isLoading?: boolean;
  activeTestSetRange: TestSetRange;
  setActiveTestSetRange: (range: TestSetRange) => void;
  tpoTests: TPOTest[];
  isContentLocked: (index: number, freeCount: number) => boolean;
  setActiveTab: (tab: any) => void;
  setCurrentTest: (test: { tpoNumber: number; section: string }) => void;
  setTestBankType: (type: any) => void;
  setShowListeningIntro: (show: boolean | string) => void;
  setShowReadingIntro: (show: boolean) => void;
  setShowWritingIntro: (show: boolean) => void;
  setShowSpeakingIntro: (show: boolean) => void;
  setShowToeflTest: (show: boolean) => void;
  onStartTest?: (testNumber: number, section: string) => void;
  onReviewTest?: (testNumber: number, section: string) => void;
  TPOCard: any;
  TestCard: any;
  advertisements?: Advertisement[];
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function TPOPage({
  isMobile,
  isLoading = false,
  activeTestSetRange,
  setActiveTestSetRange,
  tpoTests,
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
  TPOCard,
  TestCard,
  advertisements
}: TPOPageProps) {

  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, monthFilter]);

  // --- Dynamically derive year & month options from actual CMS data ---
  const { availableYears, availableMonths } = useMemo(() => {
    const tpoOnly = tpoTests.filter(t => t.testType === 'TPO');
    const years = Array.from(
      new Set(tpoOnly.map(t => t.year).filter((y): y is number => !!y))
    ).sort((a, b) => b - a); // newest first

    const months = Array.from(
      new Set(tpoOnly.map(t => t.month).filter((m): m is number => !!m))
    ).sort((a, b) => a - b);

    return { availableYears: years, availableMonths: months };
  }, [tpoTests]);

  // Only show month options relevant to the selected year (or all months if no year selected)
  const filteredMonthOptions = useMemo(() => {
    if (yearFilter === 'all') return availableMonths;
    return Array.from(
      new Set(
        tpoTests
          .filter(t => t.testType === 'TPO' && t.year === yearFilter)
          .map(t => t.month)
          .filter((m): m is number => !!m)
      )
    ).sort((a, b) => a - b);
  }, [yearFilter, tpoTests, availableMonths]);

  // TPO 카드 정렬 — CMS(TPOOverview)와 동일한 규칙:
  // Year → Month → Day 순으로 정렬하고, 날짜가 전혀 설정되지 않은 세트는
  // 정렬 방향과 무관하게 항상 맨 앞에 표시. 같은 날짜(또는 둘 다 미설정)면 번호순.
  const allTestNumbers = useMemo(() => {
    const maxTestNumber = tpoTests.reduce((max, test) => {
      if (test.testType === 'TPO' && test.testNumber > max) return test.testNumber;
      return max;
    }, 0);
    const numbers = Array.from({ length: maxTestNumber }, (_, i) => i + 1);
    const getMeta = (num: number) => tpoTests.find(t => t.testType === 'TPO' && t.testNumber === num);

    return numbers.slice().sort((numA, numB) => {
      const a = getMeta(numA);
      const b = getMeta(numB);

      if (a?.year === undefined && b?.year !== undefined) return -1;
      if (a?.year !== undefined && b?.year === undefined) return 1;
      if (a?.year !== undefined && b?.year !== undefined && a.year !== b.year) {
        return sortOrder === 'asc' ? a.year - b.year : b.year - a.year;
      }

      if (a?.month === undefined && b?.month !== undefined) return -1;
      if (a?.month !== undefined && b?.month === undefined) return 1;
      if (a?.month !== undefined && b?.month !== undefined && a.month !== b.month) {
        return sortOrder === 'asc' ? a.month - b.month : b.month - a.month;
      }

      // 정식 Day 필드가 비어 있으면 "날짜 메모"(예: "4/6")에서 일(day)을 추출해 대신 사용한다.
      const aDay = effectiveDay(a);
      const bDay = effectiveDay(b);
      if (aDay === undefined && bDay !== undefined) return -1;
      if (aDay !== undefined && bDay === undefined) return 1;
      if (aDay !== undefined && bDay !== undefined && aDay !== bDay) {
        return sortOrder === 'asc' ? aDay - bDay : bDay - aDay;
      }

      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [tpoTests, sortOrder]);

  // 카드에 보여줄 "TPO N" 번호 — 실제 시행 순서(Year→Month→Day)에 맞춰 자동 재배정.
  // 정렬 토글(오름/내림)은 카드가 놓이는 위치만 바꾸고, 이 번호 자체는 항상
  // 가장 먼저 시행된 세트가 1번이 되도록 고정한다 (날짜 미설정은 1번부터 배정).
  const chronoDisplayNumbers = useMemo(
    () => computeChronoDisplayNumbers(tpoTests, 'TPO'),
    [tpoTests]
  );

  const filteredNumbers = useMemo(() => {
    if (yearFilter === 'all' && monthFilter === 'all') return allTestNumbers;

    return allTestNumbers.filter(num => {
      const testData = tpoTests.find(t => t.testType === 'TPO' && t.testNumber === num);

      if (yearFilter !== 'all') {
        if (!testData?.year || testData.year !== yearFilter) return false;
      }
      if (monthFilter !== 'all') {
        if (!testData?.month || testData.month !== monthFilter) return false;
      }
      return true;
    });
  }, [allTestNumbers, tpoTests, yearFilter, monthFilter]);

  // Ads
  const activeAds = advertisements?.filter(ad => ad.isActive && ad.locations?.includes('TPO')) || [];
  const displayAd = activeAds[0] ?? null;
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const FilterPill = ({
    active,
    label,
    onClick,
    count,
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
    count?: number;
  }) => (
    <button
      className={`flex items-center gap-1 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-semibold text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-[#2d7a7c] text-white shadow-md'
          : 'bg-[#f5f5f5] text-gray-500 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  );

  // Count tests per year / month for badges
  const countByYear = useMemo(() => {
    const map: Record<number, number> = {};
    tpoTests.filter(t => t.testType === 'TPO' && t.year).forEach(t => {
      map[t.year!] = (map[t.year!] || 0) + 1;
    });
    return map;
  }, [tpoTests]);

  const countByMonth = useMemo(() => {
    const map: Record<number, number> = {};
    tpoTests
      .filter(t => t.testType === 'TPO' && t.month && (yearFilter === 'all' || t.year === yearFilter))
      .forEach(t => {
        map[t.month!] = (map[t.month!] || 0) + 1;
      });
    return map;
  }, [tpoTests, yearFilter]);

  return (
    <div className="bg-white relative shrink-0 w-full shadow-sm pb-24 md:pb-0">
      {/* Ad Modal */}
      {displayAd && (
        <AdModal ad={displayAd} isOpen={isAdModalOpen} onClose={() => setIsAdModalOpen(false)} />
      )}

      {/* Advertisement Banner */}
      {displayAd && (
        <div className="border-b border-gray-200">
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-3 md:py-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 md:p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              {displayAd.imageUrl && (
                <div className="hidden md:block shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                  <img loading="lazy" src={displayAd.imageUrl} alt={displayAd.title} className="w-full h-full object-cover" />
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
        <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-4 md:py-5 space-y-3 md:space-y-4">

          {/* Sort order toggle */}
          <div className="flex items-center gap-3 md:gap-5">
            <span className="text-xs md:text-sm font-bold text-gray-400 shrink-0 w-10 md:w-12">정렬</span>
            <div className="flex gap-2 md:gap-3">
              <FilterPill
                active={sortOrder === 'asc'}
                label="오름차순 ↑"
                onClick={() => setSortOrder('asc')}
              />
              <FilterPill
                active={sortOrder === 'desc'}
                label="내림차순 ↓"
                onClick={() => setSortOrder('desc')}
              />
            </div>
          </div>

          {/* Row 1: Year */}
          <div className="flex items-center gap-3 md:gap-5">
            <span className="text-xs md:text-sm font-bold text-gray-400 shrink-0 w-10 md:w-12">Year</span>
            <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
              <FilterPill
                active={yearFilter === 'all'}
                label="전체"
                onClick={() => { setYearFilter('all'); setMonthFilter('all'); }}
              />
              {availableYears.map(y => (
                <FilterPill
                  key={y}
                  active={yearFilter === y}
                  label={String(y)}
                  count={countByYear[y]}
                  onClick={() => { setYearFilter(y); setMonthFilter('all'); }}
                />
              ))}
              {availableYears.length === 0 && (
                <span className="text-xs text-gray-400 self-center">CMS에서 연도 설정 후 표시됩니다</span>
              )}
            </div>
          </div>

          {/* Row 2: Month */}
          <div className="flex items-center gap-3 md:gap-5">
            <span className="text-xs md:text-sm font-bold text-gray-400 shrink-0 w-10 md:w-12">Month</span>
            <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
              <FilterPill
                active={monthFilter === 'all'}
                label="전체"
                onClick={() => setMonthFilter('all')}
              />
              {filteredMonthOptions.map(m => (
                <FilterPill
                  key={m}
                  active={monthFilter === m}
                  label={MONTH_NAMES[m - 1]}
                  count={countByMonth[m]}
                  onClick={() => setMonthFilter(m)}
                />
              ))}
              {filteredMonthOptions.length === 0 && yearFilter !== 'all' && (
                <span className="text-xs text-gray-400 self-center">해당 연도에 월 데이터가 없습니다</span>
              )}
              {filteredMonthOptions.length === 0 && yearFilter === 'all' && (
                <span className="text-xs text-gray-400 self-center">CMS에서 월 설정 후 표시됩니다</span>
              )}
            </div>
          </div>

          {/* Active filter summary */}
          {(yearFilter !== 'all' || monthFilter !== 'all') && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-500">필터:</span>
              {yearFilter !== 'all' && (
                <span className="text-xs bg-[#2d7a7c]/10 text-[#2d7a7c] px-2 py-0.5 rounded-full font-medium">
                  {yearFilter}년
                </span>
              )}
              {monthFilter !== 'all' && (
                <span className="text-xs bg-[#e67e22]/10 text-[#e67e22] px-2 py-0.5 rounded-full font-medium">
                  {MONTH_NAMES[(monthFilter as number) - 1]}
                </span>
              )}
              <span className="text-xs text-gray-500">· {filteredNumbers.length}개</span>
              <button
                className="text-xs text-gray-400 underline hover:text-gray-600 ml-1"
                onClick={() => { setYearFilter('all'); setMonthFilter('all'); }}
              >
                초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TPO Cards Grid */}
      <div className="!w-full py-4 md:py-8">
        <div className="!w-full md:max-w-7xl md:mx-auto px-3 md:px-8">
          {filteredNumbers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {isLoading ? (
                <>
                  <p className="text-lg font-medium">Loading TPO tests...</p>
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
            <div className={isMobile ? 'flex flex-col gap-2 !w-full' : 'grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 !w-full'}>
              {filteredNumbers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((number, index) => {
                const tpoData = tpoTests.find(t => t.testType === 'TPO' && t.testNumber === number);

                const handleStartTest = (section: string) => {
                  if (onStartTest) { onStartTest(number, section); return; }
                  // fallback (onStartTest 없을 때)
                  setCurrentTest({ tpoNumber: number, section });
                  setTestBankType('tpo');
                  if (section === 'Listening') setShowListeningIntro(true);
                  else if (section === 'Reading') setShowReadingIntro(true);
                  else if (section === 'Writing') setShowWritingIntro(true);
                  else if (section === 'Speaking') setShowSpeakingIntro(true);
                  else setShowToeflTest(true);
                };

                const handleReviewTest = (section: string) => {
                  if (onReviewTest) { onReviewTest(number, section); return; }
                  handleStartTest(section);
                };

                return (
                  <div key={number} className="w-full max-w-full">
                    {isMobile ? (
                      <TPOCardMobileCompact
                        number={number}
                        displayNumber={chronoDisplayNumbers.get(number)}
                        isLocked={isContentLocked(index, 3)}
                        onUnlockClick={() => setActiveTab('Pricing')}
                        testData={tpoData}
                        onStartTest={handleStartTest}
                        onReviewTest={handleReviewTest}
                      />
                    ) : (
                      <TPOCard
                        number={number}
                        displayNumber={chronoDisplayNumbers.get(number)}
                        isLocked={isContentLocked(index, 3)}
                        onUnlockClick={() => setActiveTab('Pricing')}
                        testData={tpoData}
                        onStartTest={handleStartTest}
                        onReviewTest={handleReviewTest}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagination — 반응형: 모바일은 원형 아이콘만, 데스크톱은 "이전 / 다음" 텍스트 pill 형태 */}
      {filteredNumbers.length > itemsPerPage && (() => {
        const totalPages = Math.ceil(filteredNumbers.length / itemsPerPage);
        const canPrev = currentPage > 1;
        const canNext = currentPage < totalPages;
        const prevBase = 'group inline-flex items-center gap-1 md:gap-2 font-semibold transition-all select-none';
        const prevActive = 'text-[#2d7a7c] hover:text-[#1e5a5c]';
        const prevDisabled = 'text-gray-300 cursor-not-allowed';
        return (
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-3 md:py-5">
            <div className="flex justify-center items-center gap-3 md:gap-6">
              <button
                aria-label="이전 페이지"
                className={`${prevBase} ${canPrev ? prevActive : prevDisabled}`}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!canPrev}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all ${
                    canPrev
                      ? 'bg-[#e6f2f2] group-hover:bg-[#2d7a7c] group-hover:text-white group-active:scale-95'
                      : 'bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
                </span>
                <span className="hidden md:inline text-sm">이전</span>
              </button>

              <span className="text-sm md:text-base font-semibold text-gray-500 select-none tabular-nums px-1">
                <span className="text-[#2d7a7c] text-base md:text-lg font-bold">{currentPage}</span>
                <span className="text-gray-300 mx-1.5">/</span>
                <span>{totalPages}</span>
                <span className="hidden md:inline text-xs text-gray-400 ml-2">페이지</span>
              </span>

              <button
                aria-label="다음 페이지"
                className={`${prevBase} ${canNext ? prevActive : prevDisabled}`}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={!canNext}
              >
                <span className="hidden md:inline text-sm">다음</span>
                <span
                  className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all ${
                    canNext
                      ? 'bg-[#e6f2f2] group-hover:bg-[#2d7a7c] group-hover:text-white group-active:scale-95'
                      : 'bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
                </span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Info */}
      <div className="pb-12">
        <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 font-['Inter',_sans-serif]">
              Showing TPO 1-{allTestNumbers.length} • Total: {allTestNumbers.length} TPO Tests Available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
