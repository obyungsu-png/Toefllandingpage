import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { Advertisement } from './AdManagement';
import { AdModal } from './AdModal';
import { TPOTest } from './ContentManagement';
import { TPOCardMobileCompact } from './TPOCardMobileCompact';
import { computeChronoDisplayNumbers, effectiveDay } from '../utils/testLabel';
import { TestResult } from '../types/testResult';


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
  /** 학생의 TPO 응시 결과 — 각 카드의 밴드 점수·섹션 완료 표시용 */
  testResults?: TestResult[];
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
  advertisements,
  testResults,
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

  const MobileChip = ({ active, label, onClick, count }: {
    active: boolean; label: string; onClick: () => void; count?: number;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${
        active
          ? 'text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-150 hover:bg-gray-50'
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

  // ── 모바일 Hero 통계 — 밴드(0~6) · 완료 · 연속 ────────────────────────
  // TOEFL 밴드 스케일 0~6. R/L 원점수(0~30) → 밴드(÷5), S/W aiBandScore 사용.
  const heroStats = useMemo(() => {
    const totalTpos = tpoTests.filter(t => t.testType === 'TPO').length || 0;
    const tpoResults = (testResults || []).filter(r => r.type === 'TPO');

    // 섹션 점수 → 0~6 밴드
    const sectionBand = (r: TestResult): number | null => {
      const cat = r.category || '';
      if (cat === 'Speaking' || cat === 'Writing') {
        const b = r.aiBandScore;
        if (typeof b === 'number' && Number.isFinite(b)) return Math.max(0, Math.min(6, b));
        const sc = r.aiScore ?? (Number.isFinite(r.score) ? r.score : null);
        if (sc === null) return null;
        return Math.max(0, Math.min(6, sc <= 6 ? sc : sc / 5));  // 0~6 또는 0~30 추정
      }
      // R/L : 0~30 → ÷5 → 0~6
      const sc = Number.isFinite(r.score) ? r.score : null;
      if (sc === null) return null;
      return Math.max(0, Math.min(6, sc / 5));
    };

    // 완료 TPO — 4섹션 전부 응시
    const perTest = new Map<number, Set<string>>();
    for (const r of tpoResults) {
      if (!r.testNumber) continue;
      const cat = r.category || '';
      if (!['Reading','Listening','Speaking','Writing'].includes(cat)) continue;
      const completed = r.status === 'completed' || (r.answeredCount ?? 0) > 0 || (r.correctAnswers ?? 0) > 0;
      if (!completed) continue;
      if (!perTest.has(r.testNumber)) perTest.set(r.testNumber, new Set());
      perTest.get(r.testNumber)!.add(cat);
    }
    const doneTpoNumbers = [...perTest.entries()].filter(([_, secs]) => secs.size >= 4).map(([n]) => n);
    const completedCount = doneTpoNumbers.length;

    // 최근 밴드 — 가장 최근 완료 TPO 섹션 평균 (소수 첫째자리)
    let latestBand: number | null = null;
    if (doneTpoNumbers.length > 0) {
      const lastN = doneTpoNumbers[doneTpoNumbers.length - 1];
      const bands: number[] = [];
      for (const r of tpoResults) {
        if (r.testNumber !== lastN) continue;
        const b = sectionBand(r);
        if (b !== null) bands.push(b);
      }
      if (bands.length > 0) {
        latestBand = Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10;
      }
    }

    // 지난 주 변화 — 완료 TPO 2개 이상일 때, 최근 2개 평균 차
    let weekDelta: number | null = null;
    if (doneTpoNumbers.length >= 2) {
      const prevN = doneTpoNumbers[doneTpoNumbers.length - 2];
      const prevBands: number[] = [];
      for (const r of tpoResults) {
        if (r.testNumber !== prevN) continue;
        const b = sectionBand(r);
        if (b !== null) prevBands.push(b);
      }
      if (prevBands.length > 0 && latestBand !== null) {
        const prev = prevBands.reduce((a, b) => a + b, 0) / prevBands.length;
        weekDelta = Math.round((latestBand - prev) * 10) / 10;
      }
    }

    // 연속 일수
    const dates = [...new Set(tpoResults.map(r => (r.date || '').slice(0, 10)).filter(Boolean))].sort().reverse();
    let streak = 0;
    if (dates.length > 0) {
      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      const start = new Date(dates[0] + 'T00:00:00Z');
      for (let i = 0; i < dates.length; i++) {
        const want = new Date(start); want.setUTCDate(start.getUTCDate() - i);
        if (dates[i] === toISO(want)) streak++; else break;
      }
    }

    // 목표 — localStorage, 기본 5.5 (0~6 스케일)
    let goal = 5.5;
    try {
      const v = localStorage.getItem('tpo_band_goal');
      if (v && Number(v) > 0 && Number(v) <= 6) goal = Number(v);
    } catch { /* ignore */ }
    const remaining = latestBand !== null
      ? Math.max(0, Math.round((goal - latestBand) * 10) / 10)
      : null;

    // 목표 달 — localStorage 'tpo_band_target_month' (예: "Oct 2027"), 기본 지금+3개월
    let targetMonth = '';
    try {
      const v = localStorage.getItem('tpo_band_target_month');
      if (v) targetMonth = v;
    } catch { /* ignore */ }
    if (!targetMonth) {
      const d = new Date(); d.setMonth(d.getMonth() + 3);
      targetMonth = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    return { totalTpos, completedCount, latestBand, streak, goal, remaining, weekDelta, targetMonth };
  }, [tpoTests, testResults]);

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

      {/* ============ MOBILE: Hero + Compact Filters ============ */}
      {isMobile ? (
        <div>
          {/* Band Focus 다크 히어로 — 배너 바로 아래 */}
          <div className="px-4 pt-2 pb-3 -mt-2.5">
            <div
              className="relative overflow-hidden rounded-2xl p-4 pb-3.5"
              style={{
                background: 'linear-gradient(135deg, #0a0f1a 0%, #0e1724 55%, #122032 100%)',
                boxShadow: '0 4px 14px -4px rgba(10, 15, 26, 0.3), 0 1px 3px rgba(10, 15, 26, 0.12)',
              }}
            >
              {/* 은은한 데코 */}
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-[#00d4a1]/[0.06]" />
              <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-[#00d4a1]/[0.04]" />

              {/* eyebrow */}
              <div className="relative text-[9.5px] font-extrabold tracking-[0.18em] uppercase text-[#4ddfb4]">
                Your Target · {heroStats.targetMonth}
              </div>

              {/* 헤드라인 */}
              <h2 className="relative mt-1 text-white font-extrabold leading-[1.05] tracking-tight text-[22px]">
                목표 {heroStats.goal}점
                {heroStats.remaining !== null && heroStats.remaining > 0 && (
                  <><br />까지 {heroStats.remaining}점</>
                )}
                {heroStats.remaining === 0 && (
                  <span className="block text-[14px] text-[#4ddfb4] mt-0.5">목표 도달!</span>
                )}
                {heroStats.remaining === null && (
                  <span className="block text-[12px] text-white/60 mt-0.5 font-medium">첫 TPO 응시 후 측정 시작</span>
                )}
              </h2>

              {/* 큰 밴드 숫자 + sub */}
              <div className="relative mt-3 flex items-end gap-2.5">
                <div
                  className="font-extrabold leading-none tabular-nums tracking-tight"
                  style={{
                    fontSize: '46px',
                    color: heroStats.latestBand !== null ? '#4ddfb4' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {heroStats.latestBand ?? '—'}
                </div>
                <div className="pb-1 text-[11px] text-white/70 font-medium leading-tight">
                  현재 밴드 / 6
                </div>
              </div>

              {/* 하단 미니 통계 */}
              <div className="relative mt-2 text-[11px] text-white/75 font-medium tabular-nums">
                완료 <b className="text-white font-bold">{heroStats.completedCount}</b>
                <span className="text-white/35 mx-1.5">·</span>
                연속 <b className="text-[#f0a658] font-bold">{heroStats.streak}일</b>
                {heroStats.weekDelta !== null && heroStats.weekDelta !== 0 && (
                  <>
                    <span className="text-white/35 mx-1.5">·</span>
                    이번 주 <b className={heroStats.weekDelta > 0 ? 'text-[#4ddfb4]' : 'text-[#f87171]'}>
                      {heroStats.weekDelta > 0 ? '+' : ''}{heroStats.weekDelta}점
                    </b>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 컴팩트 필터 바 — 한 줄 가로 스크롤 */}
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
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-4 md:py-5 space-y-3 md:space-y-4">

            {/* Sort order toggle */}
            <div className="flex items-center gap-3 md:gap-5">
              <span className="text-xs md:text-sm font-bold text-gray-400 shrink-0 w-10 md:w-12">정렬</span>
              <div className="flex gap-2 md:gap-3">
                <FilterPill active={sortOrder === 'asc'}  label="오름차순 ↑" onClick={() => setSortOrder('asc')} />
                <FilterPill active={sortOrder === 'desc'} label="내림차순 ↓" onClick={() => setSortOrder('desc')} />
              </div>
            </div>

            {/* Row 1: Year */}
            <div className="flex items-center gap-3 md:gap-5">
              <span className="text-xs md:text-sm font-bold text-gray-400 shrink-0 w-10 md:w-12">Year</span>
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

            {/* Row 2: Month */}
            <div className="flex items-center gap-3 md:gap-5">
              <span className="text-xs md:text-sm font-bold text-gray-400 shrink-0 w-10 md:w-12">Month</span>
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
                {filteredMonthOptions.length === 0 && yearFilter !== 'all' && (
                  <span className="text-xs text-gray-400 self-center">해당 연도에 월 데이터가 없습니다</span>
                )}
                {filteredMonthOptions.length === 0 && yearFilter === 'all' && (
                  <span className="text-xs text-gray-400 self-center">CMS에서 월 설정 후 표시됩니다</span>
                )}
              </div>
            </div>

            {(yearFilter !== 'all' || monthFilter !== 'all') && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-500">필터:</span>
                {yearFilter !== 'all' && (
                  <span className="text-xs bg-[#2d7a7c]/10 text-[#2d7a7c] px-2 py-0.5 rounded-full font-medium">{yearFilter}년</span>
                )}
                {monthFilter !== 'all' && (
                  <span className="text-xs bg-[#e67e22]/10 text-[#e67e22] px-2 py-0.5 rounded-full font-medium">{MONTH_NAMES[(monthFilter as number) - 1]}</span>
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
      )}

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
                        results={testResults}
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

      {/* Pagination — 카드형 컨테이너 + 이전/다음 버튼 + 페이지 번호 pill + 현재 페이지 뱃지 */}
      {filteredNumbers.length > itemsPerPage && (() => {
        const totalPages = Math.ceil(filteredNumbers.length / itemsPerPage);
        const canPrev = currentPage > 1;
        const canNext = currentPage < totalPages;

        // 현재 페이지 주변으로 최대 5개 페이지 번호를 노출 (양 끝은 항상 포함)
        const pageNumbers: (number | 'gap')[] = [];
        const push = (v: number | 'gap') => {
          if (pageNumbers[pageNumbers.length - 1] !== v) pageNumbers.push(v);
        };
        const window = 1;
        for (let p = 1; p <= totalPages; p++) {
          if (p === 1 || p === totalPages || (p >= currentPage - window && p <= currentPage + window)) {
            push(p);
          } else if (p === currentPage - window - 1 || p === currentPage + window + 1) {
            push('gap');
          }
        }

        const prevNextBase = 'group inline-flex items-center gap-2 rounded-xl px-3 md:px-4 py-2 font-semibold transition-all select-none border';
        const prevNextActive = 'text-[#2d7a7c] border-[#2d7a7c]/25 bg-white hover:bg-[#2d7a7c] hover:text-white hover:border-[#2d7a7c] hover:shadow-md active:scale-[0.97]';
        const prevNextDisabled = 'text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed';

        return (
          <div className="w-full md:max-w-7xl md:mx-auto px-4 md:px-8 py-4 md:py-6">
            <div className="mx-auto flex items-center justify-center gap-2 md:gap-3 rounded-2xl border border-gray-100 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.04)] px-3 md:px-5 py-2.5 md:py-3 w-fit">

              {/* 이전 버튼 */}
              <button
                aria-label="이전 페이지"
                className={`${prevNextBase} ${canPrev ? prevNextActive : prevNextDisabled}`}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!canPrev}
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
                <span className="hidden md:inline text-sm">이전</span>
              </button>

              {/* 페이지 번호 pill 그룹 */}
              <div className="flex items-center gap-1 md:gap-1.5 px-1 md:px-2">
                {pageNumbers.map((p, i) =>
                  p === 'gap' ? (
                    <span key={`gap-${i}`} className="w-6 text-center text-gray-300 select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      aria-current={p === currentPage ? 'page' : undefined}
                      className={`min-w-[32px] md:min-w-[36px] h-8 md:h-9 px-2 rounded-lg text-sm font-semibold transition-all tabular-nums ${
                        p === currentPage
                          ? 'bg-gradient-to-br from-[#2d7a7c] to-[#1e6b73] text-white shadow-md scale-105'
                          : 'text-gray-600 hover:bg-[#e6f2f2] hover:text-[#2d7a7c] active:scale-95'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              {/* 총 페이지 안내 */}
              <span className="hidden md:inline text-xs text-gray-400 border-l border-gray-200 pl-3 ml-1 tabular-nums">
                총 <span className="text-gray-600 font-semibold">{totalPages}</span> 페이지
              </span>

              {/* 다음 버튼 */}
              <button
                aria-label="다음 페이지"
                className={`${prevNextBase} ${canNext ? prevNextActive : prevNextDisabled}`}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={!canNext}
              >
                <span className="hidden md:inline text-sm">다음</span>
                <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
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
