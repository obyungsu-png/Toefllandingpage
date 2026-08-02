-- Createlandingpage 및 TOEFL2용 kv_store 테이블 생성
-- xmdf 프로젝트 삭제 시 손실된 테이블 구조 복구

-- 1. kv_store_c33bd60b (Createlandingpage)
CREATE TABLE IF NOT EXISTS public.kv_store_c33bd60b (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
ALTER TABLE public.kv_store_c33bd60b DISABLE ROW LEVEL SECURITY;

-- 2. kv_store_toefl2 (TOEFL2 별도 분리 테이블)
CREATE TABLE IF NOT EXISTS public.kv_store_toefl2 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
ALTER TABLE public.kv_store_toefl2 DISABLE ROW LEVEL SECURITY;
