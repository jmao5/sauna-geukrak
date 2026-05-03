-- ==========================================
-- 마이그레이션 002: 찜 기능 강화
-- favorites 테이블에 memo, status 컬럼 추가
-- ==========================================

-- favorites에 메모 + 상태 컬럼 추가
alter table public.favorites
  add column if not exists memo text default null,
  add column if not exists status text not null default 'want'
    check (status in ('want', 'visited'));

-- status 인덱스 (미방문만 보기 필터용)
create index if not exists favorites_status_idx on public.favorites(user_id, status);
