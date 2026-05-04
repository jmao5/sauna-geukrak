-- ==========================================
-- 🧖 사우나 극락 Database Schema (최종)
-- Supabase SQL Editor에서 전체 복사 후 실행
-- ==========================================

-- ── 1. users ─────────────────────────────────────────────────
create table if not exists public.users (
  id         uuid references auth.users on delete cascade primary key,
  nickname   text unique not null,
  avatar_url text,
  bio        text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default timezone('utc', now()) not null
);

-- ── 2. saunas ────────────────────────────────────────────────
-- sauna_rooms JSONB 스키마 (각 항목):
--   { "type":"건식"|"습식"|"핀란드식"|"한증막"|"불가마",
--     "temp": int, "capacity": int,
--     "has_tv": bool, "has_auto_loyly": bool, "has_self_loyly": bool,
--     "gender": "male"|"female"|"both"  ← 5번 개선: 성별 구분
--   }
-- cold_baths JSONB 스키마 (각 항목):
--   { "temp": int, "capacity": int, "is_groundwater": bool, "depth": int,
--     "gender": "male"|"female"|"both"  ← 5번 개선: 성별 구분
--   }
create table if not exists public.saunas (
  id             uuid default gen_random_uuid() primary key,
  name           text not null,
  address        text not null,
  latitude       float8 not null,
  longitude      float8 not null,
  sauna_rooms    jsonb default '[]'::jsonb,
  cold_baths     jsonb default '[]'::jsonb,
  resting_area   jsonb default '{}'::jsonb,
  amenities      jsonb default '{}'::jsonb,
  rules          jsonb default '{}'::jsonb,
  kr_specific    jsonb default '{}'::jsonb,
  pricing        jsonb default '{}'::jsonb,
  business_hours text,
  contact        text,
  parking        boolean default false,
  images         text[] default '{}'::text[],
  -- 큐레이션 / 집계
  is_featured    boolean not null default false,
  avg_rating     float   default null,
  review_count   int     not null default 0,
  -- 풀텍스트 검색
  search_vector  tsvector generated always as (
    to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(address,''))
  ) stored,
  created_at     timestamptz default timezone('utc', now()) not null
);

create index if not exists saunas_search_idx  on public.saunas using gin(search_vector);
create index if not exists saunas_featured_idx on public.saunas(is_featured) where is_featured = true;
create index if not exists saunas_geo_idx      on public.saunas(latitude, longitude);

-- ── 3. reviews ───────────────────────────────────────────────
-- sessions JSONB 스키마 (각 항목):
--   { "type":"sauna"|"cold"|"rest",
--     "temp": int, "duration_minutes": int }
create table if not exists public.reviews (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  sauna_id    uuid references public.saunas(id) on delete cascade not null,
  rating      int not null check (rating >= 1 and rating <= 5),
  content     text,
  visit_date  date not null default current_date,
  visit_time  text,    -- 'morning'|'afternoon'|'evening'|'night'
  congestion  text,    -- 'low'|'normal'|'high'|'very_high'
  sessions    jsonb default '[]'::jsonb,
  images      text[] default '{}'::text[],
  like_count  int not null default 0,   -- ← 6번: 좋아요 수 캐시
  created_at  timestamptz default timezone('utc', now()) not null
);

create index if not exists reviews_sauna_idx on public.reviews(sauna_id, created_at desc);
create index if not exists reviews_user_idx  on public.reviews(user_id, created_at desc);

-- ── 4. favorites ─────────────────────────────────────────────
create table if not exists public.favorites (
  user_id    uuid references public.users(id)  on delete cascade not null,
  sauna_id   uuid references public.saunas(id) on delete cascade not null,
  created_at timestamptz default timezone('utc', now()) not null,
  primary key (user_id, sauna_id)
);

-- ── 5. review_likes ──────────────────────────────────────────
-- 6번 소셜: 리뷰 좋아요 (하트)
create table if not exists public.review_likes (
  review_id  uuid references public.reviews(id) on delete cascade not null,
  user_id    uuid references public.users(id)   on delete cascade not null,
  created_at timestamptz default timezone('utc', now()) not null,
  primary key (review_id, user_id)
);

create index if not exists review_likes_user_idx on public.review_likes(user_id);

-- ==========================================
-- RLS
-- ==========================================

alter table public.users        enable row level security;
alter table public.saunas       enable row level security;
alter table public.reviews      enable row level security;
alter table public.favorites    enable row level security;
alter table public.review_likes enable row level security;

-- saunas: 누구나 읽기, admin만 쓰기
create policy "사우나 조회" on public.saunas for select using (true);
create policy "사우나 등록 (admin)" on public.saunas for insert
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "사우나 수정 (admin)" on public.saunas for update
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- reviews
create policy "리뷰 조회"      on public.reviews for select using (true);
create policy "리뷰 작성"      on public.reviews for insert with check (auth.uid() = user_id);
create policy "리뷰 수정"      on public.reviews for update using (auth.uid() = user_id);
create policy "리뷰 삭제"      on public.reviews for delete using (auth.uid() = user_id);

-- favorites
create policy "찜 조회"        on public.favorites for select using (auth.uid() = user_id);
create policy "찜 추가"        on public.favorites for insert with check (auth.uid() = user_id);
create policy "찜 삭제"        on public.favorites for delete using (auth.uid() = user_id);

-- review_likes
create policy "좋아요 조회"    on public.review_likes for select using (true);
create policy "좋아요 추가"    on public.review_likes for insert with check (auth.uid() = user_id);
create policy "좋아요 삭제"    on public.review_likes for delete using (auth.uid() = user_id);

-- users
create policy "프로필 생성"    on public.users for insert with check (auth.uid() = id);
create policy "프로필 조회"    on public.users for select using (auth.uid() is not null);
create policy "프로필 수정"    on public.users for update using (auth.uid() = id);

-- ==========================================
-- 트리거
-- ==========================================

-- Google OAuth 로그인 시 users 행 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_nickname  text;
  final_nickname text;
  suffix         int := 0;
begin
  base_nickname := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    '익명'
  );
  final_nickname := base_nickname;

  loop
    begin
      insert into public.users (id, nickname, avatar_url)
      values (
        new.id,
        final_nickname,
        new.raw_user_meta_data->>'avatar_url'
      )
      on conflict (id) do update
        set nickname   = excluded.nickname,
            avatar_url = excluded.avatar_url;
      exit;
    exception when unique_violation then
      suffix := suffix + 1;
      final_nickname := base_nickname || suffix::text;
    end;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 리뷰 추가/삭제 시 saunas.avg_rating + review_count 자동 갱신
create or replace function public.refresh_sauna_rating()
returns trigger as $$
begin
  update public.saunas
  set
    review_count = (select count(*)       from public.reviews where sauna_id = coalesce(new.sauna_id, old.sauna_id)),
    avg_rating   = (select avg(rating)::float from public.reviews where sauna_id = coalesce(new.sauna_id, old.sauna_id))
  where id = coalesce(new.sauna_id, old.sauna_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create or replace trigger trg_refresh_sauna_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_sauna_rating();

-- 좋아요 추가/취소 시 reviews.like_count 자동 갱신
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
