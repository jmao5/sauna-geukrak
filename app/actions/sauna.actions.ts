'use server'

import { createClient, createPublicClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SaunaDto, SaunaSummaryDto, NearbyRestaurant } from '@/types/sauna'
import type { ThemeId } from '@/constants/home'
import { getKakaoPlaceImage, downloadImageBuffer } from '@/lib/kakao'
import { uploadSaunaImage } from '@/lib/supabase/storage'
import { z } from 'zod'
import webpush from 'web-push'

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
  jjimjilbang: z.number().min(0).optional().nullable(),
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

/** ILIKE 와일드카드(%, _, \)를 리터럴 문자로 취급하도록 이스케이프 */
function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, '\\$&')
}

/**
 * PostgREST .or() 필터 값 인용.
 * 예약문자(, . : * ( ))가 포함된 값은 큰따옴표로 감싸야 필터 파싱이 깨지지 않으며,
 * 따옴표 내부의 " 와 \ 는 백슬래시로 이스케이프한다.
 */
function quoteFilterValue(value: string): string {
  return `"${value.replace(/[\\"]/g, '\\$&')}"`
}

export async function getSaunas(params: GetSaunasParams = {}): Promise<SaunaSummaryDto[]> {
  const { page = 0, pageSize = 20, keyword, region, conditions = [], sort = 'default' } = params
  try {
    const supabase = createPublicClient()
    const from = page * pageSize
    const to = from + pageSize - 1
    
    let query = supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, resting_area, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured')

    if (keyword) {
      const kw = keyword.trim()
      if (kw) {
        const pattern = quoteFilterValue(`%${escapeLikePattern(kw)}%`)
        query = query.or(`name.ilike.${pattern},address.ilike.${pattern}`)
      }
    }
    if (region) {
      query = query.ilike('address', `%${escapeLikePattern(region)}%`)
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
    const supabase = createPublicClient()
    const delta = radiusKm / 111
    const { data, error } = await supabase
      .from('saunas')
      .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, resting_area, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured')
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

const THEME_SELECT =
  'id, name, address, latitude, longitude, sauna_rooms, cold_baths, resting_area, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured'

const EMPTY_THEMES: Record<ThemeId, SaunaSummaryDto[]> = {
  coldest: [], groundwater: [], hottest: [], autoloyly: [], tattoo: [], sesin: [],
}

/**
 * 홈 테마 큐레이션용 사우나 묶음.
 * - 불리언 조건(지하수/타투/오토 로울리)은 DB contains 필터 + 평점순
 * - 수치 비교(냉탕 최저/사우나 최고/세신 최저)는 JSONB 배열 내부 값이라 DB 정렬이 불가하므로
 *   후보 풀(사활 많은 순 300곳)을 받아 서버에서 계산
 * 실패 시 빈 묶음을 돌려 홈 렌더링을 막지 않는다.
 */
export async function getThemeSaunas(limit = 10): Promise<Record<ThemeId, SaunaSummaryDto[]>> {
  try {
    const supabase = createPublicClient()
    const ratingOrder = { ascending: false, nullsFirst: false } as const

    const [pool, groundwater, tattoo, autoloyly] = await Promise.all([
      supabase.from('saunas').select(THEME_SELECT)
        .order('review_count', ratingOrder).limit(300),
      supabase.from('saunas').select(THEME_SELECT)
        .contains('cold_baths', '[{"is_groundwater":true}]').order('avg_rating', ratingOrder).limit(limit),
      supabase.from('saunas').select(THEME_SELECT)
        .contains('rules', '{"tattoo_allowed":true}').order('avg_rating', ratingOrder).limit(limit),
      supabase.from('saunas').select(THEME_SELECT)
        .contains('sauna_rooms', '[{"has_auto_loyly":true}]').order('avg_rating', ratingOrder).limit(limit),
    ])
    for (const res of [pool, groundwater, tattoo, autoloyly]) {
      if (res.error) throw new Error(res.error.message)
    }

    const trim = (rows: SaunaSummaryDto[] | null) =>
      (rows ?? []).map((row) => ({ ...row, images: row.images?.slice(0, 1) ?? [] }))

    const rows = (pool.data ?? []) as SaunaSummaryDto[]
    const minCold = (s: SaunaSummaryDto) => {
      const temps = (s.cold_baths ?? []).map((b) => b.temp).filter((t) => t > 0)
      return temps.length ? Math.min(...temps) : null
    }
    const maxHot = (s: SaunaSummaryDto) => {
      const temps = (s.sauna_rooms ?? []).map((r) => r.temp).filter((t) => t > 0)
      return temps.length ? Math.max(...temps) : null
    }
    const minSesin = (s: SaunaSummaryDto) => {
      const prices = [s.kr_specific?.sesin_price_male, s.kr_specific?.sesin_price_female]
        .filter((p): p is number => typeof p === 'number' && p > 0)
      return prices.length ? Math.min(...prices) : null
    }
    const rank = (metric: (s: SaunaSummaryDto) => number | null, ascending: boolean) =>
      rows
        .map((s) => ({ s, v: metric(s) }))
        .filter((x): x is { s: SaunaSummaryDto; v: number } => x.v !== null)
        .sort((a, b) => (ascending ? a.v - b.v : b.v - a.v))
        .slice(0, limit)
        .map((x) => x.s)

    return {
      coldest:     trim(rank(minCold, true)),
      hottest:     trim(rank(maxHot, false)),
      sesin:       trim(rank(minSesin, true)),
      groundwater: trim(groundwater.data as SaunaSummaryDto[] | null),
      tattoo:      trim(tattoo.data as SaunaSummaryDto[] | null),
      autoloyly:   trim(autoloyly.data as SaunaSummaryDto[] | null),
    }
  } catch (error) {
    console.error('테마 사우나 조회 에러:', error)
    return EMPTY_THEMES
  }
}

export async function getSaunaById(id: string): Promise<SaunaDto> {
  try {
    const supabase = createPublicClient()
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: '로그인이 필요합니다.' }

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

    // ── 가입된 유저들에게 웹 푸시 알림 전송 ──
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
      
      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(
          'mailto:support@sauna-geukrak.com',
          vapidPublicKey,
          vapidPrivateKey
        )

        // 모든 활성 푸시 구독 조회
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('subscription')

        if (subs && subs.length > 0) {
          const pushPayload = JSON.stringify({
            title: '♨️ 새로운 사우나가 등록되었어요!',
            body: `내 주변에 새로운 사우나 [${data.name}]이(가) 등록되었습니다. 시설 정보를 확인해보세요!`,
            url: `/saunas/${data.id}`
          })

          // 비동기로 모든 구독자에게 푸시 전송 (실패하는 일부 기기는 무시)
          await Promise.allSettled(
            subs.map((sub: any) => 
              webpush.sendNotification(sub.subscription, pushPayload)
            )
          )
        }
      }
    } catch (pushErr) {
      console.error('[createSauna] 푸시 알림 전송 오류 (사우나 등록은 성공했으므로 무시):', pushErr)
    }

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: '로그인이 필요합니다.' }

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

/**
 * 사우나 좌표 기준 반경 1km 이내 인기 로컬 음식점(사우나밥) 조회
 */
export async function getNearbyRestaurants(
  lat: number,
  lng: number,
  radius = 1000
): Promise<NearbyRestaurant[]> {
  try {
    const restApiKey = process.env.KAKAO_REST_API_KEY
    if (!restApiKey || !lat || !lng) return []

    const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=FD6&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=10`

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${restApiKey}` },
      next: { revalidate: 3600 }, // 1시간 캐시
    })

    if (!res.ok) {
      console.warn('[getNearbyRestaurants] 카카오 로컬 API 호출 실패:', res.status)
      return []
    }

    const json = await res.json()
    const docs = json.documents ?? []

    return docs.map((d: any) => {
      // "음식점 > 한식 > 육류,고기" -> "한식 > 육류,고기"
      const catParts = (d.category_name ?? '').split('>').map((s: string) => s.trim())
      const cleanCat = catParts.length > 1 ? catParts.slice(1).join(' · ') : catParts[0] || '음식점'

      return {
        id: d.id,
        name: d.place_name,
        category: cleanCat,
        address: d.road_address_name || d.address_name || '',
        phone: d.phone || undefined,
        distanceMeters: parseInt(d.distance || '0', 10),
        placeUrl: d.place_url || `https://map.kakao.com/link/map/${d.id}`,
        lat: d.y ? parseFloat(d.y) : undefined,
        lng: d.x ? parseFloat(d.x) : undefined,
      }
    })
  } catch (err) {
    console.warn('[getNearbyRestaurants] 오류 발생:', err)
    return []
  }
}


