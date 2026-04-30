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
    const { error } = await supabase
      .from('favorites')
      .upsert({ user_id: userId, sauna_id: saunaId }, { onConflict: 'user_id,sauna_id' })
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('찜 추가 에러:', error)
    throw new Error('찜 추가에 실패했습니다.')
  }
}

export async function removeFavorite(userId: string, saunaId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('sauna_id', saunaId)
    if (error) throw new Error(error.message)
  } catch (error) {
    console.error('찜 제거 에러:', error)
    throw new Error('찜 제거에 실패했습니다.')
  }
}
