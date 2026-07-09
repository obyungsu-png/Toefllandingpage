import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { supabase as supabaseClient } from '../utils/supabase/client';
import {
  Search, Users, Calendar, TrendingUp, AlertTriangle,
  RefreshCw, Clock, Key, Smartphone, Monitor, GraduationCap, Shield,
  DollarSign, BarChart3, LayoutDashboard, Ticket, X, Copy, Check,
  ArrowUpRight, ArrowDownRight, Download, Eye, CheckSquare, Square
} from 'lucide-react';
import { calcExpireDate } from '../utils/licenseUtils';

// ─────────────────────── 타입 ───────────────────────
export interface Student {
  id: string; name: string; email: string; enrolledDate: string;
  phoneNumber?: string; registeredVia?: 'registration_form' | 'manual';
}
export interface VocabularyScore {
  id: string; studentId: string; date: string; totalQuestions: number;
  correctAnswers: number; percentage: number; wrongWords: string[];
  testType: 'multiple' | 'subjective' | 'mixed'; dayRange: string;
}
interface EnrichedStudent {
  user_id: string; email: string; name: string;
  user_type: '내학생' | '외부구매자'; expire_date: string;
  pc_machine_id?: string | null; tablet_machine_id?: string | null; mobile_machine_id?: string | null;
  created_at: string; signup_method: string; actual_price?: number | null;
  licenseKeys: LicenseKeyRecord[];
}
interface LicenseKeyRecord {
  id: string; key_code: string; duration_months: number;
  user_type: '내학생' | '외부구매자'; is_used: boolean;
  assigned_user_id?: string | null; used_at?: string | null; created_at: string;
  actual_price?: number | null;
}
interface DashboardStats { totalStudents: number; activeStudents: number; expiredStudents: number; expiringSoon: number; newThisMonth: number; innerStudents: number; outerStudents: number; monthlyRevenue: number; }
interface MonthlyData { month: string; label: string; newStudents: number; expiring: number; revenue: number; activeEnd: number; }

type SortField = 'expire' | 'created' | 'email' | 'type';
type SortDir = 'asc' | 'desc';

// ─────────────────────── Props ───────────────────────
interface StudentManagementProps {
  students: Student[]; scores: VocabularyScore[];
  onAddStudent: (s: Omit<Student, 'id'>) => void; onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void; onAddScore: (s: Omit<VocabularyScore, 'id'>) => void;
  onDeleteStudentData: (id: string) => void;
}

