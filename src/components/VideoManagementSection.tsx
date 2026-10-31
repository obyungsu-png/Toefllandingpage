/**
 * VideoManagementSection.tsx — 관리자 "🎬 영상 관리" CMS
 * -----------------------------------------------------------------------------
 * TOEFL Prep → 영상 관리 탭. 3개 서브 섹션:
 *   1) 🔥 자주 틀리는 Top 50 — testResults 집계 기반 랭킹 + 바로 등록
 *   2) 📺 등록된 영상 전체    — 검색/필터/수정/삭제
 *   3) ➕ 새 영상 추가         — 수동 등록 모달 (오른쪽 상단 버튼)
 *
 * 저장은 question_videos 테이블 (upsert by question_key).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Loader2, Search, Plus, Pencil, Trash2, X, Save, Film, Flame, ListVideo,
  Youtube, ExternalLink, EyeOff, RefreshCw, Filter,
} from 'lucide-react';
import {
  listAllVideosAdmin, upsertVideo, deleteVideo,
  type QuestionVideo,
} from '../utils/questionVideos';
import {
  buildQuestionKey, parseQuestionKey, formatQuestionLabel, formatQuestionLabelFull,
  type QuestionFamily, type QuestionSection,
} from '../utils/questionKey';
import { SERVER_BASE_URL, getServerHeaders } from '../utils/apiConfig';
import type { TestResult } from '../types/testResult';

type SubTab = 'ranking' | 'all';

interface QStat {
  questionKey: string;
  attempts:    number;
  wrongs:      number;
  rate:        number;   // wrongs / attempts, 0~1
}

/** TestResult 전체를 받아 문제별 틀린 비율을 계산 */
function aggregateQuestionStats(results: TestResult[], minAttempts = 3): QStat[] {
  const attemptsMap = new Map<string, number>(); // "fam:testNo:section" → count
  const wrongsMap   = new Map<string, number>(); // "fam:testNo:section:qNo"

  for (const r of results || []) {
    // family 결정 — bankType 우선, 없으면 type 소문자
    const fam = ((r.bankType || r.type) || '').toLowerCase();
    if (!['tpo', 'test', 'training'].includes(fam)) continue;
    const testNo = Number(r.testNumber);
    if (!Number.isFinite(testNo) || testNo <= 0) continue;
    const section = (r.category || '').toLowerCase();
    if (!['reading', 'listening', 'writing', 'speaking'].includes(section)) continue;

    const secKey = `${fam}:${testNo}:${section}`;
    attemptsMap.set(secKey, (attemptsMap.get(secKey) || 0) + 1);

    for (const w of (r.wrongAnswers || [])) {
      const qNum = parseInt(String(w.questionId).replace(/\D/g, ''), 10);
      if (!Number.isFinite(qNum) || qNum <= 0) continue;
      const key = `${secKey}:${qNum}`;
      wrongsMap.set(key, (wrongsMap.get(key) || 0) + 1);
    }
  }

  const stats: QStat[] = [];
  for (const [qKey, wCount] of wrongsMap.entries()) {
    const secKey = qKey.split(':').slice(0, 3).join(':');
    const aCount = attemptsMap.get(secKey) || 0;
    if (aCount < minAttempts) continue;
    stats.push({ questionKey: qKey, attempts: aCount, wrongs: wCount, rate: wCount / aCount });
  }
  return stats.sort((a, b) => b.rate - a.rate);
}

