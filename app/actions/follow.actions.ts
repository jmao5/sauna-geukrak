'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserProfileDto {
  id: string
  nickname: string
  avatar_url: string | null
  bio: string | null
  follower_count: number
  following_count: number
}

/** 유저 프로필 조회 */
export async function getUserProfile(userId: string): Promise<UserProfileDto | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, nickname, avatar_url, bio, follower_count, following_count')
      .eq('id', userId)
      .single()
    if (error) return null
    return data as UserProfileDto
  } catch {
    return null
  }
}

/** 팔로우 여부 확인 */
export async function getFollowStatus(
  targetUserId: string
): Promise<{ following: boolean; followerCount: number }> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const { data: profile } = await supabase
      .from('users')
      .select('follower_count')
      .eq('id', targetUserId)
      .single()

    const followerCount = profile?.follower_count ?? 0

    if (!session || session.user.id === targetUserId) {
      return { following: false, followerCount }
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', session.user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()

    return { following: !!existing, followerCount }
  } catch {
    return { following: false, followerCount: 0 }
  }
}

/** 팔로우 토글 */
export async function toggleFollow(
  targetUserId: string
): Promise<{ ok: boolean; following: boolean; followerCount: number; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, following: false, followerCount: 0, error: '로그인이 필요합니다' }
    if (session.user.id === targetUserId) {
      return { ok: false, following: false, followerCount: 0, error: '자기 자신을 팔로우할 수 없습니다' }
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', session.user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (existing) {
      await supabase.from('follows').delete()
        .eq('follower_id', session.user.id).eq('following_id', targetUserId)
    } else {
      await supabase.from('follows').insert({
        follower_id: session.user.id,
        following_id: targetUserId,
      })
    }

    const { data: updated } = await supabase
      .from('users').select('follower_count').eq('id', targetUserId).single()

    return { ok: true, following: !existing, followerCount: updated?.follower_count ?? 0 }
  } catch {
    return { ok: false, following: false, followerCount: 0, error: '팔로우 처리 중 오류가 발생했습니다' }
  }
}
