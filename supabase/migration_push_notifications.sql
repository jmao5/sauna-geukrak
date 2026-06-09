-- push_subscriptions 테이블 생성
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  subscription jsonb not null, -- { endpoint: string, keys: { auth: string, p256dh: string } }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 사용자별 중복 디바이스(동일 endpoint) 알림 구독 방지를 위해 고유 인덱스 설정 (표현식을 사용하므로 UNIQUE INDEX로 생성)
create unique index if not exists unique_user_endpoint
on public.push_subscriptions (user_id, (subscription->>'endpoint'));

-- RLS(Row Level Security) 설정
alter table public.push_subscriptions enable row level security;

-- 사용자는 자신의 구독 정보만 조회, 등록, 삭제할 수 있도록 정책 설정
create policy "사용자는 본인의 구독 정보만 조회 가능"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "사용자는 본인의 구독 정보만 등록 가능"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "사용자는 본인의 구독 정보만 삭제 가능"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
