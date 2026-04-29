'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

/**
 * Supabase onAuthStateChange 구독 → Zustand userStore 동기화
 * 앱 최상단에 한 번만 마운트합니다.
 *
 * getSession() 대신 getUser()를 사용합니다.
 * getSession()은 만료된 토큰을 갱신하지 않고 캐시된 값을 반환하므로
 * 로그인이 풀리는 문제가 발생합니다.
 * getUser()는 서버에 실제 검증 요청을 보내고 토큰을 자동 갱신합니다.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, clearSession } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // getSession()으로 빠르게 초기 세션 확인 (캐시 사용)
    // 토큰 유효성 검증은 onAuthStateChange의 TOKEN_REFRESHED 이벤트가 처리
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 이후 인증 상태 변화 구독 (로그인/로그아웃/토큰 갱신 등)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession, clearSession])

  return <>{children}</>
}
