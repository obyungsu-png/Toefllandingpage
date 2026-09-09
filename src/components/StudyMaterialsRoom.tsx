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
  Eye, EyeOff, ArrowUpDown, RefreshCw, Save, FolderOpen,
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
    <div className="p-3 md:p-6">
      {/* 헤더 */}
      <div className="mb-4 md:mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" style={{ color: themeColor }} />
            자료방
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            학습에 도움이 되는 자료를 다운로드하거나 외부 링크로 열어볼 수 있어요. 순번대로 정렬되어 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          {isAdmin && (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
              style={{ backgroundColor: themeColor }}
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
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">아직 올라온 자료가 없어요</p>
          {isAdmin && (
            <p className="text-xs text-gray-400 mt-1">
              우측 상단의 "자료 추가" 버튼으로 첫 자료를 올려보세요.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((m, i) => {
            const isExternal = isExternalPageLink(m.download_url);
            const Icon = isExternal ? ExternalLink : Download;
            const btnLabel = m.link_label || (isExternal ? '링크 열기' : '다운로드');
            const hidden = !m.is_visible;
            return (
              <div
                key={m.id}
                className={`bg-white rounded-xl border p-3 md:p-4 flex items-start gap-3 md:gap-4 transition-shadow hover:shadow-md ${
                  hidden ? 'border-dashed border-gray-300 opacity-60' : 'border-gray-200'
                }`}
              >
                {/* 순번 배지 */}
                <div
                  className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center font-bold text-sm md:text-base text-white"
                  style={{ backgroundColor: themeColor }}
                  title={`순번 ${m.order_num || i + 1}`}
                >
                  {m.order_num || i + 1}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 break-words">
                      {m.title}
                    </h3>
                    {m.category && (
                      <span
                        className="inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: categoryColor(m.category) }}
                      >
                        {m.category}
                      </span>
                    )}
                    {hidden && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                        <EyeOff className="w-3 h-3" /> 감춤
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                      {m.description}
                    </p>
                  )}
                  {isAdmin && (
                    <p className="mt-1 text-[10px] text-gray-400 truncate" title={m.download_url}>
                      {m.download_url}
                    </p>
                  )}
                </div>

                {/* 액션 */}
                <div className="flex-shrink-0 flex flex-col md:flex-row items-end md:items-center gap-1.5">
                  <a
                    href={m.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-white px-3 py-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {btnLabel}
                  </a>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(m); setShowForm(true); }}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded hover:bg-gray-100"
                        title="편집"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.title)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
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
