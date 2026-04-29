-- ==========================================
-- 🧖‍♂️ 사우나 극락 (Sauna Geukrak) Database Schema
-- Supabase SQL Editor 에서 전체 복사 후 실행하세요.
-- ==========================================

-- 1. 사용자 (Users) 프로필 확장 테이블
-- Supabase Auth의 auth.users 와 1:1 매칭되는 퍼블릭 프로필
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text unique not null,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 사우나 시설 (Saunas)
create table public.saunas (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  latitude float8 not null,
  longitude float8 not null,

  sauna_rooms jsonb default '[]'::jsonb,
  cold_baths jsonb default '[]'::jsonb,
  resting_area jsonb default '{}'::jsonb,
  amenities jsonb default '{}'::jsonb,
  rules jsonb default '{}'::jsonb,
  kr_specific jsonb default '{}'::jsonb,
  pricing jsonb default '{}'::jsonb,

  business_hours text,
  contact text,
  parking boolean default false,
  images text[] default '{}'::text[],

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 사우나 활동 기록 / 리뷰 (Reviews)
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  sauna_id uuid references public.saunas(id) on delete cascade not null,

  rating int not null check (rating >= 1 and rating <= 5),
  content text,

  visit_date date not null default current_date,
  visit_time text,
  congestion text,

  sessions jsonb default '[]'::jsonb,
  images text[] default '{}'::text[],

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 가고 싶다 / 찜 (Favorites)
create table public.favorites (
  user_id uuid references public.users(id) on delete cascade not null,
  sauna_id uuid references public.saunas(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  primary key (user_id, sauna_id)
);

-- ==========================================
-- RLS (Row Level Security) 설정
-- ==========================================

alter table public.users enable row level security;
alter table public.saunas enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- 사우나: 누구나 읽기, 로그인한 유저만 등록/수정
create policy "사우나 정보는 누구나 조회 가능" on public.saunas for select using (true);
create policy "사우나 등록은 로그인한 사용자만" on public.saunas for insert with check (auth.uid() is not null);
create policy "사우나 수정은 관리자만 (추후 role 추가)" on public.saunas for update using (auth.uid() is not null);

-- ==========================================
-- users 자동 생성 트리거
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set
      nickname = excluded.nickname,
      avatar_url = excluded.avatar_url;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- users RLS
-- ✅ 로그인한 유저라면 모든 프로필 조회 가능
--    (reviews JOIN 시 닉네임/아바타 표시, favorites FK 검증에 필요)
-- ❌ 기존 "본인만 조회" 정책은 favorites/reviews insert 시 FK 검증 실패를 유발함
create policy "로그인한 유저는 프로필 조회 가능" on public.users
  for select using (auth.uid() is not null);
create policy "본인 프로필 생성" on public.users
  for insert with check (auth.uid() = id);
create policy "본인 프로필 수정" on public.users for update using (auth.uid() = id);

-- reviews: 누구나 읽기, 본인만 쓰기/수정/삭제
create policy "리뷰는 누구나 조회 가능" on public.reviews for select using (true);
create policy "리뷰 작성은 로그인한 사용자만" on public.reviews for insert with check (auth.uid() = user_id);
create policy "리뷰 수정은 작성자 본인만" on public.reviews for update using (auth.uid() = user_id);
create policy "리뷰 삭제는 작성자 본인만" on public.reviews for delete using (auth.uid() = user_id);

-- favorites: 본인 것만 CRUD
create policy "찜 조회는 본인 것만" on public.favorites for select using (auth.uid() = user_id);
create policy "찜 생성은 본인 이름으로만" on public.favorites for insert with check (auth.uid() = user_id);
create policy "찜 삭제는 본인 것만" on public.favorites for delete using (auth.uid() = user_id);
