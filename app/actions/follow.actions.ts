'use server'

import { createClient, createPublicClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

    // 1. 기본 유저 정보 조회 (id, nickname, avatar_url은 항상 존재하는 안전한 컬럼)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nickname, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (error || !user) {
      console.warn('[getUserProfile] 유저 조회 실패:', error?.message)
      return null
    }

    // 2. bio 조회 시도 (컬럼 없을 수 있음)
    let bio: string | null = null
    try {
      const { data: bioData } = await supabase
        .from('users')
        .select('bio')
        .eq('id', userId)
        .maybeSingle()
      bio = (bioData as any)?.bio ?? null
    } catch {}

    // 3. 팔로워 수 및 팔로잉 수는 follows 테이블에서 직접 카운트 (users.follower_count 컬럼 유무 무관)
    let followerCount = 0
    let followingCount = 0
    try {
      const [{ count: fCount }, { count: ingCount }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ])
      followerCount = fCount ?? 0
      followingCount = ingCount ?? 0
    } catch {}

    return {
      id: user.id,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      bio,
      follower_count: followerCount,
      following_count: followingCount,
    }
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

    // follows 테이블에서 직접 팔로워 수 카운트
    let followerCount = 0
    try {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId)
      followerCount = count ?? 0
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

/** 내가 팔로우하는 유저 ID 목록 조회 */
export async function getMyFollowingIds(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    if (error) {
      console.warn('[getMyFollowingIds] 조회 에러:', error.message)
      return []
    }
    return (data ?? []).map((row) => row.following_id as string)
  } catch {
    return []
  }
}

/** 팔로우 토글 */
export async function toggleFollow(
  targetUserId: string
): Promise<{ ok: boolean; following: boolean; followerCount: number; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { ok: false, following: false, followerCount: 0, error: '로그인이 필요합니다' }
    }
    if (user.id === targetUserId) {
      return { ok: false, following: false, followerCount: 0, error: '자기 자신을 팔로우할 수 없습니다' }
    }

    // 1. 기존 팔로우 여부 확인
    const { data: existing, error: checkError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (checkError) {
      console.error('[toggleFollow] 조회 에러:', checkError.message)
      return { ok: false, following: false, followerCount: 0, error: '팔로우 정보 조회에 실패했습니다' }
    }

    let isFollowing = false

    if (existing) {
      const { error: delError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)

      if (delError) {
        console.error('[toggleFollow] 언팔로우 에러:', delError.message)
        return { ok: false, following: true, followerCount: 0, error: delError.message }
      }
      isFollowing = false
    } else {
      const { error: insError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        })

      if (insError) {
        console.error('[toggleFollow] 팔로우 에러:', insError.message)
        return { ok: false, following: false, followerCount: 0, error: insError.message }
      }
      isFollowing = true
    }

    // 2. 최신 팔로워 수 집계 (follows 테이블에서 직접 카운트)
    let followerCount = 0
    try {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId)
      followerCount = count ?? 0
    } catch {}

    // 3. 관련 경로 캐시 무효화
    try {
      revalidatePath('/feed')
      revalidatePath(`/users/${targetUserId}`)
    } catch {}

    return { ok: true, following: isFollowing, followerCount }
  } catch (err: any) {
    console.error('[toggleFollow] 예외 발생:', err)
    return { ok: false, following: false, followerCount: 0, error: err?.message || '팔로우 처리 중 오류가 발생했습니다' }
  }
}
