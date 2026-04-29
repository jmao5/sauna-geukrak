'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

/**
 * Supabase onAuthStateChange 구독 → Zustand userStore 동기화
 * 앱 최상단에 한 번만 마운트합니다.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // 현재 세션 즉시 확인
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
  }, [setSession])

  return <>{children}</>
}
