import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Download, Search, Trash2, X } from 'lucide-react';

/**
 * 오답 노트 통합 관리 — 모달 또는 전체 화면 페이지
 * - 모든 TPO/콘텐츠의 Dictation 오답을 한곳에서 조회
 * - 필터(전체/이 문제/최근 7일) + 검색 + 개별/일괄 삭제 + CSV 내보내기
 * - ReviewAssistantPanel의 localStorage('dictation_wrong_notes')와 동일 데이터 공유
 * - fullScreen=true 시 전용 페이지로 표시 (헤더 + 뒤로가기 버튼 포함)
 */

const WRONG_NOTE_KEY = 'dictation_wrong_notes';
const MAX_NOTES = 200;

interface WrongNoteEntry {
  word: string;
  sentence: string;
  savedAt: number;
  contentKey: string;
}

function loadWrongNotes(): WrongNoteEntry[] {
  try {
    return JSON.parse(localStorage.getItem(WRONG_NOTE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAllNotes(notes: WrongNoteEntry[]) {
  localStorage.setItem(WRONG_NOTE_KEY, JSON.stringify(notes.slice(-MAX_NOTES)));
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

/** contentKey에서 사람이 읽을 수 있는 라벨 추출 (예: tpo_9_listening_q1 → TPO 9 Listening Q1) */
function contentKeyLabel(key: string): string {
  if (!key) return '알 수 없음';
  // tpo_9_listening_q1, test_3_reading_q2, training_speaking_q5 등
  const m = key.match(/^(tpo|test|training)_(\d+)_(listening|reading|speaking|writing)_q(\d+)/i);
  if (m) {
    const type = m[1].toUpperCase();
    const num = m[2];
    const section = m[3].charAt(0).toUpperCase() + m[3].slice(1);
    const q = m[4];
    return `${type} ${num} ${section} Q${q}`;
  }
  return key;
}

interface WrongNotesManagerProps {
  open: boolean;
  onClose: () => void;
  /** 현재 리뷰 중인 콘텐츠 키 — "이 문제" 필터에 사용 */
  currentContentKey?: string;
  /** 오답 노트 변경 시 호출 (ReviewAssistantPanel에서 wrongNotesVersion 갱신용) */
  onChanged?: () => void;
  /** 전체 화면 페이지 모드 — true 시 모달 대신 전용 페이지로 표시 */
  fullScreen?: boolean;
}

export function WrongNotesManager({ open, onClose, currentContentKey, onChanged, fullScreen = false }: WrongNotesManagerProps) {
  const [notes, setNotes] = useState<WrongNoteEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'this' | 'recent'>('all');
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set()); // 일괄 삭제용 선택

  // 모달 열릴 때마다 localStorage에서 최신 로드
  useEffect(() => {
    if (open) {
      setNotes(loadWrongNotes());
      setSelectedKeys(new Set());
      setSearch('');
      setFilter(currentContentKey ? 'all' : 'all');
    }
  }, [open, currentContentKey]);

  // contentKey별 그룹화 (통계용)
  const groupedByKey = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach(n => {
      map.set(n.contentKey, (map.get(n.contentKey) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // 필터 + 검색 적용
  const filteredNotes = useMemo(() => {
    let result = [...notes].sort((a, b) => b.savedAt - a.savedAt); // 최신순

    if (filter === 'this' && currentContentKey) {
      result = result.filter(n => n.contentKey === currentContentKey);
    } else if (filter === 'recent') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter(n => n.savedAt >= sevenDaysAgo);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(n =>
        n.word.toLowerCase().includes(q) ||
        n.sentence.toLowerCase().includes(q) ||
        contentKeyLabel(n.contentKey).toLowerCase().includes(q)
      );
    }

    return result;
  }, [notes, filter, search, currentContentKey]);

  // 노트 고유 키 (savedAt + word 조합)
  const noteId = (n: WrongNoteEntry) => `${n.savedAt}_${n.word}_${n.contentKey}`;

  const handleDelete = (note: WrongNoteEntry) => {
    const id = noteId(note);
    const remaining = notes.filter(n => noteId(n) !== id);
    saveAllNotes(remaining);
    setNotes(remaining);
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    onChanged?.();
  };

  const handleDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    if (!window.confirm(`선택한 ${selectedKeys.size}개의 오답을 삭제하시겠습니까?`)) return;
    const remaining = notes.filter(n => !selectedKeys.has(noteId(n)));
    saveAllNotes(remaining);
    setNotes(remaining);
    setSelectedKeys(new Set());
    onChanged?.();
  };

  const handleDeleteAll = () => {
    if (notes.length === 0) return;
    if (!window.confirm(`전체 ${notes.length}개의 오답을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    saveAllNotes([]);
    setNotes([]);
    setSelectedKeys(new Set());
    onChanged?.();
  };

  const handleDeleteByContentKey = (key: string) => {
    const count = notes.filter(n => n.contentKey === key).length;
    if (!window.confirm(`"${contentKeyLabel(key)}"의 오답 ${count}개를 삭제하시겠습니까?`)) return;
    const remaining = notes.filter(n => n.contentKey !== key);
    saveAllNotes(remaining);
    setNotes(remaining);
    onChanged?.();
  };

  const handleToggleSelect = (note: WrongNoteEntry) => {
    const id = noteId(note);
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCSV = () => {
    if (filteredNotes.length === 0) return;
    const header = '콘텐츠,단어,문장,저장일시\n';
    const rows = filteredNotes.map(n =>
      `"${contentKeyLabel(n.contentKey)}","${n.word.replace(/"/g, '""')}","${n.sentence.replace(/"/g, '""')}","${formatDate(n.savedAt)}"`
    ).join('\n');
    const csv = '\uFEFF' + header + rows; // BOM for Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictation_wrong_notes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = (note: WrongNoteEntry) => {
    const text = `${note.word}\n${note.sentence}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  if (!open) return null;

  const recentCount = notes.filter(n => n.savedAt >= Date.now() - 7 * 24 * 60 * 60 * 1000).length;
  const thisCount = currentContentKey ? notes.filter(n => n.contentKey === currentContentKey).length : 0;

  // ── 전체 화면 페이지 모드 — 전용 페이지로 표시 (헤더 + 뒤로가기) ──
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col overflow-hidden">
        {/* 페이지 헤더 — 뒤로가기 + 제목 */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} /> 뒤로
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                <BookOpen size={16} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">📒 오답 노트</h1>
                <p className="text-xs text-gray-500">Dictation에서 틀린 단어를 모아 재학습</p>
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-400">최대 {MAX_NOTES}개까지 저장됩니다.</span>
        </div>

        {/* 통계 배지 */}
        <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-100 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold">
            전체 {notes.length}개
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            최근 7일 {recentCount}개
          </span>
          {currentContentKey && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
              이 문제 {thisCount}개
            </span>
          )}
        </div>

        {/* 필터 + 검색 + 액션 */}
        <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-1 rounded-full bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
            >
              전체
            </button>
            {currentContentKey && (
              <button
                type="button"
                onClick={() => setFilter('this')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filter === 'this' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
              >
                이 문제
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilter('recent')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filter === 'recent' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
            >
              최근 7일
            </button>
          </div>

          <div className="flex-1 min-w-[140px] relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="단어/문장/콘텐츠 검색..."
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-full focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredNotes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="CSV로 내보내기"
          >
            <Download size={13} /> 내보내기
          </button>
          {selectedKeys.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full bg-red-100 text-red-700 hover:bg-red-200"
            >
              <Trash2 size={13} /> 선택 삭제 ({selectedKeys.size})
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={notes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} /> 전체 삭제
          </button>
        </div>

        {/* 오답 목록 — 전체 화면 모드는 더 넓은 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <BookOpen size={48} className="mb-4 opacity-40" />
              <p className="text-base font-medium">
                {notes.length === 0 ? '아직 저장된 오답이 없습니다.' : '조건에 맞는 오답이 없습니다.'}
              </p>
              <p className="text-sm mt-2">
                {notes.length === 0
                  ? 'Dictation에서 틀린 단어가 자동으로 저장됩니다.'
                  : '필터나 검색어를 변경해 보세요.'}
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              {filteredNotes.map((note) => {
                const id = noteId(note);
                const selected = selectedKeys.has(id);
                return (
                  <div
                    key={id}
                    className={`rounded-xl border px-4 py-3 transition-colors ${selected ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleToggleSelect(note)}
                        className="mt-1 w-3.5 h-3.5 accent-red-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-red-600 px-1.5 py-0.5 bg-red-50 rounded">
                            {note.word}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                            {contentKeyLabel(note.contentKey)}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto">{formatDate(note.savedAt)}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {note.sentence}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(note)}
                          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          title="복사"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note)}
                          className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-600"
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 — 콘텐츠별 요약 */}
        {groupedByKey.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 bg-white max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">📊 콘텐츠별 오답 수 — 클릭 시 해당 콘텐츠 오답 삭제</p>
            <div className="flex flex-wrap gap-1.5">
              {groupedByKey.map(([key, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDeleteByContentKey(key)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  title={`"${contentKeyLabel(key)}"의 오답 ${count}개 삭제`}
                >
                  {contentKeyLabel(key)} <span className="font-bold">{count}</span> ×
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 모달 모드 (기존) ──
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 본체 */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[fadeSlideUp_0.25s_ease-out]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">📒 오답 노트 통합 관리</h2>
              <p className="text-xs text-gray-500">Dictation에서 틀린 단어를 모아 재학습</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* 통계 배지 */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold">
            전체 {notes.length}개
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
            최근 7일 {recentCount}개
          </span>
          {currentContentKey && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
              이 문제 {thisCount}개
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            최대 {MAX_NOTES}개까지 저장됩니다.
          </span>
        </div>

        {/* 필터 + 검색 + 액션 */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-1 rounded-full bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
            >
              전체
            </button>
            {currentContentKey && (
              <button
                type="button"
                onClick={() => setFilter('this')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filter === 'this' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
              >
                이 문제
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilter('recent')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filter === 'recent' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
            >
              최근 7일
            </button>
          </div>

          <div className="flex-1 min-w-[140px] relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="단어/문장/콘텐츠 검색..."
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-full focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredNotes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="CSV로 내보내기"
          >
            <Download size={13} /> 내보내기
          </button>
          {selectedKeys.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full bg-red-100 text-red-700 hover:bg-red-200"
            >
              <Trash2 size={13} /> 선택 삭제 ({selectedKeys.size})
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={notes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} /> 전체 삭제
          </button>
        </div>

        {/* 오답 목록 */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <BookOpen size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">
                {notes.length === 0 ? '아직 저장된 오답이 없습니다.' : '조건에 맞는 오답이 없습니다.'}
              </p>
              <p className="text-xs mt-1">
                {notes.length === 0
                  ? 'Dictation에서 틀린 단어가 자동으로 저장됩니다.'
                  : '필터나 검색어를 변경해 보세요.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => {
                const id = noteId(note);
                const selected = selectedKeys.has(id);
                return (
                  <div
                    key={id}
                    className={`rounded-xl border px-3 py-2.5 transition-colors ${selected ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleToggleSelect(note)}
                        className="mt-1 w-3.5 h-3.5 accent-red-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-red-600 px-1.5 py-0.5 bg-red-50 rounded">
                            {note.word}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                            {contentKeyLabel(note.contentKey)}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-auto">{formatDate(note.savedAt)}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {note.sentence}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(note)}
                          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                          title="복사"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note)}
                          className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-600"
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 — 콘텐츠별 요약 */}
        {groupedByKey.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 max-h-32 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">📊 콘텐츠별 오답 수</p>
            <div className="flex flex-wrap gap-1.5">
              {groupedByKey.map(([key, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDeleteByContentKey(key)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  title={`"${contentKeyLabel(key)}"의 오답 ${count}개 삭제`}
                >
                  {contentKeyLabel(key)} <span className="font-bold">{count}</span> ×
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
