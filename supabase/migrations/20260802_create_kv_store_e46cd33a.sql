-- kv_store_e46cd33a 테이블 생성 (xmdf 프로젝트 삭제 시 누락된 가장 중요한 테이블)
-- Toefllandingpage의 make-server-e46cd33a Edge Function이 의존하는 핵심 KV 저장소
-- 저장 데이터: TPO/Test/Training 콘텐츠, 어휘 데이터, 커스텀 사용자 계정, 광고 데이터 등

CREATE TABLE IF NOT EXISTS public.kv_store_e46cd33a (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE public.kv_store_e46cd33a DISABLE ROW LEVEL SECURITY;

-- 인덱스 (키 prefix 검색용)
CREATE INDEX IF NOT EXISTS idx_kv_store_e46cd33a_key ON public.kv_store_e46cd33a(key);
