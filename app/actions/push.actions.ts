'use server'

import { createClient } from '@/lib/supabase/server'

interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
}

/**
 * 브라우저에서 생성된 푸시 구독(Subscription) 정보 등록
 */
export async function savePushSubscription(subscription: PushSubscriptionPayload) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return { ok: false, error: '로그인이 필요합니다.' }
    }

    // 1. 이미 동일 유저의 동일 endpoint 구독 정보가 있는지 먼저 확인
    const { data: existing, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('subscription->>endpoint', subscription.endpoint)
      .maybeSingle()

    if (fetchError) {
      console.error('기존 구독 조회 에러:', fetchError)
      return { ok: false, error: fetchError.message }
    }

    if (existing) {
      // 이미 구독되어 있는 기기이므로 성공 처리
      return { ok: true }
    }

    // 2. 존재하지 않는 경우 새로 insert
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: session.user.id,
        subscription: subscription
      })

    if (insertError) {
      console.error('푸시 구독 저장 에러:', insertError)
      return { ok: false, error: insertError.message }
    }

    return { ok: true }
  } catch (error) {
    console.error('푸시 구독 저장 중 예외 발생:', error)
    return { ok: false, error: '서버 에러가 발생했습니다.' }
  }
}

/**
 * 브라우저 푸시 구독 취소 시 DB에서 구독 삭제
 */
export async function deletePushSubscription(endpoint: string) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return { ok: false, error: '로그인이 필요합니다.' }
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', session.user.id)
      .eq('subscription->>endpoint', endpoint)

    if (error) {
      console.error('푸시 구독 삭제 에러:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (error) {
    console.error('푸시 구독 삭제 중 예외 발생:', error)
    return { ok: false, error: '서버 에러가 발생했습니다.' }
  }
}
