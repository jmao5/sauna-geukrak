'use server'

import { createClient, createPublicClient } from '@/lib/supabase/server'

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
    const supabase = createPublicClient()

    // 1차 시도: 전체 컬럼 조회 (bio, follower_count, following_count)
    const { data, error } = await supabase
      .from('users')
      .select('id, nickname, avatar_url, bio, follower_count, following_count')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      return data as UserProfileDto
    }

    // 2차 시도 (fallback): bio나 follower_count 컬럼이 DB에 없는 경우 기본 컬럼만 조회
    if (error) {
      console.warn('[getUserProfile] 전체 컬럼 조회 실패, 기본 컬럼으로 fallback:', error.message)
      const { data: fallbackUser, error: fallbackError } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .eq('id', userId)
        .maybeSingle()

      if (fallbackError || !fallbackUser) {
        console.error('[getUserProfile] 기본 유저 조회도 실패:', fallbackError)
        return null
      }

      return {
        id: fallbackUser.id,
        nickname: fallbackUser.nickname,
        avatar_url: fallbackUser.avatar_url,
        bio: null,
        follower_count: 0,
        following_count: 0,
      }
    }

    return null
  } catch (err) {
    console.error('[getUserProfile] 예외 발생:', err)
    return null
  }
}

/** 팔로우 여부 확인 */
export async function getFollowStatus(
  targetUserId: string
): Promise<{ following: boolean; followerCount: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let followerCount = 0
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('follower_count')
        .eq('id', targetUserId)
        .maybeSingle()
      if (profile?.follower_count !== undefined && profile?.follower_count !== null) {
        followerCount = profile.follower_count
      }
    } catch {}

    if (!user || user.id === targetUserId) {
      return { following: false, followerCount }
    }

    try {
      const { data: existing } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()

      return { following: !!existing, followerCount }
    } catch {
      return { following: false, followerCount }
    }
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, following: false, followerCount: 0, error: '로그인이 필요합니다' }
    if (user.id === targetUserId) {
      return { ok: false, following: false, followerCount: 0, error: '자기 자신을 팔로우할 수 없습니다' }
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (existing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', targetUserId)
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
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
