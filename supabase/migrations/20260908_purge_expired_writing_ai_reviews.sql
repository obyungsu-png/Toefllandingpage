-- 유료 회원 기간이 끝난 회원의 AI 첨삭을 서버측에서 완전히 정리하기 위한 함수.
--
-- 기존 delete_expired_writing_ai_reviews() 는 각 레코드의 expires_at 기준으로만
-- 삭제하지만, 학생의 수강권이 만료·해지·환불된 경우에는 이미 저장된 레코드의
-- expires_at 이 아직 미래일 수 있다 (저장 당시 기준으로 박아둔 값). 이 함수는
-- users_profile.expire_date 를 실시간 기준으로 다시 확인해 만료된 유저의 모든
-- 첨삭을 삭제한다. 재로그인 하지 않는 유저까지 커버되도록 배치(cron)에서
-- 매일 1회 실행하는 것을 권장.

create or replace function public.delete_reviews_for_expired_subscriptions()
returns integer as $$
declare
  removed integer := 0;
begin
  -- ① users_profile 에 등록되어 있으나 expire_date 가 과거인 유저의 모든 첨삭 삭제
  with del as (
    delete from public.writing_ai_reviews r
    using public.users_profile p
    where r.user_id = p.user_id
      and p.expire_date < current_date
    returning 1
  )
  select count(*) into removed from del;

  -- ② users_profile 에 아예 등록되지 않은(수강권을 한 번도 활성화한 적 없는)
  --    유저의 첨삭도 삭제 — 저장 시점의 검사가 어떤 이유로든 우회되었을 때 대비.
  with del2 as (
    delete from public.writing_ai_reviews r
    where not exists (
      select 1 from public.users_profile p where p.user_id = r.user_id
    )
    returning 1
  )
  select removed + count(*) into removed from del2;

  -- ③ 기존 per-row expires_at 기준 정리도 같은 함수 안에서 함께 수행.
  with del3 as (
    delete from public.writing_ai_reviews
    where expires_at < now()
    returning 1
  )
  select removed + count(*) into removed from del3;

  return removed;
end;
$$ language plpgsql security definer;

-- (선택) pg_cron 이 설치된 프로젝트라면 다음 SQL 로 매일 새벽 3시(UTC) 스케줄링.
--   select cron.schedule(
--     'purge-expired-writing-ai-reviews',
--     '0 3 * * *',
--     $$ select public.delete_reviews_for_expired_subscriptions(); $$
--   );

-- 특정 유저의 첨삭을 즉시 전부 삭제 (RPC로 클라이언트가 호출 가능)
-- SECURITY DEFINER + auth.uid() 체크로 본인 것만 지우도록 강제.
create or replace function public.purge_my_writing_ai_reviews()
returns integer as $$
declare
  uid uuid := auth.uid();
  removed integer := 0;
begin
  if uid is null then
    return 0;
  end if;
  with del as (
    delete from public.writing_ai_reviews where user_id = uid returning 1
  )
  select count(*) into removed from del;
  return removed;
end;
$$ language plpgsql security definer;

-- 인증된 사용자에게만 RPC 실행 권한 부여
revoke all on function public.purge_my_writing_ai_reviews() from public;
grant execute on function public.purge_my_writing_ai_reviews() to authenticated;
