
-- ==========================================
-- Storage: sauna-images 버킷 설정
-- Supabase Dashboard → SQL Editor에서 실행하세요.
-- ==========================================

-- sauna-images 버킷 생성 (공개 버킷)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sauna-images',
  'sauna-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- 업로드: 인증된 사용자만
create policy "인증된 사용자 업로드" on storage.objects
  for insert with check (
    bucket_id = 'sauna-images'
    and auth.role() = 'authenticated'
  );

-- 업데이트 (upsert)
create policy "인증된 사용자 업데이트" on storage.objects
  for update using (
    bucket_id = 'sauna-images'
    and auth.role() = 'authenticated'
  );

-- 조회: 누구나 가능 (공개 버킷)
create policy "모두 조회 가능" on storage.objects
  for select using (bucket_id = 'sauna-images');
