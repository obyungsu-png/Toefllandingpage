/**
 * StudyMaterialsRoom.tsx — 자료방 (History → 자료방 탭)
 * -----------------------------------------------------------------------------
 * 관리자가 올린 학습 자료를 순번대로 리스트로 보여주고, 각 자료마다
 * "다운로드" 또는 "링크 열기" 버튼으로 접근 가능. 링크는 외부(Google Drive /
 * Baidu / Dropbox / 직접 URL) 를 새 창으로 열기만 함 — 파일 저장은 하지 않음.
 *
 * 관리자(isAdmin=true) 인 경우 상단에 "+ 자료 추가" 버튼이 뜨고 각 카드에
 * 편집·삭제 버튼이 노출됨. 감춘 자료도 함께 보임.
 */
import { useEffect, useState } from 'react';
import {
  BookOpen, Loader2, Download, ExternalLink, Plus, Pencil, Trash2, X,
  EyeOff, RefreshCw, Save, FolderOpen, FileText, Link2,
} from 'lucide-react';
import {
  listMaterials, listAllMaterialsAdmin,
  addMaterial, updateMaterial, deleteMaterial,
  type StudyMaterial,
} from '../utils/studyMaterials';

interface StudyMaterialsRoomProps {
  themeColor?: string;
  isAdmin?: boolean;
}

/** URL 이 외부 페이지 링크인지 직접 파일 다운로드 링크인지 대충 감지 */
function isExternalPageLink(url: string): boolean {
  const u = (url || '').toLowerCase();
  return /drive\.google\.com|baidu\.com|pan\.baidu|dropbox\.com|onedrive|mega\.nz|notion\.so|docs\.google/.test(u);
}

