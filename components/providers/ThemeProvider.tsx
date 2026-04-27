'use client'

import { useEffect, useState } from 'react'
import { useUiStore } from '@/stores/uiStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((state) => state.theme)
  const [mounted, setMounted] = useState(false)

  // Hydration 이슈 방지
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, mounted])

  // 초기 렌더링 시에는 children만 반환 (flash 방지는 layout script에서 처리)
  return <>{children}</>
}
