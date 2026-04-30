import { createClient as createBrowserClient } from './supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SaunaDto, SaunaSummaryDto, ReviewDto, ReviewUser, MyReviewDto, MyFavoriteDto, Session } from '@/types/sauna'

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
    /** 사우나 등록 */
    create: async (
      payload: Omit<SaunaDto, 'id' | 'created_at'>,
      customClient?: SupabaseClient
    ): Promise<SaunaDto> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('saunas').insert(payload).select().single()
      if (error) throw new Error(`사우나 등록에 실패했습니다: ${error.message}`)
      return data as SaunaDto
    },

    /** 사우나 수정 */
    update: async (
      id: string,
      payload: Omit<SaunaDto, 'id' | 'created_at'>,
      customClient?: SupabaseClient
    ): Promise<SaunaDto> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('saunas').update(payload).eq('id', id).select().single()
      if (error) throw new Error(`사우나 수정에 실패했습니다: ${error.message}`)
      return data as SaunaDto
    },

    /** 사우나 목록 (페이지네이션, SSR 지원) */
    getAll: async (customClient?: SupabaseClient, page = 0, pageSize = 20): Promise<SaunaSummaryDto[]> => {
      const supabase = getSupabaseClient(customClient)
      const from = page * pageSize
      const to = from + pageSize - 1
      const { data, error } = await supabase
        .from('saunas')
        .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count, is_featured')
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw new Error(`사우나 목록을 불러오는데 실패했습니다.`)
      return (data as SaunaSummaryDto[]).map((row) => ({
        ...row,
        images: row.images?.slice(0, 1) ?? [],
      }))
    },

    /** 특정 사우나 상세 정보 (SSR 지원) */
    getById: async (id: string, customClient?: SupabaseClient): Promise<SaunaDto> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('saunas').select('*').eq('id', id).single()
      if (error) throw new Error(`사우나 정보를 불러오는데 실패했습니다.`)
      return data as SaunaDto
    },

    /** 텍스트 검색 + 필터 — 이름/주소 풀텍스트 검색 */
    search: async (params: SaunaSearchParams, customClient?: SupabaseClient): Promise<SaunaSummaryDto[]> => {
      const supabase = getSupabaseClient(customClient)
      let query = supabase
        .from('saunas')
        .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths, pricing, rules, kr_specific, images, avg_rating, review_count')
      if (params.query) {
        // search_vector 컴럼이 있으면 풀텍스트, 없으면 ilike fallback
        query = query.or(`name.ilike.%${params.query}%,address.ilike.%${params.query}%`)
      }
      if (params.tattooAllowed) query = query.eq('rules->>tattoo_allowed', 'true')
      if (params.femaleAllowed) query = query.eq('rules->>female_allowed', 'true')
      if (params.hasJjimjilbang) query = query.eq('kr_specific->>has_jjimjilbang', 'true')
      if (params.hasAutoloyly) query = query.filter('sauna_rooms', 'cs', '[{"has_auto_loyly":true}]')
      if (params.hasGroundwater) query = query.filter('cold_baths', 'cs', '[{"is_groundwater":true}]')
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw new Error(`검색에 실패했습니다.`)
      return data as SaunaSummaryDto[]
    },
  },

  reviews: {
    /** 사우나별 리뷰 목록 */
    getBySaunaId: async (saunaId: string, customClient?: SupabaseClient): Promise<ReviewDto[]> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('reviews')
        .select(`id, rating, content, visit_date, visit_time, congestion, sessions, images, created_at,
          users (id, nickname, avatar_url)`)
        .eq('sauna_id', saunaId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw new Error(`리뷰를 불러오는데 실패했습니다.`)
      
      return (data as ReviewDto[]).map(row => ({
        ...row,
        users: Array.isArray(row.users) ? (row.users as ReviewUser[])[0] : row.users
      }))
    },

    /** 유저별 사활 기록 (마이페이지) */
    getByUserId: async (userId: string, customClient?: SupabaseClient): Promise<MyReviewDto[]> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('reviews')
        .select(`id, rating, content, visit_date, visit_time, created_at,
          saunas (id, name, address, sauna_rooms, cold_baths, images)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`사활 기록을 불러오는데 실패했습니다.`)
      
      return (data as MyReviewDto[]).map(row => ({
        ...row,
        saunas: Array.isArray(row.saunas) ? (row.saunas as SaunaSummaryDto[])[0] : row.saunas
      }))
    },

    create: async (
      review: {
        sauna_id: string; user_id: string; rating: number; content?: string
        visit_date: string; visit_time?: string; congestion?: string
        sessions?: Session[]; images?: string[]
      },
      customClient?: SupabaseClient
    ) => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single()
      if (error) throw new Error(`리뷰 작성에 실패했습니다: ${error.message}`)
      return data
    },
  },

  favorites: {
    getByUserId: async (userId: string, customClient?: SupabaseClient): Promise<MyFavoriteDto[]> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('favorites')
        .select('sauna_id, created_at, saunas (id, name, address, sauna_rooms, cold_baths, images)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`찜 목록을 불러오는데 실패했습니다.`)
      
      return (data as MyFavoriteDto[]).map(row => ({
        ...row,
        saunas: Array.isArray(row.saunas) ? (row.saunas as SaunaSummaryDto[])[0] : row.saunas
      }))
    },

    add: async (userId: string, saunaId: string, customClient?: SupabaseClient) => {
      const supabase = getSupabaseClient(customClient)
      const { error } = await supabase
        .from('favorites')
        .upsert({ user_id: userId, sauna_id: saunaId }, { onConflict: 'user_id,sauna_id' })
      if (error) throw new Error(`찜 추가에 실패했습니다: ${error.message}`)
    },

    remove: async (userId: string, saunaId: string, customClient?: SupabaseClient) => {
      const supabase = getSupabaseClient(customClient)
      const { error } = await supabase
        .from('favorites').delete().eq('user_id', userId).eq('sauna_id', saunaId)
      if (error) throw new Error(`찜 제거에 실패했습니다: ${error.message}`)
    },

    check: async (userId: string, saunaId: string, customClient?: SupabaseClient): Promise<boolean> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('favorites').select('user_id').eq('user_id', userId).eq('sauna_id', saunaId).maybeSingle()
      if (error) return false
      return !!data
    },
  },

  storage: {
    uploadImage: async (saunaId: string, file: File, customClient?: SupabaseClient): Promise<string> => {
      const supabase = getSupabaseClient(customClient)
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${saunaId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('sauna-geukrak')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (error) throw new Error(`이미지 업로드 실패: ${error.message}`)
      const { data } = supabase.storage.from('sauna-geukrak').getPublicUrl(path)
      return data.publicUrl
    },

    /** 여러 장 병렬 업로드. 실패한 파일은 Storage에서 정리 후 에러를 던집니다. */
    uploadImages: async (saunaId: string, files: File[], customClient?: SupabaseClient): Promise<string[]> => {
      const supabase = getSupabaseClient(customClient)
      const uploaded: string[] = []
      const results = await Promise.allSettled(
        files.map(async (file) => {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `${saunaId}/${crypto.randomUUID()}.${ext}`
          const { error } = await supabase.storage
            .from('sauna-geukrak')
            .upload(path, file, { upsert: false, contentType: file.type })
          if (error) throw new Error(path) // 실패 시 path를 실어 정리 가능하게
          const { data } = supabase.storage.from('sauna-geukrak').getPublicUrl(path)
          return data.publicUrl
        })
      )
      // 부분 실패: 성공한 파일만 반환, 실패한 고아 파일은 Storage에서 제거
      const failed: string[] = []
      results.forEach((r) => {
        if (r.status === 'fulfilled') uploaded.push(r.value)
        else if (r.reason instanceof Error) failed.push(r.reason.message)
      })
      if (failed.length > 0) {
        await supabase.storage.from('sauna-geukrak').remove(failed).catch(() => null)
        throw new Error(`${failed.length}개 업로드 실패. 성공: ${uploaded.length}개`)
      }
      return uploaded
    },

    deleteImage: async (publicUrl: string, customClient?: SupabaseClient): Promise<void> => {
      const supabase = getSupabaseClient(customClient)
      const marker = '/sauna-geukrak/'
      const idx = publicUrl.indexOf(marker)
      if (idx === -1) return
      const path = publicUrl.slice(idx + marker.length)
      const { error } = await supabase.storage.from('sauna-geukrak').remove([path])
      if (error) throw new Error(`이미지 삭제 실패: ${error.message}`)
    },
  },
}
