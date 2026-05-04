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
  role text not null default 'user' check (role in ('user', 'admin')),
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

-- 사우나: 누구나 읽기, admin만 등록/수정
create policy "사우나 정보는 누구나 조회 가능" on public.saunas for select using (true);
create policy "사우나 등록은 admin만" on public.saunas for insert
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "사우나 수정은 admin만" on public.saunas for update
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ==========================================
-- users 자동 생성 트리거
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $
declare
  base_nickname text;
  final_nickname text;
  suffix int := 0;
begin
  base_nickname := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    '익명'
  );

  final_nickname := base_nickname;

  -- nickname unique 충돌 시 숫자 suffix 붙여서 재시도
  loop
    begin
      insert into public.users (id, nickname, avatar_url)
      values (
        new.id,
        final_nickname,
        new.raw_user_meta_data->>'avatar_url'
      )
      on conflict (id) do update
        set
          nickname = excluded.nickname,
          avatar_url = excluded.avatar_url;
      exit; -- 성공 시 루프 탈출
    exception when unique_violation then
      suffix := suffix + 1;
      final_nickname := base_nickname || suffix::text;
    end;
  end loop;

  return new;
end;
$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- users RLS
create policy "유저 프로필 본인 생성" on public.users for insert with check (auth.uid() = id);
create policy "로그인한 유저는 프로필 조회 가능" on public.users
  for select using (auth.uid() is not null);
create policy "본인 프로필 수정" on public.users for update using (auth.uid() = id);

-- reviews: 누구나 읽기, 본인만 쓰기/수정/삭제
create policy "리뷰는 누구나 조회 가능" on public.reviews for select using (true);
create policy "리뷰 작성은 로그인한 사용자만" on public.reviews for insert with check (auth.uid() = user_id);
create policy "리뷰 수정은 작성자 본인만" on public.reviews for update using (auth.uid() = user_id);
create policy "리뷰 삭제는 작성자 본인만" on public.reviews for delete using (auth.uid() = user_id);

-- favorites: 본인 것만 CRUD
create policy "찜 조회는 본인 것만" on public.favorites for select using (auth.uid() = user_id);
create policy "찜 생성은 본인 이름으로만" on public.favorites for insert with check (auth.uid() = user_id);
create policy "찜 업데이트는 본인 것만" on public.favorites for update using (auth.uid() = user_id);
create policy "찜 삭제는 본인 것만" on public.favorites for delete using (auth.uid() = user_id);

-- ==========================================
-- 마이그레이션 001: 성능·큐레이션 개선
-- ==========================================

-- #4 검색 풀텍스트 인덱스 (이름 + 주소 검색)
alter table public.saunas add column if not exists
  search_vector tsvector
  generated always as (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(address,''))) stored;
create index if not exists saunas_search_idx on public.saunas using gin(search_vector);

-- #7 Editor's Pick 큐레이션 컬럼
alter table public.saunas add column if not exists is_featured boolean not null default false;
create index if not exists saunas_featured_idx on public.saunas(is_featured) where is_featured = true;

-- #11 평점 집계 컬럼
alter table public.saunas add column if not exists avg_rating float default null;
alter table public.saunas add column if not exists review_count int not null default 0;

-- 평점 자동 갱신 트리거
create or replace function public.refresh_sauna_rating()
returns trigger as $
begin
  update public.saunas
  set
    review_count = (select count(*) from public.reviews where sauna_id = coalesce(new.sauna_id, old.sauna_id)),
    avg_rating   = (select avg(rating)::float from public.reviews where sauna_id = coalesce(new.sauna_id, old.sauna_id))
  where id = coalesce(new.sauna_id, old.sauna_id);
  return coalesce(new, old);
end;
$ language plpgsql security definer;

create or replace trigger trg_refresh_sauna_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_sauna_rating();
