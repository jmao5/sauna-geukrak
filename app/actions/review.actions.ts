'use server'

import { createClient } from '@/lib/supabase/server'
import { ReviewDto, MyReviewDto, ReviewUser, Session } from '@/types/sauna'

export async function getReviewsBySaunaId(saunaId: string): Promise<ReviewDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reviews')
      .select(`id, rating, content, visit_date, visit_time, congestion, sessions, images, created_at,
        users (id, nickname, avatar_url)`)
      .eq('sauna_id', saunaId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw new Error(error.message)
    return (data as any[] ?? []).map((row) => ({
      ...row,
      users: Array.isArray(row.users) ? (row.users as ReviewUser[])[0] : row.users,
    })) as ReviewDto[]
  } catch (error) {
    console.error('리뷰 목록 조회 에러:', error)
    throw new Error('리뷰를 불러오는데 실패했습니다.')
  }
}

export async function getReviewsByUserId(userId: string): Promise<MyReviewDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reviews')
      .select(`id, rating, content, visit_date, visit_time, sessions, created_at,
        saunas (id, name, address, sauna_rooms, cold_baths, images)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as any[] ?? []).map((row) => ({
      ...row,
      saunas: Array.isArray(row.saunas) ? row.saunas[0] : row.saunas,
    })) as MyReviewDto[]
  } catch (error) {
    console.error('사활 기록 조회 에러:', error)
    throw new Error('사활 기록을 불러오는데 실패했습니다.')
  }
}

export async function createReview(review: {
  sauna_id: string
  user_id: string
  rating: number
  content?: string
  visit_date: string
  visit_time?: string
  congestion?: string
  sessions?: Session[]
  images?: string[]
}) {
  try {
    const supabase = await createClient()

    // 1. 세션 검증 (보안) - 클라이언트에서 보낸 user_id를 신뢰하지 않음
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('로그인이 필요합니다.')
    if (user.id !== review.user_id) throw new Error('잘못된 접근입니다.')

    const { data, error } = await supabase
      .from('reviews')
      // 검증된 user.id 사용으로 덮어씌움
      .insert({ ...review, user_id: user.id })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  } catch (error) {
    console.error('리뷰 작성 에러:', error)
    throw new Error(error instanceof Error ? error.message : '리뷰 작성에 실패했습니다.')
  }
}
