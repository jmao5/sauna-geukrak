import { createClient as createBrowserClient } from './supabase/client'
import { SaunaDto, SaunaSummaryDto } from '@/types/sauna'

// Helper to check if customClient is a valid SupabaseClient
const getSupabaseClient = (customClient?: any) => {
  return (customClient && typeof customClient.from === 'function') 
    ? customClient 
    : createBrowserClient()
}

// 사우나 API 인스턴스 객체
export const api = {
  saunas: {
    // 모든 사우나 목록 가져오기 (SSR 지원을 위해 customClient 옵션 추가)
    getAll: async (customClient?: any): Promise<SaunaSummaryDto[]> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('saunas')
        .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths')

      if (error) {
        throw new Error(`Failed to fetch saunas: ${error.message}`)
      }
      
      return data as SaunaSummaryDto[]
    },
    
    // 특정 사우나 상세 정보 가져오기 (SSR 지원을 위해 customClient 옵션 추가)
    getById: async (id: string, customClient?: any): Promise<SaunaDto> => {
      const supabase = getSupabaseClient(customClient)
      const { data, error } = await supabase
        .from('saunas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(`Failed to fetch sauna ${id}: ${error.message}`)
      }
      
      return data as SaunaDto
    }
  }
}

