'use client'

import { useEffect } from 'react'
import { useUiStore } from '@/stores/uiStore'

/**
 * 개선: mounted 가드 제거
 *
 * 기존 문제:
 *   mounted: false → true 전환으로 useEffect가 두 번 실행되고
 *   불필요한 리렌더가 발생.
 *
 * 개선 근거:
 *   layout.tsx의 인라인 스크립트가 이미 hydration 전에 다크 클래스를 붙임.
 *   ThemeProvider는 이후 theme 상태 변화(사용자가 설정에서 토글)만 반영하면 됨.
 *   hydration mismatch 위험도 없음 — children을 조건부 렌더하지 않으므로.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((state) => state.theme)

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return <>{children}</>
}
