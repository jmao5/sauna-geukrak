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
  
  -- 사우나 이키타이 스타일의 상세 정보 (JSONB로 유연하게 관리)
  sauna_rooms jsonb default '[]'::jsonb, 
  -- 예: [{ "type": "건식", "temp": 90, "capacity": 10, "has_tv": true, "has_auto_loyly": false }]
  
  cold_baths jsonb default '[]'::jsonb,  
  -- 예: [{ "temp": 15, "capacity": 5, "is_groundwater": true, "depth": 80 }]
  
  resting_area jsonb default '{}'::jsonb, 
  -- 예: { "indoor_seats": 5, "outdoor_seats": 3, "infinity_chairs": 2, "deck_chairs": 0 }
  
  amenities jsonb default '{}'::jsonb,    
  -- 예: { "towel": true, "shampoo": true, "body_wash": true, "hair_dryer": true }
  
  rules jsonb default '{}'::jsonb,        
  -- 예: { "tattoo_allowed": false, "female_allowed": true, "male_allowed": true }
  
  kr_specific jsonb default '{}'::jsonb,  
  -- 한국 특화 (예: { "has_jjimjilbang": true, "sesin_price_male": 20000, "sesin_price_female": 25000, "food": ["식혜"] })
  
  pricing jsonb default '{}'::jsonb,      
  -- 예: { "adult_day": 12000, "adult_night": 15000, "child": 8000 }
  
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
  visit_time text, -- '아침', '오후', '저녁', '심야'
  congestion text, -- '여유', '보통', '혼잡', '매우 혼잡'
  
  sessions jsonb default '[]'::jsonb, 
  -- 사활 루틴 세트 기록 예: [{ "sauna_mins": 10, "cold_mins": 1, "rest_mins": 10 }, ...]
  
  images text[] default '{}'::text[],
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 가고 싶다 / 찜 (Favorites)
create table public.favorites (
  user_id uuid references public.users(id) on delete cascade not null,
  sauna_id uuid references public.saunas(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- 복합 기본키 설정 (한 유저가 한 사우나를 한 번만 찜할 수 있음)
  primary key (user_id, sauna_id)
);

-- ==========================================
-- (선택) RLS (Row Level Security) 설정
-- 프론트엔드에서 직접 쿼리할 때 보안을 위해 활성화합니다.
-- ==========================================

alter table public.users enable row level security;
alter table public.saunas enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- 사우나 데이터는 누구나 읽을 수 있음
create policy "사우나 정보는 누구나 조회 가능" on public.saunas for select using (true);

-- 리뷰는 누구나 읽을 수 있지만, 작성/수정/삭제는 본인만 가능
create policy "리뷰는 누구나 조회 가능" on public.reviews for select using (true);
create policy "리뷰 작성은 로그인한 사용자만" on public.reviews for insert with check (auth.uid() = user_id);
create policy "리뷰 수정은 작성자 본인만" on public.reviews for update using (auth.uid() = user_id);
create policy "리뷰 삭제는 작성자 본인만" on public.reviews for delete using (auth.uid() = user_id);

-- 찜 기능은 로그인한 사용자 본인 것만 CRUD 가능
create policy "찜 조회는 본인 것만" on public.favorites for select using (auth.uid() = user_id);
create policy "찜 생성은 본인 이름으로만" on public.favorites for insert with check (auth.uid() = user_id);
create policy "찜 삭제는 본인 것만" on public.favorites for delete using (auth.uid() = user_id);
