/**
 * WritingReviewHistory.tsx
 * ----------------------------------------------------------------------------
 * 내 AI 첨삭 히스토리 화면 — 유료 회원 기간 동안 Supabase에 보관된
 * TPO Writing AI 첨삭 결과를 카드 리스트로 보여주고, 카드를 클릭하면
 * 저장된 첨삭 결과 전체(점수/차원별 피드백/문법교정/원문/모범답안)를
 * 모달로 다시 열람할 수 있게 한다.
 *
 * 데이터 출처: writing_ai_reviews 테이블 (writingAiReviews.ts 헬퍼 사용)
 * 만료 처리: 서버 조회 시 expires_at > now() 인 것만 가져오므로 여기서는
 *          별도 만료 처리 불필요.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Loader2, X, Mail, Users, Calendar, Star, RefreshCw,
  MessageSquare, Wand2, Copy, CheckCircle2, ChevronDown, ChevronUp, ArrowRight,
  Palette, Sparkles,
} from 'lucide-react';
import { listRecentWritingAiReviewsCloud, type WritingType, type WritingAiReviewPayload } from '../utils/writingAiReviews';
import { renderInlineDiff, extractChangeBlocks, COLOR_CLASSES, COLOR_LEGEND } from '../utils/writingDiff';

// ── 로컬 타입 — writingAiReviews 헬퍼가 리턴하는 항목 형태 ─────────────────
interface HistoryRow {
  writingType: WritingType;
  answerHash: string;
  answerPreview: string;
  updatedAt: string;
  payload: WritingAiReviewPayload;
}

interface WritingReviewHistoryProps {
  themeColor?: string;
  isLoggedIn?: boolean;
  onRequestLogin?: () => void;
}

// ── 헬퍼: 날짜 표시 (2026-09-08 → "9월 8일 (월)") ─────────────────────────
function formatKoreanDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}
function formatDateHeader(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch {
    return iso;
  }
}

// ── 헬퍼: 유형 라벨/아이콘 ────────────────────────────────────────────────
function typeLabel(t: WritingType): string {
  return t === 'email' ? 'Write an Email (Task 1)' : 'Academic Discussion (Task 2)';
}
function typeIcon(t: WritingType) {
  return t === 'email' ? Mail : Users;
}
function typeColor(t: WritingType): string {
  return t === 'email' ? '#2563eb' : '#7c3aed';
}

// ── 헬퍼: 전체 점수 밴드 색상 ──────────────────────────────────────────────
function bandColor(score: number): string {
  if (score >= 5) return '#10b981';  // 초록
  if (score >= 4) return '#3b82f6';  // 파랑
  if (score >= 3) return '#e67e22';  // 주황
  return '#ef4444';                   // 빨강
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────
export function WritingReviewHistory({
  themeColor = '#1e6b73',
  isLoggedIn = true,
  onRequestLogin,
}: WritingReviewHistoryProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | WritingType>('all');
  const [detail, setDetail] = useState<HistoryRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const list = await listRecentWritingAiReviewsCloud({ limit: 100 });
        if (cancelled) return;
        setRows(list);
      } catch {
        if (cancelled) return;
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, refreshKey]);

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter(r => r.writingType === filter);
  }, [rows, filter]);

  // 날짜별 그룹핑
  const grouped = useMemo(() => {
    const map = new Map<string, HistoryRow[]>();
    for (const r of filtered) {
      const key = formatDateHeader(r.updatedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const emailCount = rows.filter(r => r.writingType === 'email').length;
  const discCount  = rows.filter(r => r.writingType === 'discussion').length;

  // ── 미로그인 안내 ────
  if (!isLoggedIn) {
    return (
      <div className="p-6 md:p-10 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">로그인이 필요합니다</h3>
          <p className="text-sm text-gray-500 mb-4">
            내 AI 첨삭 히스토리는 유료 회원 기간 동안 계정에 저장됩니다.
          </p>
          {onRequestLogin && (
            <button
              onClick={onRequestLogin}
              className="px-5 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: themeColor }}
            >
              로그인하기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      {/* 헤더 */}
      <div className="mb-4 md:mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5" style={{ color: themeColor }} />
            내 AI 첨삭 히스토리
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            유료 회원 기간 동안 저장된 TPO Writing AI 첨삭 결과입니다. 카드를 눌러 상세 결과를 다시 볼 수 있어요.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {([
          { key: 'all' as const,        label: '전체',       count: rows.length },
          { key: 'email' as const,      label: 'Email (Task 1)',       count: emailCount },
          { key: 'discussion' as const, label: 'Discussion (Task 2)', count: discCount },
        ]).map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                active
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: active ? themeColor : undefined }}
            >
              {f.label} <span className="ml-1 opacity-75">({f.count})</span>
            </button>
          );
        })}
      </div>

      {/* 리스트 */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin mb-2" />
          <p className="text-sm text-gray-500">첨삭 히스토리를 불러오는 중…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">아직 저장된 AI 첨삭이 없어요</p>
          <p className="text-xs text-gray-400 mt-1">
            TPO Writing Review 화면에서 AI 분석을 한 번이라도 실행하면 여기에 자동으로 쌓여요.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, records]) => (
            <div key={date}>
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {date}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {records.map(row => (
                  <HistoryCard
                    key={`${row.writingType}:${row.answerHash}`}
                    row={row}
                    themeColor={themeColor}
                    onOpen={() => setDetail(row)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {detail && (
        <DetailModal
          row={detail}
          themeColor={themeColor}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

// ── 히스토리 카드 (리스트 항목) ────────────────────────────────────────────
function HistoryCard({
  row, themeColor, onOpen,
}: { row: HistoryRow; themeColor: string; onOpen: () => void }) {
  const Icon = typeIcon(row.writingType);
  const overall = Number(row.payload.analysis?.rubric?.overall ?? 0);
  const preview = row.answerPreview || row.payload.answerText?.slice(0, 240) || '(원문 미저장)';

  return (
    <button
      onClick={onOpen}
      className="text-left bg-white rounded-xl border border-gray-200 hover:border-[color:var(--th)] hover:shadow-md transition-all p-4 group"
      style={{ ['--th' as any]: themeColor }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: typeColor(row.writingType) }}
          >
            <Icon className="w-3 h-3" />
            {row.writingType === 'email' ? 'Email' : 'Discussion'}
          </span>
          <span className="text-[11px] text-gray-500 truncate">
            {formatKoreanDate(row.updatedAt)}
          </span>
        </div>
        <div
          className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg text-white"
          style={{ backgroundColor: bandColor(overall) }}
          title="전체 점수 (0–6)"
        >
          {overall.toFixed(1)} / 6
        </div>
      </div>
      <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed">
        {preview}
      </p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
        <span>{typeLabel(row.writingType)}</span>
        <span className="group-hover:text-gray-600 transition-colors">상세 보기 →</span>
      </div>
    </button>
  );
}

// ── 상세 모달 ──────────────────────────────────────────────────────────
function DetailModal({
  row, themeColor, onClose,
}: { row: HistoryRow; themeColor: string; onClose: () => void }) {
  const [copied, setCopied] = useState<'original' | 'upgraded' | null>(null);
  const [openSection, setOpenSection] = useState<'answer' | 'upgraded' | 'model' | null>('answer');

  const rubric = row.payload.analysis?.rubric;
  const overall = Number(rubric?.overall ?? 0);
  const dimensions = rubric?.dimensions || {};
  const grammar   = row.payload.analysis?.grammarCorrections || [];
  const upgrades  = row.payload.upgradeSuggestions || [];
  const modelEssay = row.payload.analysis?.modelEssay?.content || '';
  const originalAnswer = row.payload.answerText || row.answerPreview || '';
  const upgradedText = row.payload.analysis?.upgradedText || '';
  const semanticHighlights = row.payload.semanticHighlights || [];

  // 원본 → AI 교정본 inline diff (LCS 기반)
  const diffSegments = useMemo(
    () => (originalAnswer && upgradedText) ? renderInlineDiff(originalAnswer, upgradedText) : [],
    [originalAnswer, upgradedText],
  );
  const changeBlocks = useMemo(() => extractChangeBlocks(diffSegments), [diffSegments]);

  // Semantic Highlight 적용된 원본 세그먼트 (인사/맺음/동료인용/주장/예시 색상 코딩)
  const highlightedOriginal = useMemo(() => {
    if (!originalAnswer || !semanticHighlights.length) return null;
    const segments: Array<{ text: string; color: string | null }> = [];
    let remaining = originalAnswer;
    while (remaining.length > 0) {
      let bestMatch: { text: string; color: string } | null = null;
      let bestIdx = Infinity;
      for (const hl of semanticHighlights as Array<{ text: string; color: string }>) {
        const idx = remaining.indexOf(hl.text);
        if (idx !== -1 && idx < bestIdx) {
          bestIdx = idx;
          bestMatch = { text: hl.text, color: hl.color };
        }
      }
      if (!bestMatch) {
        segments.push({ text: remaining, color: null });
        break;
      }
      if (bestIdx > 0) segments.push({ text: remaining.slice(0, bestIdx), color: null });
      segments.push({ text: bestMatch.text, color: bestMatch.color });
      remaining = remaining.slice(bestIdx + bestMatch.text.length);
    }
    return segments;
  }, [originalAnswer, semanticHighlights]);

  const copy = async (text: string, key: 'original' | 'upgraded') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: typeColor(row.writingType) }}
            >
              {row.writingType === 'email' ? 'Email' : 'Discussion'}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-bold text-gray-900 truncate">
                {typeLabel(row.writingType)}
              </h3>
              <p className="text-[11px] text-gray-500">{formatKoreanDate(row.updatedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-sm font-bold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: bandColor(overall) }}
            >
              전체 {overall.toFixed(1)} / 6
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 종합 피드백 */}
          {rubric?.overallFeedback && (
            <div
              className="rounded-xl p-4 border"
              style={{ background: `${themeColor}10`, borderColor: `${themeColor}30` }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Star className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-bold" style={{ color: themeColor }}>종합 피드백</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {rubric.overallFeedback}
              </p>
            </div>
          )}

          {/* 차원별 점수 */}
          {Object.keys(dimensions).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-600 mb-2">차원별 점수 (0–6)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(dimensions).map(([key, val]) => {
                  const dim = val as { score: number; feedback: string };
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{key}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                          style={{ backgroundColor: bandColor(dim.score) }}
                        >
                          {Number(dim.score).toFixed(1)}
                        </span>
                      </div>
                      {dim.feedback && (
                        <p className="text-[11px] text-gray-600 leading-relaxed mt-1">{dim.feedback}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 원본 답안 + Semantic 색상 코딩 */}
          {originalAnswer && (
            <CollapsibleSection
              open={openSection === 'answer'}
              onToggle={() => setOpenSection(openSection === 'answer' ? null : 'answer')}
              title="내 원본 답안"
              icon={<MessageSquare className="w-4 h-4" style={{ color: themeColor }} />}
              action={
                <button
                  onClick={(e) => { e.stopPropagation(); copy(originalAnswer, 'original'); }}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800"
                >
                  {copied === 'original' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'original' ? '복사됨' : '복사'}
                </button>
              }
            >
              {/* Semantic Color 범례 (하이라이트가 있을 때만) */}
              {highlightedOriginal && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <Palette className="w-3.5 h-3.5 text-gray-400" />
                  {COLOR_LEGEND.map(legend => (
                    <span key={legend.color} className={`px-2 py-0.5 rounded ${COLOR_CLASSES[legend.color]} font-medium`}>
                      {legend.label}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {highlightedOriginal
                  ? highlightedOriginal.map((seg, idx) =>
                      seg.color
                        ? <span key={idx} className={`px-1 rounded ${COLOR_CLASSES[seg.color]}`}>{seg.text}</span>
                        : <span key={idx}>{seg.text}</span>
                    )
                  : originalAnswer}
              </p>
            </CollapsibleSection>
          )}

          {/* AI 교정본 (upgradedText) — 원본 대비 초록 하이라이트로 수정된 부분 표시 */}
          {upgradedText && upgradedText.trim() && upgradedText !== originalAnswer && (
            <CollapsibleSection
              open={openSection === 'upgraded'}
              onToggle={() => setOpenSection(openSection === 'upgraded' ? null : 'upgraded')}
              title="AI 교정본 (수정된 전체 답안)"
              icon={<Wand2 className="w-4 h-4" style={{ color: themeColor }} />}
              action={
                <button
                  onClick={(e) => { e.stopPropagation(); copy(upgradedText, 'upgraded'); }}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800"
                >
                  {copied === 'upgraded' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'upgraded' ? '복사됨' : '복사'}
                </button>
              }
            >
              <p className="text-[11px] text-gray-500 mb-2">
                <span className="inline-block bg-green-100 text-green-800 px-1 rounded font-medium">초록</span>
                {' '}= 원본에서 수정·추가된 표현. 원본 그대로인 부분은 회색으로 표시.
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {diffSegments.length > 0
                  ? diffSegments.map((seg, idx) => {
                      if (seg.type === 'delete') return null; // 삭제된 부분은 아래 변경 포인트 카드에서
                      if (seg.type === 'add') {
                        return (
                          <mark key={idx} className="bg-green-100 text-green-800 px-0.5 rounded font-medium">
                            {seg.text}
                          </mark>
                        );
                      }
                      return <span key={idx} className="text-gray-700">{seg.text}</span>;
                    })
                  : <span className="text-gray-800">{upgradedText}</span>
                }
              </p>
            </CollapsibleSection>
          )}

          {/* 변경 포인트 (Before → After 카드) */}
          {changeBlocks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: themeColor }} />
                변경 포인트 ({changeBlocks.length}건)
              </h4>
              <div className="space-y-2">
                {changeBlocks.map((block, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-3 text-xs">
                    {block.before && (
                      <div className="text-gray-500">
                        <span className="font-bold text-red-500 mr-1">Before</span>
                        <span className="line-through decoration-red-400">{block.before}</span>
                      </div>
                    )}
                    <div className={`text-sm font-medium text-green-700 ${block.before ? 'mt-1' : ''}`}>
                      <ArrowRight className="w-3 h-3 inline mr-1" />
                      {block.after || '(삭제됨)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 문법 교정 */}
          {grammar.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-600 mb-2">문법 교정 ({grammar.length}건)</h4>
              <div className="space-y-2">
                {grammar.map((g: any, i: number) => (
                  <div key={i} className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-xs">
                    <p className="text-red-700 line-through mb-1">{g.original}</p>
                    <p className="text-green-700 font-semibold mb-1">→ {g.corrected}</p>
                    {g.rule && <p className="text-[11px] text-gray-500 mt-1">💡 {g.rule}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 문장 업그레이드 제안 */}
          {upgrades.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" style={{ color: themeColor }} />
                AI 문장 업그레이드 제안 ({upgrades.length}건)
              </h4>
              <div className="space-y-2">
                {upgrades.map((u: any, i: number) => (
                  <div key={i} className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 text-xs">
                    <p className="text-gray-700 mb-1">{u.original}</p>
                    <p className="text-purple-700 font-semibold mb-1">→ {u.upgraded}</p>
                    {u.reason && <p className="text-[11px] text-gray-500 mt-1">💡 {u.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 모범 에세이 */}
          {modelEssay && (
            <CollapsibleSection
              open={openSection === 'model'}
              onToggle={() => setOpenSection(openSection === 'model' ? null : 'model')}
              title="AI 모범 에세이"
              icon={<Star className="w-4 h-4" style={{ color: themeColor }} />}
            >
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{modelEssay}</p>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 접을 수 있는 섹션 ────────────────────────────────────────────────────
function CollapsibleSection({
  open, onToggle, title, icon, action, children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-gray-700">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {action}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}
