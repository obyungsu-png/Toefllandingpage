import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { BarChart3, Clock, CheckCircle, XCircle, RotateCcw, ChevronRight, Calendar, Share2, Settings, TrendingUp, ChevronDown, BookOpen, Star, ChevronLeft, CheckCircle2, Flame, Eye, MessageCircle, PanelRightOpen, PanelRightClose, User, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { ShareSettings, ShareConfig } from './ShareSettings';
import { toast } from 'sonner@2.0.3';
import { AdModal } from './AdModal';
import { AdBanner } from './AdBanner';
import { Advertisement } from './AdManagement';
import { RestartConfirmModal } from './RestartConfirmModal';
import { TestResult } from '../types/testResult';
import { WrongNotesManager } from './WrongNotesManager';
import { computeChronoDisplayNumbers } from '../utils/testLabel';
import {
  readingRawToBand,
  listeningRawToBand,
  speakingWritingRawToBand,
  scaleRawScore,
  computeOverallBand,
} from '../utils/bandScore';

const ReportSection = lazy(() =>
  import('./ReportSection').then(module => ({ default: module.ReportSection }))
);
const QuestionReviewFull = lazy(() =>
  import('./QuestionReviewFull').then(module => ({ default: module.QuestionReviewFull }))
);

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
  // 오답 복습 자동 열기 (App.tsx → HistorySection)
  pendingReviewResult?: TestResult | null;
  onClearPendingReview?: () => void;
}

type TabType = 'TPO' | 'Test' | 'Training' | 'Wrong Answers' | 'Report' | '오답 노트';
type NavType = 'records';
type TimeFilter = 'all' | 'today' | '7days' | '1month' | '3months';
type StatusFilter = 'all' | 'completed' | 'incomplete';

// Sample data shown when no real results exist
const SAMPLE_RESULTS: TestResult[] = [];

/** AI 채점 정보 추출 — 구조화 필드 우선, 없으면 legacy 'ai-feedback' wrongAnswer 파싱 */
function getAiScoreInfo(r: TestResult | null | undefined): { band: number | null; raw: number | null; feedback: string } | null {
  if (!r) return null;
  if (typeof r.aiBandScore === 'number') {
    return { band: r.aiBandScore, raw: typeof r.aiScore === 'number' ? r.aiScore : null, feedback: r.aiFeedback || '' };
  }
  const entry = r.wrongAnswers?.find(w => w.questionId === 'ai-feedback');
  if (!entry) return null;
  const bandMatch = String(entry.userAnswer ?? '').match(/([\d.]+)/);
  const rawMatch = String(entry.correctAnswer ?? '').match(/([\d.]+)\s*\/\s*30/);
  return {
    band: bandMatch ? parseFloat(bandMatch[1]) : null,
    raw: rawMatch ? parseFloat(rawMatch[1]) : null,
    feedback: entry.explanation || '',
  };
}

