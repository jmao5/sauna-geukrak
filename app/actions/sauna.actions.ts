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

export async function searchSaunas(query: string): Promise<SaunaSummaryDto[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count')
      // PostgreSQL의 to_tsquery 문법에 맞게 검색어를 변환 (공백을 &로 치환)
      .textSearch('search_vector', query.trim().split(/\s+/).join(' & '))
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as SaunaSummaryDto[]
  } catch (error) {
    console.error('사우나 검색 에러:', error)
    throw new Error('검색에 실패했습니다.')
  }
}

export async function createSauna(
  payload: Omit<SaunaDto, 'id' | 'created_at'>
): Promise<SaunaDto> {
  try {
    const supabase = await createClient()

    // 1. 세션 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('로그인이 필요합니다.')

    // 2. 권한 검증
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'admin') throw new Error('관리자 권한이 필요합니다.')

    // 3. 이미지가 없으면 카카오에서 가져와 Storage에 영구 저장
    //    - 등록 시 1회만 실행 → 이후 카드/상세 페이지는 CDN URL 직접 사용
    let finalImages = payload.images ?? []

    if (finalImages.length === 0) {
      try {
        const kakaoImageUrl = await getKakaoPlaceImage(payload.name, payload.address)

        if (kakaoImageUrl) {
          // 임시 UUID로 폴더 경로 생성 (DB INSERT 전이라 id 없음)
          const tempId = crypto.randomUUID()
          const downloaded = await downloadImageBuffer(kakaoImageUrl)

          if (downloaded) {
            const storedUrl = await uploadSaunaImage(
              downloaded.buffer,
              downloaded.contentType,
              `saunas/${tempId}`
            )
            if (storedUrl) finalImages = [storedUrl]
          }
        }
      } catch (imgErr) {
        // 이미지 처리 실패는 등록 자체를 막지 않음
        console.warn('[createSauna] 이미지 자동 처리 실패 (무시):', imgErr)
      }
    }

    // 4. DB INSERT
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

    // 1. 세션 검증 (보안)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('로그인이 필요합니다.')

    // 2. 권한 검증 (Admin만 수정 가능)
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
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
