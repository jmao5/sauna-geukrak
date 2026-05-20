'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

/**
 * AuthProvider
 *
 * 개선 내용:
 * 서버 사이드 블로킹을 해제하기 위해 초기 세션을 클라이언트 사이드 마운트 시점에 가져옵니다.
 * 이로 인해 layout.tsx가 동적으로 멈춰 서는 현상을 제거하여 첫 로딩 속도(TTFB)를 높였습니다.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setSession, setRole, clearSession, setLoading } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // ── 1. 초기 로컬 세션 확인 ──
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        const role =
          (session?.user?.app_metadata?.role as 'user' | 'admin' | undefined) ??
          (session?.user?.user_metadata?.role as 'user' | 'admin' | undefined) ??
          'user'
        setRole(role)
      } else {
        setLoading(false)
      }
    })

    // ── 2. 이후 상태 변화 구독 (로그인/로그아웃/토큰 갱신) ──────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // 초기 세션 이벤트는 위의 getSession()에서 처리하므로 중복 방지 스킵
      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session)
        const role =
          (session?.user?.app_metadata?.role as 'user' | 'admin' | undefined) ??
          (session?.user?.user_metadata?.role as 'user' | 'admin' | undefined) ??
          'user'
        setRole(role)
      } else if (event === 'SIGNED_OUT') {
        clearSession()
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
