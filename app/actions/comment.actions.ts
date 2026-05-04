'use server'

import { createClient } from '@/lib/supabase/server'

export interface CommentDto {
  id: string
  review_id: string
  content: string
  created_at: string
  users: { id: string; nickname: string; avatar_url: string | null } | null
}

/** 리뷰 댓글 목록 */
export async function getCommentsByReviewId(reviewId: string): Promise<CommentDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('review_comments')
      .select('id, review_id, content, created_at, users!user_id(id, nickname, avatar_url)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) throw error
    return (data as any[]).map((row) => ({
      ...row,
      users: Array.isArray(row.users) ? row.users[0] : row.users,
    })) as CommentDto[]
  } catch {
    return []
  }
}

/** 댓글 작성 */
export async function createComment(
  reviewId: string,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const trimmed = content.trim()
    if (!trimmed) return { ok: false, error: '내용을 입력해주세요' }
    if (trimmed.length > 500) return { ok: false, error: '500자 이하로 입력해주세요' }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: '로그인이 필요합니다' }

    const { error } = await supabase.from('review_comments').insert({
      review_id: reviewId,
      user_id: session.user.id,
      content: trimmed,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch {
    return { ok: false, error: '댓글 작성에 실패했습니다' }
  }
}

/** 댓글 삭제 */
export async function deleteComment(commentId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: '로그인이 필요합니다' }

    const { error } = await supabase
      .from('review_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', session.user.id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch {
    return { ok: false, error: '댓글 삭제에 실패했습니다' }
  }
}
