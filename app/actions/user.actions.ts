'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNickname(userId?: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    let uid = userId
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      uid = user.id
    }
    const { data } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', uid)
      .single()
    return data?.nickname ?? null
  } catch {
    return null
  }
}

export async function updateNickname(nickname: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const trimmed = nickname.trim()
    if (!trimmed) return { ok: false, error: '닉네임을 입력해주세요' }
    if (trimmed.length < 2) return { ok: false, error: '2자 이상 입력해주세요' }
    if (trimmed.length > 16) return { ok: false, error: '16자 이하로 입력해주세요' }
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(trimmed)) {
      return { ok: false, error: '한글, 영문, 숫자, _만 사용 가능합니다' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: '로그인이 필요합니다' }

    // 중복 확인
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', trimmed)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) return { ok: false, error: '이미 사용 중인 닉네임입니다' }

    const { error } = await supabase
      .from('users')
      .update({ nickname: trimmed })
      .eq('id', user.id)
    if (error) return { ok: false, error: error.message }

    // Supabase Auth 유저 메타데이터 동기화 (전역 세션 일관성 유지)
    try {
      await supabase.auth.updateUser({
        data: {
          nickname: trimmed,
          full_name: trimmed,
          name: trimmed,
        },
      })
    } catch {
      // Auth 메타데이터 갱신 실패해도 DB 변경은 완료되었으므로 안전하게 유지
    }

    revalidatePath('/my')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: '닉네임 변경에 실패했습니다' }
  }
}
