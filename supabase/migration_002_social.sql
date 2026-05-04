-- ==========================================
-- Migration 002: 소셜 기능 컬럼 추가
-- 기존 DB에 schema.sql 전체 재실행이 어려울 때
-- 이 파일만 Supabase SQL Editor에서 실행하세요.
-- ==========================================

-- reviews 테이블에 집계 컬럼 추가
alter table public.reviews
  add column if not exists like_count    int not null default 0,
  add column if not exists comment_count int not null default 0;

-- users 테이블에 팔로우 집계 컬럼 추가
alter table public.users
  add column if not exists follower_count  int not null default 0,
  add column if not exists following_count int not null default 0;

-- review_likes 테이블
create table if not exists public.review_likes (
  review_id  uuid references public.reviews(id) on delete cascade not null,
  user_id    uuid references public.users(id)   on delete cascade not null,
  created_at timestamptz default timezone('utc', now()) not null,
  primary key (review_id, user_id)
);
create index if not exists review_likes_user_idx on public.review_likes(user_id);

-- review_comments 테이블
create table if not exists public.review_comments (
  id         uuid default gen_random_uuid() primary key,
  review_id  uuid references public.reviews(id) on delete cascade not null,
  user_id    uuid references public.users(id)   on delete cascade not null,
  content    text not null check (char_length(content) <= 500),
  created_at timestamptz default timezone('utc', now()) not null
);
create index if not exists review_comments_review_idx on public.review_comments(review_id, created_at asc);
create index if not exists review_comments_user_idx   on public.review_comments(user_id);

-- follows 테이블
create table if not exists public.follows (
  follower_id  uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at   timestamptz default timezone('utc', now()) not null,
  primary key  (follower_id, following_id),
  check        (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows(following_id);
create index if not exists follows_follower_idx  on public.follows(follower_id);

-- RLS 활성화
alter table public.review_likes    enable row level security;
alter table public.review_comments enable row level security;
alter table public.follows         enable row level security;

-- RLS 정책
create policy "좋아요 조회"   on public.review_likes    for select using (true);
create policy "좋아요 추가"   on public.review_likes    for insert with check (auth.uid() = user_id);
create policy "좋아요 삭제"   on public.review_likes    for delete using (auth.uid() = user_id);

create policy "댓글 조회"     on public.review_comments for select using (true);
create policy "댓글 작성"     on public.review_comments for insert with check (auth.uid() = user_id);
create policy "댓글 삭제"     on public.review_comments for delete using (auth.uid() = user_id);

create policy "팔로우 조회"   on public.follows         for select using (true);
create policy "팔로우 추가"   on public.follows         for insert with check (auth.uid() = follower_id);
create policy "팔로우 삭제"   on public.follows         for delete using (auth.uid() = follower_id);

-- like_count 자동 갱신 트리거
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

create or replace trigger trg_refresh_like_count
  after insert or delete on public.review_likes
  for each row execute procedure public.refresh_review_like_count();

-- comment_count 자동 갱신 트리거
create or replace function public.refresh_review_comment_count()
returns trigger as $$
begin
  update public.reviews
  set comment_count = (
    select count(*) from public.review_comments
    where review_id = coalesce(new.review_id, old.review_id)
  )
  where id = coalesce(new.review_id, old.review_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create or replace trigger trg_refresh_comment_count
  after insert or delete on public.review_comments
  for each row execute procedure public.refresh_review_comment_count();

-- follower/following_count 자동 갱신 트리거
create or replace function public.refresh_follow_counts()
returns trigger as $$
declare
  t_following_id uuid := coalesce(new.following_id, old.following_id);
  t_follower_id  uuid := coalesce(new.follower_id,  old.follower_id);
begin
  update public.users
  set follower_count  = (select count(*) from public.follows where following_id = t_following_id)
  where id = t_following_id;

  update public.users
  set following_count = (select count(*) from public.follows where follower_id = t_follower_id)
  where id = t_follower_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create or replace trigger trg_refresh_follow_counts
  after insert or delete on public.follows
  for each row execute procedure public.refresh_follow_counts();
