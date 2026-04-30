'use server'

import { createClient } from '@/lib/supabase/server'
import { SaunaDto, SaunaSummaryDto } from '@/types/sauna'

export async function getSaunas(page = 0, pageSize = 20): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return (data as SaunaSummaryDto[]).map((row) => ({
      ...row,
      images: row.images?.slice(0, 1) ?? [],
    }))
  } catch (error) {
    console.error('사우나 목록 조회 에러:', error)
    throw new Error('사우나 목록을 불러오는데 실패했습니다.')
  }
}

export async function getSaunaById(id: string): Promise<SaunaDto> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data as SaunaDto
  } catch (error) {
    console.error('사우나 상세 조회 에러:', error)
    throw new Error('사우나 정보를 불러오는데 실패했습니다.')
  }
}

export async function searchSaunas(query: string): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as SaunaSummaryDto[]
  } catch (error) {
    console.error('사우나 검색 에러:', error)
    throw new Error('검색에 실패했습니다.')
  }
}
