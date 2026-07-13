-- reading_highlights 테이블 — 리딩 review 하이라이트/밑줄 저장 (데이터 최소화)
create table if not exists public.reading_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  test_id text not null,
  passage_key text not null,
  start_offset integer not null,
  end_offset integer not null,
  type char(1) not null default 'h', -- 'h'=highlight, 'u'=underline
  created_at timestamptz not null default now(),
  expires_at timestamptz not null -- 수강권 만료일 (필수)
);

alter table public.reading_highlights enable row level security;

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

create index if not exists idx_reading_highlights_user on public.reading_highlights(user_id);
create index if not exists idx_reading_highlights_test on public.reading_highlights(test_id, passage_key);

-- 만료된 하이라이트 자동 삭제 함수
create or replace function public.delete_expired_highlights()
returns void as $$
begin
  delete from public.reading_highlights where expires_at < now();
end;
$$ language plpgsql;
