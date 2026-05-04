'use server'

import { createClient } from '@/lib/supabase/server'

/** 현재 유저가 특정 리뷰에 좋아요 했는지 여부 */
export async function getReviewLikeStatus(reviewId: string): Promise<{ liked: boolean; count: number }> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // 좋아요 수는 reviews.like_count 캐시 컬럼에서 읽음
    const { data: review } = await supabase
      .from('reviews')
      .select('like_count')
      .eq('id', reviewId)
      .single()

    const count = review?.like_count ?? 0

    if (!session) return { liked: false, count }

    const { data: existing } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('review_id', reviewId)
      .eq('user_id', session.user.id)
      .maybeSingle()

    return { liked: !!existing, count }
  } catch {
    return { liked: false, count: 0 }
  }
}

/** 리뷰 여러 개의 좋아요 상태를 한 번에 조회 (목록 렌더링용) */
export async function getReviewLikeStatuses(
  reviewIds: string[]
): Promise<Record<string, { liked: boolean; count: number }>> {
  if (!reviewIds.length) return {}
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // like_count는 reviews 테이블에 캐시돼 있음
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, like_count')
      .in('id', reviewIds)

    const result: Record<string, { liked: boolean; count: number }> = {}
    for (const r of reviews ?? []) {
      result[r.id] = { liked: false, count: r.like_count ?? 0 }
    }

    if (!session) return result

    const { data: likes } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds)
      .eq('user_id', session.user.id)

    for (const like of likes ?? []) {
      if (result[like.review_id]) {
        result[like.review_id].liked = true
      }
    }

    return result
  } catch {
    return {}
  }
}

/** 좋아요 토글 — 없으면 추가, 있으면 제거 */
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
      await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId)
    } else {
      await supabase
        .from('review_likes')
        .insert({ review_id: reviewId, user_id: userId })
    }

    // 트리거가 like_count를 갱신하므로 최신값 읽기
    const { data: updated } = await supabase
      .from('reviews')
      .select('like_count')
      .eq('id', reviewId)
      .single()

    return {
      ok: true,
      liked: !existing,
      count: updated?.like_count ?? 0,
    }
  } catch (e) {
    return { ok: false, liked: false, count: 0, error: '좋아요 처리 중 오류가 발생했습니다' }
  }
}
