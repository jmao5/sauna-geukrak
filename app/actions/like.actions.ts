'use server'

import { createClient } from '@/lib/supabase/server'

/** 리뷰 여러 개의 좋아요 상태를 한 번에 조회 */
export async function getReviewLikeStatuses(
  reviewIds: string[]
): Promise<Record<string, { liked: boolean; count: number }>> {
  if (!reviewIds.length) return {}
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const { data: reviews } = await supabase
      .from('reviews')
      .select('id')
      .in('id', reviewIds)

    const result: Record<string, { liked: boolean; count: number }> = {}
    for (const r of reviews ?? []) {
      result[r.id] = { liked: false, count: 0 }
    }
    if (!session) return result

    const { data: likes } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds)
      .eq('user_id', session.user.id)

    for (const like of likes ?? []) {
      if (result[like.review_id]) result[like.review_id].liked = true
    }
    return result
  } catch {
    return {}
  }
}

/** 좋아요 토글 */
export async function toggleReviewLike(
  reviewId: string
): Promise<{ ok: boolean; liked: boolean; count: number; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, liked: false, count: 0, error: '로그인이 필요합니다' }

    const userId = session.user.id

    const { data: existing } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await supabase.from('review_likes').delete()
        .eq('review_id', reviewId).eq('user_id', userId)
    } else {
      await supabase.from('review_likes').insert({ review_id: reviewId, user_id: userId })
    }

    const { data: updated } = await supabase
      .from('reviews').select('like_count').eq('id', reviewId).single()

    // like_count 콼럼이 없으면 review_likes 직접 집계
    const likeCount = updated?.like_count ?? null
    if (likeCount !== null) {
      return { ok: true, liked: !existing, count: likeCount }
    }
    const { count } = await supabase
      .from('review_likes').select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)
    return { ok: true, liked: !existing, count: count ?? 0 }
  } catch {
    return { ok: false, liked: false, count: 0, error: '좋아요 처리 중 오류가 발생했습니다' }
  }
}
