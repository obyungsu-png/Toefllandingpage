-- 통합 마이그레이션: xmdf에서 rpx로 테이블 통합
-- 4개 테이블 생성 + RLS 정책 + 인덱스

-- ============================================================
-- 1. license_keys (이미 테이블은 생성됨, 정책/인덱스만 추가)
-- ============================================================
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access license_keys" ON public.license_keys;
CREATE POLICY "Public access license_keys" ON public.license_keys
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anyone can create license keys" ON public.license_keys;
CREATE POLICY "anyone can create license keys" ON public.license_keys
  FOR INSERT WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS license_keys_key_code_key
  ON public.license_keys USING btree (key_code);

-- ============================================================
-- 2. speaking_recordings (이미 테이블은 생성됨, 정책/인덱스만 추가)
-- ============================================================
ALTER TABLE public.speaking_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rec_insert" ON public.speaking_recordings;
CREATE POLICY "rec_insert" ON public.speaking_recordings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rec_select" ON public.speaking_recordings;
CREATE POLICY "rec_select" ON public.speaking_recordings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rec_update" ON public.speaking_recordings;
CREATE POLICY "rec_update" ON public.speaking_recordings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_speaking_rec_lookup
  ON public.speaking_recordings USING btree (session_id, test_type, test_number);

CREATE UNIQUE INDEX IF NOT EXISTS uq_speaking_recording
  ON public.speaking_recordings USING btree (session_id, test_type, test_number, question_number);

-- ============================================================
-- 3. users_profile (이미 테이블은 생성됨, 정책만 추가)
-- ============================================================
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access" ON public.users_profile;
CREATE POLICY "Allow public access" ON public.users_profile
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access users_profile" ON public.users_profile;
CREATE POLICY "Public access users_profile" ON public.users_profile
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 4. reading_highlights 정책/인덱스 (테이블은 이미 생성됨)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own highlights" ON public.reading_highlights;
CREATE POLICY "Users can view own highlights" ON public.reading_highlights
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own highlights" ON public.reading_highlights;
CREATE POLICY "Users can insert own highlights" ON public.reading_highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own highlights" ON public.reading_highlights;
CREATE POLICY "Users can update own highlights" ON public.reading_highlights
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own highlights" ON public.reading_highlights;
CREATE POLICY "Users can delete own highlights" ON public.reading_highlights
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reading_highlights_user
  ON public.reading_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_highlights_test
  ON public.reading_highlights(test_id, passage_key);

-- 만료된 하이라이트 자동 삭제 함수
CREATE OR REPLACE FUNCTION public.delete_expired_highlights()
RETURNS void AS $$
BEGIN
  DELETE FROM public.reading_highlights WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
