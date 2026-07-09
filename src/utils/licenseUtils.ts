import { supabase } from './supabase/client';

// ───────────────────── 타입 ─────────────────────

export interface UserProfile {
  user_id: string;
  expire_date: string;
  user_type: '내학생' | '외부구매자';
  pc_machine_id?: string | null;
  mobile_machine_id?: string | null;
}

export interface LicenseKey {
  key_code: string;
  duration_months: number;
  user_type: '내학생' | '외부구매자';
  is_used: boolean;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  profile?: UserProfile;
}

// ───────────────────── 헬퍼 ─────────────────────

/** Electron 환경인지 확인 */
function isElectronEnv(): boolean {
  try {
    return !!(window as any).electronAPI?.isElectron;
  } catch {
    return false;
  }
}

/** 머신 ID 가져오기 (Electron: 파일 기반 UUID, 웹: null) */
async function getMachineId(): Promise<string | null> {
  if (!isElectronEnv()) return null;
  try {
    const api = (window as any).electronAPI;
    if (api?.getMachineId) {
      return await api.getMachineId();
    }
  } catch (e) {
    console.warn('[license] getMachineId 실패:', e);
  }
  return null;
}

/** 오늘 날짜 문자열 (YYYY-MM-DD) */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** 만료일 계산 (오늘 + N개월) */
export function calcExpireDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// ───────────────────── 프로필 조회 ─────────────────────

/** 현재 로그인 사용자의 프로필 조회 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

// ───────────────────── 활성화 코드 등록 ─────────────────────

export interface ActivateResult {
  success: boolean;
  message: string;
}

/**
 * 학생이 입력한 활성화 코드를 검증하고 등록합니다.
 */
export async function activateLicenseKey(inputKeyCode: string): Promise<ActivateResult> {
  try {
    // 1. 로그인 확인
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return { success: false, message: '로그인이 필요한 서비스입니다.' };
    }

    // 2. 코드 유효성 검증
    const { data: keyData, error: keyError } = await supabase
      .from('license_keys')
      .select('*')
      .eq('key_code', inputKeyCode.trim())
      .eq('is_used', false)
      .single();

    if (keyError || !keyData) {
      return { success: false, message: '올바르지 않거나 이미 사용된 활성화 코드입니다.' };
    }

    // 3. 만료일 계산
    const expireDate = calcExpireDate(keyData.duration_months);

    // 4. 프로필 upsert
    const { error: profileError } = await supabase
      .from('users_profile')
      .upsert(
        {
          user_id: authData.user.id,
          expire_date: expireDate,
          user_type: keyData.user_type,
        },
        { onConflict: 'user_id' },
      );

    if (profileError) {
      return { success: false, message: '프로필 등록 중 오류가 발생했습니다.' };
    }

    // 5. 코드 사용 처리
    await supabase
      .from('license_keys')
      .update({
        is_used: true,
        assigned_user_id: authData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq('key_code', inputKeyCode.trim());

    const userTypeLabel = keyData.user_type === '내학생' ? '내 학생' : '외부 구매자';
    return {
      success: true,
      message: `활성화 성공! ${userTypeLabel} 권한으로 ${keyData.duration_months}개월 동안 이용 가능합니다.`,
    };
  } catch (err) {
    console.error('[license] activateLicenseKey 오류:', err);
    return { success: false, message: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
  }
}

// ───────────────────── 권한 검증 ─────────────────────

/**
 * 현재 사용자의 콘텐츠 접근 권한을 검증합니다.
 * TPO 1 / Test 1 은 항상 허용 (무료 체험).
 *
 * @param checkPaidOnly true 이면 무료 콘텐츠(TPO 1, Test 1)도 차단합니다.
 */
export async function checkUserAccess(checkPaidOnly = false): Promise<AccessCheckResult> {
  try {
    // 1. 로그인 여부
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return {
        allowed: checkPaidOnly ? false : true,
        reason: checkPaidOnly ? '로그인이 필요한 서비스입니다.' : undefined,
      };
    }

    // 2. 프로필 조회
    const profile = await getUserProfile();
    if (!profile) {
      return {
        allowed: checkPaidOnly ? false : true,
        reason: checkPaidOnly ? '등록된 프로필이 없습니다. 활성화 코드를 입력해주세요.' : undefined,
      };
    }

    // 3. 만료일 체크
    if (profile.expire_date < todayStr()) {
      return {
        allowed: false,
        reason: '수강 기간이 만료되었습니다. 선생님께 연장 문의하세요.',
        profile,
      };
    }

    // 4. 환경별 접근 제한
    if (isElectronEnv()) {
      // EXE 프로그램: 외부 구매자 → 1대 기기 제한
      if (profile.user_type === '외부구매자') {
        const currentMachineId = await getMachineId();
        if (!currentMachineId) {
          return { allowed: false, reason: '기기 정보를 확인할 수 없습니다.', profile };
        }

        // 최초 실행: 기기 등록
        if (!profile.pc_machine_id) {
          const { error } = await supabase
            .from('users_profile')
            .update({ pc_machine_id: currentMachineId })
            .eq('user_id', authData.user.id);

          if (error) {
            return { allowed: false, reason: '기기 등록에 실패했습니다.', profile };
          }
          profile.pc_machine_id = currentMachineId;
        }

        // 등록된 기기와 다른 기기 → 차단
        if (profile.pc_machine_id !== currentMachineId) {
          return {
            allowed: false,
            reason: '등록된 본인의 컴퓨터(1대)에서만 실행할 수 있습니다.\n기기 변경은 선생님께 문의하세요.',
            profile,
          };
        }
      }
    } else {
      // 웹사이트: 외부 구매자 차단
      if (profile.user_type === '외부구매자') {
        return {
          allowed: false,
          reason: '외부 구매자는 웹 이용이 제한됩니다.\n다운로드 받으신 EXE 프로그램에서 실행해 주세요.',
          profile,
        };
      }
    }

    return { allowed: true, profile };
  } catch (err) {
    console.error('[license] checkUserAccess 오류:', err);
    return { allowed: checkPaidOnly ? false : true };
  }
}

// ───────────────────── 무료 콘텐츠 여부 ─────────────────────

/**
 * TPO 1, Test 1은 무료 체험 가능 (로그인 불필요).
 */
export function isFreeContent(testType: string, testNumber: number): boolean {
  const type = String(testType).toLowerCase();
  const num = Number(testNumber);
  // TPO 1 또는 Test 1은 무료
  if ((type === 'tpo' || type === 'test') && num === 1) return true;
  // 그 외 유료
  return false;
}
