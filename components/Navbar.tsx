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
    <nav
      className="flex h-[60px] w-full items-center justify-around relative"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        borderTop: '1px solid rgba(186,230,253,0.6)',
        boxShadow: '0 -4px 24px rgba(14,165,233,0.07)',
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
            className="group relative flex flex-1 flex-col items-center justify-center gap-[3px] py-1 outline-none h-full transition-colors duration-150"
            aria-label={item.label}
          >
            {/* 활성 인디케이터 — 상단 물빛 라인 */}
            {isActive && (
              <m.div
                layoutId="nav-active-top"
                className="absolute top-0 h-[2.5px] w-8 rounded-b-full"
                style={{
                  background: 'linear-gradient(90deg, #7dd3fc, #0ea5e9, #7dd3fc)',
                  boxShadow: '0 0 8px rgba(14,165,233,0.5)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            {/* 아이콘 */}
            <m.div
              animate={isActive ? { y: 0, scale: 1 } : { y: 2, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex h-7 w-7 items-center justify-center"
              style={{
                color: isActive ? '#0ea5e9' : '#94a3b8',
                transition: 'color 0.2s ease',
              }}
            >
              <item.icon size={22} />
            </m.div>

            {/* 라벨 */}
            <m.span
              animate={isActive ? { opacity: 1 } : { opacity: 0.45 }}
              className="text-[9px] tracking-wide font-bold"
              style={{ color: isActive ? '#0ea5e9' : '#94a3b8' }}
            >
              {item.label}
            </m.span>
          </Link>
        )
      })}
    </nav>
  )
}