export function VideoManagementSection() {
  const [sub, setSub] = useState<SubTab>('ranking');
  const [videos, setVideos] = useState<QuestionVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuestionVideo | null>(null);
  const [prefillKey, setPrefillKey] = useState<string | null>(null);

  // 영상 목록
  useEffect(() => {
    let cancelled = false;
    setVideosLoading(true);
    (async () => {
      const list = await listAllVideosAdmin();
      if (!cancelled) {
        setVideos(list);
        setVideosLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // 전체 test-results (랭킹 집계용)
  useEffect(() => {
    let cancelled = false;
    setResultsLoading(true);
    (async () => {
      try {
        const res = await fetch(`${SERVER_BASE_URL}/test-results`, { headers: getServerHeaders() });
        if (!res.ok) { if (!cancelled) { setResults([]); setResultsLoading(false); } return; }
        const data = await res.json();
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setResultsLoading(false);
        }
      } catch {
        if (!cancelled) { setResults([]); setResultsLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // 영상 등록 여부 매핑 (question_key → QuestionVideo)
  const videoByKey = useMemo(() => {
    const m = new Map<string, QuestionVideo>();
    for (const v of videos) m.set(v.question_key, v);
    return m;
  }, [videos]);

  // Top 50
  const topStats = useMemo(() => aggregateQuestionStats(results, 3).slice(0, 50), [results]);

  const openEdit = (v: QuestionVideo) => { setEditing(v); setPrefillKey(null); setShowForm(true); };
  const openCreateFromKey = (key: string) => { setEditing(null); setPrefillKey(key); setShowForm(true); };
  const openCreateFresh = () => { setEditing(null); setPrefillKey(null); setShowForm(true); };

  const handleDelete = async (v: QuestionVideo) => {
    if (!confirm(`${formatQuestionLabelFull(v.question_key)} 영상을 삭제할까요?`)) return;
    const r = await deleteVideo(v.id);
    if (!r.ok) { alert('삭제 실패: ' + (r.reason || '')); return; }
    setRefreshKey(k => k + 1);
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-[#2d5a5d]" />
            영상 관리
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            문제별 선생님 강의 영상(YouTube · Bilibili) 을 등록·관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${videosLoading || resultsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateFresh}
            className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg bg-[#2d5a5d] text-white hover:bg-[#1e6b73] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            새 영상 추가
          </button>
        </div>
      </div>

      {/* 서브 탭 */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setSub('ranking')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            sub === 'ranking' ? 'border-[#2d5a5d] text-[#2d5a5d]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Flame className="w-4 h-4" /> Top 50 랭킹
        </button>
        <button
          onClick={() => setSub('all')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
            sub === 'all' ? 'border-[#2d5a5d] text-[#2d5a5d]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListVideo className="w-4 h-4" /> 등록 영상 ({videos.length})
        </button>
      </div>

      {sub === 'ranking' ? (
        <RankingPanel
          loading={resultsLoading}
          stats={topStats}
          videoByKey={videoByKey}
          onRegister={openCreateFromKey}
          onEdit={openEdit}
        />
      ) : (
        <AllVideosPanel
          loading={videosLoading}
          videos={videos}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <VideoForm
          initial={editing}
          prefillKey={prefillKey}
          onClose={() => { setShowForm(false); setEditing(null); setPrefillKey(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); setPrefillKey(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}

// ── Top 50 랭킹 패널 ──────────────────────────────────────────────────
function RankingPanel({ loading, stats, videoByKey, onRegister, onEdit }: {
  loading: boolean;
  stats: QStat[];
  videoByKey: Map<string, QuestionVideo>;
  onRegister: (key: string) => void;
  onEdit: (v: QuestionVideo) => void;
}) {
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<'' | QuestionSection>('');

  const filtered = useMemo(() => {
    return stats.filter(s => {
      const ref = parseQuestionKey(s.questionKey);
      if (!ref) return false;
      if (sectionFilter && ref.section !== sectionFilter) return false;
      if (onlyMissing && videoByKey.has(s.questionKey)) return false;
      return true;
    });
  }, [stats, onlyMissing, sectionFilter, videoByKey]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-7 h-7 text-gray-400 mx-auto animate-spin mb-2" />
        <p className="text-sm text-gray-500">응시 기록 집계 중…</p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
        <Flame className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-gray-700">아직 집계할 데이터가 부족해요</p>
        <p className="text-xs text-gray-500 mt-1">
          학생들이 TPO/Test 를 몇 차례 응시하고 나면 "자주 틀리는 문제" 랭킹이 자동으로 뜹니다.
          그 전엔 <b>"새 영상 추가"</b> 로 수동 등록해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs">
          {([
            { k: '',          label: '전체' },
            { k: 'reading',   label: 'R' },
            { k: 'listening', label: 'L' },
            { k: 'writing',   label: 'W' },
            { k: 'speaking',  label: 'S' },
          ] as const).map(f => (
            <button
              key={f.k || 'all'}
              onClick={() => setSectionFilter(f.k as any)}
              className={`px-2.5 py-1.5 font-bold rounded-md transition-colors ${
                sectionFilter === f.k ? 'bg-white shadow-sm text-[#2d5a5d]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={e => setOnlyMissing(e.target.checked)}
          />
          <Filter className="w-3.5 h-3.5" />
          영상 미등록만
        </label>
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length}개 (총 {stats.length})
        </span>
      </div>

      {/* 리스트 */}
      <ul className="space-y-1.5">
        {filtered.map((s, idx) => {
          const existing = videoByKey.get(s.questionKey);
          return (
            <li
              key={s.questionKey}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 px-3 md:px-4 py-2.5">
                <span className="text-xs font-bold text-gray-400 tabular-nums w-6 text-right shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatQuestionLabel(s.questionKey)}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: s.rate > 0.6 ? '#fee2e2' : s.rate > 0.4 ? '#fef3c7' : '#e0e7ff',
                        color:            s.rate > 0.6 ? '#dc2626' : s.rate > 0.4 ? '#ca8a04' : '#4338ca',
                      }}
                    >
                      틀린 {(s.rate * 100).toFixed(0)}%
                    </span>
                    <span className="text-[11px] text-gray-500">
                      · 응시 {s.attempts}회 · 오답 {s.wrongs}명
                    </span>
                  </div>
                </div>
                {existing ? (
                  <button
                    onClick={() => onEdit(existing)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[#2d5a5d] text-[#2d5a5d] hover:bg-[#2d5a5d]/5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> 영상 수정
                  </button>
                ) : (
                  <button
                    onClick={() => onRegister(s.questionKey)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2d5a5d] text-white hover:opacity-90"
                  >
                    <Plus className="w-3.5 h-3.5" /> 영상 등록
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
            이 조건에 해당하는 문제가 없어요.
          </li>
        )}
      </ul>
    </div>
  );
}

// ── 등록된 영상 전체 패널 ──────────────────────────────────────────────
function AllVideosPanel({ loading, videos, onEdit, onDelete }: {
  loading: boolean;
  videos: QuestionVideo[];
  onEdit: (v: QuestionVideo) => void;
  onDelete: (v: QuestionVideo) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(v =>
      v.question_key.toLowerCase().includes(q)
      || (v.title || '').toLowerCase().includes(q)
      || (v.note  || '').toLowerCase().includes(q)
    );
  }, [videos, search]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-7 h-7 text-gray-400 mx-auto animate-spin mb-2" />
        <p className="text-sm text-gray-500">영상 목록 불러오는 중…</p>
      </div>
    );
  }

  return (
    <div>
      {/* 검색 */}
      <div className="relative mb-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="문제키·제목·메모 검색 (예: tpo:3, reading, 지문)"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a5d]/30"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
          <ListVideo className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">
            {search ? '검색 결과가 없어요' : '아직 등록된 영상이 없어요'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {search ? '다른 키워드로 다시 검색해 보세요.' : '상단 "새 영상 추가" 버튼으로 첫 영상을 등록하세요.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map(v => {
            const hidden = !v.is_visible;
            return (
              <li
                key={v.id}
                className={`bg-white rounded-xl border transition-colors ${
                  hidden ? 'border-dashed border-gray-300 opacity-70' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 px-3 md:px-4 py-2.5">
                  <Film className="w-4 h-4 text-[#2d5a5d] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatQuestionLabel(v.question_key)}
                      </span>
                      {v.title && (
                        <span className="text-xs text-gray-500 truncate">· {v.title}</span>
                      )}
                      {hidden && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                          <EyeOff className="w-2.5 h-2.5" /> 감춤
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 truncate">
                      {v.youtube_url && (
                        <a href={v.youtube_url} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 text-red-600 hover:underline">
                          <Youtube className="w-3 h-3" /> YouTube
                        </a>
                      )}
                      {v.bilibili_url && (
                        <a href={v.bilibili_url} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Bilibili
                        </a>
                      )}
                      {v.start_sec > 0 && <span>· 시작 {v.start_sec}s</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-0.5">
                    <button
                      onClick={() => onEdit(v)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-100"
                      title="편집"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(v)}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── 등록/수정 모달 ─────────────────────────────────────────────────────
function VideoForm({ initial, prefillKey, onClose, onSaved }: {
  initial: QuestionVideo | null;
  prefillKey: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  // 분해된 ref 상태
  const seedRef = parseQuestionKey(initial?.question_key || prefillKey || '');
  const [family, setFamily]           = useState<QuestionFamily>(seedRef?.family || 'tpo');
  const [testNo, setTestNo]           = useState<string>(seedRef?.testNumber ? String(seedRef.testNumber) : '');
  const [section, setSection]         = useState<QuestionSection>(seedRef?.section || 'reading');
  const [qNo, setQNo]                 = useState<string>(seedRef?.questionNumber ? String(seedRef.questionNumber) : '');
  const [youtubeUrl, setYoutubeUrl]   = useState<string>(initial?.youtube_url || '');
  const [bilibiliUrl, setBilibiliUrl] = useState<string>(initial?.bilibili_url || '');
  const [title, setTitle]             = useState<string>(initial?.title || '');
  const [startSec, setStartSec]       = useState<string>(initial?.start_sec ? String(initial.start_sec) : '');
  const [note, setNote]               = useState<string>(initial?.note || '');
  const [isVisible, setIsVisible]     = useState<boolean>(initial?.is_visible ?? true);

  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  // 편집 모드에서는 question_key 변경 금지 (하지만 UI 상 보여주기 위해 input 비활성)
  const keyLocked = !!initial;

  const handleSave = async () => {
    const testNumber     = Number(testNo);
    const questionNumber = Number(qNo);
    if (!Number.isFinite(testNumber) || testNumber <= 0) {
      setErr('시험 번호는 1 이상 숫자여야 합니다.');
      return;
    }
    if (!Number.isFinite(questionNumber) || questionNumber <= 0) {
      setErr('문제 번호는 1 이상 숫자여야 합니다.');
      return;
    }
    if (!youtubeUrl.trim() && !bilibiliUrl.trim()) {
      setErr('YouTube URL 또는 Bilibili URL 중 하나는 반드시 입력해야 합니다.');
      return;
    }
    const key = buildQuestionKey({ family, testNumber, section, questionNumber });
    setSaving(true);
    setErr(null);
    const r = await upsertVideo({
      key,
      title:         title.trim() || null,
      youtube_url:   youtubeUrl.trim() || null,
      bilibili_url:  bilibiliUrl.trim() || null,
      start_sec:     Number(startSec) || 0,
      note:          note.trim() || null,
      is_visible:    isVisible,
    });
    setSaving(false);
    if (!r.ok) { setErr(r.reason || '저장 실패'); return; }
    onSaved();
  };

  const previewKey = (() => {
    const tn = Number(testNo), qn = Number(qNo);
    if (!Number.isFinite(tn) || !Number.isFinite(qn)) return '';
    try { return formatQuestionLabelFull(buildQuestionKey({ family, testNumber: tn, section, questionNumber: qn })); }
    catch { return ''; }
  })();

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {initial ? '영상 수정' : '새 영상 등록'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
          {/* 문제 지정 */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">종류</label>
              <select
                value={family}
                onChange={e => setFamily(e.target.value as QuestionFamily)}
                disabled={keyLocked}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="tpo">TPO</option>
                <option value="test">Test</option>
                <option value="training">Training</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">시험 #</label>
              <input
                type="number" min="1"
                value={testNo}
                onChange={e => setTestNo(e.target.value)}
                disabled={keyLocked}
                placeholder="3"
                className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">섹션</label>
              <select
                value={section}
                onChange={e => setSection(e.target.value as QuestionSection)}
                disabled={keyLocked}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
                <option value="writing">Writing</option>
                <option value="speaking">Speaking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">문제 #</label>
              <input
                type="number" min="1"
                value={qNo}
                onChange={e => setQNo(e.target.value)}
                disabled={keyLocked}
                placeholder="4"
                className="w-full px-2 py-2 border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
          {previewKey && (
            <p className="text-[11px] text-gray-500">
              대상 : <span className="font-bold text-gray-700">{previewKey}</span>
              {!keyLocked && <span className="text-gray-400"> · 이미 등록된 문제라면 자동 수정됩니다.</span>}
            </p>
          )}

          {/* 영상 URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <Youtube className="w-3.5 h-3.5 text-red-600" /> YouTube URL
            </label>
            <input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" /> Bilibili URL
            </label>
            <input
              value={bilibiliUrl}
              onChange={e => setBilibiliUrl(e.target.value)}
              placeholder="https://www.bilibili.com/video/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              유튜브 / 빌리빌리 중 하나만 입력해도 OK. 둘 다 넣으면 재생기에서 탭으로 노출됩니다.
            </p>
          </div>

          {/* 메타 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">제목 (선택)</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: TPO3 R Q4 지문 함정 해설"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">시작 초 (선택)</label>
              <input
                type="number" min="0"
                value={startSec}
                onChange={e => setStartSec(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">관리자 메모 (선택)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="예: 2026-10 업데이트. 지문 2단락 함정 중점."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={isVisible} onChange={e => setIsVisible(e.target.checked)} />
            학생에게 공개 (체크 해제 시 관리자만 보임)
          </label>

          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg bg-[#2d5a5d] hover:bg-[#1e6b73] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