// ─────────────────────── 메인 ───────────────────────
export function StudentManagement({ students, scores, onAddStudent, onUpdateStudent, onDeleteStudent, onAddScore, onDeleteStudentData }: StudentManagementProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'license'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | '내학생' | '외부구매자' | 'expiring' | 'expired'>('all');
  const [sortField, setSortField] = useState<SortField>('expire');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [enrichedStudents, setEnrichedStudents] = useState<EnrichedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExtendModal, setShowExtendModal] = useState<EnrichedStudent | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // 라이선스 생성
  const [genDuration, setGenDuration] = useState(1);
  const [genUserType, setGenUserType] = useState<'내학생' | '외부구매자'>('외부구매자');
  const [genActualPrice, setGenActualPrice] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [genError, setGenError] = useState('');
  const [licenseHistory, setLicenseHistory] = useState<LicenseKeyRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 일괄: 체크박스 + 일괄연장 모달 + 상세 모달
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchMonths, setBatchMonths] = useState(1);
  const [detailStudent, setDetailStudent] = useState<EnrichedStudent | null>(null);
  const [detailActivity, setDetailActivity] = useState<{ testCount: number; lastLogin: string } | null>(null);

  // ── 데이터 로드 ──
  useEffect(() => { loadStudentsData(); }, []);
  const loadStudentsData = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabaseClient.from('users_profile').select('*');
      if (error) { console.error(error); setLoading(false); return; }
      const { data: allKeys } = await supabaseClient.from('license_keys').select('*').order('created_at', { ascending: false });
      const keyMap = new Map<string, LicenseKeyRecord[]>();
      (allKeys || []).forEach((k: any) => { if (k.assigned_user_id) { if (!keyMap.has(k.assigned_user_id)) keyMap.set(k.assigned_user_id, []); keyMap.get(k.assigned_user_id)!.push(k); } });
      const enriched: EnrichedStudent[] = (profiles || []).map((p: any) => ({
        user_id: p.user_id, email: p.email || '', name: (p.email || '').split('@')[0] || 'Unknown',
        user_type: p.user_type || '내학생', expire_date: p.expire_date || '', actual_price: p.actual_price,
        pc_machine_id: p.pc_machine_id, tablet_machine_id: p.tablet_machine_id, mobile_machine_id: p.mobile_machine_id,
        created_at: p.created_at || '', signup_method: p.signup_method || 'email',
        licenseKeys: keyMap.get(p.user_id) || [],
      }));
      setEnrichedStudents(enriched);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // ── 월별 통계 ──
  const monthlyData = useMemo((): MonthlyData[] => {
    const months: MonthlyData[] = []; const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}월`;
      const ms = new Date(d.getFullYear(), d.getMonth(), 1);
      const me = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      let ns = 0, ex = 0, rev = 0;
      enrichedStudents.forEach(s => {
        if (new Date(s.created_at) >= ms && new Date(s.created_at) <= me) ns++;
        if (new Date(s.expire_date) >= ms && new Date(s.expire_date) <= me) ex++;
        s.licenseKeys.forEach(k => {
          if (new Date(k.created_at) >= ms && new Date(k.created_at) <= me)
            rev += k.actual_price || (k.duration_months * (s.user_type === '내학생' ? 30000 : 20000));
        });
      });
      const activeEnd = enrichedStudents.filter(s => new Date(s.expire_date) >= me).length;
      months.push({ month: key, label, newStudents: ns, expiring: ex, revenue: rev, activeEnd });
    }
    return months;
  }, [enrichedStudents]);

  // ── 대시보드 통계 ──
  const dashboardStats = useMemo((): DashboardStats => {
    const now = new Date(); const d7 = new Date(now.getTime() + 7 * 86400000); const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    let a = 0, e = 0, s = 0, n = 0, i = 0, o = 0, rev = 0;
    enrichedStudents.forEach(s => {
      const ed = new Date(s.expire_date); if (ed >= now) a++; else e++;
      if (ed >= now && ed <= d7) s++; if (new Date(s.created_at) >= ms) n++;
      if (s.user_type === '내학생') i++; else o++;
      const lk = s.licenseKeys[0];
      if (lk) rev += lk.actual_price || (lk.duration_months * (s.user_type === '내학생' ? 30000 : 20000));
    });
    return { totalStudents: enrichedStudents.length, activeStudents: a, expiredStudents: e, expiringSoon: s, newThisMonth: n, innerStudents: i, outerStudents: o, monthlyRevenue: rev };
  }, [enrichedStudents]);

  // ── 정렬 + 필터 ──
  const sortedStudents = useMemo(() => {
    const arr = [...enrichedStudents];
    arr.sort((a, b) => {
      const v = sortField === 'expire' ? [new Date(a.expire_date).getTime(), new Date(b.expire_date).getTime()] :
               sortField === 'created' ? [new Date(a.created_at).getTime(), new Date(b.created_at).getTime()] :
               sortField === 'email' ? [a.email.localeCompare(b.email), 0] :
               [a.user_type.localeCompare(b.user_type), 0];
      return (v[0] as number) - (v[1] as number);
    });
    return sortDir === 'desc' ? arr.reverse() : arr;
  }, [enrichedStudents, sortField, sortDir]);

  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(s => {
      const q = searchQuery.toLowerCase();
      const m = !q || s.email.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const now = new Date(); const ed = new Date(s.expire_date); const d7 = new Date(now.getTime() + 7 * 86400000);
      switch (filterType) {
        case '내학생': return m && s.user_type === '내학생';
        case '외부구매자': return m && s.user_type === '외부구매자';
        case 'expiring': return m && ed >= now && ed <= d7;
        case 'expired': return m && ed < now;
        default: return m;
      }
    });
  }, [sortedStudents, searchQuery, filterType]);

  // ── 체크박스 토글 ──
  const toggleSelect = (id: string) => { const ns = new Set(selectedIds); ns.has(id) ? ns.delete(id) : ns.add(id); setSelectedIds(ns); };
  const toggleSelectAll = () => { if (selectedIds.size === filteredStudents.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredStudents.map(s => s.user_id))); };

  // ── CSV 내보내기 ──
  const exportCSV = () => {
    const rows = [['이메일', '가입방법', '등급', '만료일', '남은일수', '상태', '수익', '코드수']];
    enrichedStudents.forEach(s => {
      const days = getDaysRemaining(s.expire_date);
      const lastKey = s.licenseKeys[0];
      const revenue = lastKey ? (lastKey.actual_price || lastKey.duration_months * (s.user_type === '내학생' ? 30000 : 20000)) : 0;
      rows.push([s.email, getSignupMethodLabel(s.signup_method), s.user_type, s.expire_date, String(days),
        days < 0 ? '만료' : days <= 7 ? '임박' : '활성', String(revenue), String(s.licenseKeys.length)]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `학생명단_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── 일괄 연장 ──
  const handleBatchExtend = async () => {
    setActionLoading(true); setActionError('');
    try {
      for (const id of selectedIds) {
        const s = enrichedStudents.find(x => x.user_id === id);
        if (!s) continue;
        const ce = s.expire_date ? new Date(s.expire_date) : new Date();
        const ne = new Date(ce); ne.setMonth(ne.getMonth() + batchMonths);
        await supabaseClient.from('users_profile').update({ expire_date: ne.toISOString().split('T')[0] }).eq('user_id', id);
        const code = `TPO-${batchMonths}M-${s.user_type === '내학생' ? 'INNER' : 'OUTER'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await supabaseClient.from('license_keys').insert({ key_code: code, duration_months: batchMonths, user_type: s.user_type, is_used: true, assigned_user_id: id, used_at: new Date().toISOString() });
      }
      setSelectedIds(new Set()); setShowBatchModal(false);
      loadStudentsData(); loadLicenseHistory();
    } catch (e: any) { setActionError(e?.message || '일괄 연장 실패'); } finally { setActionLoading(false); }
  };

  // ── 라이선스 키 생성 ──
  const handleGenerate = async () => {
    setGenLoading(true); setGenError(''); setCopied(false);
    const code = `TPO-${genDuration}M-${genUserType === '내학생' ? 'INNER' : 'OUTER'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    try {
      const price = genActualPrice ? Number(genActualPrice) : null;
      const { error } = await supabaseClient.from('license_keys').insert({ key_code: code, duration_months: genDuration, user_type: genUserType, is_used: false, actual_price: price });
      if (error) { if (error.code === '23505') return handleGenerate(); throw error; }
      setGeneratedCode(code); loadLicenseHistory();
    } catch (e: any) { setGenError(e?.message || '생성 실패'); } finally { setGenLoading(false); }
  };

  const handleCopy = async () => { if (!generatedCode) return; await navigator.clipboard.writeText(generatedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // ── 라이선스 이력 ──
  const loadLicenseHistory = async () => {
    setHistoryLoading(true);
    try { const { data } = await supabaseClient.from('license_keys').select('*').order('created_at', { ascending: false }).limit(50); setLicenseHistory(data || []); } catch {} finally { setHistoryLoading(false); }
  };
  useEffect(() => { loadLicenseHistory(); }, []);

  // ── 학생 액션 ──
  const handleExtend = async () => {
    if (!showExtendModal) return; setActionLoading(true); setActionError('');
    try {
      const ce = showExtendModal.expire_date ? new Date(showExtendModal.expire_date) : new Date();
      const ne = new Date(ce); ne.setMonth(ne.getMonth() + extendMonths);
      await supabaseClient.from('users_profile').update({ expire_date: ne.toISOString().split('T')[0] }).eq('user_id', showExtendModal.user_id);
      const code = `TPO-${extendMonths}M-${showExtendModal.user_type === '내학생' ? 'INNER' : 'OUTER'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await supabaseClient.from('license_keys').insert({ key_code: code, duration_months: extendMonths, user_type: showExtendModal.user_type, is_used: true, assigned_user_id: showExtendModal.user_id, used_at: new Date().toISOString() });
      setShowExtendModal(null); loadStudentsData(); loadLicenseHistory();
    } catch (e: any) { setActionError(e?.message || '연장 실패'); } finally { setActionLoading(false); }
  };

  const handleDeviceReset = async (student: EnrichedStudent, device: 'pc' | 'tablet' | 'mobile') => {
    if (!confirm('기기 초기화 하시겠습니까?')) return;
    try {
      const u: Record<string, null> = {}; if (device === 'pc') u.pc_machine_id = null; else if (device === 'tablet') u.tablet_machine_id = null; else u.mobile_machine_id = null;
      await supabaseClient.from('users_profile').update(u).eq('user_id', student.user_id); loadStudentsData();
    } catch (e: any) { alert('실패: ' + (e?.message || '')); }
  };

  const handleDeleteProfile = async (student: EnrichedStudent) => {
    if (!confirm(`정말 ${student.email} 학생을 삭제하시겠습니까?`)) return;
    try {
      await supabaseClient.from('license_keys').update({ is_used: false, assigned_user_id: null, used_at: null }).eq('assigned_user_id', student.user_id);
      await supabaseClient.from('users_profile').delete().eq('user_id', student.user_id);
      const m = students.find(x => x.email === student.email); if (m) onDeleteStudent(m.id);
      loadStudentsData(); loadLicenseHistory();
    } catch (e: any) { alert('실패: ' + (e?.message || '')); }
  };

  // ── 상세 보기 ──
  const openDetail = async (s: EnrichedStudent) => {
    setDetailStudent(s);
    try {
      const { count } = await supabaseClient.from('reports').select('*', { count: 'exact', head: true }).eq('user_id', s.user_id);
      setDetailActivity({ testCount: count || 0, lastLogin: '-' });
    } catch { setDetailActivity({ testCount: 0, lastLogin: '-' }); }
  };

  // ── 헬퍼 ──
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
  const formatKRW = (w: number) => w >= 10000 ? `${(w / 10000).toFixed(w % 10000 === 0 ? 0 : 1)}만원` : `${w.toLocaleString()}원`;
  const formatShortKRW = (w: number) => w >= 10000 ? `${(w / 10000).toFixed(0)}만` : `${(w / 1000).toFixed(0)}천`;
  const getDaysRemaining = (ed: string) => ed ? Math.ceil((new Date(ed).getTime() - Date.now()) / 86400000) : 0;
  const getStatusBadge = (ed: string) => { const d = getDaysRemaining(ed); if (d < 0) return { l: '만료', c: 'bg-red-100 text-red-700' }; if (d <= 7) return { l: `D-${d}`, c: 'bg-orange-100 text-orange-700' }; if (d <= 30) return { l: `D-${d}`, c: 'bg-yellow-100 text-yellow-700' }; return { l: '활성', c: 'bg-green-100 text-green-700' }; };
  const getSignupMethodLabel = (m: string) => { switch (m) { case 'google': return 'Google'; case 'wechat': return 'WeChat'; case 'email': return '이메일'; default: return '이메일'; } };
  const getSignupMethodColor = (m: string) => { switch (m) { case 'google': return 'bg-blue-100 text-blue-700'; case 'wechat': return 'bg-green-100 text-green-700'; default: return 'bg-gray-100 text-gray-700'; } };
  const maxMonthlyValue = useMemo(() => Math.max(...monthlyData.flatMap(d => [d.newStudents, d.expiring, d.revenue / 10000]), 1), [monthlyData]);
  const barHeightPercent = (v: number) => `${Math.max((v / maxMonthlyValue) * 100, 2)}%`;

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 text-[#1e6b73] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm">
        {[{ id: 'dashboard' as const, label: '대시보드', icon: LayoutDashboard }, { id: 'list' as const, label: '학생 목록', icon: GraduationCap }, { id: 'license' as const, label: '수강권', icon: Ticket }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === t.id ? 'bg-[#1e6b73] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><t.icon className="w-4 h-4" />{t.label}</button>
        ))}
        <button onClick={loadStudentsData} className="ml-auto px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="새로고침"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* 대시보드 */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="전체 학생" value={dashboardStats.totalStudents} />
            <StatCard icon={TrendingUp} label="활성 학생" value={dashboardStats.activeStudents} />
            <StatCard icon={AlertTriangle} label="만료 임박" value={dashboardStats.expiringSoon} alert />
            <StatCard icon={Clock} label="만료" value={dashboardStats.expiredStudents} danger />
            <StatCard icon={Calendar} label="이번 달 신규" value={dashboardStats.newThisMonth} />
            <StatCard icon={GraduationCap} label="내 학생" value={dashboardStats.innerStudents} />
            <StatCard icon={Shield} label="외부 구매자" value={dashboardStats.outerStudents} />
            <StatCard icon={DollarSign} label="총 수익" value={formatKRW(dashboardStats.monthlyRevenue)} revenue />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5"><BarChart3 className="w-4 h-4 text-[#1e6b73]" /><h3 className="text-sm font-semibold text-gray-700">월별 추이</h3></div>
            <div className="flex items-end gap-[3px] h-44 mb-4">
              {monthlyData.map(d => (
                <div key={d.month} className="flex-1 flex flex-col items-center relative" onMouseEnter={() => setHoveredMonth(d.month)} onMouseLeave={() => setHoveredMonth(null)}>
                  {hoveredMonth === d.month && <div className="absolute -top-10 bg-gray-800 text-white text-[11px] rounded-lg px-2.5 py-1 z-10 whitespace-nowrap">{d.label}: 신규 {d.newStudents} / 만료 {d.expiring} / {formatShortKRW(d.revenue)}</div>}
                  <div className="w-full h-36 flex items-end gap-[2px]">
                    <div className="flex-1 bg-[#1e6b73] rounded-t hover:opacity-90 transition-opacity" style={{ height: barHeightPercent(d.newStudents) }} />
                    <div className="flex-1 bg-orange-200 rounded-t hover:opacity-90 transition-opacity" style={{ height: barHeightPercent(d.expiring) }} />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1.5">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 text-[11px] text-gray-400"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e6b73]" />신규</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-200" />만료</span></div>
            <div className="mt-4 border-t border-gray-100 pt-4 overflow-x-auto">
              <table className="w-full text-xs"><thead><tr className="text-gray-400 border-b border-gray-50"><th className="text-left py-1.5">월</th><th className="text-right py-1.5">신규</th><th className="text-right py-1.5">만료</th><th className="text-right py-1.5">순증감</th><th className="text-right py-1.5">활성(말)</th><th className="text-right py-1.5">수익</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{monthlyData.map(d => { const nc = d.newStudents - d.expiring; return (
                  <tr key={d.month} className="hover:bg-gray-50"><td className="py-1.5 font-medium text-gray-700">{d.label}</td><td className="py-1.5 text-right text-blue-600">{d.newStudents}</td><td className="py-1.5 text-right text-red-500">{d.expiring}</td>
                    <td className="py-1.5 text-right"><span className={`inline-flex items-center gap-0.5 ${nc >= 0 ? 'text-green-600' : 'text-red-500'}`}>{nc >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{nc >= 0 ? '+' : ''}{nc}</span></td>
                    <td className="py-1.5 text-right text-gray-600">{d.activeEnd}</td><td className="py-1.5 text-right text-emerald-600 font-medium">{formatShortKRW(d.revenue)}</td></tr>); })}</tbody>
              </table>
            </div>
          </div>
          {dashboardStats.expiringSoon > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-5">
              <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-3"><AlertTriangle className="w-5 h-5" />만료 임박 (7일 이내)</h3>
              <div className="space-y-2">{enrichedStudents.filter(s => { const d = getDaysRemaining(s.expire_date); return d >= 0 && d <= 7; }).map(s => (
                <div key={s.user_id} className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg"><div><p className="font-medium text-gray-800 text-sm">{s.email}</p><p className="text-xs text-gray-500">{s.user_type} · 만료일: {formatDate(s.expire_date)} · D-{getDaysRemaining(s.expire_date)}</p></div><Button size="sm" onClick={() => { setShowExtendModal(s); setExtendMonths(1); }} className="bg-[#1e6b73] text-white hover:bg-[#185a61] text-xs">연장</Button></div>
              ))}</div></div>)}
        </div>
      )}

      {/* 학생 목록 */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="이름/이메일 검색..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30" /></div>
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30"><option value="all">전체</option><option value="내학생">내 학생</option><option value="외부구매자">외부 구매자</option><option value="expiring">만료 임박</option><option value="expired">만료됨</option></select>
            <div className="flex items-center gap-1">
              <select value={sortField} onChange={e => setSortField(e.target.value as SortField)} className="px-2 py-2 border border-gray-200 rounded-lg text-xs"><option value="expire">만료일순</option><option value="created">가입일순</option><option value="email">이름순</option><option value="type">등급순</option></select>
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="px-2 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">{sortDir === 'asc' ? '↑오름' : '↓내림'}</button>
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"><Download className="w-3.5 h-3.5" />Excel</button>
            {selectedIds.size > 0 && <Button size="sm" onClick={() => setShowBatchModal(true)} className="bg-[#1e6b73] text-white hover:bg-[#185a61] text-xs">{selectedIds.size}명 일괄 연장</Button>}
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Users className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">{searchQuery ? '검색 결과 없음' : '등록된 학생 없음'}</p></div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">{selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}</button>
                <span className="text-xs text-gray-400">{selectedIds.size > 0 ? `${selectedIds.size}/${filteredStudents.length} 선택됨` : '전체 선택'}</span>
              </div>
              {filteredStudents.map(s => {
                const st = getStatusBadge(s.expire_date); const days = getDaysRemaining(s.expire_date);
                const hasDevice = !!(s.pc_machine_id || s.tablet_machine_id || s.mobile_machine_id);
                const lastKey = s.licenseKeys[0];
                const revenue = lastKey ? (lastKey.actual_price || lastKey.duration_months * (s.user_type === '내학생' ? 30000 : 20000)) : 0;
                return (
                  <div key={s.user_id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleSelect(s.user_id)} className="mt-1 text-gray-400 hover:text-gray-600 shrink-0">{selectedIds.has(s.user_id) ? <CheckSquare className="w-4 h-4 text-[#1e6b73]" /> : <Square className="w-4 h-4" />}</button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm">{s.email}</span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${getSignupMethodColor(s.signup_method)}`}>{getSignupMethodLabel(s.signup_method)}</span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${s.user_type === '내학생' ? 'bg-teal-100 text-teal-700' : 'bg-indigo-100 text-indigo-700'}`}>{s.user_type}</span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${st.c}`}>{st.l}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />만료 {formatDate(s.expire_date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{days > 0 ? `${days}일` : '만료'}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatKRW(revenue)}</span>
                          {hasDevice && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />기기</span>}
                          <span className="text-gray-300">코드 {s.licenseKeys.length}개</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="text-[11px] px-2 py-1" onClick={() => openDetail(s)}><Eye className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="text-[11px] px-2 py-1" onClick={() => { setShowExtendModal(s); setExtendMonths(1); }}><Clock className="w-3 h-3 mr-0.5" />연장</Button>
                        {hasDevice && <Button size="sm" variant="outline" className="text-[11px] px-2 py-1 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleDeviceReset(s, s.pc_machine_id ? 'pc' : s.tablet_machine_id ? 'tablet' : 'mobile')}><Smartphone className="w-3 h-3 mr-0.5" />초기화</Button>}
                        <Button size="sm" variant="outline" className="text-[11px] px-2 py-1 text-red-400 border-red-200 hover:bg-red-50" onClick={() => handleDeleteProfile(s)}><X className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-sm text-gray-500 text-center">전체 {enrichedStudents.length}명 / 표시 {filteredStudents.length}명</p>
        </div>
      )}

      {/* 수강권 관리 */}
      {activeTab === 'license' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><Key className="w-5 h-5 text-[#1e6b73]" /><h3 className="text-lg font-bold text-gray-800">수강권 코드 생성</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">기간</label><select value={genDuration} onChange={e => setGenDuration(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30"><option value={1}>1개월</option><option value={3}>3개월</option><option value={6}>6개월</option><option value={12}>12개월</option></select></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">등급</label><select value={genUserType} onChange={e => setGenUserType(e.target.value as any)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30"><option value="외부구매자">외부 구매자</option><option value="내학생">내 학생</option></select></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">실제 금액 (선택)</label><input type="number" value={genActualPrice} onChange={e => setGenActualPrice(e.target.value)} placeholder="ex) 30000" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30" /></div>
            </div>
            <Button onClick={handleGenerate} disabled={genLoading} className="w-full py-2.5 bg-[#1e6b73] text-white hover:bg-[#185a61]">{genLoading ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />생성 중</> : <><RefreshCw className="w-4 h-4 mr-2" />코드 생성</>}</Button>
            {genError && <p className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{genError}</p>}
            {generatedCode && (
              <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 space-y-2">
                <p className="text-sm text-green-700 font-medium">생성 완료!</p>
                <div className="flex items-center gap-2"><code className="flex-1 px-4 py-2.5 bg-white rounded-lg border border-green-300 text-lg font-mono font-bold text-[#1e6b73] tracking-wider text-center select-all">{generatedCode}</code><button onClick={handleCopy} className="shrink-0 p-2.5 rounded-lg bg-white border border-green-300 hover:bg-green-100">{copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-600" />}</button></div>
                <p className="text-xs text-gray-500">{genUserType === '외부구매자' ? '외부 구매자용 (1대 제한)' : '내 학생용'} · {genDuration}개월{genActualPrice ? ` · ${Number(genActualPrice).toLocaleString()}원` : ''}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-800">발급 이력</h3><button onClick={loadLicenseHistory} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} /></button></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-gray-600 text-xs uppercase"><th className="text-left px-4 py-3">코드</th><th className="text-left px-4 py-3">기간</th><th className="text-left px-4 py-3">등급</th><th className="text-left px-4 py-3">상태</th><th className="text-left px-4 py-3">사용자</th><th className="text-left px-4 py-3">금액</th><th className="text-left px-4 py-3">생성일</th><th className="text-left px-4 py-3">마감일</th></tr></thead>
                <tbody className="divide-y divide-gray-100">{licenseHistory.map(k => {
                  const ed = k.is_used && k.used_at ? (() => { const d = new Date(k.used_at); d.setMonth(d.getMonth() + k.duration_months); return d.toISOString().split('T')[0]; })() : null;
                  return (<tr key={k.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-mono text-xs text-gray-700">{k.key_code}</td><td className="px-4 py-3">{k.duration_months}개월</td><td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${k.user_type === '내학생' ? 'bg-teal-100 text-teal-700' : 'bg-indigo-100 text-indigo-700'}`}>{k.user_type}</span></td><td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${k.is_used ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>{k.is_used ? '사용됨' : '미사용'}</span></td><td className="px-4 py-3 text-gray-500 text-xs">{k.assigned_user_id ? enrichedStudents.find(x => x.user_id === k.assigned_user_id)?.email || k.assigned_user_id.slice(0, 8) + '...' : '-'}</td><td className="px-4 py-3 text-xs">{k.actual_price ? `${(k.actual_price).toLocaleString()}원` : '-'}</td><td className="px-4 py-3 text-gray-500 text-xs">{formatDate(k.created_at)}</td><td className="px-4 py-3 text-xs">{ed ? <span className={new Date(ed) < new Date() ? 'text-red-500' : 'text-gray-600'}>{formatDate(ed)}</span> : <span className="text-gray-400">-</span>}</td></tr>);
                })}</tbody>
              </table>
              {licenseHistory.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">발급된 코드가 없습니다.</p>}
            </div>
          </div>
        </div>
      )}

      {/* 연장 모달 */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,15,20,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-800">수강 기간 연장</h3><button onClick={() => setShowExtendModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4"><div><p className="text-sm text-gray-500">학생</p><p className="font-medium text-gray-800">{showExtendModal.email}</p></div><div><p className="text-sm text-gray-500">현재 만료일</p><p className="font-medium text-gray-800">{formatDate(showExtendModal.expire_date)}</p></div><div><label className="block text-sm font-medium text-gray-600 mb-1">연장 기간</label><select value={extendMonths} onChange={e => setExtendMonths(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30"><option value={1}>1개월</option><option value={3}>3개월</option><option value={6}>6개월</option><option value={12}>12개월</option></select><p className="text-xs text-gray-400 mt-1">새 만료일: {formatDate(calcExpireDate(extendMonths))}{showExtendModal.expire_date && new Date(showExtendModal.expire_date) > new Date() ? ` (+${extendMonths}개월)` : ''}</p></div>{actionError && <p className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{actionError}</p>}<div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowExtendModal(null)}>취소</Button><Button className="flex-1 bg-[#1e6b73] text-white hover:bg-[#185a61]" onClick={handleExtend} disabled={actionLoading}>{actionLoading && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}연장</Button></div></div>
          </div>
        </div>
      )}

      {/* 일괄 연장 모달 */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,15,20,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-800">일괄 연장 ({selectedIds.size}명)</h3><button onClick={() => setShowBatchModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4"><div className="max-h-40 overflow-y-auto space-y-1">{enrichedStudents.filter(s => selectedIds.has(s.user_id)).map(s => <p key={s.user_id} className="text-sm text-gray-600 truncate">{s.email}</p>)}</div><div><label className="block text-sm font-medium text-gray-600 mb-1">연장 기간</label><select value={batchMonths} onChange={e => setBatchMonths(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e6b73]/30"><option value={1}>1개월</option><option value={3}>3개월</option><option value={6}>6개월</option><option value={12}>12개월</option></select></div>{actionError && <p className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{actionError}</p>}<div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowBatchModal(false)}>취소</Button><Button className="flex-1 bg-[#1e6b73] text-white hover:bg-[#185a61]" onClick={handleBatchExtend} disabled={actionLoading}>{actionLoading && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}{selectedIds.size}명 연장</Button></div></div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,15,20,0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-800">학생 상세</h3><button onClick={() => setDetailStudent(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="이메일" value={detailStudent.email} />
                <Info label="가입 방법" value={getSignupMethodLabel(detailStudent.signup_method)} />
                <Info label="등급" value={detailStudent.user_type} />
                <Info label="만료일" value={formatDate(detailStudent.expire_date)} />
                <Info label="남은 기간" value={`${getDaysRemaining(detailStudent.expire_date)}일`} />
                <Info label="가입일" value={formatDate(detailStudent.created_at)} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="테스트 횟수" value={detailActivity?.testCount || 0} />
                <Info label="마지막 접속" value={detailActivity?.lastLogin || '-'} />
              </div>
              <div className="flex gap-1 text-xs">
                <span className="text-gray-500">기기: </span>
                {detailStudent.pc_machine_id ? <span className="bg-gray-100 px-2 py-0.5 rounded">PC</span> : null}
                {detailStudent.tablet_machine_id ? <span className="bg-gray-100 px-2 py-0.5 rounded">태블릿</span> : null}
                {detailStudent.mobile_machine_id ? <span className="bg-gray-100 px-2 py-0.5 rounded">모바일</span> : null}
                {!detailStudent.pc_machine_id && !detailStudent.tablet_machine_id && !detailStudent.mobile_machine_id && <span className="text-gray-400">없음</span>}
              </div>
              {detailStudent.licenseKeys.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">라이선스 이력</p>
                  <div className="space-y-1">
                    {detailStudent.licenseKeys.map(k => (
                      <div key={k.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <code className="font-mono text-gray-600">{k.key_code}</code>
                        <span className="text-gray-400">{k.duration_months}개월 · {formatDate(k.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────── 작은 컴포넌트들 ───────────────────────
function StatCard({ icon: Icon, label, value, alert, danger, revenue }: { icon: any; label: string; value: string | number; alert?: boolean; danger?: boolean; revenue?: boolean; }) {
  const iconBg = danger ? 'bg-red-50' : alert ? 'bg-orange-50' : revenue ? 'bg-emerald-50' : 'bg-[#1e6b73]/8';
  const iconColor = danger ? 'text-red-500' : alert ? 'text-orange-500' : revenue ? 'text-emerald-600' : 'text-[#1e6b73]';
  const valueColor = danger ? 'text-red-600' : alert ? 'text-orange-600' : revenue ? 'text-emerald-700' : 'text-gray-900';
  return (<div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center justify-between mb-3"><span className="text-xs text-gray-400 font-medium">{label}</span><div className={`${iconBg} p-1.5 rounded-lg`}><Icon className={`w-3.5 h-3.5 ${iconColor}`} /></div></div><p className={`text-2xl font-bold ${valueColor} tracking-tight`}>{value}</p></div>);
}

function Info({ label, value }: { label: string; value: string | number }) {
  return <div><p className="text-xs text-gray-400">{label}</p><p className="font-medium text-gray-700">{value}</p></div>;
}
