'use server'

import { createClient } from '@/lib/supabase/server'
import { MyFavoriteDto, SaunaSummaryDto } from '@/types/sauna'

export async function getFavoritesByUserId(userId: string): Promise<MyFavoriteDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        sauna_id,
        created_at,
        memo,
        status,
        saunas (
          id, name, address, sauna_rooms, cold_baths,
          images, avg_rating, review_count, pricing, rules, kr_specific
        )
      `)
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

/** 특정 사우나의 찜 수 조회 */
export async function getFavoriteCount(saunaId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('sauna_id', saunaId)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
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

export async function addFavorite(saunaId: string): Promise<void> {
  try {
    const supabase = await createClient()
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
    throw new Error(error instanceof Error ? error.message : '찜 추가에 실패했습니다.')
  }
}

export async function removeFavorite(saunaId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', session.user.id)
      .eq('sauna_id', saunaId)
    if (error) throw new Error(error.message)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '찜 제거에 실패했습니다.')
  }
}

export async function updateFavoriteMemo(saunaId: string, memo: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    const { error } = await supabase
      .from('favorites')
      .update({ memo: memo.trim() || null })
      .eq('user_id', session.user.id)
      .eq('sauna_id', saunaId)
    if (error) throw new Error(error.message)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '메모 저장에 실패했습니다.')
  }
}

export async function updateFavoriteStatus(
  saunaId: string,
  status: 'want' | 'visited'
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    const { error } = await supabase
      .from('favorites')
      .update({ status })
      .eq('user_id', session.user.id)
      .eq('sauna_id', saunaId)
    if (error) throw new Error(error.message)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '상태 변경에 실패했습니다.')
  }
}