/** URL 확장자(+ 보조로 제목 키워드) 로 파일 타입 추정 — 아이콘/뱃지 표시용 */
function getFileKind(url: string, title: string = ''): { label: string; color: string } {
  const hay = `${url || ''} ${title || ''}`.toLowerCase();
  // 확장자 매치 (가장 신뢰도 높음)
  if (/\.pdf(\?|#|$)/.test(hay)) return { label: 'PDF', color: '#dc2626' };
  if (/\.(docx?|hwp)(\?|#|$)/.test(hay)) return { label: 'DOC', color: '#2563eb' };
  if (/\.(xlsx?|csv)(\?|#|$)/.test(hay)) return { label: 'XLS', color: '#059669' };
  if (/\.(pptx?)(\?|#|$)/.test(hay)) return { label: 'PPT', color: '#ea580c' };
  if (/\.(zip|rar|7z)(\?|#|$)/.test(hay)) return { label: 'ZIP', color: '#7c3aed' };
  if (/\.(mp3|wav|m4a)(\?|#|$)/.test(hay)) return { label: 'AUDIO', color: '#db2777' };
  if (/\.(mp4|mov|webm)(\?|#|$)/.test(hay)) return { label: 'VIDEO', color: '#0891b2' };
  if (/\.(png|jpe?g|webp|gif)(\?|#|$)/.test(hay)) return { label: 'IMG', color: '#ca8a04' };
  // 키워드 fallback — 제목이나 URL 에 'pdf' 가 들어 있으면 PDF 로 추정
  if (/\bpdf\b/.test(hay)) return { label: 'PDF', color: '#dc2626' };
  if (/\b(docx?|word|hwp)\b/.test(hay)) return { label: 'DOC', color: '#2563eb' };
  if (/\b(xlsx?|excel|sheet)\b/.test(hay)) return { label: 'XLS', color: '#059669' };
  if (/\b(pptx?|slide)\b/.test(hay)) return { label: 'PPT', color: '#ea580c' };
  if (/\b(mp3|audio|음성|듣기)\b/.test(hay)) return { label: 'AUDIO', color: '#db2777' };
  if (/\b(mp4|video|영상)\b/.test(hay)) return { label: 'VIDEO', color: '#0891b2' };
  return { label: 'LINK', color: '#6b7280' };
}

/** 카테고리 배지 색상 */
function categoryColor(cat: string | null): string {
  if (!cat) return '#6b7280';
  const c = cat.toLowerCase();
  if (c.includes('reading')) return '#2563eb';
  if (c.includes('listen')) return '#7c3aed';
  if (c.includes('writing')) return '#059669';
  if (c.includes('speak')) return '#dc2626';
  return '#6b7280';
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────
export function StudyMaterialsRoom({ themeColor = '#005f61', isAdmin = false }: StudyMaterialsRoomProps) {
  const [rows, setRows] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const list = isAdmin ? await listAllMaterialsAdmin() : await listMaterials();
      if (!cancelled) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, isAdmin]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 자료를 삭제하시겠어요? 되돌릴 수 없어요.`)) return;
    const r = await deleteMaterial(id);
    if (!r.ok) { alert('삭제 실패: ' + (r.reason || '')); return; }
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto">
      {/* 헤더 — 자료방임을 강조하는 큰 배너 */}
      <div
        className="mb-5 rounded-2xl p-5 md:p-6 flex items-center justify-between gap-3 flex-wrap shadow-sm"
        style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}
      >
        <div className="text-white">
          <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
            <FolderOpen className="w-6 h-6" />
            자료방
          </h2>
          <p className="text-xs md:text-sm text-white/90 mt-1 leading-relaxed max-w-xl">
            학원 공식 학습 자료 모음집입니다. PDF·오디오·링크 등 다양한 형식의
            자료를 <b>다운로드</b> 받거나 <b>외부 링크</b> 로 바로 열어볼 수 있어요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/15 border border-white/30 text-white hover:bg-white/25 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          {isAdmin && (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-bold bg-white text-gray-800 hover:bg-gray-100"
            >
              <Plus className="w-3.5 h-3.5" /> 자료 추가
            </button>
          )}
        </div>
      </div>

      {/* 리스트 */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin mb-2" />
          <p className="text-sm text-gray-500">자료를 불러오는 중…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 md:p-14 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
            <BookOpen className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <p className="text-base font-bold text-gray-700">아직 올라온 자료가 없어요</p>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? '우측 상단의 "자료 추가" 버튼으로 첫 자료를 올려보세요.'
              : '곧 학원 측에서 학습 자료를 업로드할 예정입니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 md:space-y-2">
          {rows.map((m, i) => {
            const hidden = !m.is_visible;
            const kind = getFileKind(m.download_url, m.title);
            const isExternal = isExternalPageLink(m.download_url);
            const TypeIcon = isExternal ? Link2 : FileText;
            return (
              <div
                key={m.id}
                className={`group bg-white rounded-xl border transition-all duration-150 hover:border-gray-300 hover:shadow-sm ${
                  hidden ? 'border-dashed border-gray-300 opacity-60' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-2 md:py-2.5">
                  {/* 좌측 순번 — 더 작게 */}
                  <div
                    className="w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-[11px] md:text-xs text-white"
                    style={{ backgroundColor: themeColor }}
                    title={`순번 ${m.order_num || i + 1}`}
                  >
                    {m.order_num || i + 1}
                  </div>

                  {/* 가운데 — 제목 · 뱃지 · 설명 (한 줄 압축) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                      <TypeIcon
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: themeColor }}
                      />
                      <h3 className="text-[13px] md:text-sm font-semibold text-gray-900 truncate">
                        {m.title}
                      </h3>
                      {/* 파일 타입 inline chip */}
                      <span
                        className="shrink-0 text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                        style={{ backgroundColor: `${kind.color}18`, color: kind.color }}
                      >
                        {kind.label}
                      </span>
                      {m.category && (
                        <span
                          className="shrink-0 text-[9px] md:text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: categoryColor(m.category) }}
                        >
                          {m.category}
                        </span>
                      )}
                      {hidden && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] md:text-[10px] font-semibold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                          <EyeOff className="w-2.5 h-2.5" /> 감춤
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 line-clamp-1 md:line-clamp-1 group-hover:line-clamp-2 transition-all">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* 우측 액션 — 다운로드 + 링크 쌍둥이 버튼 */}
                  <div className="shrink-0 flex items-center gap-1 md:gap-1.5">
                    {/* 다운로드 (primary) */}
                    <a
                      href={m.download_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] md:text-xs font-bold text-white px-2.5 md:px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                      style={{ backgroundColor: themeColor }}
                      title="파일 다운로드"
                    >
                      <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      <span className="hidden sm:inline">다운로드</span>
                    </a>
                    {/* 링크 (secondary, outlined) */}
                    <a
                      href={m.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] md:text-xs font-bold px-2.5 md:px-3 py-1.5 rounded-lg border transition-all hover:bg-gray-50 active:scale-95 whitespace-nowrap"
                      style={{ borderColor: `${themeColor}55`, color: themeColor }}
                      title="새 탭에서 링크 열기"
                    >
                      <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      <span className="hidden sm:inline">링크</span>
                    </a>

                    {/* 관리자 전용 — 편집/삭제 */}
                    {isAdmin && (
                      <div className="ml-1 pl-1 border-l border-gray-200 flex items-center gap-0.5">
                        <button
                          onClick={() => { setEditing(m); setShowForm(true); }}
                          className="p-1.5 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors"
                          title="편집"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.title)}
                          className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 관리자 — URL 작게 표시 (영역 분리) */}
                {isAdmin && (
                  <div className="px-3 md:px-4 pb-2 pt-0 text-[10px] text-gray-400 truncate" title={m.download_url}>
                    {m.download_url}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 관리자 폼 모달 */}
      {showForm && (
        <MaterialForm
          initial={editing}
          themeColor={themeColor}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}

// ── 관리자용 자료 추가/편집 폼 ─────────────────────────────────────
function MaterialForm({
  initial, themeColor, onClose, onSaved,
}: {
  initial: StudyMaterial | null;
  themeColor: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle]           = useState(initial?.title || '');
  const [description, setDesc]      = useState(initial?.description || '');
  const [url, setUrl]               = useState(initial?.download_url || '');
  const [linkLabel, setLinkLabel]   = useState(initial?.link_label || '다운로드');
  const [category, setCategory]     = useState(initial?.category || '');
  const [orderNum, setOrderNum]     = useState<string>(String(initial?.order_num ?? ''));
  const [isVisible, setIsVisible]   = useState<boolean>(initial?.is_visible ?? true);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      setErr('제목과 링크 URL 은 필수입니다.');
      return;
    }
    setSaving(true);
    setErr(null);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      download_url: url.trim(),
      link_label: linkLabel.trim() || '다운로드',
      category: category.trim() || null,
      order_num: Number.isFinite(Number(orderNum)) && orderNum !== '' ? Number(orderNum) : 0,
      is_visible: isVisible,
    };
    const r = initial
      ? await updateMaterial(initial.id, payload)
      : await addMaterial(payload);
    setSaving(false);
    if (!r.ok) {
      setErr(r.reason || '저장 실패');
      return;
    }
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
            {initial ? '자료 편집' : '새 자료 추가'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">순번 (숫자, 작을수록 먼저)</label>
            <input
              type="number"
              value={orderNum}
              onChange={e => setOrderNum(e.target.value)}
              placeholder="예: 1"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--th)]"
              style={{ ['--th' as any]: themeColor }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: TPO 3 리스닝 스크립트 PDF"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--th)]"
              style={{ ['--th' as any]: themeColor }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">설명 (자료 간단 소개)</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="예: TPO 3 리스닝 문제의 원본 스크립트입니다. 인쇄해서 복습에 활용하세요."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--th)] resize-none"
              style={{ ['--th' as any]: themeColor }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">링크 URL *</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Google Drive / Baidu / Dropbox / 직접 파일 URL"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--th)]"
              style={{ ['--th' as any]: themeColor }}
            />
            <p className="mt-1 text-[10px] text-gray-500 leading-relaxed">
              • Google Drive: 파일 우클릭 → 공유 → "링크가 있는 모든 사용자" 로 설정 후 링크 복사<br />
              • Baidu 网盘: 자료 우측 "分享" → 설정 후 링크 복사 (필요시 추출 코드도 설명란에 함께 기재)<br />
              • Dropbox / OneDrive: 공유 링크 그대로 붙여넣기<br />
              • 직접 파일 URL 도 사용 가능 (예: 서버에 올린 PDF 링크)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">버튼 라벨</label>
              <input
                value={linkLabel}
                onChange={e => setLinkLabel(e.target.value)}
                placeholder="다운로드 / 링크 열기"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--th)]"
                style={{ ['--th' as any]: themeColor }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리 (선택)</label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Reading / Listening / Writing / Speaking / General"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--th)]"
                style={{ ['--th' as any]: themeColor }}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={e => setIsVisible(e.target.checked)}
            />
            학생들에게 공개 (체크 해제 시 관리자만 볼 수 있는 감춤 상태)
          </label>

          {err && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
              {err}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? '저장 중…' : (initial ? '수정 저장' : '자료 추가')}
          </button>
        </div>
      </div>
    </div>
  );
}
