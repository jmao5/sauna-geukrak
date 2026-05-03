'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

/**
 * AuthProvider
 *
 * role을 DB에서 읽지 않고 auth.users의 app_metadata / user_metadata에서 읽습니다.
 * → public.users SELECT 쿼리 제거 → 400 에러 원천 차단
 *
 * role이 metadata에 없으면 'user'로 기본값 처리.
 * (admin 지정은 Supabase Dashboard → Auth → Users → app_metadata 에서 직접 수행)
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setRole, clearSession, setLoading } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {
        setSession(session)

        // DB 쿼리 없이 JWT metadata에서 role 추출
        const role =
          (session?.user?.app_metadata?.role as 'user' | 'admin' | undefined) ??
          (session?.user?.user_metadata?.role as 'user' | 'admin' | undefined) ??
          'user'

        setRole(role)

        if (!session) setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        clearSession()
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
