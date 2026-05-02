'use client'

import Link from 'next/link'
import { BiCompass, BiSearch, BiUserCircle, BiMap } from 'react-icons/bi'
import { usePathname } from 'next/navigation'
import { m } from 'framer-motion'
import { hapticFeedback } from '@/utils/haptic'

const NAV_ITEMS = [
  { label: '홈',  href: '/',       icon: BiCompass,    activePath: '/' },
  { label: '지도', href: '/map',    icon: BiMap,        activePath: '/map' },
  { label: '검색', href: '/search', icon: BiSearch,     activePath: '/search' },
  { label: '마이', href: '/my',     icon: BiUserCircle, activePath: '/my' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav
      className="flex h-[56px] w-full items-stretch"
      style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-main)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.activePath)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => hapticFeedback('light')}
            className="relative flex flex-1 flex-col items-center justify-center gap-[2px] outline-none transition-opacity active:opacity-50"
            aria-label={item.label}
          >
            {/* 활성 인디케이터 — 상단 라인, 파란색 하나 */}
            {isActive && (
              <m.div
                layoutId="nav-active-bar"
                className="absolute top-0 inset-x-0 h-[2px]"
                style={{ background: 'var(--point-color)' }}
                transition={{ type: 'spring', stiffness: 600, damping: 40 }}
              />
            )}

            <item.icon
              size={22}
              style={{
                color: isActive ? 'var(--point-color)' : 'var(--text-muted)',
                transition: 'color 0.1s',
              }}
            />

            <span
              className="text-[9px] font-bold"
              style={{
                color: isActive ? 'var(--point-color)' : 'var(--text-muted)',
                transition: 'color 0.1s',
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
