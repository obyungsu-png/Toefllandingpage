-- speaking_recordings: store student recording URLs for 30-day review
-- session_id = localStorage UUID per browser (anonymous user identifier)

create table if not exists public.speaking_recordings (
  id              uuid primary key default gen_random_uuid(),
  session_id      text        not null,  -- browser localStorage UUID
  test_type       text        not null,  -- 'TPO', 'Test', etc.
  test_number     integer     not null,
  question_number integer     not null,
  recording_url   text        not null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '30 days')
);

-- Unique constraint for upsert (one recording per Q per test per session)
alter table public.speaking_recordings
  add constraint uq_speaking_recording
  unique (session_id, test_type, test_number, question_number);

-- Index for fast lookup by session + test
create index if not exists idx_speaking_recordings_lookup
  on public.speaking_recordings (session_id, test_type, test_number);

-- Auto-delete expired rows (requires pg_cron extension)
-- Run separately if pg_cron is enabled:
-- select cron.schedule('delete-expired-recordings', '0 4 * * *',
--   $$delete from public.speaking_recordings where expires_at < now()$$);

-- RLS: anyone can insert/select their own rows (anon key)
alter table public.speaking_recordings enable row level security;

create policy "anon insert"
  on public.speaking_recordings for insert
  to anon with check (true);

create policy "anon select own"
  on public.speaking_recordings for select
  to anon using (true);

create policy "anon delete own"
  on public.speaking_recordings for delete
  to anon using (expires_at < now());
