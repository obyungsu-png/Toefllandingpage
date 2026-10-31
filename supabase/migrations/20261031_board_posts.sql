-- board_posts 테이블 — 게시판 (History 옆 Board 탭)
--
-- 학생들이 질문을 올리고, 관리자가 답변(텍스트 + 선택적으로 관련 링크) 을
-- 다는 Q&A 형식의 게시판.
-- - 공개 읽기: 모두 (게스트 포함)
-- - 쓰기(질문 등록): 로그인한 사용자
-- - 수정/삭제: 작성자 본인 또는 관리자(기존 관리자 비밀번호 UI 로 보호)
-- - 답변 작성: 관리자 (실질적으로 UI 상 관리자 모드에서만 노출)

create table if not exists public.board_posts (
  id            uuid primary key default gen_random_uuid(),
  author_user_id uuid references auth.users(id) on delete set null,
  author_name   text    not null default 'anonymous',
  category      text,                                       -- Reading / Listening / Writing / Speaking / Vocabulary / General
  title         text    not null,
  body          text    not null,
  answer_body   text,                                       -- 관리자 답변 본문
  answer_link   text,                                       -- 선택: 관련 참고 링크 (유튜브/구글드라이브/블로그 등)
  answered_at   timestamptz,
  answered_by   uuid references auth.users(id) on delete set null,
  is_visible    boolean not null default true,
  view_count    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.board_posts enable row level security;

-- 읽기: 공개 (visible 만)
create policy "board_posts_public_read"
  on public.board_posts for select
  using (is_visible = true);

-- 삽입: 로그인한 사용자
create policy "board_posts_authenticated_insert"
  on public.board_posts for insert
  to authenticated
  with check (true);

-- 수정: 작성자 본인 또는 (관리자 UI 를 통한) authenticated — study_materials 와 동일 모델
create policy "board_posts_authenticated_update"
  on public.board_posts for update
  to authenticated
  using (true);

-- 삭제: authenticated — 관리자 UI 로만 접근 가능
create policy "board_posts_authenticated_delete"
  on public.board_posts for delete
  to authenticated
  using (true);

create index if not exists idx_board_posts_created
  on public.board_posts(created_at desc);
create index if not exists idx_board_posts_visible_created
  on public.board_posts(is_visible, created_at desc);

-- updated_at 자동 갱신
create or replace function public.tg_board_posts_touch()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists board_posts_touch on public.board_posts;
create trigger board_posts_touch
  before update on public.board_posts
  for each row execute function public.tg_board_posts_touch();

-- 샘플 1건 — 게시판이 비어 있을 때만 자동 등록 (관리자가 자료 올리면 중복 X)
insert into public.board_posts (
  author_name, category, title, body,
  answer_body, answer_link, answered_at
)
select
  '관리자',
  'General',
  '[공지] 게시판 사용 안내',
  '궁금한 점을 자유롭게 질문해 주세요.' || E'\n\n' ||
  '• 질문 등록은 로그인 후 가능합니다.' || E'\n' ||
  '• 답변은 담당 선생님이 확인 후 달아드립니다.' || E'\n' ||
  '• 과거 질문/답변은 모두에게 공개됩니다 — 비슷한 궁금증이 있을 때 참고하세요.',
  '게시판에 올라온 모든 질문은 수업 자료 또는 관련 영상 링크와 함께 답변드립니다.' || E'\n' ||
  '우측 상단 "질문하기" 버튼으로 작성해 주세요.',
  null,
  now()
where not exists (select 1 from public.board_posts);
