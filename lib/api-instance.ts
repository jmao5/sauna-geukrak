import { createClient } from './supabase/client'
import { SaunaDto, SaunaSummaryDto } from '@/types/sauna'

// 사우나 API 인스턴스 객체
export const api = {
  saunas: {
    // 모든 사우나 목록 가져오기
    getAll: async (): Promise<SaunaSummaryDto[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('saunas')
        .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths')

      if (error) {
        throw new Error(`Failed to fetch saunas: ${error.message}`)
      }
      
      return data as SaunaSummaryDto[]
    },
    
    // 특정 사우나 상세 정보 가져오기 (추후 사용을 위해 미리 정의)
    getById: async (id: string): Promise<SaunaDto> => {
      const supabase = createClient()
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

