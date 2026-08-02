-- reports 테이블 생성 (xmdf 삭제 시 누락된 테이블)
-- StudentManagement.tsx에서 .from('reports').select('*', { count: 'exact', head: true }).eq('user_id', ...) 로 사용됨

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  test_type text,
  test_number integer,
  section_type text,
  score integer,
  total_questions integer,
  correct_answers integer,
  answers jsonb,
  time_spent integer,
  created_at timestamptz not null default now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 본인 reports만 조회 가능
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

-- 인증된 사용자는 본인 reports 생성 가능
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 인증된 사용자는 본인 reports 수정 가능
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

-- 인증된 사용자는 본인 reports 삭제 가능
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
CREATE POLICY "Users can delete own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
