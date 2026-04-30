'use server'

import { createClient } from '@/lib/supabase/server'
import { MyFavoriteDto, SaunaSummaryDto } from '@/types/sauna'

export async function getFavoritesByUserId(userId: string): Promise<MyFavoriteDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('favorites')
      .select('sauna_id, created_at, saunas (id, name, address, sauna_rooms, cold_baths, images)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as any[] ?? []).map((row) => ({
      ...row,
      saunas: Array.isArray(row.saunas) ? (row.saunas as SaunaSummaryDto[])[0] : row.saunas,
    })) as MyFavoriteDto[]
  } catch (error) {
    console.error('찜 목록 조회 에러:', error)
    throw new Error('찜 목록을 불러오는데 실패했습니다.')
  }
}

export async function checkFavorite(userId: string, saunaId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('user_id', userId)
      .eq('sauna_id', saunaId)
      .maybeSingle()
    if (error) return false
    return !!data
  } catch {
    return false
  }
}

/**
 * #4 Fix: auth.getUser() (네트워크 왕복) → getSession() (로컬 JWT 파싱, 왕복 없음)
 *
 * getUser()  : Supabase Auth 서버로 토큰 검증 요청 → 외부 왕복 발생
 * getSession(): 쿠키의 JWT를 로컬에서 파싱 → 네트워크 0번
 *
 * 보안: INSERT/DELETE 시 RLS 정책 `auth.uid() = user_id` 가 DB 레벨에서 재검증하므로
 *       Server Action에서 별도 검증 불필요. getSession()으로 user_id만 추출하면 충분.
 */
export async function addFavorite(saunaId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // getSession() — 로컬 JWT 파싱, Supabase 서버 왕복 없음
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    const { error } = await supabase
      .from('favorites')
      .upsert(
        { user_id: session.user.id, sauna_id: saunaId },
        { onConflict: 'user_id,sauna_id', ignoreDuplicates: true }
      )
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('찜 추가 에러:', error)
    throw new Error(error instanceof Error ? error.message : '찜 추가에 실패했습니다.')
  }
}

export async function removeFavorite(saunaId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // getSession() — 로컬 JWT 파싱, 왕복 없음
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', session.user.id)
      .eq('sauna_id', saunaId)
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('찜 제거 에러:', error)
    throw new Error(error instanceof Error ? error.message : '찜 제거에 실패했습니다.')
  }
}
