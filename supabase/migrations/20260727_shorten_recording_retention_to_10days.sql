-- 20260727_shorten_recording_retention_to_10days.sql
-- 목적: 기존 speaking_recordings 테이블의 보관기간을 30일 → 10일로 단축
--
-- 배경:
--   - 기존 expires_at 기본값: now() + interval '30 days'
--   - 신규 업로드는 애플리케이션 코드(uploadRecording.ts)에서 10일로 설정하도록 변경됨
--   - 하지만 이미 DB에 저장된 기존 행들은 여전히 30일 만료 시점을 가짐
--   - 이 마이그레이션은 기존 행들의 만료 시점을 10일로 앞당겨 정책을 일관되게 적용
--
-- 주의: 이 스크립트는 실행 즉시 기존 행들의 expires_at을 created_at 기준 10일로 재계산.
--       이미 10일이 지난 행은 즉시 만료(cleanup-recordings 함수가 다음 실행 시 삭제).

-- 1. 기본값을 10일로 변경 (이미 20250609 마이그레이션에서 변경되었으나 안전장치로 재설정)
alter table public.speaking_recordings
  alter column expires_at set default (now() + interval '10 days');

-- 2. 기존 행들의 expires_at을 created_at + 10일로 재계산
--    (이미 10일 이상 지난 행은 과거 시점이 되어 즉시 만료)
update public.speaking_recordings
  set expires_at = created_at + interval '10 days';

-- 3. 이미 만료된 행 삭제 (선택 사항 — cleanup-recordings Edge Function이 처리하긴 하지만
--    즉시 정리를 원할 경우 아래 주석 해제)
-- delete from public.speaking_recordings
--   where expires_at < now();

-- 4. 검증용 쿼리 (수동 실행용)
-- select
--   count(*) as total_rows,
--   count(*) filter (where expires_at < now()) as expired_rows,
--   min(expires_at) as earliest_expiry,
--   max(expires_at) as latest_expiry
-- from public.speaking_recordings;
