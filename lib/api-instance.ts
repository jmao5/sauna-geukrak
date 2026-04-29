import { createClient as createBrowserClient } from './supabase/client'
import { createBrowserClient as createAuthedBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SaunaDto, SaunaSummaryDto } from '@/types/sauna'

/**
 * access_token을 주입한 인증된 Supabase 클라이언트 생성
 * global.headers 옵션으로 주입하므로 @ts-ignore 불필요
 */
const getAuthedClient = (accessToken: string): SupabaseClient => {
  return createAuthedBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  )
}

const getSupabaseClient = (customClient?: SupabaseClient): SupabaseClient => {
  return customClient && typeof customClient.from === 'function'
    ? customClient
    : createBrowserClient()
}

export interface SaunaSearchParams {
  query?: string
  tattooAllowed?: boolean
  femaleAllowed?: boolean
  maleAllowed?: boolean
  hasJjimjilbang?: boolean
  hasAutoloyly?: boolean
  hasGroundwater?: boolean
  minSaunaTemp?: number
  maxColdTemp?: number
}

export const api = {
  saunas: {
    /** 사우나 등록 (로그인 필요 — access_token 사용) */
    create: async (
      payload: Omit<SaunaDto, 'id' | 'created_at'>,
      accessToken: string
    ): Promise<SaunaDto> => {
      const supabase = getAuthedClient(accessToken)
      const { data, error } = await supabase
        .from('saunas')
        .insert(payload)
        .select()
        .single()

      if (error) throw new Error(`사우나 등록에 실패했습니다.`)
      return data as SaunaDto
    },

    /** 모든 사우나 목록 (SSR 지원) */
    getAll: async (customClient?: SupabaseClient): Promise<SaunaSummaryDto[]> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('saunas')
        .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images')
        .order('created_at', { ascending: false })

      if (error) throw new Error(`사우나 목록을 불러오는데 실패했습니다.`)
      return data as SaunaSummaryDto[]
    },

    /** 특정 사우나 상세 정보 (SSR 지원) */
    getById: async (id: string, customClient?: SupabaseClient): Promise<SaunaDto> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('saunas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(`사우나 정보를 불러오는데 실패했습니다.`)
      return data as SaunaDto
    },

    /** 텍스트 검색 + 필터 기반 목록 */
    search: async (params: SaunaSearchParams, customClient?: SupabaseClient): Promise<SaunaSummaryDto[]> => {
      const supabase = getSupabaseClient(customClient)
      let query = supabase
        .from('saunas')
        .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images')

      if (params.query) {
        query = query.ilike('name', `%${params.query}%`)
      }
      if (params.tattooAllowed) {
        query = query.eq('rules->>tattoo_allowed', 'true')
      }
      if (params.femaleAllowed) {
        query = query.eq('rules->>female_allowed', 'true')
      }
      if (params.hasJjimjilbang) {
        query = query.eq('kr_specific->>has_jjimjilbang', 'true')
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw new Error(`검색에 실패했습니다.`)
      return data as SaunaSummaryDto[]
    },
  },

  reviews: {
    /** 특정 사우나의 리뷰 목록 */
    getBySaunaId: async (saunaId: string, customClient?: SupabaseClient) => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, rating, content, visit_date, visit_time, congestion, sessions, images, created_at,
          users (id, nickname, avatar_url)
        `)
        .eq('sauna_id', saunaId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw new Error(`리뷰를 불러오는데 실패했습니다.`)
      return data
    },

    /** 리뷰 작성 */
    create: async (
      review: {
        sauna_id: string
        user_id: string
        rating: number
        content?: string
        visit_date: string
        visit_time?: string
        congestion?: string
        sessions?: object[]
        images?: string[]
      },
      customClient?: SupabaseClient
    ) => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase.from('reviews').insert(review).select().single()
      if (error) throw new Error(`리뷰 작성에 실패했습니다.`)
      return data
    },
  },

  favorites: {
    /** 유저의 찜 목록 조회 */
    getByUserId: async (userId: string, customClient?: SupabaseClient) => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('favorites')
        .select('sauna_id, created_at, saunas (id, name, address, sauna_rooms, cold_baths, images)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`찜 목록을 불러오는데 실패했습니다.`)
      return data
    },

    /** 찜 추가 */
    add: async (userId: string, saunaId: string, customClient?: SupabaseClient) => {
      const supabase = getSupabaseClient(customClient)
      const { error } = await supabase.from('favorites').insert({ user_id: userId, sauna_id: saunaId })
      if (error) throw new Error(`찜 추가에 실패했습니다.`)
    },

    /** 찜 제거 */
    remove: async (userId: string, saunaId: string, customClient?: SupabaseClient) => {
      const supabase = getSupabaseClient(customClient)
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('sauna_id', saunaId)
      if (error) throw new Error(`찜 제거에 실패했습니다.`)
    },

    /** 특정 사우나 찜 여부 */
    check: async (userId: string, saunaId: string, customClient?: SupabaseClient): Promise<boolean> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('favorites')
        .select('user_id')
        .eq('user_id', userId)
        .eq('sauna_id', saunaId)
        .maybeSingle()  // .single()은 0행이면 406 에러 → maybeSingle()은 0행이면 null 반환

      if (error) return false
      return !!data
    },
  },
}
