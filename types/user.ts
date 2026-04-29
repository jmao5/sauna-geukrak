/**
 * Supabase auth.User 를 그대로 사용합니다.
 * user.user_metadata 에서 Google 프로필 정보를 읽을 수 있습니다:
 *   - user_metadata.full_name
 *   - user_metadata.avatar_url
 *   - user_metadata.email
 */
export type { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * public.users 테이블 프로필 (한국어 닉네임, 추가 바이오 등)
 */
export interface UserProfile {
  id: string
  nickname: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}
