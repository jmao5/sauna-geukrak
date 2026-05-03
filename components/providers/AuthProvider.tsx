'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

/**
 * Supabase onAuthStateChange 구독 → Zustand userStore 동기화
 *
 * 수정 사항:
 * - loadRole을 useEffect 안으로 이동 (클로저 중복 인스턴스 방지)
 * - userId 유효성 검사 추가 (빈 uuid로 쿼리 나가는 것 방지)
 * - getSession 제거 → onAuthStateChange INITIAL_SESSION 이벤트로 통합
 *   (중복 호출 원천 차단)
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setRole, clearSession, setLoading } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    /** userId가 실제 uuid인지 확인 후 role 조회 */
    const loadRole = async (userId: string) => {
      // 빈 문자열이나 invalid uuid 방어
      if (!userId || userId.length < 10) return

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()   // single() 대신 maybeSingle() → row 없어도 에러 안 남

      if (!error && data?.role) {
        setRole(data.role as 'user' | 'admin')
      } else {
        setRole('user') // 기본값, 에러 시 콘솔 노출 안 함
      }
    }

    // getSession() 제거 — INITIAL_SESSION 이벤트가 동일한 역할을 함
    // 중복 호출 방지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session)
        if (session?.user?.id) {
          loadRole(session.user.id)
        } else {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        clearSession()
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
