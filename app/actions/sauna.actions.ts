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

/**
 * #4 Fix: auth.getUser() (서버 왕복) → getSession() (로컬 JWT 파싱)
 * 역할 검증은 DB 조회가 필요하므로 한 번은 유지하되, 인증 확인만 getSession으로 대체.
 */
export async function createSauna(
  payload: Omit<SaunaDto, 'id' | 'created_at'>
): Promise<SaunaDto> {
  try {
    const supabase = await createClient()

    // getSession() — 로컬 JWT 파싱, 네트워크 왕복 없음
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    // 역할 검증 (admin 확인은 DB 조회 필요 — 1번만)
    const { data: userData } = await supabase
      .from('users').select('role').eq('id', session.user.id).single()
    if (userData?.role !== 'admin') throw new Error('관리자 권한이 필요합니다.')

    // 이미지 없으면 카카오 이미지 1회 시도 (등록 시에만 실행)
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
    if (error) throw new Error(error.message)
    return data as SaunaDto
  } catch (error) {
    console.error('사우나 등록 에러:', error)
    throw new Error(error instanceof Error ? error.message : '사우나 등록에 실패했습니다.')
  }
}

export async function updateSauna(
  id: string,
  payload: Omit<SaunaDto, 'id' | 'created_at'>
): Promise<SaunaDto> {
  try {
    const supabase = await createClient()

    // getSession() — 로컬 JWT 파싱, 네트워크 왕복 없음
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('로그인이 필요합니다.')

    // 역할 검증 (admin 확인은 DB 조회 필요 — 1번만)
    const { data: userData } = await supabase
      .from('users').select('role').eq('id', session.user.id).single()
    if (userData?.role !== 'admin') throw new Error('관리자 권한이 필요합니다.')

    const { data, error } = await supabase
      .from('saunas')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as SaunaDto
  } catch (error) {
    console.error('사우나 수정 에러:', error)
    throw new Error(error instanceof Error ? error.message : '사우나 수정에 실패했습니다.')
  }
}
