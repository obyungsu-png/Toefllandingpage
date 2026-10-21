-- study_materials 샘플 자료 1건 — 자료방이 비어 있을 때만 1건 자동 추가
--
-- 관리자/학생이 처음 자료방을 열었을 때 "어떤 식으로 자료가 보이는지" 바로 체감할 수
-- 있도록, 테이블이 완전히 비어 있을 때만 샘플 PDF 1건을 삽입함.
-- 샘플 PDF 파일(sample-toefl-guide.pdf) 은 /public/materials/ 에 포함되어
-- 빌드/배포에 그대로 포함됨 — 외부 저장소 의존 없음.
--
-- 관리자가 자료를 1건이라도 추가하면 더 이상 이 샘플은 자동 추가되지 않으며,
-- 기존 샘플이 남아있다면 "편집" 또는 "삭제" 로 자유롭게 정리 가능.

insert into public.study_materials (order_num, title, description, download_url, link_label, category, is_visible)
select
  1,
  '[예시] TOEFL iBT 시험 안내 가이드',
  '자료방이 어떻게 보이는지 체감할 수 있도록 올린 샘플 자료입니다.' || E'\n' ||
  '관리자는 상단 "자료 추가" 버튼으로 자유롭게 자료를 올리고,' || E'\n' ||
  '필요 없으면 이 샘플을 삭제하셔도 됩니다.',
  '/materials/sample-toefl-guide.pdf',
  '다운로드',
  'General',
  true
where not exists (select 1 from public.study_materials);
