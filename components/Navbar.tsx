'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { BiCompass, BiSearch, BiUserCircle, BiMap } from 'react-icons/bi'
import { usePathname } from 'next/navigation'
import { m } from 'framer-motion'
import { hapticFeedback } from '@/utils/haptic'

const NAV_ITEMS = [
  { label: '홈', href: '/', icon: BiCompass, activePath: '/' },
  { label: '지도', href: '/map', icon: BiMap, activePath: '/map' },
  { label: '검색', href: '/search', icon: BiSearch, activePath: '/search' },
  { label: '마이', href: '/my', icon: BiUserCircle, activePath: '/my' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="flex h-[56px] w-full items-center justify-around bg-bg-sub border-t border-border-main shadow-nav">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.activePath)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => hapticFeedback('light')}
            className="group relative flex flex-1 flex-col items-center justify-center gap-[2px] py-1 outline-none h-full transition-colors duration-150"
            aria-label={item.label}
          >
            {/* 활성 인디케이터 — 상단 선 */}
            {isActive && (
              <m.div
                layoutId="nav-active-top"
                className="absolute top-0 h-[2px] w-7 rounded-b-full bg-point"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            <m.div
              animate={isActive ? { y: 0, scale: 1 } : { y: 2, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={clsx(
                'flex h-7 w-7 items-center justify-center transition-colors duration-200',
                isActive ? 'text-point' : 'text-text-muted/60 group-hover:text-text-muted',
              )}
            >
              <item.icon size={22} />
            </m.div>

            <m.span
              animate={isActive ? { opacity: 1 } : { opacity: 0.45 }}
              className={clsx(
                'text-[9px] tracking-wide transition-colors duration-200',
                isActive
                  ? 'font-black text-point'
                  : 'font-bold text-text-muted group-hover:text-text-sub',
              )}
            >
              {item.label}
            </m.span>
          </Link>
        )
      })}
    </nav>
  )
}
