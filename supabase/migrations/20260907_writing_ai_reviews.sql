-- writing_ai_reviews 테이블 — TPO Writing Review의 AI 첨삭 결과를
-- 회원 유료 기간 동안 Supabase에 보관하기 위한 테이블.
--
-- 지금까지는 localStorage에만 device-local로 저장돼 브라우저를 지우거나
-- 다른 기기에서 로그인하면 첨삭이 사라졌다. 이제 유료 회원의 첨삭 결과를
-- 서버에 upsert 하여 다른 기기·브라우저에서도 그대로 이어볼 수 있게 한다.
-- 만료일(expires_at)이 지난 레코드는 자동 삭제(하단 함수)로 정리한다.

create table if not exists public.writing_ai_reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  writing_type  text not null,             -- 'email' | 'discussion'
  answer_hash   text not null,             -- 답안 원문 FNV-1a 해시 (dedup 키)
  answer_preview text,                     -- 첫 240자 (History 표시용)
  payload       jsonb not null,            -- { analysis, semanticHighlights, upgradeSuggestions }
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  expires_at    timestamptz not null,      -- users_profile.expire_date 기반
  constraint writing_ai_reviews_type_check check (writing_type in ('email', 'discussion')),
  unique (user_id, writing_type, answer_hash)
);

alter table public.writing_ai_reviews enable row level security;

create policy "Users can view own writing ai reviews"
  on public.writing_ai_reviews for select
  using (auth.uid() = user_id);

create policy "Users can insert own writing ai reviews"
  on public.writing_ai_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own writing ai reviews"
  on public.writing_ai_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own writing ai reviews"
  on public.writing_ai_reviews for delete
  using (auth.uid() = user_id);

create index if not exists idx_writing_ai_reviews_user
  on public.writing_ai_reviews(user_id);
create index if not exists idx_writing_ai_reviews_user_type_updated
  on public.writing_ai_reviews(user_id, writing_type, updated_at desc);

-- updated_at 자동 갱신 트리거
create or replace function public.tg_writing_ai_reviews_touch()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists writing_ai_reviews_touch on public.writing_ai_reviews;
create trigger writing_ai_reviews_touch
  before update on public.writing_ai_reviews
  for each row execute function public.tg_writing_ai_reviews_touch();

-- 만료된 레코드 자동 삭제 (스케줄러/cron에서 호출)
create or replace function public.delete_expired_writing_ai_reviews()
returns void as $$
begin
  delete from public.writing_ai_reviews where expires_at < now();
end;
$$ language plpgsql;
