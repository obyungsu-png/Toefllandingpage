/**
 * BoardSection.tsx — Board 탭 (History 옆)
 * -----------------------------------------------------------------------------
 * 두 가지 서브 섹션:
 *   1) Q&A      : 학생이 질문을 올리고 선생님(관리자)이 답변하는 게시판
 *   2) Materials: 학원 공식 학습 자료방 (기존 StudyMaterialsRoom 재사용)
 *
 * 관리자(isAdmin=true) 는 답변 작성/수정/삭제, 글 숨김/노출 토글이 가능.
 */
import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import {
  MessageSquare, FolderOpen, Loader2, Plus, Pencil, Trash2, X, Save,
  CheckCircle2, Clock, ExternalLink, EyeOff, RefreshCw, Search,
} from 'lucide-react';
import {
  listPosts, listAllPostsAdmin, addPost, updatePost, setAnswer, deletePost,
  type BoardPost,
} from '../utils/boardPosts';

const StudyMaterialsRoom = lazy(() =>
  import('./StudyMaterialsRoom').then(m => ({ default: m.StudyMaterialsRoom }))
);

interface BoardSectionProps {
  themeColor?: string;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  studentName?: string;
  onRequestLogin?: () => void;
}

type SubTab = 'qa' | 'materials';

/** 카테고리 색상 — StudyMaterialsRoom 과 동일 톤 */
function categoryColor(cat: string | null): string {
  if (!cat) return '#6b7280';
  const c = cat.toLowerCase();
  if (c.includes('reading')) return '#2563eb';
  if (c.includes('listen')) return '#7c3aed';
  if (c.includes('writing')) return '#059669';
  if (c.includes('speak'))   return '#dc2626';
  if (c.includes('vocab'))   return '#ea580c';
  return '#6b7280';
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return '';
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function BoardSection({
  themeColor = '#005f61',
  isAdmin = false,
  isLoggedIn = false,
  studentName,
  onRequestLogin,
}: BoardSectionProps) {
  const [sub, setSub] = useState<SubTab>('qa');

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto">
      {/* 상단 배너 */}
      <div
        className="mb-5 rounded-2xl p-5 md:p-6 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}
      >
        <div className="text-white">
          <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Board
          </h2>
          <p className="text-xs md:text-sm text-white/90 mt-1 leading-relaxed max-w-xl">
            궁금한 점을 <b>질문</b>으로 올리면 선생님이 답변해 드립니다.
            수업과 관련된 <b>학습 자료</b> 도 이곳에서 다운로드 받을 수 있어요.
          </p>
        </div>
      </div>

      {/* 서브 탭 */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        <SubTabButton active={sub === 'qa'}        label="Q&A"       icon={MessageSquare} onClick={() => setSub('qa')}        themeColor={themeColor} />
        <SubTabButton active={sub === 'materials'} label="Materials" icon={FolderOpen}    onClick={() => setSub('materials')} themeColor={themeColor} />
      </div>

      {sub === 'qa' ? (
        <QASection
          themeColor={themeColor}
          isAdmin={isAdmin}
          isLoggedIn={isLoggedIn}
          studentName={studentName}
          onRequestLogin={onRequestLogin}
        />
      ) : (
        <Suspense fallback={<div className="p-10 text-center text-gray-500"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Materials 불러오는 중…</div>}>
          <StudyMaterialsRoom themeColor={themeColor} isAdmin={isAdmin} />
        </Suspense>
      )}
    </div>
  );
}

function SubTabButton({ active, label, icon: Icon, onClick, themeColor }: {
  active: boolean; label: string; icon: any; onClick: () => void; themeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all ${
        active
          ? 'bg-opacity-5'
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
      }`}
      style={active ? { color: themeColor, borderColor: themeColor } : {}}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ── Q&A 섹션 ────────────────────────────────────────────────────────────
function QASection({
  themeColor, isAdmin, isLoggedIn, studentName, onRequestLogin,
}: {
  themeColor: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  studentName?: string;
  onRequestLogin?: () => void;
}) {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BoardPost | null>(null);
  const [answering, setAnswering] = useState<BoardPost | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const list = isAdmin ? await listAllPostsAdmin() : await listPosts();
      if (!cancelled) {
        setPosts(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(p => {
      if (filter === 'answered'   && !p.answer_body) return false;
      if (filter === 'unanswered' &&  p.answer_body) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q)
        || p.body.toLowerCase().includes(q)
        || (p.answer_body || '').toLowerCase().includes(q)
        || (p.category || '').toLowerCase().includes(q)
        || p.author_name.toLowerCase().includes(q);
    });
  }, [posts, search, filter]);

  const handleDelete = async (p: BoardPost) => {
    if (!confirm(`"${p.title}" 글을 삭제할까요? 되돌릴 수 없어요.`)) return;
    const r = await deletePost(p.id);
    if (!r.ok) { alert('삭제 실패: ' + (r.reason || '')); return; }
    setRefreshKey(k => k + 1);
  };

  const canWrite = isLoggedIn;

  return (
    <div>
      {/* 툴바 — 검색/필터/새글 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목·내용·작성자 검색"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
            style={{ ['--th' as any]: themeColor, boxShadow: 'none' }}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['all', 'unanswered', 'answered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                filter === f ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={filter === f ? { color: themeColor } : {}}
            >
              {f === 'all' ? '전체' : f === 'unanswered' ? '미답변' : '답변완료'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => {
            if (!canWrite) { onRequestLogin?.(); return; }
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 text-xs md:text-sm px-3 py-2 rounded-lg font-bold text-white hover:opacity-90 shadow-sm"
          style={{ backgroundColor: themeColor }}
        >
          <Plus className="w-4 h-4" />
          질문하기
        </button>
      </div>

      {/* 리스트 */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-7 h-7 text-gray-400 mx-auto animate-spin mb-2" />
          <p className="text-sm text-gray-500">게시판을 불러오는 중…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-14 h-14 mx-auto mb-2 rounded-full flex items-center justify-center"
               style={{ backgroundColor: `${themeColor}15` }}>
            <MessageSquare className="w-7 h-7" style={{ color: themeColor }} />
          </div>
          <p className="text-sm font-bold text-gray-700">
            {search || filter !== 'all' ? '조건에 맞는 글이 없어요' : '아직 등록된 질문이 없어요'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {canWrite ? '우측 "질문하기" 버튼으로 첫 질문을 올려보세요.' : '로그인 후 질문을 올릴 수 있어요.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(p => (
            <PostCard
              key={p.id}
              post={p}
              themeColor={themeColor}
              isAdmin={isAdmin}
              onEdit={() => { setEditing(p); setShowForm(true); }}
              onDelete={() => handleDelete(p)}
              onAnswer={() => setAnswering(p)}
            />
          ))}
        </ul>
      )}

      {/* 질문 작성/수정 모달 */}
      {showForm && (
        <PostForm
          initial={editing}
          themeColor={themeColor}
          studentName={studentName}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); setRefreshKey(k => k + 1); }}
        />
      )}

      {/* 답변 작성/수정 모달 (관리자) */}
      {answering && (
        <AnswerForm
          post={answering}
          themeColor={themeColor}
          onClose={() => setAnswering(null)}
          onSaved={() => { setAnswering(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}

// ── 글 카드 (답변 포함) ────────────────────────────────────────────────
function PostCard({ post, themeColor, isAdmin, onEdit, onDelete, onAnswer }: {
  post: BoardPost;
  themeColor: string;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAnswer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const answered = !!post.answer_body;

  return (
    <li className={`bg-white rounded-xl border transition-all ${post.is_visible ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-70'} hover:border-gray-300 hover:shadow-sm`}>
      {/* 헤더 */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3 md:px-4 py-3 flex items-start gap-3"
      >
        {/* 답변 상태 */}
        <div className="shrink-0 mt-0.5">
          {answered ? (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: themeColor }} />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-50">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {post.category && (
              <span
                className="shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: categoryColor(post.category) }}
              >
                {post.category}
              </span>
            )}
            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
              {post.title}
            </h3>
            {!post.is_visible && (
              <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                <EyeOff className="w-2.5 h-2.5" /> 감춤
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-gray-600">{post.author_name}</span>
            <span>·</span>
            <span>{timeAgo(post.created_at)}</span>
            {!answered && <span className="ml-1 text-amber-700 font-semibold">· 답변 대기</span>}
            {answered && <span className="ml-1 font-semibold" style={{ color: themeColor }}>· 답변 완료</span>}
          </div>
          {!open && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{post.body}</p>
          )}
        </div>

        <div className="shrink-0 text-gray-400 text-xs mt-1 self-center">
          {open ? '접기' : '펼치기'}
        </div>
      </button>

      {/* 상세 */}
      {open && (
        <div className="px-3 md:px-4 pb-3 md:pb-4">
          {/* 질문 본문 */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.body}
            </p>
          </div>

          {/* 답변 */}
          {answered && (
            <div
              className="mt-3 rounded-lg p-3 border"
              style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}08` }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4" style={{ color: themeColor }} />
                <span className="text-xs font-bold" style={{ color: themeColor }}>선생님 답변</span>
                {post.answered_at && (
                  <span className="text-[10px] text-gray-500">· {timeAgo(post.answered_at)}</span>
                )}
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {post.answer_body}
              </p>
              {post.answer_link && (
                <a
                  href={post.answer_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-white"
                  style={{ borderColor: `${themeColor}60`, color: themeColor }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  관련 링크 열기
                </a>
              )}
            </div>
          )}

          {/* 관리자 액션 */}
          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5 flex-wrap">
              <button
                onClick={(e) => { e.stopPropagation(); onAnswer(); }}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                {answered ? '답변 수정' : '답변 작성'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="w-3.5 h-3.5" /> 수정
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> 삭제
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ── 질문 작성/수정 모달 ─────────────────────────────────────────────────
function PostForm({ initial, themeColor, studentName, onClose, onSaved }: {
  initial: BoardPost | null;
  themeColor: string;
  studentName?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle]       = useState(initial?.title || '');
  const [body, setBody]         = useState(initial?.body || '');
  const [category, setCategory] = useState(initial?.category || 'General');
  const [visible, setVisible]   = useState<boolean>(initial?.is_visible ?? true);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      setErr('제목과 내용은 필수입니다.');
      return;
    }
    setSaving(true);
    setErr(null);
    const r = initial
      ? await updatePost(initial.id, { title: title.trim(), body: body.trim(), category: category || null, is_visible: visible })
      : await addPost({ title, body, category: category || null, authorName: studentName });
    setSaving(false);
    if (!r.ok) { setErr(r.reason || '저장 실패'); return; }
    onSaved();
  };

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
            {initial ? '질문 수정' : '새 질문 작성'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
            >
              <option value="General">General</option>
              <option value="Reading">Reading</option>
              <option value="Listening">Listening</option>
              <option value="Writing">Writing</option>
              <option value="Speaking">Speaking</option>
              <option value="Vocabulary">Vocabulary</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: TPO 3 리스닝 lecture 2 번째 문제 이해가 안 돼요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">내용 *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="상황을 자세히 적어주시면 더 정확한 답변을 받을 수 있어요."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none resize-none"
            />
          </div>
          {initial && (
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
              다른 사용자에게 공개 (체크 해제 시 감춤)
            </label>
          )}
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 답변 작성/수정 모달 (관리자) ────────────────────────────────────────
function AnswerForm({ post, themeColor, onClose, onSaved }: {
  post: BoardPost;
  themeColor: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [body, setBody] = useState(post.answer_body || '');
  const [link, setLink] = useState(post.answer_link || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!body.trim()) { setErr('답변 내용을 입력해주세요.'); return; }
    setSaving(true);
    setErr(null);
    const r = await setAnswer(post.id, { answer_body: body, answer_link: link.trim() || null });
    setSaving(false);
    if (!r.ok) { setErr(r.reason || '저장 실패'); return; }
    onSaved();
  };

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
          <h3 className="text-base font-bold text-gray-900">선생님 답변 {post.answer_body ? '수정' : '작성'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-bold text-gray-800 mb-1">{post.title}</p>
            <p className="whitespace-pre-wrap text-gray-600">{post.body}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">답변 내용 *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="질문에 대한 답변을 작성하세요."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">관련 링크 (선택)</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://youtube.com/... 또는 Google Drive 공유 링크"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              유튜브 강의, 수업 자료, 블로그 글 등 참고가 될 외부 링크를 하나 걸 수 있어요.
            </p>
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
