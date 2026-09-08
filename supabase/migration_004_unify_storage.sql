-- ==========================================
-- Migration 004: 이미지 버킷 통일 및 소유자별 삭제 권한
-- ==========================================
-- 앱은 sauna-images 버킷만 사용합니다. 기존 sauna-geukrak 버킷의 파일은
-- URL을 유지하므로 이 migration이 삭제하거나 옮기지 않습니다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sauna-images', 'sauna-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "인증된 사용자 업로드" on storage.objects;
drop policy if exists "인증된 사용자 업데이트" on storage.objects;
drop policy if exists "인증된 사용자 삭제" on storage.objects;
drop policy if exists "모두 조회 가능" on storage.objects;

create policy "인증된 사용자 업로드" on storage.objects
  for insert with check (bucket_id = 'sauna-images' and auth.role() = 'authenticated');

create policy "인증된 사용자 업데이트" on storage.objects
  for update using (bucket_id = 'sauna-images' and owner_id = auth.uid()::text);

create policy "인증된 사용자 삭제" on storage.objects
  for delete using (bucket_id = 'sauna-images' and owner_id = auth.uid()::text);

create policy "모두 조회 가능" on storage.objects
  for select using (bucket_id = 'sauna-images');
