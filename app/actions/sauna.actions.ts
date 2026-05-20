'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SaunaDto, SaunaSummaryDto } from '@/types/sauna'
import { getKakaoPlaceImage, downloadImageBuffer } from '@/lib/kakao'
import { uploadSaunaImage } from '@/lib/supabase/storage'
import { z } from 'zod'

export interface GetSaunasParams {
  page?: number
  pageSize?: number
  keyword?: string
  region?: string
  conditions?: string[]
  sort?: string
}

const saunaRoomSchema = z.object({
  type: z.string().min(1, '사우나실 종류를 입력해주세요.'),
  gender: z.enum(['male', 'female', 'both']),
  temp: z.number().min(0, '온도는 0도 이상이어야 합니다.'),
  capacity: z.number().min(0, '수용인원은 0명 이상이어야 합니다.'),
  has_tv: z.boolean(),
  has_auto_loyly: z.boolean(),
  has_self_loyly: z.boolean().optional(),
})

const coldBathSchema = z.object({
  temp: z.number().min(0, '온도는 0도 이상이어야 합니다.'),
  gender: z.enum(['male', 'female', 'both']),
  capacity: z.number().min(0, '수용인원은 0명 이상이어야 합니다.'),
  is_groundwater: z.boolean(),
  depth: z.number().min(0, '수심은 0cm 이상이어야 합니다.'),
})

const restingAreaSchema = z.object({
  indoor_seats: z.number().min(0),
  outdoor_seats: z.number().min(0),
  infinity_chairs: z.number().min(0),
  deck_chairs: z.number().min(0),
})

const amenitiesSchema = z.object({
  towel: z.boolean(),
  shampoo: z.boolean(),
  body_wash: z.boolean(),
  hair_dryer: z.boolean(),
  water_dispenser: z.boolean().optional(),
})

const rulesSchema = z.object({
  tattoo_allowed: z.boolean(),
  female_allowed: z.boolean(),
  male_allowed: z.boolean(),
})

const krSpecificSchema = z.object({
  has_jjimjilbang: z.boolean(),
  sesin_price_male: z.number().min(0),
  sesin_price_female: z.number().min(0),
  food: z.array(z.string()).optional().nullable(),
})

const pricingSchema = z.object({
  adult_day: z.number().min(0),
  adult_night: z.number().min(0),
  child: z.number().min(0),
})

const instagramMediaSchema = z.object({
  url: z.string().url('올바른 URL을 입력해주세요.'),
  type: z.enum(['reel', 'post']),
  caption: z.string().optional().nullable(),
  thumbnail_url: z.string().optional().nullable(),
})

const saunaSchema = z.object({
  name: z.string().min(1, '시설명을 입력해주세요.'),
  address: z.string().min(1, '주소를 입력해주세요.'),
  latitude: z.number(),
  longitude: z.number(),
  contact: z.string().optional().nullable(),
  business_hours: z.string().optional().nullable(),
  parking: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  floor_plan_images: z.array(z.string()).optional(),
  instagram_media: z.array(instagramMediaSchema).optional(),
  sauna_rooms: z.array(saunaRoomSchema),
  cold_baths: z.array(coldBathSchema),
  resting_area: restingAreaSchema,
  amenities: amenitiesSchema,
  rules: rulesSchema,
  kr_specific: krSpecificSchema,
  pricing: pricingSchema,
})

