-- reading_highlights 테이블 — 리딩 review 하이라이트/밑줄 저장
create table if not exists public.reading_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  test_id text not null,
  passage_key text not null,
  selected_text text not null,
  type text not null default 'highlight', -- 'highlight' | 'underline'
  start_offset integer,
  end_offset integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz -- 수강권 만료일 (null이면 만료 없음)
);

-- RLS 활성화
alter table public.reading_highlights enable row level security;

-- 사용자는 자신의 하이라이트만 조회/수정/삭제 가능
create policy "Users can view own highlights"
  on public.reading_highlights for select
  using (auth.uid() = user_id);

create policy "Users can insert own highlights"
  on public.reading_highlights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own highlights"
  on public.reading_highlights for update
  using (auth.uid() = user_id);

create policy "Users can delete own highlights"
  on public.reading_highlights for delete
  using (auth.uid() = user_id);

-- expires_at이 지난 하이라이트 자동 삭제 (cron job용)
-- pg_cron 확장이 있는 경우 아래 주석 해제
-- select cron.schedule('delete-expired-highlights', '0 3 * * *', 'delete from public.reading_highlights where expires_at is not null and expires_at < now();');

-- 인덱스
create index if not exists idx_reading_highlights_user on public.reading_highlights(user_id);
create index if not exists idx_reading_highlights_test on public.reading_highlights(test_id, passage_key);
