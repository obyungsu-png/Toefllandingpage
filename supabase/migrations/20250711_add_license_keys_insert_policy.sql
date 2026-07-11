-- license_keys 테이블에 INSERT 정책 추가
-- 배경: 최초 생성 마이그레이션(20250709)에는 SELECT/UPDATE 정책만 있고
--       INSERT 정책이 없어, 학생 관리 화면에서 수강권 코드 생성 시
--       "new row violates row-level security policy" (403) 오류가 발생함.
-- 관리자 접근은 실제 Supabase 인증이 아니라 화면단 비밀번호로 통제되므로,
-- anon 키로도 코드 생성(INSERT)이 가능하도록 정책을 연다.
-- (읽기는 is_used=FALSE만 노출되고, 활성화 시 UPDATE는 별도 정책으로 제어됨)

DROP POLICY IF EXISTS "anyone can create license keys" ON public.license_keys;

CREATE POLICY "anyone can create license keys" ON public.license_keys
    FOR INSERT WITH CHECK (true);
