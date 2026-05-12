'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import type { Session } from '@supabase/supabase-js'

/**
 * AuthProvider
 *
 * 개선 내용:
 * 서버(layout.tsx)에서 받아온 초기 session을 Props로 전달받습니다.
 * 컴포넌트 마운트 전(render phase)에 Zustand 스토어를 동기적으로 초기화하여
 * 페이지 첫 진입 시 깜빡임(Flickering) 없이 즉시 로그인 상태를 렌더링합니다.
 */
export default function AuthProvider({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) {
  const { setSession, setRole, clearSession } = useUserStore()
  const initialized = useRef(false)

  // ── 1. 서버 사이드 렌더링 또는 초기 클라이언트 렌더링 시 스토어 즉시 초기화 ──
  if (!initialized.current) {
    useUserStore.setState({
      session,
      user: session?.user ?? null,
      isLoading: false,
      role:
        (session?.user?.app_metadata?.role as 'user' | 'admin' | undefined) ??
        (session?.user?.user_metadata?.role as 'user' | 'admin' | undefined) ??
        'user',
    })
    initialized.current = true
  }

  useEffect(() => {
    const supabase = createClient()

    // ── 2. 이후 상태 변화만 구독 (로그인/로그아웃/토큰 갱신) ──────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // 서버에서 전달받은 초기 상태는 이미 적용되었으므로 스킵
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