export async function getSaunas(params: GetSaunasParams = {}): Promise<SaunaSummaryDto[]> {
  const { page = 0, pageSize = 20, keyword, region, conditions = [], sort = 'default' } = params
  try {
    const supabase = await createClient()
    const from = page * pageSize
    const to = from + pageSize - 1
    
    let query = supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured')

    if (keyword) {
      const kw = keyword.trim()
      query = query.or(`name.ilike.%${kw}%,address.ilike.%${kw}%`)
    }
    if (region) {
      query = query.ilike('address', `%${region}%`)
    }

    const isFemale = conditions.includes('female')
    const isMale = conditions.includes('male')
    const pref = (isFemale && !isMale) ? 'female' : (!isFemale && isMale) ? 'male' : null

    for (const cond of conditions) {
      switch (cond) {
        case 'autoloyly':
          if (pref) {
             query = query.or(`sauna_rooms.cs.[{"has_auto_loyly":true,"gender":"${pref}"}],sauna_rooms.cs.[{"has_auto_loyly":true,"gender":"both"}]`)
          } else {
             query = query.contains('sauna_rooms', '[{"has_auto_loyly":true}]')
          }
          break
        case 'groundwater':
          if (pref) {
             query = query.or(`cold_baths.cs.[{"is_groundwater":true,"gender":"${pref}"}],cold_baths.cs.[{"is_groundwater":true,"gender":"both"}]`)
          } else {
             query = query.contains('cold_baths', '[{"is_groundwater":true}]')
          }
          break
        case 'jjimjilbang':
          query = query.contains('kr_specific', '{"has_jjimjilbang":true}')
          break
        case 'tattoo':
          query = query.contains('rules', '{"tattoo_allowed":true}')
          break
        case 'female':
          query = query.contains('rules', '{"female_allowed":true}')
          break
        case 'male':
          query = query.contains('rules', '{"male_allowed":true}')
          break
        case 'parking':
          query = query.eq('parking', true)
          break
      }
    }

    switch (sort) {
      case 'rating': query = query.order('avg_rating', { ascending: false, nullsFirst: false }); break
      case 'reviews': query = query.order('review_count', { ascending: false, nullsFirst: false }); break
      default: query = query.order('created_at', { ascending: false }); break
    }

    query = query.range(from, to)

    const { data, error } = await query
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
      return Math.sqrt(dLat * dLat + dLng * dLng) * 111 <= radiusKm
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

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function createSauna(
  payload: Omit<SaunaDto, 'id' | 'created_at'>
): Promise<ActionResult<SaunaDto>> {
  try {
    const parsed = saunaSchema.safeParse(payload)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || '잘못된 입력 양식입니다.' }
    }
    const validatedPayload = parsed.data

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: '로그인이 필요합니다.' }

    let finalImages = validatedPayload.images ?? []
    if (finalImages.length === 0) {
      try {
        const kakaoImageUrl = await getKakaoPlaceImage(validatedPayload.name, validatedPayload.address)
        if (kakaoImageUrl) {
          const downloaded = await downloadImageBuffer(kakaoImageUrl)
          if (downloaded) {
            const storedUrl = await uploadSaunaImage(
              downloaded.buffer, downloaded.contentType, `saunas/${crypto.randomUUID()}`
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
      .insert({ ...validatedPayload, images: finalImages })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }

    // ISR 캐시 즉시 무효화
    revalidatePath('/')

    return { ok: true, data: data as SaunaDto }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : '사우나 등록에 실패했습니다.' }
  }
}

export async function updateSauna(
  id: string,
  payload: Omit<SaunaDto, 'id' | 'created_at'>
): Promise<ActionResult<SaunaDto>> {
  try {
    const parsed = saunaSchema.safeParse(payload)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || '잘못된 입력 양식입니다.' }
    }
    const validatedPayload = parsed.data

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: '로그인이 필요합니다.' }

    const { data, error } = await supabase
      .from('saunas')
      .update(validatedPayload)
      .eq('id', id)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }

    // ISR 캐시 즉시 무효화
    revalidatePath('/')
    revalidatePath(`/saunas/${id}`)

    return { ok: true, data: data as SaunaDto }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : '사우나 수정에 실패했습니다.' }
  }
}

/**
 * 카카오 검색 이미지 캐싱용 Lazy Syncing 서버 액션
 * 이미지가 완전히 비어있는 사우나에 대해, 크롤링된 카카오 이미지를 자동으로 DB에 보존합니다.
 */
export async function updateSaunaImages(
  id: string,
  imageUrls: string[]
): Promise<ActionResult<void>> {
  try {
    if (!id || !imageUrls || imageUrls.length === 0) {
      return { ok: false, error: '유효하지 않은 요청 데이터입니다.' }
    }

    const supabase = await createClient()
    
    // 1. 기존 사우나의 이미지가 비어있는지 조회
    const { data: sauna, error: fetchError } = await supabase
      .from('saunas')
      .select('images')
      .eq('id', id)
      .single()

    if (fetchError || !sauna) {
      return { ok: false, error: fetchError?.message || '사우나를 찾을 수 없습니다.' }
    }

    // 기존 이미지가 이미 존재한다면 중복 업데이트 방지 스킵
    if (sauna.images && sauna.images.length > 0) {
      return { ok: true, data: undefined }
    }

    // 2. 이미지 업데이트 실행
    const { error: updateError } = await supabase
      .from('saunas')
      .update({ images: imageUrls })
      .eq('id', id)

    if (updateError) {
      return { ok: false, error: updateError.message }
    }

    // 캐시 즉시 무효화
    revalidatePath('/')
    revalidatePath(`/saunas/${id}`)

    return { ok: true, data: undefined }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : '이미지 동기화에 실패했습니다.' }
  }
}

