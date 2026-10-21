-- study_materials — 자료방 사용법 샘플 1건
--
-- 자료방이 어떤 식으로 동작하는지 (학생/관리자 양쪽) 한 장짜리 PDF 로 안내.
-- public/materials/materials-room-howto.pdf 는 빌드 번들에 포함되므로 외부
-- 저장소 의존 없음.
--
-- 같은 제목의 자료가 아직 없을 때만 1건 삽입 → 재실행해도 중복 없음.
-- 관리자는 "편집" 또는 "삭제" 로 자유롭게 정리 가능.

insert into public.study_materials (order_num, title, description, download_url, link_label, category, is_visible)
select
  0,
  '[예시] 자료방 사용법 — Quick Start',
  '자료방이 어떻게 동작하는지 한 장으로 정리한 샘플 PDF 입니다.' || E'\n' ||
  '학생용 / 관리자용 사용법을 한 페이지에 담았습니다.' || E'\n' ||
  '필요 없으면 삭제하셔도 됩니다.',
  '/materials/materials-room-howto.pdf',
  '다운로드',
  'General',
  true
where not exists (
  select 1 from public.study_materials
  where title = '[예시] 자료방 사용법 — Quick Start'
);