/** 밴드 점수 → CEFR 레이블 (EndSpeaking/EndWriting 화면과 동일 기준) */
function getBandCefrLabel(band: number): { cefr: string; label: string; color: string } {
  if (band >= 5) return { cefr: 'C1-C2', label: 'Expert', color: '#10b981' };
  if (band >= 4) return { cefr: 'B2', label: 'Upper-Int', color: '#3b82f6' };
  if (band >= 3) return { cefr: 'B1', label: 'Intermediate', color: '#e67e22' };
  return { cefr: 'A1-A2', label: 'Developing', color: '#ef4444' };
}

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
  pendingReviewResult,
  onClearPendingReview,
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
  const [reviewInitialSection, setReviewInitialSection] = useState<'Reading' | 'Listening' | 'Writing' | 'Speaking'>('Reading');
  const [reviewInitialIndex, setReviewInitialIndex] = useState(0);
  const [reviewInitialModule, setReviewInitialModule] = useState<1 | 2>(1);

  // Restart confirm modal
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartTarget, setRestartTarget] = useState<TestResult | null>(null);

  // Delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TestResult | null>(null);

  // 오답 복습 자동 열기: pendingReviewResult가 들어오면 → QuestionReviewFull 실행
  useEffect(() => {
    if (pendingReviewResult) {
      setSelectedResult(pendingReviewResult);
      setReviewInitialSection((pendingReviewResult.category as any) || 'Reading');
      setReviewInitialIndex(0);
      setReviewInitialModule(1);
      setShowQuestionReview(true);
      onClearPendingReview?.();
    }
  }, [pendingReviewResult]);

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
  // Test 는 전체 문항의 10% 이상 응답한 경우 history 에 표시 (이전 50문항 → 10% 로 완화)
  // answeredCount(실제 응답 수) 우선 사용, 없으면 기존 방식(correct + wrong) fallback
  const myResults = isLoggedIn
    ? results.filter(r => r.ownerName === studentName)
    : [];
  const effectiveResults = isLoggedIn
    ? (myResults.length > 0
        ? myResults.filter(r => {
            if (r.type === 'Test') {
              const attempted = r.answeredCount ?? (r.correctAnswers + (r.wrongAnswers?.length || 0));
              const total = r.totalQuestions || 0;
              const minRequired = total > 0 ? Math.max(1, Math.ceil(total * 0.1)) : 1;
              return attempted >= minRequired;
            }
            return true;
          })
        : SAMPLE_RESULTS)
    : [];

  // Ads
  const activeAds = (advertisements as Advertisement[])?.filter(ad =>
    ad.isActive && ad.locations?.includes('History')
  ) || [];
  const displayAd = activeAds.length > 0 ? activeAds[0] : null;
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  const tabs: TabType[] = ['TPO', 'Test', 'Training', 'Wrong Answers', 'Report', '오답 노트'];

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
      case '오답 노트':
        // 오답 노트 탭은 별도 전체화면 UI(WrongNotesManager)로 렌더링 — records 리스트 미사용
        return [];
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
      /** CMS 정답 미등록으로 채점 제외된 문제 수 */
      unscored?: number;
      /** Speaking/Writing AI 밴드 점수 (0-6) — 있으면 correct/total 대신 표시 */
      bandScore?: number;
      /** Speaking/Writing AI Raw 점수 (0-30) */
      rawScore?: number;
      /** Reading/Listening 모듈 구분 저장 시 M1+M2 합산 표시용 breakdown */
      moduleBreakdown?: {
        m1?: { correct: number; total: number };
        m2?: { correct: number; total: number };
      };
    }[];
    result: TestResult;
  }

  // 표시용 테스트 이름 — 자동배열 번호(연·월·일 시행 순서)를 카드/PDF와 동일하게 표시.
  // 이전 데이터(year/month 라벨, 낸부 번호)도 자동배열 번호로 변환해 일치시킨다.
  const chronoMaps = useMemo(() => {
    const maps = new Map<string, Map<number, number>>();
    (['TPO', 'Test', 'Training'] as const).forEach(type => {
      maps.set(type, computeChronoDisplayNumbers(tpoTests ?? [], type));
    });
    return maps;
  }, [tpoTests]);

  const getDisplayTestName = (r: TestResult): string => {
    if (!tpoTests || tpoTests.length === 0 || r.testNumber == null) return r.testName;
    const type = r.type || 'TPO';
    const displayNum = chronoMaps.get(type)?.get(r.testNumber);
    if (!displayNum) return r.testName;
    // 섹션 + 선택적 " - Module N" 접미사 유지:
    //   "TPO ... - Reading"           → "TPO N - Reading"
    //   "TPO ... - Reading - Module 1" → "TPO N - Reading - Module 1"
    const sectionMatch = r.testName.match(/(\s*-\s*(Reading|Listening|Writing|Speaking)(?:\s*-\s*Module\s*[12])?)\s*$/i);
    return `${type} ${displayNum}${sectionMatch ? sectionMatch[1] : ''}`;
  };

  const displayRecords: DisplayRecord[] = useMemo(() => {
    const allSections = ['Reading', 'Listening', 'Writing', 'Speaking'];

    // 단일 TestResult → 섹션별 스코어 계산 (기존 로직 유지, module 인지 반영)
    const computeSectionForCategory = (r: TestResult, s: string): DisplayRecord['sections'][number] => {
      if (r.category !== s) return { name: s, status: 'not-started' };
      const unscoredWrongs = r.wrongAnswers.filter(w =>
        w.correctAnswer === '(정답 미등록)' ||
        (typeof w.correctAnswer === 'string' && w.correctAnswer.includes('미등록'))
      );
      const scoredWrongs = r.wrongAnswers.filter(w =>
        w.correctAnswer !== '(정답 미등록)' &&
        !(typeof w.correctAnswer === 'string' && w.correctAnswer.includes('미등록'))
      );
      const mcqWrongs = scoredWrongs.filter(w =>
        !w.questionId?.startsWith('blank-') &&
        !(typeof w.questionText === 'string' && w.questionText.toLowerCase().includes('fill in'))
      ).length;
      const blankWrongs = scoredWrongs.filter(w =>
        w.questionId?.startsWith('blank-') ||
        (typeof w.questionText === 'string' && w.questionText.toLowerCase().includes('fill in'))
      ).length;
      // Reading Module 1(Complete Words) 만 빈칸 10문항 — 나머지(M2, 통합 저장)는 MCQ만
      const fillBlanksTotal = (s === 'Reading' && (r.module === 1 || r.module === undefined)) ? 10 : 0;
      const mcqTotal = Math.max(0, r.totalQuestions - fillBlanksTotal - unscoredWrongs.length);
      const correctMcq = Math.max(0, mcqTotal - mcqWrongs);
      const correctBlanks = Math.max(0, fillBlanksTotal - blankWrongs);
      const accurate = correctMcq + correctBlanks;
      const aiInfo = (s === 'Speaking' || s === 'Writing') ? getAiScoreInfo(r) : null;
      return {
        name: s,
        status: 'completed',
        correct: accurate,
        total: r.totalQuestions,
        unscored: unscoredWrongs.length,
        bandScore: aiInfo?.band ?? undefined,
        rawScore: aiInfo?.raw ?? undefined,
      };
    };

    // Reading/Listening 의 M1·M2 결과를 같은 응시(type+bankType+testNumber+category) 단위로 묶는다.
    // 두 모듈이 모두 있으면 한 장의 카드에 M1/M2/합산을 함께 보여준다.
    // 같은 모듈을 여러 번 응시(review 반복 등)해도 M1·M2 슬롯을 독립 유지하고
    // 각 슬롯은 가장 최근 결과로 갱신한다 (start → review 순서로도 두 모듈 모두 남음).
    type Bucket = { m1?: TestResult; m2?: TestResult; single?: TestResult };
    const buckets = new Map<string, Bucket>();
    const orderedKeys: string[] = [];
    const isNewer = (a: TestResult, b?: TestResult) => !b || new Date(a.date).getTime() >= new Date(b.date).getTime();
    tabFiltered.forEach(r => {
      const isModular = (r.category === 'Reading' || r.category === 'Listening') && (r.module === 1 || r.module === 2);
      const key = isModular
        ? `mod|${r.type}|${r.bankType || ''}|${r.testNumber ?? ''}|${r.category}`
        : `single|${r.id}`;
      const existing = buckets.get(key) || {};
      if (!buckets.has(key)) orderedKeys.push(key);
      if (isModular) {
        if (r.module === 1 && isNewer(r, existing.m1)) existing.m1 = r;
        else if (r.module === 2 && isNewer(r, existing.m2)) existing.m2 = r;
      } else {
        existing.single = r;
      }
      buckets.set(key, existing);
    });

    return orderedKeys.map(key => {
      const bucket = buckets.get(key)!;
      // 대표 결과(primary): single 이면 그것, 모듈형이면 M2 우선, 없으면 M1
      const primary = (bucket.single ?? bucket.m2 ?? bucket.m1)!;
      const other = bucket.single ? undefined : (primary === bucket.m2 ? bucket.m1 : bucket.m2);
      const date = new Date(primary.date);
      const sections: DisplayRecord['sections'] = allSections.map(s => {
        const primarySec = computeSectionForCategory(primary, s);
        if (!other || primarySec.status !== 'completed') return primarySec;
        const otherSec = computeSectionForCategory(other, s);
        if (otherSec.status !== 'completed') return primarySec;
        const m1Result = bucket.m1;
        const m2Result = bucket.m2;
        const m1Sec = m1Result === primary ? primarySec : (m1Result === other ? otherSec : null);
        const m2Sec = m2Result === primary ? primarySec : (m2Result === other ? otherSec : null);
        return {
          ...primarySec,
          correct: (primarySec.correct || 0) + (otherSec.correct || 0),
          total: (primarySec.total || 0) + (otherSec.total || 0),
          unscored: (primarySec.unscored || 0) + (otherSec.unscored || 0),
          moduleBreakdown: {
            m1: m1Sec ? { correct: m1Sec.correct || 0, total: m1Sec.total || 0 } : undefined,
            m2: m2Sec ? { correct: m2Sec.correct || 0, total: m2Sec.total || 0 } : undefined,
          },
        };
      });

      // 병합 카드의 이름에서 " - Module N" 접미사 제거 → "TPO N - Reading" 형태
      let testName = getDisplayTestName(primary);
      if (other) {
        testName = testName.replace(/\s*-\s*Module\s*[12]\s*$/i, '');
      }

      const mergedId = other ? `${primary.id}__${other.id}` : primary.id;
      return {
        id: mergedId,
        testName,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        timestamp: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        category: primary.category,
        score: primary.score,
        correctAnswers: primary.correctAnswers + (other?.correctAnswers ?? 0),
        totalQuestions: primary.totalQuestions + (other?.totalQuestions ?? 0),
        sections,
        result: primary,
      };
    });
  }, [tabFiltered, tpoTests]);

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

  // 같은 응시(type+bankType+testNumber)의 4영역이 모두 완료됐으면 Overall 밴드를 계산.
  // 각 카드가 자신이 속한 응시의 Overall 뱃지를 보여줄 수 있도록 map 형태로 준비한다.
  const overallByTestKey = useMemo(() => {
    const map = new Map<string, { overall: number; bands: Record<string, number> }>();
    const grouped = new Map<string, DisplayRecord[]>();
    filteredRecords.forEach(rec => {
      const r = rec.result;
      const key = `${r.type}|${r.bankType || ''}|${r.testNumber ?? ''}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(rec);
    });
    grouped.forEach((records, key) => {
      const bandBySection: Record<string, number> = {};
      records.forEach(rec => {
        rec.sections.forEach(s => {
          if (s.status !== 'completed') return;
          if (s.name === 'Reading' && s.correct != null && s.total) {
            bandBySection.Reading = readingRawToBand(scaleRawScore('Reading', s.correct, s.total));
          } else if (s.name === 'Listening' && s.correct != null && s.total) {
            bandBySection.Listening = listeningRawToBand(scaleRawScore('Listening', s.correct, s.total));
          } else if (s.name === 'Speaking') {
            if (s.bandScore != null) bandBySection.Speaking = s.bandScore;
            else if (s.rawScore != null) bandBySection.Speaking = speakingWritingRawToBand(s.rawScore);
          } else if (s.name === 'Writing') {
            if (s.bandScore != null) bandBySection.Writing = s.bandScore;
            else if (s.rawScore != null) bandBySection.Writing = speakingWritingRawToBand(s.rawScore);
          }
        });
      });
      const overall = computeOverallBand({
        reading: bandBySection.Reading,
        listening: bandBySection.Listening,
        speaking: bandBySection.Speaking,
        writing: bandBySection.Writing,
      });
      if (overall != null) map.set(key, { overall, bands: bandBySection });
    });
    return map;
  }, [filteredRecords]);

  const getOverallForRecord = (rec: DisplayRecord) => {
    const r = rec.result;
    const key = `${r.type}|${r.bankType || ''}|${r.testNumber ?? ''}`;
    return overallByTestKey.get(key) ?? null;
  };

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
      case '오답 노트': return 0;
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
  };

  const handleViewResults = (result: TestResult) => {
    // 클릭 시 곧바로 전체 리뷰(QuestionReviewFull) 화면으로 이동
    setSelectedResult({ ...result, testName: getDisplayTestName(result) });
    const sec = (result.category as any) ||
      (result.testName.includes('Reading') ? 'Reading'
      : result.testName.includes('Listening') ? 'Listening'
      : result.testName.includes('Speaking') ? 'Speaking'
      : result.testName.includes('Writing') ? 'Writing'
      : 'Reading');
    setReviewInitialSection(sec);
    setReviewInitialIndex(0);
    setReviewInitialModule(1);
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

  // 병합 카드(M1+M2) 는 record.id 가 `${primary.id}__${other.id}` 형태이므로
  // 삭제 시 두 결과 ID 를 모두 넘겨 함께 지운다.
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
  const handleDeleteClick = (record: DisplayRecord) => {
    setDeleteTarget(record.result);
    setDeleteTargetIds(record.id.includes('__') ? record.id.split('__') : [record.result.id]);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetIds.length > 0) {
      deleteTargetIds.forEach(id => onDeleteResult?.(id));
    } else if (deleteTarget) {
      onDeleteResult?.(deleteTarget.id);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setDeleteTargetIds([]);
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
      <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading review...</div>}>
        <QuestionReviewFull
          result={selectedResult}
          tpoTests={tpoTests}
          onBack={handleBackFromReview}
          themeColor={themeColor}
          initialSection={reviewInitialSection}
          initialIndex={reviewInitialIndex}
          initialModule={reviewInitialModule}
        />
      </Suspense>
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
          {/* Mobile horizontal category tabs — min-w-0으로 flex 부모 내 가로 스크롤 보장 */}
          <div className="bg-white border-b border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto scrollbar-hide shrink-0 min-w-0 max-w-full">
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
              <div className="space-y-4">
                <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading report...</div>}>
                  <ReportSection
                    themeColor={themeColor}
                    results={results}
                    shareConfig={shareConfig}
                    onShareConfigChange={onShareConfigChange}
                    studentName={studentName}
                    onOpenShareSettings={() => setShowShareSettings(true)}
                  />
                </Suspense>
              </div>
            ) : activeTab === '오답 노트' ? (
              <WrongNotesManager
                open={true}
                onClose={() => setActiveTab('Report')}
                fullScreen={true}
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
                          {records.map(record => {
                            const overallInfo = getOverallForRecord(record);
                            return (
                            <div key={record.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-gray-900 flex-1 mr-2">{record.testName}</h3>
                                {overallInfo && (
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                                    style={{ backgroundColor: themeColor }}
                                    title="4영역 종합 밴드 (2026 New TOEFL)"
                                  >
                                    Overall {overallInfo.overall} / 6.0
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">{record.timestamp}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 mb-3">
                                {record.sections.map(section => (
                                  <div key={section.name} className="text-center">
                                    <p className="text-xs text-gray-600 mb-0.5">{section.name}</p>
                                    {section.status === 'completed' ? (
                                      <>
                                        {section.bandScore != null ? (
                                          <>
                                            <p className="text-xs font-bold" style={{ color: getBandCefrLabel(section.bandScore).color }}>
                                              Band {section.bandScore}
                                            </p>
                                            {section.rawScore != null && (
                                              <p className="text-[10px] text-gray-400 mt-0.5">{section.rawScore}/30</p>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <p className="text-xs font-bold" style={{ color: themeColor }}>{section.correct}/{section.total}</p>
                                            {section.moduleBreakdown && (
                                              <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">
                                                M1 {section.moduleBreakdown.m1?.correct ?? 0}/{section.moduleBreakdown.m1?.total ?? 0}
                                                <br/>
                                                M2 {section.moduleBreakdown.m2?.correct ?? 0}/{section.moduleBreakdown.m2?.total ?? 0}
                                              </p>
                                            )}
                                          </>
                                        )}
                                        {section.unscored && section.unscored > 0 ? (
                                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5" title="CMS에 정답이 등록되지 않아 채점에서 제외된 문제 수">
                                            ⚠ 미채점 {section.unscored}
                                          </p>
                                        ) : null}
                                      </>
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
                                  onClick={() => handleDeleteClick(record)}
                                  className="px-2 py-1.5 rounded-lg text-xs font-bold border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                                  title="기록 삭제"
                                  aria-label="기록 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            );
                          })}
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
            <div className="space-y-4">
              <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading report...</div>}>
                <ReportSection
                  themeColor={themeColor}
                  results={results}
                  shareConfig={shareConfig}
                  onShareConfigChange={onShareConfigChange}
                  studentName={studentName}
                  onOpenShareSettings={() => setShowShareSettings(true)}
                />
              </Suspense>
            </div>
          ) : activeTab === '오답 노트' ? (
            <WrongNotesManager
              open={true}
              onClose={() => setActiveTab('Report')}
              fullScreen={true}
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
                        {records.map((record) => {
                          const overallInfo = getOverallForRecord(record);
                          return (
                          <div
                            key={record.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-[fadeSlideUp_0.3s_ease-out]"
                            style={{ animation: 'fadeSlideUp 0.3s ease-out' }}
                          >
                            <div className="p-4 lg:p-5">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                {/* Left: Test info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-3">
                                    <h3 className="text-base font-bold text-gray-900">
                                      {record.testName}
                                    </h3>
                                    {overallInfo && (
                                      <span
                                        className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                                        style={{ backgroundColor: themeColor }}
                                        title="4영역 종합 밴드 (2026 New TOEFL)"
                                      >
                                        Overall {overallInfo.overall} / 6.0
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                                    {record.sections.map(section => (
                                      <div key={section.name} className="text-center">
                                        <p className="text-sm font-medium text-gray-800 mb-1">{section.name}</p>
                                        {section.status === 'completed' ? (
                                          <>
                                            {section.bandScore != null ? (
                                              <>
                                                <p className="text-sm font-bold" style={{ color: getBandCefrLabel(section.bandScore).color }}>
                                                  Band {section.bandScore}
                                                </p>
                                                {section.rawScore != null && (
                                                  <p className="text-[11px] text-gray-400 mt-0.5">{section.rawScore}/30</p>
                                                )}
                                              </>
                                            ) : (
                                              <>
                                                <p className="text-base font-bold" style={{ color: themeColor }}>
                                                  {section.correct} / {section.total}
                                                </p>
                                                {section.moduleBreakdown && (
                                                  <div className="flex justify-center gap-2 mt-1 text-[10px] font-semibold">
                                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">M1 {section.moduleBreakdown.m1?.correct ?? 0}/{section.moduleBreakdown.m1?.total ?? 0}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">M2 {section.moduleBreakdown.m2?.correct ?? 0}/{section.moduleBreakdown.m2?.total ?? 0}</span>
                                                  </div>
                                                )}
                                              </>
                                            )}
                                            {section.unscored && section.unscored > 0 ? (
                                              <p className="text-[11px] text-amber-600 font-semibold mt-0.5" title="CMS에 정답이 등록되지 않아 채점에서 제외된 문제 수">
                                                ⚠ 미채점 {section.unscored}
                                              </p>
                                            ) : null}
                                          </>
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
                                      onClick={() => handleDeleteClick(record)}
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
                          );
                        })}
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