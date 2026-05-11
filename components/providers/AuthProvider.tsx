'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

/**
 * AuthProvider
 *
 * 개선: getSession()으로 초기 세션을 로컬 JWT 파싱으로 즉시 읽고,
 * onAuthStateChange는 이후 상태 변화(로그인/로그아웃/토큰 갱신)만 담당합니다.
 *
 * 기존 문제:
 *   onAuthStateChange의 INITIAL_SESSION은 Supabase Auth 서버 왕복 후 발화
 *   → 그 동안 isLoading: true가 유지되어 모든 화면이 로딩 UI를 표시
 *
 * 개선 결과:
 *   getSession()은 쿠키의 JWT를 로컬에서 파싱 → 네트워크 왕복 없음
 *   → 마운트 즉시 isLoading: false, 화면 즉시 렌더
 *   → onAuthStateChange는 보조 역할로 토큰 갱신/로그아웃 처리만 수행
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setRole, clearSession } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // ── 1. 초기 세션: 로컬 JWT 파싱, 네트워크 왕복 없음 ──────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)

      const role =
        (session?.user?.app_metadata?.role as 'user' | 'admin' | undefined) ??
        (session?.user?.user_metadata?.role as 'user' | 'admin' | undefined) ??
        'user'
      setRole(role)
    })

    // ── 2. 이후 상태 변화만 구독 (로그인/로그아웃/토큰 갱신) ──────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // INITIAL_SESSION은 getSession()이 이미 처리했으므로 스킵
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
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
