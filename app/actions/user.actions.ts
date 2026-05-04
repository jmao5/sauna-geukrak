'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNickname(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const { data } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', session.user.id)
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: '로그인이 필요합니다' }

    // 중복 확인
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', trimmed)
      .neq('id', session.user.id)
      .maybeSingle()
    if (existing) return { ok: false, error: '이미 사용 중인 닉네임입니다' }

    const { error } = await supabase
      .from('users')
      .update({ nickname: trimmed })
      .eq('id', session.user.id)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/my')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: '닉네임 변경에 실패했습니다' }
  }
}
