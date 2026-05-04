'use client'

import Link from 'next/link'
import { BiCompass, BiSearch, BiUserCircle, BiMap } from 'react-icons/bi'
import { usePathname } from 'next/navigation'
import { m, AnimatePresence } from 'framer-motion'
import { hapticFeedback } from '@/utils/haptic'

const NAV_ITEMS = [
  { label: '홈',  href: '/',       icon: BiCompass,    activePath: '/' },
  { label: '지도', href: '/map',    icon: BiMap,        activePath: '/map' },
  { label: '검색', href: '/search', icon: BiSearch,     activePath: '/search' },
  { label: '마이', href: '/my',     icon: BiUserCircle, activePath: '/my' },
]

// layoutId(= layout animation, domMax 필요)를 쓰지 않고
// 각 탭 안에서 AnimatePresence로 인디케이터를 fade-in/out.
// domAnimation만으로 동작 → 번들 ~40% 절감.
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
            className="relative flex flex-1 flex-col items-center justify-center gap-[2px] outline-none active:opacity-50"
            aria-label={item.label}
          >
            {/* 활성 인디케이터 — 탭 내부에서 AnimatePresence로 fade */}
            <AnimatePresence>
              {isActive && (
                <m.div
                  key="indicator"
                  initial={{ opacity: 0, scaleX: 0.5 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.5 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-0 inset-x-0 h-[2px] origin-center"
                  style={{ background: 'var(--point-color)' }}
                />
              )}
            </AnimatePresence>

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
