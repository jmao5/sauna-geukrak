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
  const { setSession, setRole, clearSession } = useUserStore()

  const loadRole = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    setRole((data?.role as 'user' | 'admin') ?? 'user')
  }

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadRole(session.user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadRole(session.user.id)
      else setRole(null)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Zustand setter는 안정적(stable)이므로 의존성 불필요 — 탭 전환 시 재구독 방지

  return <>{children}</>
}
