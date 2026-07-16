-- reading_highlights에 color 컬럼 추가 (밑줄/하이라이트 3색상 선택 기능)
-- 기존 데이터는 색상 정보가 없으므로 nullable로 추가하고,
-- 앱 코드에서 null인 경우 타입별 기본 색상(h=#fff3a3, u=#1e6b73)으로 대체해서 표시함.

alter table public.reading_highlights
  add column if not exists color text null;

comment on column public.reading_highlights.color is
  '하이라이트/밑줄 색상 (hex, 예: #fff3a3). null이면 프론트에서 타입별 기본색 사용';
