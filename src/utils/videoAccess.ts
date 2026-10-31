/**
 * videoAccess.ts — 영상 강의 재생 접근 게이트
 * ---------------------------------------------------------------
 * 로직 (아주 단순):
 *   1) 로그인 안 함       → 거부 (login_required)
 *   2) 가입 10일 이내      → 허용 (trial, 남은 일수 반환)
 *   3) 유효한 수강권 있음 → 허용 (licensed)
 *   4) 그 외              → 거부 (trial_expired)
 *
 * 가입일 기준은 Supabase auth.users.created_at (가입 즉시 자동 기록).
 * 수강권 체크는 기존 licenseUtils.checkUserAccess({checkPaidOnly: true}) 재사용.
 */
import { supabase } from './supabase/client';
import { checkUserAccess } from './licenseUtils';

/** 가입 후 무료 체험 기간 (일) */
export const VIDEO_TRIAL_DAYS = 10;

export type VideoAccessStatus = 'trial' | 'licensed' | 'login_required' | 'trial_expired';

export interface VideoAccessResult {
  allowed: boolean;
  status:  VideoAccessStatus;
  /** trial 상태일 때 남은 일수 (올림, 1 이상). 다른 상태에선 undefined. */
  trialDaysLeft?: number;
  /** 사용자에게 보여줄 짧은 안내 (예외 안내용) */
  reason?: string;
}

function daysBetween(fromIso: string, toDate: Date): number {
  const from = new Date(fromIso).getTime();
  const to   = toDate.getTime();
  if (!Number.isFinite(from)) return Number.POSITIVE_INFINITY;
  return (to - from) / (1000 * 60 * 60 * 24);
}

/**
 * 현재 사용자가 영상을 볼 수 있는지 확인.
 * - 1차: 가입 10일 안 → 통과
 * - 2차: 수강권 유효 → 통과
 * - 그 외: 거부
 */
export async function checkVideoAccess(): Promise<VideoAccessResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return {
        allowed: false,
        status:  'login_required',
        reason:  '영상을 보려면 먼저 로그인해 주세요.',
      };
    }

    // 1) 가입일 기준 10일 무료
    const createdAt = user.created_at; // Supabase Auth 가 자동으로 ISO 문자열로 넣어줌
    if (createdAt) {
      const elapsed = daysBetween(createdAt, new Date());
      if (elapsed >= 0 && elapsed < VIDEO_TRIAL_DAYS) {
        const left = Math.max(1, Math.ceil(VIDEO_TRIAL_DAYS - elapsed));
        return { allowed: true, status: 'trial', trialDaysLeft: left };
      }
    }

    // 2) 수강권 유효성 검사 (기존 라이선스 체계 재사용)
    const paid = await checkUserAccess(true /* checkPaidOnly */);
    if (paid.allowed) {
      return { allowed: true, status: 'licensed' };
    }

    // 3) 만료 — 수강권 안내
    return {
      allowed: false,
      status:  'trial_expired',
      reason:  '무료 체험 10일이 끝났어요. 수강권을 등록하면 모든 강의를 볼 수 있어요.',
    };
  } catch (err) {
    console.warn('[videoAccess] 확인 실패:', err);
    return {
      allowed: false,
      status:  'login_required',
      reason:  '접근 권한을 확인하는 중 오류가 발생했어요. 다시 시도해 주세요.',
    };
  }
}
