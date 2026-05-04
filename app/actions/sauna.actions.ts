'use server'

import { createClient } from '@/lib/supabase/server'
import { SaunaDto, SaunaSummaryDto } from '@/types/sauna'
import { getKakaoPlaceImage, downloadImageBuffer } from '@/lib/kakao'
import { uploadSaunaImage } from '@/lib/supabase/storage'

const SUMMARY_SELECT =
  'id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured'

function toSummary(row: any): SaunaSummaryDto {
  return { ...row, images: row.images?.slice(0, 1) ?? [] }
}

export async function getFeaturedSaunas(): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured')
      .eq('is_featured', true)
      .order('review_count', { ascending: false })
      .limit(10)
    if (error) throw new Error(error.message)
    return data as SaunaSummaryDto[]
  } catch (error) {
    console.error('에디터 픽 조회 에러:', error)
    return []
  }
}

export async function getTopReviewedSaunas(limit = 10): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count')
      .order('review_count', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data as SaunaSummaryDto[]
  } catch (error) {
    console.error('TOP 리븷 조회 에러:', error)
    return []
  }
}

export async function getSaunas(page = 0, pageSize = 20): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('saunas')
      .select(SUMMARY_SELECT)
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return (data as any[]).map(toSummary)
  } catch (error) {
    console.error('사우나 목록 조회 에러:', error)
    throw new Error('사우나 목록을 불러오는데 실패했습니다.')
  }
}

/** TOP 10: 이번 달 사활 수 기준 */
export async function getTopSaunas(limit = 10): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select(SUMMARY_SELECT)
      .order('review_count', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data as any[]).map(toSummary)
  } catch {
    return []
  }
}

/** 에디터 픽 (is_featured = true) */
export async function getFeaturedSaunas(): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select(SUMMARY_SELECT)
      .eq('is_featured', true)
      .order('review_count', { ascending: false })
      .limit(10)
    if (error) throw new Error(error.message)
    return (data as any[]).map(toSummary)
  } catch {
    return []
  }
}

/** 위치 기반 — 가까운 순 (정렬은 클라이언트에서 거리 계산) */
export async function getSaunasByLocation(
  lat: number,
  lng: number,
  radiusKm = 10
): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const delta = radiusKm / 111
    const { data, error } = await supabase
      .from('saunas')
      .select(SUMMARY_SELECT)
      .gte('latitude',  lat - delta)
      .lte('latitude',  lat + delta)
      .gte('longitude', lng - delta)
      .lte('longitude', lng + delta)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    const list = (data as any[]).map(toSummary)
    return list
      .map((s) => ({
        ...s,
        _dist: Math.sqrt((s.latitude - lat) ** 2 + (s.longitude - lng) ** 2) * 111,
      }))
      .filter((s) => s._dist <= radiusKm)
      .sort((a, b) => a._dist - b._dist)
      .map(({ _dist, ...rest }) => rest)
  } catch (error) {
    console.error('위치 기반 사우나 조회 에러:', error)
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

export async function getReviewsBySaunaId(id: string) {
  const { getReviewsBySaunaId: _get } = await import('@/app/actions/review.actions')
  return _get(id)
}

export async function getPopularKeywords(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select('name, address, review_count')
      .order('review_count', { ascending: false })
      .limit(10)
    if (error) throw new Error(error.message)
    const keywords: string[] = []
    for (const row of (data ?? [])) {
      const regionMatch = row.address?.match(/^(\S+[시군구])/)
      if (regionMatch) keywords.push(regionMatch[1])
      keywords.push(row.name)
    }
    return [...new Set(keywords)].slice(0, 5)
  } catch {
    return []
  }
}

export async function searchSaunas(query: string): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select(SUMMARY_SELECT)
      .textSearch('search_vector', query.trim().split(/\s+/).join(' & '))
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as any[]).map(toSummary)
  } catch (error) {
    console.error('사우나 검색 에러:', error)
    throw new Error('검색에 실패했습니다.')
  }
}

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function createSauna(
  payload: Omit<SaunaDto, 'id' | 'created_at'>
): Promise<ActionResult<SaunaDto>> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: '로그인이 필요합니다.' }

    let finalImages = payload.images ?? []
    if (finalImages.length === 0) {
      try {
        const kakaoImageUrl = await getKakaoPlaceImage(payload.name, payload.address)
        if (kakaoImageUrl) {
          const tempId = crypto.randomUUID()
          const downloaded = await downloadImageBuffer(kakaoImageUrl)
          if (downloaded) {
            const storedUrl = await uploadSaunaImage(
              downloaded.buffer, downloaded.contentType, `saunas/${tempId}`
            )
            if (storedUrl) finalImages = [storedUrl]
          }
        }
      } catch (imgErr) {
        console.warn('[createSauna] 이미지 자동 처리 실패 (무시):', imgErr)
      }
    }

    const { data, error } = await supabase
      .from('saunas')
      .insert({ ...payload, images: finalImages })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as SaunaDto }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '사우나 등록에 실패했습니다.',
    }
  }
}

export async function updateSauna(
  id: string,
  payload: Omit<SaunaDto, 'id' | 'created_at'>
): Promise<ActionResult<SaunaDto>> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: '로그인이 필요합니다.' }

    const { data, error } = await supabase
      .from('saunas')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as SaunaDto }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '사우나 수정에 실패했습니다.',
    }
  }
}
