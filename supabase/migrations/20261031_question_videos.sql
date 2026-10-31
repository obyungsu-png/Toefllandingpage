-- question_videos — 각 TPO/Test/Training 문제별 선생님 영상 강의 링크
--
-- 설계 요점
-- • 영상 파일은 YouTube / Bilibili 에 호스팅, 여기엔 URL 문자열만 저장
--   → Supabase 용량 거의 안 씀 (영상 1건당 약 0.5KB)
-- • 하나의 "문제" 를 식별하는 canonical key : "<family>:<testNo>:<section>:<Q번호>"
--     family  = tpo | test | training
--     section = reading | listening | writing | speaking
--     예시    = tpo:3:reading:4   /   test:5:listening:12
-- • 유튜브/빌리빌리 URL 둘 다 받고 (하나 이상 필수), 재생기에서 탭 노출
-- • is_visible = false 로 숨김 처리 가능 (관리자만 보임)

create table if not exists public.question_videos (
  id            uuid primary key default gen_random_uuid(),
  question_key  text    not null unique,            -- canonical key (중복 금지)
  title         text,                                -- 선택 (영상 제목 — 빈값이면 key 로 자동 표시)
  youtube_url   text,
  bilibili_url  text,
  start_sec     integer not null default 0,         -- 재생 시작 초 (0 = 처음부터)
  note          text,                                -- 관리자 메모
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id) on delete set null,
  -- 최소 하나의 URL 은 반드시 있어야 함
  constraint question_videos_has_url
    check (youtube_url is not null or bilibili_url is not null),
  -- 둘 중 아무 URL 이든 공백 문자열은 null 로 통일하기 위한 가드
  constraint question_videos_youtube_nonempty
    check (youtube_url is null or length(trim(youtube_url)) > 0),
  constraint question_videos_bilibili_nonempty
    check (bilibili_url is null or length(trim(bilibili_url)) > 0)
);

alter table public.question_videos enable row level security;

-- 읽기 : 모두 (visible 만) — 영상 접근 게이트는 클라이언트 쪽에서 10일 무료/수강권 체크
create policy "question_videos_public_read"
  on public.question_videos for select
  using (is_visible = true);

-- 쓰기/수정/삭제 : authenticated (study_materials / board_posts 와 동일 보안 모델 —
-- 관리자 UI 자체가 비밀번호로 잠겨있어서 실질적으로 관리자만 접근)
create policy "question_videos_authenticated_insert"
  on public.question_videos for insert
  to authenticated
  with check (true);
create policy "question_videos_authenticated_update"
  on public.question_videos for update
  to authenticated
  using (true);
create policy "question_videos_authenticated_delete"
  on public.question_videos for delete
  to authenticated
  using (true);

create index if not exists idx_question_videos_key
  on public.question_videos(question_key);
create index if not exists idx_question_videos_visible
  on public.question_videos(is_visible, question_key);

-- updated_at 자동 갱신
create or replace function public.tg_question_videos_touch()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists question_videos_touch on public.question_videos;
create trigger question_videos_touch
  before update on public.question_videos
  for each row execute function public.tg_question_videos_touch();


-- ─────────────────────────────────────────────────────────────────────
-- question_video_clicks — 영상 재생 클릭 로그 (분석용, 가벼움)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.question_video_clicks (
  id            bigserial primary key,
  question_key  text    not null,
  user_id       uuid    references auth.users(id) on delete set null,
  provider      text    not null,                   -- 'youtube' | 'bilibili'
  clicked_at    timestamptz not null default now()
);

alter table public.question_video_clicks enable row level security;

-- INSERT 는 로그인 안 해도 가능 (비회원 클릭도 집계 — user_id 는 null)
create policy "question_video_clicks_public_insert"
  on public.question_video_clicks for insert
  with check (true);

-- SELECT 는 관리자 집계용 — authenticated 로 열어둠
create policy "question_video_clicks_authenticated_read"
  on public.question_video_clicks for select
  to authenticated
  using (true);

create index if not exists idx_question_video_clicks_key_time
  on public.question_video_clicks(question_key, clicked_at desc);


-- ─────────────────────────────────────────────────────────────────────
-- board_posts.question_key — Board 질문을 특정 문제에 연결 (양방향 링크)
-- ─────────────────────────────────────────────────────────────────────
alter table public.board_posts
  add column if not exists question_key text;

create index if not exists idx_board_posts_question_key
  on public.board_posts(question_key)
  where question_key is not null;
