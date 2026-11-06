import React, { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Advertisement } from './AdManagement';
import { AdModal } from './AdModal';
import { TPOCardMobileCompact } from './TPOCardMobileCompact';
import { computeChronoDisplayNumbers, effectiveDay } from '../utils/testLabel';
import { TestResult } from '../types/testResult';

type TestSetRange = '1-5' | '1-4' | '5-8' | '9-12' | '13-16' | '17-20';

interface TPOTest {
  id: string;
  testNumber: number;
  testType: 'TPO' | 'Test' | 'Training';
  year?: number;
  month?: number;
  day?: number;
  dateMemo?: string;
  isOfficial?: boolean;
  reading?: { passages: any[]; questions: any[]; };
  listening?: any;
  speaking?: any;
  writing?: any;
  sections?: any[];
}

interface TestPageProps {
  isMobile: boolean;
  isLoading?: boolean;
  activeTestSetRange: TestSetRange;
  setActiveTestSetRange: (range: TestSetRange) => void;
  testTests: TPOTest[];
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
  TestCard: any;
  advertisements?: Advertisement[];
  testResults?: TestResult[];
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function TestPage({
  isMobile,
  isLoading = false,
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
  advertisements,
  testResults,
}: TestPageProps) {

  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, monthFilter]);

  // ── 연도·월 옵션 동적 생성 (CMS 데이터로부터 자동) ──────────────────────
  const { availableYears, availableMonths } = useMemo(() => {
    const onlyTest = testTests.filter(t => t.testType === 'Test');
    const years = Array.from(
      new Set(onlyTest.map(t => t.year).filter((y): y is number => !!y))
    ).sort((a, b) => b - a);
    const months = Array.from(
      new Set(onlyTest.map(t => t.month).filter((m): m is number => !!m))
    ).sort((a, b) => a - b);
    return { availableYears: years, availableMonths: months };
  }, [testTests]);

  const filteredMonthOptions = useMemo(() => {
    if (yearFilter === 'all') return availableMonths;
    return Array.from(
      new Set(
        testTests
          .filter(t => t.testType === 'Test' && t.year === yearFilter)
          .map(t => t.month)
          .filter((m): m is number => !!m)
      )
    ).sort((a, b) => a - b);
  }, [yearFilter, testTests, availableMonths]);

  const countByYear = useMemo(() => {
    const map: Record<number, number> = {};
    testTests.filter(t => t.testType === 'Test' && t.year).forEach(t => {
      map[t.year!] = (map[t.year!] || 0) + 1;
    });
    return map;
  }, [testTests]);

  const countByMonth = useMemo(() => {
    const map: Record<number, number> = {};
    testTests
      .filter(t => t.testType === 'Test' && t.month && (yearFilter === 'all' || t.year === yearFilter))
      .forEach(t => {
        map[t.month!] = (map[t.month!] || 0) + 1;
      });
    return map;
  }, [testTests, yearFilter]);

  // ── Hero 통계 (TPOPage 와 동일 로직, type: 'Test') ───────────────────
  const heroStats = useMemo(() => {
    const totalTests = testTests.filter(t => t.testType === 'Test').length || 0;
    const tResults = (testResults || []).filter(r => r.type === 'Test');

    const sectionBand = (r: TestResult): number | null => {
      const cat = r.category || '';
      if (cat === 'Speaking' || cat === 'Writing') {
        const b = r.aiBandScore;
        if (typeof b === 'number' && Number.isFinite(b)) return Math.max(0, Math.min(6, b));
        const sc = r.aiScore ?? (Number.isFinite(r.score) ? r.score : null);
        if (sc === null) return null;
        return Math.max(0, Math.min(6, sc <= 6 ? sc : sc / 5));
      }
      const sc = Number.isFinite(r.score) ? r.score : null;
      if (sc === null) return null;
      return Math.max(0, Math.min(6, sc / 5));
    };

    const perTest = new Map<number, Set<string>>();
    for (const r of tResults) {
      if (!r.testNumber) continue;
      const cat = r.category || '';
      if (!['Reading','Listening','Speaking','Writing'].includes(cat)) continue;
      const completed = r.status === 'completed' || (r.answeredCount ?? 0) > 0 || (r.correctAnswers ?? 0) > 0;
      if (!completed) continue;
      if (!perTest.has(r.testNumber)) perTest.set(r.testNumber, new Set());
      perTest.get(r.testNumber)!.add(cat);
    }
    const doneTestNumbers = [...perTest.entries()].filter(([_, secs]) => secs.size >= 4).map(([n]) => n);
    const completedCount = doneTestNumbers.length;

    let latestBand: number | null = null;
    if (doneTestNumbers.length > 0) {
      const lastN = doneTestNumbers[doneTestNumbers.length - 1];
      const bands: number[] = [];
      for (const r of tResults) {
        if (r.testNumber !== lastN) continue;
        const b = sectionBand(r);
        if (b !== null) bands.push(b);
      }
      if (bands.length > 0) {
        latestBand = Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10;
      }
    }

    let weekDelta: number | null = null;
    if (doneTestNumbers.length >= 2) {
      const prevN = doneTestNumbers[doneTestNumbers.length - 2];
      const prevBands: number[] = [];
      for (const r of tResults) {
        if (r.testNumber !== prevN) continue;
        const b = sectionBand(r);
        if (b !== null) prevBands.push(b);
      }
      if (prevBands.length > 0 && latestBand !== null) {
        const prev = prevBands.reduce((a, b) => a + b, 0) / prevBands.length;
        weekDelta = Math.round((latestBand - prev) * 10) / 10;
      }
    }

    const dates = [...new Set(tResults.map(r => (r.date || '').slice(0, 10)).filter(Boolean))].sort().reverse();
    let streak = 0;
    if (dates.length > 0) {
      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      const start = new Date(dates[0] + 'T00:00:00Z');
      for (let i = 0; i < dates.length; i++) {
        const want = new Date(start); want.setUTCDate(start.getUTCDate() - i);
        if (dates[i] === toISO(want)) streak++; else break;
      }
    }

    let goal = 5.5;
    try {
      const v = localStorage.getItem('test_band_goal');
      if (v && Number(v) > 0 && Number(v) <= 6) goal = Number(v);
    } catch { /* ignore */ }
    const remaining = latestBand !== null
      ? Math.max(0, Math.round((goal - latestBand) * 10) / 10)
      : null;

    let targetMonth = '';
    try {
      const v = localStorage.getItem('test_band_target_month');
      if (v) targetMonth = v;
    } catch { /* ignore */ }
    if (!targetMonth) {
      const d = new Date(); d.setMonth(d.getMonth() + 3);
      targetMonth = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    return { totalTests, completedCount, latestBand, streak, goal, remaining, weekDelta, targetMonth };
  }, [testTests, testResults]);

  // ── Test 번호 정렬 (TPOPage 와 동일) ─────────────────────────────────
  const allTestNumbers = useMemo(() => {
    const maxTestNumber = testTests.reduce((max, test) => {
      if (test.testType === 'Test' && test.testNumber > max) return test.testNumber;
      return max;
    }, 0);
    const numbers = Array.from({ length: maxTestNumber }, (_, i) => i + 1);
    const getMeta = (num: number) => testTests.find(t => t.testType === 'Test' && t.testNumber === num);

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
      const aDay = effectiveDay(a);
      const bDay = effectiveDay(b);
      if (aDay === undefined && bDay !== undefined) return -1;
      if (aDay !== undefined && bDay === undefined) return 1;
      if (aDay !== undefined && bDay !== undefined && aDay !== bDay) {
        return sortOrder === 'asc' ? aDay - bDay : bDay - aDay;
      }
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }, [testTests, sortOrder]);

  const chronoDisplayNumbers = useMemo(
    () => computeChronoDisplayNumbers(testTests, 'Test'),
    [testTests]
  );

  const filteredNumbers = useMemo(() => {
    if (yearFilter === 'all' && monthFilter === 'all') return allTestNumbers;
    return allTestNumbers.filter(num => {
      const testData = testTests.find(t => t.testType === 'Test' && t.testNumber === num);
      if (yearFilter !== 'all' && (!testData?.year || testData.year !== yearFilter)) return false;
      if (monthFilter !== 'all' && (!testData?.month || testData.month !== monthFilter)) return false;
      return true;
    });
  }, [allTestNumbers, testTests, yearFilter, monthFilter]);

  const activeAds = advertisements?.filter(ad => ad.isActive && ad.locations?.includes('Test')) || [];
  const displayAd = activeAds[0] ?? null;
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // 데스크탑 FilterPill (기존 유지)
  const FilterPill = ({ active, label, onClick, count }: {
    active: boolean; label: string; onClick: () => void; count?: number;
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

  // 모바일 작은 chip
  const MobileChip = ({ active, label, onClick, count }: {
    active: boolean; label: string; onClick: () => void; count?: number;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
        active ? 'text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-150 hover:bg-gray-50'
      }`}
      style={{
        backgroundColor: active ? '#005f61' : undefined,
        borderColor: active ? '#005f61' : '#eceeed',
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-[9px] font-bold tabular-nums ${active ? 'opacity-80' : 'opacity-60'}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="relative shrink-0 w-full shadow-sm pb-24 md:pb-0 bg-[#f6f6f1] md:bg-white">
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
                  <img src={displayAd.imageUrl} alt={displayAd.title} className="w-full h-full object-cover" />
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

      {/* ============ MOBILE: Band Focus Hero + Compact Filters ============ */}
      {isMobile ? (
        <div>
          {/* Band Focus 라이트 히어로 */}
          <div className="px-4 pt-3 pb-2">
            <div
              className="relative overflow-hidden rounded-2xl p-4 pb-3.5 bg-white border border-[#005f61]/15"
              style={{ boxShadow: '0 1px 2px rgba(0, 95, 97, 0.04), 0 2px 8px -4px rgba(0, 95, 97, 0.08)' }}
            >
              <div
                className="absolute left-0 top-4 bottom-4 w-1 rounded-r"
                style={{ background: 'linear-gradient(180deg, #005f61, #00bcd4)' }}
              />
              <div className="absolute -top-10 -right-8 w-28 h-28 rounded-full bg-[#005f61]/[0.04]" />
              <div className="absolute -bottom-10 -right-20 w-32 h-32 rounded-full bg-[#00bcd4]/[0.03]" />

              <div className="relative pl-2 text-[9.5px] font-extrabold tracking-[0.18em] uppercase text-[#005f61]">
                Your Target · {heroStats.targetMonth}
              </div>

              <h2 className="relative pl-2 mt-1 font-extrabold leading-[1.05] tracking-tight text-[22px] text-gray-900">
                목표 {heroStats.goal}점
                {heroStats.remaining !== null && heroStats.remaining > 0 && (
                  <><br /><span className="text-gray-700">까지 </span><span style={{ color: '#005f61' }}>{heroStats.remaining}점</span></>
                )}
                {heroStats.remaining === 0 && (
                  <span className="block text-[14px] mt-0.5" style={{ color: '#005f61' }}>목표 도달!</span>
                )}
                {heroStats.remaining === null && (
                  <span className="block text-[12px] text-gray-500 mt-0.5 font-medium">첫 Test 응시 후 측정 시작</span>
                )}
              </h2>

              <div className="relative pl-2 mt-3 flex items-end gap-2.5">
                <div
                  className="font-extrabold leading-none tabular-nums tracking-tight"
                  style={{
                    fontSize: '46px',
                    color: heroStats.latestBand !== null ? '#005f61' : '#cbd0cf',
                  }}
                >
                  {heroStats.latestBand ?? '—'}
                </div>
                <div className="pb-1 text-[11px] text-gray-500 font-medium leading-tight">
                  현재 밴드 / 6
                </div>
              </div>

              <div className="relative pl-2 mt-2 text-[11px] text-gray-500 font-medium tabular-nums">
                완료 <b className="text-gray-900 font-bold">{heroStats.completedCount}</b>
                <span className="text-gray-300 mx-1.5">·</span>
                연속 <b className="font-bold" style={{ color: '#d97706' }}>{heroStats.streak}일</b>
                {heroStats.weekDelta !== null && heroStats.weekDelta !== 0 && (
                  <>
                    <span className="text-gray-300 mx-1.5">·</span>
                    이번 주 <b style={{ color: heroStats.weekDelta > 0 ? '#005f61' : '#dc2626' }}>
                      {heroStats.weekDelta > 0 ? '+' : ''}{heroStats.weekDelta}점
                    </b>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 컴팩트 필터 바 */}
          <div className="border-b border-gray-100 px-4 pb-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? '오름차순 — 과거 먼저' : '내림차순 — 최신 먼저'}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-gray-150 bg-white text-gray-500 text-[11px] font-semibold shrink-0 hover:bg-gray-50"
                style={{ borderColor: '#eceeed' }}
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortOrder === 'asc' ? '과거↑' : '최신↓'}
              </button>
              <MobileChip
                active={yearFilter === 'all' && monthFilter === 'all'}
                label="All"
                onClick={() => { setYearFilter('all'); setMonthFilter('all'); }}
              />
              {availableYears.map(y => (
                <MobileChip
                  key={`y-${y}`}
                  active={yearFilter === y && monthFilter === 'all'}
                  label={String(y)}
                  count={countByYear[y]}
                  onClick={() => { setYearFilter(y); setMonthFilter('all'); }}
                />
              ))}
              {filteredMonthOptions.map(m => (
                <MobileChip
                  key={`m-${m}`}
                  active={monthFilter === m}
                  label={MONTH_NAMES[m - 1]}
                  count={countByMonth[m]}
                  onClick={() => setMonthFilter(m)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-gray-200">
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-4 md:py-5 space-y-4">
            <div className="flex items-center gap-4 md:gap-5">
              <span className="text-sm md:text-base font-bold text-gray-400 shrink-0 w-12">정렬</span>
              <div className="flex gap-2 md:gap-3">
                <FilterPill active={sortOrder === 'asc'}  label="오름차순 ↑" onClick={() => setSortOrder('asc')} />
                <FilterPill active={sortOrder === 'desc'} label="내림차순 ↓" onClick={() => setSortOrder('desc')} />
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-5">
              <span className="text-sm md:text-base font-bold text-gray-400 shrink-0 w-12">Year</span>
              <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                <FilterPill active={yearFilter === 'all'} label="전체" onClick={() => { setYearFilter('all'); setMonthFilter('all'); }} />
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
            <div className="flex items-center gap-4 md:gap-5">
              <span className="text-sm md:text-base font-bold text-gray-400 shrink-0 w-12">Month</span>
              <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                <FilterPill active={monthFilter === 'all'} label="전체" onClick={() => setMonthFilter('all')} />
                {filteredMonthOptions.map(m => (
                  <FilterPill
                    key={m}
                    active={monthFilter === m}
                    label={MONTH_NAMES[m - 1]}
                    count={countByMonth[m]}
                    onClick={() => setMonthFilter(m)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className={isMobile ? 'flex flex-col gap-2 !w-full' : 'grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 !w-full'}>
              {filteredNumbers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((number, index) => {
                const testData = testTests.find(t => t.testNumber === number);

                const handleStartTest = (section: string) => {
                  if (onStartTest) { onStartTest(number, section); return; }
                  setCurrentTest({ tpoNumber: number, section });
                  setTestBankType('test');
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
                        testData={testData as any}
                        onStartTest={handleStartTest}
                        onReviewTest={handleReviewTest}
                        bankType="test"
                        customTitle={`Test ${chronoDisplayNumbers.get(number) ?? number}`}
                        results={testResults}
                      />
                    ) : (
                      <TestCard
                        number={number}
                        displayNumber={chronoDisplayNumbers.get(number)}
                        isLocked={isContentLocked(index, 3)}
                        onUnlockClick={() => setActiveTab('Pricing')}
                        testData={testData}
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
                    ? 'bg-[#005f61] text-white shadow-md'
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
