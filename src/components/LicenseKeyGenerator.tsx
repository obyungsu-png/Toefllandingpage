import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Key, Copy, Check, Loader2, RefreshCw } from 'lucide-react';

export function LicenseKeyGenerator() {
  const [duration, setDuration] = useState(1);
  const [userType, setUserType] = useState<'내학생' | '외부구매자'>('외부구매자');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateCode = () => {
    const type = userType === '내학생' ? 'INNER' : 'OUTER';
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TPO-${duration}M-${type}${rand}`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setCopied(false);

    const code = generateCode();

    try {
      const { error: insertErr } = await supabase
        .from('license_keys')
        .insert({
          key_code: code,
          duration_months: duration,
          user_type: userType,
          is_used: false,
        });

      if (insertErr) {
        // 중복 코드면 재시도
        if (insertErr.code === '23505' || insertErr.message?.includes('duplicate')) {
          return handleGenerate();
        }
        throw insertErr;
      }

      setGenerated(code);
    } catch (e: any) {
      setError(e?.message || '코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Key className="w-5 h-5 text-[#1e6b73]" />
        <h3 className="text-lg font-bold text-gray-800">수강권 코드 생성</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 기간 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">이용 기간</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b73]"
          >
            <option value={1}>1개월</option>
            <option value={6}>6개월</option>
            <option value={3}>3개월</option>
            <option value={12}>12개월</option>
          </select>
        </div>

        {/* 등급 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">학생 등급</label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value as '내학생' | '외부구매자')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b73]"
          >
            <option value="외부구매자">외부 구매자 (EXE 전용, 1대 제한)</option>
            <option value="내학생">내 학생 (웹/EXE 자유)</option>
          </select>
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[#1e6b73] text-white font-bold text-sm hover:bg-[#185a61] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> 생성 중...</>
        ) : (
          <><RefreshCw className="w-4 h-4" /> 코드 생성</>
        )}
      </button>

      {/* 오류 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* 생성 결과 */}
      {generated && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-2">
          <p className="text-sm text-green-700 font-medium">✅ 코드가 생성되었습니다! 학생에게 위챗으로 보내주세요.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2.5 bg-white rounded-lg border border-green-300 text-lg font-mono font-bold text-[#1e6b73] tracking-wider text-center">
              {generated}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2.5 rounded-lg bg-white border border-green-300 hover:bg-green-100 transition-colors"
              title="복사"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-green-600" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {userType === '외부구매자' ? '외부 구매자용 (기기 1대 자동 잠금)' : '내 학생용 (기기 제한 없음)'}
            {' · '}{duration}개월
          </p>
        </div>
      )}
    </div>
  );
}
