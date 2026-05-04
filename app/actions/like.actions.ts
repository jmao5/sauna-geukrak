'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 리뷰 여러 개의 좋아요 상태 + 카운트를 한 번에 조회
 *
 * 수정: reviews 테이블에서 id만 SELECT → id, like_count SELECT로 변경
 * → LikeButton initialCount가 정확한 값으로 초기화되어 즉시 반영됨
 */
export async function getReviewLikeStatuses(
  reviewIds: string[]
): Promise<Record<string, { liked: boolean; count: number }>> {
  if (!reviewIds.length) return {}
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // like_count 포함해서 SELECT
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, like_count')
      .in('id', reviewIds)

    const result: Record<string, { liked: boolean; count: number }> = {}
    for (const r of reviews ?? []) {
      result[r.id] = { liked: false, count: r.like_count ?? 0 }
    }

    // 비로그인이면 liked는 모두 false, count는 DB 값 그대로 반환
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

/**
 * 좋아요 토글
 *
 * 수정:
 * 1. DB 트리거로 like_count를 자동 관리하는 경우 updated.like_count 사용
 * 2. like_count 컬럼이 없으면 review_likes 직접 집계 (fallback)
 * 3. 항상 { ok, liked, count } 반환 → LikeButton이 서버 실제값으로 동기화
 */
export async function toggleReviewLike(
  reviewId: string
): Promise<{ ok: boolean; liked: boolean; count: number; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, liked: false, count: 0, error: '로그인이 필요합니다' }

    const userId = session.user.id

    // 현재 좋아요 여부 확인
    const { data: existing } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle()

    const nowLiked = !existing

    if (existing) {
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('review_likes')
        .insert({ review_id: reviewId, user_id: userId })
      if (error) throw error
    }

    // like_count 최신값 가져오기
    // DB 트리거가 있으면 like_count 자동 반영, 없으면 직접 집계
    const { data: updated } = await supabase
      .from('reviews')
      .select('like_count')
      .eq('id', reviewId)
      .single()

    if (updated?.like_count !== null && updated?.like_count !== undefined) {
      return { ok: true, liked: nowLiked, count: updated.like_count }
    }

    // fallback: like_count 컬럼 없으면 직접 집계
    const { count } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)
    return { ok: true, liked: nowLiked, count: count ?? 0 }
  } catch (e: any) {
    console.error('toggleReviewLike 에러:', e)
    return { ok: false, liked: false, count: 0, error: '좋아요 처리 중 오류가 발생했습니다' }
  }
}
