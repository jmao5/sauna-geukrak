'use client'

import { ReactNode, Suspense, useRef } from 'react'
import { clsx } from 'clsx'
import dynamic from 'next/dynamic'

import { shouldHideNavbar } from '@/constants/layout'
import { usePathname } from 'next/navigation'
import { useStatusBar } from '@/hooks/useStatusBar'
import { ScrollRefContext } from '@/contexts/ScrollRefContext'

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false })
const FloatingActions = dynamic(() => import('@/components/ui/FloatingActions'), { ssr: false })

interface ClientLayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
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
          'scrollbar-hide h-full overflow-x-hidden overflow-y-auto',
        )}
      >
        {children}
        {!isNavbarHidden && <div className="h-16 w-full shrink-0" />}
      </div>

      <Suspense fallback={null}>
        <FloatingActions />
      </Suspense>

      {!isNavbarHidden && (
        <div className="border-border-main bg-bg-sub absolute bottom-0 z-50 w-full border-t pb-[env(safe-area-inset-bottom)]">
          <Suspense fallback={<div className="h-16 w-full" />}>
            <Navbar />
          </Suspense>
        </div>
      )}
    </ScrollRefContext.Provider>
  )
}
