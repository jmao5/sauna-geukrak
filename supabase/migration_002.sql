-- ==========================================
-- 마이그레이션 002: gender 필드 정비 + 소셜 (review_likes)
-- Supabase SQL Editor 에서 실행하세요.
-- ==========================================

-- ── 1. saunas: sauna_rooms / cold_baths gender 기본값 backfill ──
-- 기존 데이터에 gender 없는 항목은 'male'로 채워줌 (jsonb array update)
update public.saunas
set sauna_rooms = (
  select jsonb_agg(
    case
      when room ? 'gender' then room
      else room || '{"gender":"male"}'::jsonb
    end
  )
  from jsonb_array_elements(sauna_rooms) as room
)
where jsonb_array_length(sauna_rooms) > 0;

update public.saunas
set cold_baths = (
  select jsonb_agg(
    case
      when bath ? 'gender' then bath
      else bath || '{"gender":"male"}'::jsonb
    end
  )
  from jsonb_array_elements(cold_baths) as bath
)
where jsonb_array_length(cold_baths) > 0;

-- ── 2. review_likes 테이블 ──
create table if not exists public.review_likes (
  review_id uuid references public.reviews(id) on delete cascade not null,
  user_id   uuid references public.users(id)   on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  primary key (review_id, user_id)
);

-- ── 3. reviews: like_count 집계 컬럼 ──
alter table public.reviews add column if not exists like_count int not null default 0;

-- 좋아요 수 자동 갱신 트리거
create or replace function public.refresh_review_like_count()
returns trigger as $$
begin
  update public.reviews
  set like_count = (
    select count(*) from public.review_likes
    where review_id = coalesce(new.review_id, old.review_id)
  )
  where id = coalesce(new.review_id, old.review_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create or replace trigger trg_refresh_review_like_count
  after insert or delete on public.review_likes
  for each row execute procedure public.refresh_review_like_count();

-- ── 4. RLS ──
alter table public.review_likes enable row level security;

create policy "좋아요 누구나 조회"
  on public.review_likes for select using (true);

create policy "좋아요 본인 이름으로만"
  on public.review_likes for insert
  with check (auth.uid() = user_id);

create policy "좋아요 취소는 본인만"
  on public.review_likes for delete
  using (auth.uid() = user_id);

-- ── 5. 인덱스 ──
create index if not exists review_likes_review_idx on public.review_likes(review_id);
create index if not exists review_likes_user_idx   on public.review_likes(user_id);
