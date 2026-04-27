'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import {
  BiCompass,
  BiSearch,
  BiUserCircle,
  BiMap,
} from 'react-icons/bi'
import { usePathname } from 'next/navigation'
import { m } from 'framer-motion'
import { hapticFeedback } from '@/utils/haptic'

export default function Navbar() {
  const pathname = usePathname()

  const NAV_ITEMS = [
    {
      label: '홈',
      href: '/',
      icon: BiCompass,
      activePath: '/' },
    {
      label: '지도',
      href: '/map',
      icon: BiMap,
      activePath: '/map' },
    {
      label: '검색',
      href: '/search',
      icon: BiSearch,
      activePath: '/search' },
    {
      label: '마이',
      href: '/my',
      icon: BiUserCircle,
      activePath: '/my' },
  ]

  return (
    <div className="relative w-full">
      <nav className="flex h-[72px] w-full items-center justify-around border-t border-border-main/50 bg-bg-main/90 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.activePath)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => hapticFeedback('light')}
              className="group relative flex flex-1 flex-col items-center justify-center gap-[3px] py-1 outline-none"
              aria-label={item.label}
            >
              {/* 상단 포인트 인디케이터 */}
              {isActive && (
                <m.div
                  layoutId="nav-active-top"
                  className="absolute top-0 h-1 w-8 rounded-b-full bg-point shadow-[0_2px_8px_rgba(var(--point-rgb),0.6)]"
                  transition={{ ease: 'easeOut', stiffness: 450, damping: 30 }}
                />
              )}

              {/* 아이콘 컨테이너 */}
              <m.div
                animate={isActive ? { y: 2 } : { y: 4 }}
                transition={{ ease: 'easeOut', stiffness: 400, damping: 25 }}
                className={clsx(
                  'relative z-10 flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-300',
                  isActive ? 'text-point bg-point/10' : 'text-text-sub/80 group-hover:text-text-main',
                )}
              >
                <item.icon size={26} strokeWidth={isActive ? 1 : 0} />
              </m.div>

              {/* 라벨 텍스트 */}
              <m.div
                animate={isActive ? { opacity: 1, y: 2 } : { opacity: 0.8, y: 4 }}
                className={clsx(
                  'z-10 text-[10px] tracking-wide transition-colors duration-300',
                  isActive ? 'font-black text-text-main' : 'font-semibold text-text-sub/70 group-hover:text-text-main',
                )}
              >
                {item.label}
              </m.div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
