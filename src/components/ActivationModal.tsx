import { useState } from 'react';
import { Key, X, Loader2, CheckCircle } from 'lucide-react';
import { activateLicenseKey } from '../utils/licenseUtils';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reason?: string;
}

export function ActivationModal({ isOpen, onClose, onSuccess, reason }: ActivationModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleActivate = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setResult({ success: false, message: '활성화 코드를 입력해주세요.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await activateLicenseKey(trimmed);
      setResult(res);
      if (res.success) {
        setCode('');
        setTimeout(() => {
          onSuccess?.();
          onClose();
          window.location.reload();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleActivate();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#1e6b73]" />
            <h2 className="text-lg font-bold text-gray-800">활성화 코드 입력</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 접근 차단 이유 */}
          {reason && (
            <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-sm border border-amber-200 whitespace-pre-line">
              ⚠️ {reason}
            </div>
          )}

          {/* 입력 필드 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              활성화 코드
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: TPO-1M-INNER123"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-[#1e6b73] focus:border-transparent disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* 활성화 버튼 */}
          <button
            onClick={handleActivate}
            disabled={loading || !code.trim()}
            className="w-full py-3 rounded-lg bg-[#1e6b73] text-white font-bold text-base hover:bg-[#185a61] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                확인 중...
              </>
            ) : (
              '활성화'
            )}
          </button>

          {/* 결과 메시지 */}
          {result && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                result.success
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {result.success && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
              <span className="whitespace-pre-line">{result.message}</span>
            </div>
          )}

          {/* 구매 안내 */}
          <hr className="border-gray-200" />
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-bold text-gray-700">아직 활성화 코드가 없으신가요?</p>
            <ul className="space-y-1 pl-5 list-disc">
              <li><strong>1개월 이용권:</strong> 200元</li>
              <li>
                <strong>6개월 이용권:</strong>{' '}
                <span className="line-through text-gray-400">1,200元</span>
                {' '}→{' '}
                <span className="text-red-500 font-bold">960元 (🔥 20% 할인)</span>
              </li>
              <li><strong>내 학생용:</strong> 1개월 이용권 무료</li>
            </ul>
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <p className="font-medium text-gray-700 mb-1">💬 구매 방법</p>
              <p>QR코드를 스캔하여 위챗으로 송금 → 확인 즉시 활성화 코드 발급</p>
            </div>
            {/* QR placeholder — 실제 이미지로 교체 필요 */}
            <div className="flex justify-center py-2">
              <div className="w-28 h-28 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                QR 코드 이미지
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
