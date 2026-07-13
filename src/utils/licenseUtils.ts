import { supabase } from './supabase/client';

// ───────────────────── 타입 ─────────────────────

export interface UserProfile {
  user_id: string;
  expire_date: string;
  user_type: '내학생' | '외부구매자';
  pc_machine_id?: string | null;
  tablet_machine_id?: string | null;
  mobile_machine_id?: string | null;
}

export type DeviceType = 'PC' | 'TABLET' | 'MOBILE' | 'WEB';

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

/** 현재 접속 기기 타입 판별 (PC / TABLET / MOBILE / WEB) */
export function getDeviceType(): DeviceType {
  // 1. Electron EXE 환경 → PC
  if (isElectronEnv()) return 'PC';

  // 2. 모바일/태블릿 환경
  const ua = navigator.userAgent.toLowerCase();
  const isMobileOrTablet = /android|iphone|ipad|ipod/.test(ua);

  if (isMobileOrTablet) {
    // 화면 가로 768px 이상 → 태블릿, 미만 → 핸드폰
    return window.innerWidth >= 768 ? 'TABLET' : 'MOBILE';
  }

  // 3. 일반 웹 브라우저
  return 'WEB';
}

/** 모바일/태블릿/웹용 기기 ID (localStorage 기반 UUID, 최초 1회 생성) */
function getWebDeviceId(): string {
  const KEY = 'amx_device_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage 접근 불가 (시크릿모드 등) → 1회성 UUID
    return crypto.randomUUID();
  }
}

/** 현재 기기의 고유 ID (모든 플랫폼 통합) */
async function getDeviceUniqueId(): Promise<string | null> {
  const deviceType = getDeviceType();
  if (deviceType === 'PC') {
    return await getMachineId();
  }
  return getWebDeviceId();
}

function getDeviceIdColumn(deviceType: DeviceType): 'pc_machine_id' | 'tablet_machine_id' | 'mobile_machine_id' {
  if (deviceType === 'TABLET') return 'tablet_machine_id';
  if (deviceType === 'MOBILE') return 'mobile_machine_id';
  return 'pc_machine_id';
}

function getDeviceName(deviceType: DeviceType): string {
  if (deviceType === 'TABLET') return '태블릿';
  if (deviceType === 'MOBILE') return '핸드폰';
  return '컴퓨터';
}

function getRegisteredDeviceIds(profile: UserProfile): string[] {
  return [profile.pc_machine_id, profile.tablet_machine_id, profile.mobile_machine_id]
    .filter((id): id is string => !!id);
}

/** 만료일 계산 (오늘 + N개월) */
export function calcExpireDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// ───────────────────── 프로필 조회 ─────────────────────

/** 현재 로그인 사용자의 프로필 조회 (5분 캐싱) */
const _profileCache = new Map<string, { profile: UserProfile; at: number }>();
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5분

export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  let currentUserId = userId;

  if (!currentUserId) {
    // getSession()은 로컬 세션만 읽으므로 네트워크 지연 없음
    const { data: { session } } = await supabase.auth.getSession();
    currentUserId = session?.user?.id;
  }

  if (!currentUserId) return null;

  // 캐시 확인
  const cached = _profileCache.get(currentUserId);
  if (cached && Date.now() - cached.at < PROFILE_CACHE_TTL) {
    return cached.profile;
  }

  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .eq('user_id', currentUserId)
    .maybeSingle();

  if (error || !data) return null;
  const profile = data as UserProfile;
  _profileCache.set(currentUserId, { profile, at: Date.now() });
  return profile;
}

/** 프로필 캐시 무효화 (활성화/로그아웃 시 호출) */
export function invalidateUserProfileCache(userId?: string) {
  if (userId) _profileCache.delete(userId);
  else _profileCache.clear();
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

    // 4. 모든 권한은 최초 활성화한 기기 1대에 묶음
    const deviceType = getDeviceType();
    const deviceId = await getDeviceUniqueId();
    if (!deviceId) {
      return { success: false, message: '기기 정보를 확인할 수 없습니다. 프로그램을 다시 실행해 주세요.' };
    }

    // 5. 프로필 upsert (기기 타입에 따라 맞는 컬럼에 ID 자동 저장)
    const upsertPayload: Record<string, any> = {
      user_id: authData.user.id,
      email: authData.user.email || '',
      signup_method: authData.user.app_metadata?.provider || 'email',
      expire_date: expireDate,
      user_type: keyData.user_type,
    };
    const deviceColumn = getDeviceIdColumn(deviceType);
    upsertPayload[deviceColumn] = deviceId;

    const { error: profileError } = await supabase
      .from('users_profile')
      .upsert(upsertPayload, { onConflict: 'user_id' });

    if (profileError) {
      return { success: false, message: '프로필 등록 중 오류가 발생했습니다.' };
    }

    // 6. 코드 사용 처리
    await supabase
      .from('license_keys')
      .update({
        is_used: true,
        assigned_user_id: authData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq('key_code', inputKeyCode.trim());

    // 프로필 캐시 무효화 (활성화로 프로필이 변경되었으므로)
    invalidateUserProfileCache(authData.user.id);

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
    // 1. 로그인 여부 — getSession()은 로컬 세션만 읽으므로 네트워크 지연 없음
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        allowed: checkPaidOnly ? false : true,
        reason: checkPaidOnly ? '로그인이 필요한 서비스입니다.' : undefined,
      };
    }

    // 2. 프로필 조회 + 기기 ID를 병렬로 실행 (네트워크 호출 1회 + 로컬)
    const currentDevice = getDeviceType();
    const [profile, currentDeviceId] = await Promise.all([
      getUserProfile(session.user.id),
      getDeviceUniqueId(),
    ]);

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

    // 4. 모든 사용자는 최초 등록된 기기 1대에서만 이용 가능
    if (!currentDeviceId) {
      return {
        allowed: false,
        reason: '기기 정보를 확인할 수 없습니다. 프로그램을 다시 실행해 주세요.',
        profile,
      };
    }

    const registeredIds = getRegisteredDeviceIds(profile);
    const currentDeviceColumn = getDeviceIdColumn(currentDevice);

    // 기존 활성화 사용자 중 기기 ID가 비어 있던 경우: 현재 기기를 최초 등록 기기로 자동 고정
    if (registeredIds.length === 0) {
      const { error: bindError } = await supabase
        .from('users_profile')
        .update({ [currentDeviceColumn]: currentDeviceId })
        .eq('user_id', session.user.id);

      if (bindError) {
        return {
          allowed: false,
          reason: '기기 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          profile,
        };
      }

      return {
        allowed: true,
        profile: {
          ...profile,
          [currentDeviceColumn]: currentDeviceId,
        } as UserProfile,
      };
    }

    if (!registeredIds.includes(currentDeviceId)) {
      return {
        allowed: false,
        reason: `등록된 ${getDeviceName(currentDevice)} 1대에서만 실행할 수 있습니다.\n기기 변경은 선생님께 문의하세요.`,
        profile,
      };
    }

    return { allowed: true, profile };
  } catch (err) {
    console.error('[license] checkUserAccess 오류:', err);
    return { allowed: false, reason: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
}

// ───────────────────── 무료 콘텐츠 여부 ─────────────────────

/**
 * TPO 1, Test 1은 무료 체험 가능 (로그인 불필요).
 */
export function isFreeContent(testType: string, testNumber: number): boolean {
  const type = String(testType).toLowerCase();
  const num = Number(testNumber);
  // TPO 1-3, Test 1-3은 무료
  if ((type === 'tpo' || type === 'test') && num <= 3) return true;
  // 그 외 유료
  return false;
}
