// src/actions/sauna.actions.ts
'use server' // 이 지시어가 핵심입니다. 이 파일의 함수들은 항상 서버에서만 실행됩니다.

import { createClient } from '@/lib/supabase/server' // 작성해두신 서버용 클라이언트 생성 함수
import { SaunaSummaryDto } from '@/types/sauna'

// customClient 인자가 완전히 사라졌습니다!
export async function getSaunas(page = 0, pageSize = 20): Promise<SaunaSummaryDto[]> {
  try {
    // 1. 서버용 Supabase 클라이언트를 내부에서 직접 생성합니다.
    const supabase = await createClient()
    
    const from = page * pageSize
    const to = from + pageSize - 1

    // 2. 데이터 페칭
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