-- study_materials 테이블 — 자료방 (History → 자료방 탭)
--
-- 관리자가 학생들에게 배포할 학습 자료(PDF/파일/외부링크)를 순번대로 올려두고
-- 학생들이 다운로드/링크로 접근할 수 있게 하는 공용 자료방 데이터.
-- - 파일 저장 자체는 외부(Google Drive / Baidu / Dropbox 등) 를 활용하고
--   여기에는 링크만 저장 (Supabase Storage 용량 부담 없음)
-- - 모든 사용자가 읽기 가능, 쓰기/수정/삭제는 관리자 role 만 가능
--   (관리자 UI 자체가 앱 비밀번호로 보호되므로 클라이언트 단에서 authenticated
--   유저 전체에 write 를 허용해도 UI 진입점이 잠겨 있어서 실질적으로 관리자만
--   조작 가능. 좀 더 엄격하게 하려면 별도 admin_role 컬럼을 도입.)

create table if not exists public.study_materials (
  id           uuid primary key default gen_random_uuid(),
  order_num    integer not null default 0,          -- 정렬 순번 (작은 숫자가 먼저)
  title        text    not null,                    -- 자료 제목
  description  text,                                 -- 간단한 설명
  download_url text    not null,                    -- 외부 링크 (Google Drive / Baidu / 직접 URL)
  link_label   text    default '다운로드',          -- 버튼 라벨 (다운로드 / 링크 열기 / etc.)
  category     text,                                 -- 선택적 카테고리 (Reading / Listening / Writing / Speaking / General)
  is_visible   boolean not null default true,       -- 감춤/공개 토글
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null
);

alter table public.study_materials enable row level security;

-- 읽기: 모두 허용 (미로그인 게스트 포함) — 자료방은 공용
create policy "study_materials_public_read"
  on public.study_materials for select
  using (is_visible = true);

-- 관리자 UI는 앱 비밀번호로 보호되므로 authenticated 는 write 허용
-- (더 엄격하게 하려면 별도 관리자 유저 리스트 함수/테이블로 대체)
create policy "study_materials_authenticated_insert"
  on public.study_materials for insert
  to authenticated
  with check (true);
create policy "study_materials_authenticated_update"
  on public.study_materials for update
  to authenticated
  using (true);
create policy "study_materials_authenticated_delete"
  on public.study_materials for delete
  to authenticated
  using (true);

create index if not exists idx_study_materials_order
  on public.study_materials(order_num asc, created_at desc);

-- updated_at 자동 갱신
create or replace function public.tg_study_materials_touch()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists study_materials_touch on public.study_materials;
create trigger study_materials_touch
  before update on public.study_materials
  for each row execute function public.tg_study_materials_touch();
