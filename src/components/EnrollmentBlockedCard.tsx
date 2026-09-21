/**
 * EnrollmentBlockedCard.tsx
 * -----------------------------------------------------------------------------
 * 시험/게임 진입이 차단된 학생에게 노출되는 공통 안내 오버레이.
 * 로그인 안 됨/수강권 없음/만료/기기 제한 등 여러 사유를 한 화면에서 통일된
 * 문구로 안내하고, 재시도 및 상위 화면(훈련 메뉴 등) 나가기를 제공한다.
 */
import { Lock, RefreshCw, X, Loader2 } from 'lucide-react';

interface Props {
  reason?: string;
  checking?: boolean;
  onRetry?: () => void;
  onExit?: () => void;
}

export function EnrollmentBlockedCard({ reason, checking, onRetry, onExit }: Props) {
  if (checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="rounded-2xl bg-white shadow-xl p-6 text-center max-w-xs">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#2d7a7c]" />
          <p className="text-sm font-semibold text-gray-700">학원생 등록 확인 중…</p>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5" />
            <h2 className="font-bold">학원생 전용 콘텐츠</h2>
          </div>
          {onExit && (
            <button onClick={onExit} aria-label="닫기" className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed text-gray-700">
            {reason || '이 콘텐츠는 등록된 학원생만 이용할 수 있습니다. 로그인 후 활성화 코드로 등록해 주세요.'}
          </p>
          <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
            <li>담당 선생님께 활성화 코드를 문의하세요.</li>
            <li>이미 코드를 발급받은 경우 로그인 후 자동으로 활성화됩니다.</li>
            <li>수강 기간이 만료된 경우 연장이 필요합니다.</li>
          </ul>
          <div className="flex gap-2 pt-1">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2d7a7c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#256668] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                다시 확인
              </button>
            )}
            {onExit && (
              <button
                onClick={onExit}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                나가기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
