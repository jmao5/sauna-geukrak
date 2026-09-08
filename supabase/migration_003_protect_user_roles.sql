-- ==========================================
-- Migration 003: 사용자 권한 상승 차단
-- ==========================================
-- 기존 운영 DB에 적용하세요. public.users의 RLS는 본인 행 수정을 허용하므로,
-- 컬럼 권한을 분리하지 않으면 인증된 사용자가 자신의 role을 admin으로 변경할 수 있습니다.

revoke update on table public.users from anon, authenticated;
grant update (nickname, avatar_url, bio) on table public.users to authenticated;

-- role 변경은 Supabase Dashboard 또는 service_role을 사용하는 신뢰된 서버 작업에서만 수행합니다.
