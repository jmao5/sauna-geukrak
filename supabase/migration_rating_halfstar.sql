-- 1. 기존 check 제약 조건 제거
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;

-- 2. 컬럼 데이터 타입을 numeric(2, 1)로 변경하여 0.5점 단위의 실수형 평점을 저장할 수 있도록 조치 (기존 정수 데이터 보존)
ALTER TABLE public.reviews ALTER COLUMN rating TYPE numeric(2, 1);

-- 3. 새로운 check 제약 조건 추가 (0.5점 ~ 5.0점)
ALTER TABLE public.reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 0.5 AND rating <= 5);
