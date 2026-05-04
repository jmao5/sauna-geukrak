'use server'

import { createClient } from '@/lib/supabase/server'
import { SaunaDto, SaunaSummaryDto } from '@/types/sauna'
import { getKakaoPlaceImage, downloadImageBuffer } from '@/lib/kakao'
import { uploadSaunaImage } from '@/lib/supabase/storage'

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
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured')
      .gte('latitude',  lat - delta)
      .lte('latitude',  lat + delta)
      .gte('longitude', lng - delta)
      .lte('longitude', lng + delta)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    const filtered = (data as SaunaSummaryDto[]).filter((s) => {
      const dLat = s.latitude  - lat
      const dLng = s.longitude - lng
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111
      return distKm <= radiusKm
    })
    return filtered.map((row) => ({
      ...row,
      images: row.images?.slice(0, 1) ?? [],
    }))
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
      // 주소에서 시/군/구 추출
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
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count')
      .textSearch('search_vector', query.trim().split(/\s+/).join(' & '))
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as SaunaSummaryDto[]
  } catch (error) {
    console.error('사우나 검색 에러:', error)
    throw new Error('검색에 실패했습니다.')
  }
}

// ── 결과 타입 ──────────────────────────────────────────────
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

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

    if (error) {
      console.error('사우나 등록 DB 에러:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data as SaunaDto }
  } catch (error) {
    console.error('사우나 등록 에러:', error)
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

    if (error) {
      console.error('사우나 수정 DB 에러:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data as SaunaDto }
  } catch (error) {
    console.error('사우나 수정 에러:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : '사우나 수정에 실패했습니다.',
    }
  }
}
