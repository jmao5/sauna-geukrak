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

export async function addFavorite(userId: string, saunaId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // 1. 세션 검증 (보안) - 클라이언트에서 보낸 userId를 신뢰하지 않음
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('로그인이 필요합니다.')
    if (user.id !== userId) throw new Error('잘못된 접근입니다.')

    const { error } = await supabase
      .from('favorites')
      .upsert({ user_id: user.id, sauna_id: saunaId }, { onConflict: 'user_id,sauna_id' })
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('찜 추가 에러:', error)
    throw new Error(error instanceof Error ? error.message : '찜 추가에 실패했습니다.')
  }
}

export async function removeFavorite(userId: string, saunaId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // 1. 세션 검증 (보안) - 클라이언트에서 보낸 userId를 신뢰하지 않음
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('로그인이 필요합니다.')
    if (user.id !== userId) throw new Error('잘못된 접근입니다.')

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('sauna_id', saunaId)
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('찜 제거 에러:', error)
    throw new Error(error instanceof Error ? error.message : '찜 제거에 실패했습니다.')
  }
}

