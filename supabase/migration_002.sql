-- ==========================================
-- 마이그레이션 002: 소셜 기능
-- review_likes / review_comments / follows
-- Supabase SQL Editor에서 실행하세요.
-- ==========================================

-- ── 1. reviews: like_count / comment_count 집계 컬럼 ──
alter table public.reviews add column if not exists like_count    int not null default 0;
alter table public.reviews add column if not exists comment_count int not null default 0;

-- ── 2. review_likes ──────────────────────────────────────────
create table if not exists public.review_likes (
  review_id  uuid references public.reviews(id) on delete cascade not null,
  user_id    uuid references public.users(id)   on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  primary key (review_id, user_id)
);

alter table public.review_likes enable row level security;

create policy "좋아요 누구나 조회"      on public.review_likes for select using (true);
create policy "좋아요 본인 이름으로만"  on public.review_likes for insert with check (auth.uid() = user_id);
create policy "좋아요 취소는 본인만"    on public.review_likes for delete using (auth.uid() = user_id);

create index if not exists review_likes_review_idx on public.review_likes(review_id);
create index if not exists review_likes_user_idx   on public.review_likes(user_id);

-- 좋아요 수 자동 갱신
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

drop trigger if exists trg_refresh_review_like_count on public.review_likes;
create trigger trg_refresh_review_like_count
  after insert or delete on public.review_likes
  for each row execute procedure public.refresh_review_like_count();

-- ── 3. review_comments ───────────────────────────────────────
create table if not exists public.review_comments (
  id         uuid default gen_random_uuid() primary key,
  review_id  uuid references public.reviews(id) on delete cascade not null,
  user_id    uuid references public.users(id)   on delete cascade not null,
  content    text not null check (char_length(content) between 1 and 500),
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table public.review_comments enable row level security;

create policy "댓글 누구나 조회"      on public.review_comments for select using (true);
create policy "댓글 로그인 사용자만"  on public.review_comments for insert with check (auth.uid() = user_id);
create policy "댓글 삭제 본인만"      on public.review_comments for delete using (auth.uid() = user_id);

create index if not exists review_comments_review_idx on public.review_comments(review_id);
create index if not exists review_comments_user_idx   on public.review_comments(user_id);

-- 댓글 수 자동 갱신
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

drop trigger if exists trg_refresh_review_comment_count on public.review_comments;
create trigger trg_refresh_review_comment_count
  after insert or delete on public.review_comments
  for each row execute procedure public.refresh_review_comment_count();

-- ── 4. follows ───────────────────────────────────────────────
create table if not exists public.follows (
  follower_id  uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at   timestamp with time zone default timezone('utc', now()) not null,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "팔로우 누구나 조회"     on public.follows for select using (true);
create policy "팔로우 본인 이름으로만" on public.follows for insert with check (auth.uid() = follower_id);
create policy "언팔로우 본인만"        on public.follows for delete using (auth.uid() = follower_id);

create index if not exists follows_follower_idx  on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

-- ── 5. users: follower_count / following_count 집계 컬럼 ──
alter table public.users add column if not exists follower_count  int not null default 0;
alter table public.users add column if not exists following_count int not null default 0;

create or replace function public.refresh_follow_counts()
returns trigger as $$
declare
  target_follower_id  uuid := coalesce(new.follower_id,  old.follower_id);
  target_following_id uuid := coalesce(new.following_id, old.following_id);
begin
  -- follower가 팔로우하는 수 (following_count)
  update public.users
  set following_count = (select count(*) from public.follows where follower_id = target_follower_id)
  where id = target_follower_id;

  -- following이 받은 팔로워 수 (follower_count)
  update public.users
  set follower_count = (select count(*) from public.follows where following_id = target_following_id)
  where id = target_following_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trg_refresh_follow_counts on public.follows;
create trigger trg_refresh_follow_counts
  after insert or delete on public.follows
  for each row execute procedure public.refresh_follow_counts();
