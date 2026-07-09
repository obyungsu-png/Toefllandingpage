-- =============================================
-- 라이선스 시스템: 활성화 코드 + 사용자 프로필
-- =============================================

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS public.users_profile (
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    expire_date     DATE NOT NULL,
    user_type       TEXT NOT NULL DEFAULT '외부구매자' CHECK (user_type IN ('내학생', '외부구매자')),
    pc_machine_id   TEXT,
    mobile_machine_id TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. 활성화 코드(라이선스 키) 테이블
CREATE TABLE IF NOT EXISTS public.license_keys (
    key_code          TEXT PRIMARY KEY,
    duration_months   INT NOT NULL CHECK (duration_months > 0),
    user_type         TEXT NOT NULL DEFAULT '외부구매자' CHECK (user_type IN ('내학생', '외부구매자')),
    is_used           BOOLEAN DEFAULT FALSE,
    assigned_user_id  UUID REFERENCES auth.users(id),
    used_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS 활성화
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 본인 프로필만 읽기/쓰기 가능
CREATE POLICY "users can read own profile" ON public.users_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can upsert own profile" ON public.users_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own profile" ON public.users_profile
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. 라이선스 키: 누구나 사용 안 된 키 조회 가능 (활성화 검증용)
CREATE POLICY "anyone can read unused license keys" ON public.license_keys
    FOR SELECT USING (is_used = FALSE);

-- 라이선스 키 사용 처리: 인증된 사용자만
CREATE POLICY "authenticated can update license keys" ON public.license_keys
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 6. 인덱스
CREATE INDEX IF NOT EXISTS idx_license_keys_unused ON public.license_keys(is_used) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_users_profile_expire ON public.users_profile(expire_date);
