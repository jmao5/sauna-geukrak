-- ==========================================
-- Migration: 인스타그램 미디어 & 내부 모형도 컬럼 추가
-- 실행: Supabase SQL Editor에서 실행하세요
-- ==========================================

-- 1. saunas 테이블에 instagram_media 컬럼 추가
--    instagram_media: [{url, type, caption?}] 형태의 JSONB 배열
ALTER TABLE public.saunas
  ADD COLUMN IF NOT EXISTS instagram_media jsonb DEFAULT '[]'::jsonb;

-- 2. saunas 테이블에 floor_plan_images 컬럼 추가
--    floor_plan_images: 모형도/도면 이미지 URL 배열
ALTER TABLE public.saunas
  ADD COLUMN IF NOT EXISTS floor_plan_images text[] DEFAULT '{}'::text[];

-- 3. 기존 데이터 기본값 보정 (null 방지)
UPDATE public.saunas
  SET instagram_media = '[]'::jsonb
  WHERE instagram_media IS NULL;

UPDATE public.saunas
  SET floor_plan_images = '{}'::text[]
  WHERE floor_plan_images IS NULL;

-- 4. instagram_media 유효성 검사 constraint (선택 — 운영 환경에서만 적용)
-- ALTER TABLE public.saunas
--   ADD CONSTRAINT instagram_media_is_array
--   CHECK (jsonb_typeof(instagram_media) = 'array');

-- ==========================================
-- Storage Policy: floor-plans 경로 허용
-- (sauna-geukrak 버킷 정책에 추가)
-- ==========================================

-- 이미 존재하는 버킷 정책이 있다면 아래는 스킵해도 됩니다.
-- floor-plans/ 경로도 기존 sauna-geukrak 버킷을 그대로 사용합니다.
-- 별도 버킷 생성은 필요 없습니다.

-- 확인 쿼리
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'saunas'
  AND column_name IN ('instagram_media', 'floor_plan_images');

-- ==========================================
-- Migration: 위치 기반 조회 성능 최적화 인덱스
-- 실행: Supabase SQL Editor에서 실행하세요
-- ==========================================

-- 1. latitude + longitude 복합 인덱스
--    getSaunasByLocation의 바운딩 박스 필터 (.gte/.lte) 속도 향상
CREATE INDEX IF NOT EXISTS idx_saunas_lat_lng
  ON public.saunas (latitude, longitude);

-- 2. created_at 인덱스
--    .order('created_at', { ascending: false }) 속도 향상
CREATE INDEX IF NOT EXISTS idx_saunas_created_at
  ON public.saunas (created_at DESC);

-- 3. 인덱스 생성 확인 쿼리
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'saunas'
  AND indexname IN ('idx_saunas_lat_lng', 'idx_saunas_created_at');
