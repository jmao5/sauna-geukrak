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

/**
 * #4 Fix: auth.getUser() (네트워크 왕복) → getSession() (로컬 JWT 파싱, 왕복 없음)
 *
 * 기존: getUser() → Supabase Auth 서버 검증 → INSERT  (2번 왕복)
 * 개선: getSession() 로컬 파싱 → INSERT, RLS가 DB 레벨 검증  (1번 왕복)
 *
 * 보안: INSERT 시 RLS 정책 `auth.uid() = user_id` 가 DB에서 재검증.
 *       클라이언트가 보낸 review.user_id 대신 session.user.id로 덮어써서 위변조 방지.
 */
export async function getReviewCount(saunaId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('sauna_id', saunaId)
    if (error) throw new Error(error.message)
    return count ?? 0
  } catch (error) {
    console.error('리뷰 카운트 조회 에러:', error)
    return 0
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

    // getSession() — 로컬 JWT 파싱, Supabase 서버 왕복 없음
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        ...review,
        user_id: session.user.id,  // 클라이언트 값을 세션으로 덮어써서 위변조 방지
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  } catch (error) {
    console.error('리뷰 작성 에러:', error)
    throw new Error(error instanceof Error ? error.message : '리뷰 작성에 실패했습니다.')
  }
}
