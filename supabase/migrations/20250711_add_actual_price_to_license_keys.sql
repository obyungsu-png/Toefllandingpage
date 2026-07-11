-- =============================================
-- license_keys 테이블에 actual_price(실제 금액) 컬럼 추가
-- StudentManagement의 "수강권 코드 생성" 실제 금액(선택) 필드용
-- =============================================

ALTER TABLE public.license_keys
    ADD COLUMN IF NOT EXISTS actual_price INT;

COMMENT ON COLUMN public.license_keys.actual_price IS '실제 판매 금액(원). 매출 집계에 사용. NULL이면 기간·등급 기본가로 계산.';
