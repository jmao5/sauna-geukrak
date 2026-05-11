'use client'

import { ReactNode, Suspense, useRef } from 'react'
import { clsx } from 'clsx'
import dynamic from 'next/dynamic'
import { shouldHideNavbar } from '@/constants/layout'
import { usePathname } from 'next/navigation'
import { useStatusBar } from '@/hooks/useStatusBar'
import { ScrollRefContext } from '@/contexts/ScrollRefContext'

/**
 * 개선: dynamic import loading 옵션으로 ULS(Unstyled Layout Shift) 방지
 *
 * 기존 문제:
 *   ssr: false 이므로 hydration 후에야 컴포넌트가 로드됨.
 *   Navbar: loading 없음 → 로드 전 해당 영역이 빈 채로 있다가 뒤늦게 채워짐.
 *   FloatingActions: 동일.
 *
 * 개선 결과:
 *   Navbar loading으로 동일 높이(56px)의 placeholder 유지 → 레이아웃 안 밀림.
 *   FloatingActions는 위치가 fixed라 placeholder 불필요, null 유지.
 */
const Navbar = dynamic(() => import('@/components/Navbar'), {
  ssr: false,
  loading: () => <div className="h-[56px] w-full bg-bg-sub" />,
})

const FloatingActions = dynamic(
  () => import('@/components/ui/FloatingActions'),
  { ssr: false }
)

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  useStatusBar()

  const isNavbarHidden = shouldHideNavbar(pathname)

  return (
    <ScrollRefContext.Provider value={scrollRef}>
      <div
        ref={scrollRef}
        className={clsx(
          'bg-bg-main text-text-main relative w-full',
          'scrollbar-hide h-full overflow-hidden',
        )}
      >
        {children}
      </div>

      <Suspense fallback={null}>
        <FloatingActions />
      </Suspense>

      {!isNavbarHidden && (
        <div className="border-border-main bg-bg-sub absolute bottom-0 z-50 w-full border-t pb-[env(safe-area-inset-bottom)]">
          <Navbar />
        </div>
      )}
    </ScrollRefContext.Provider>
  )
}
