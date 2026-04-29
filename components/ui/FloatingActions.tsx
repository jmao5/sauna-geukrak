'use client'

import { useEffect, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { BiArrowToTop, BiPlus } from 'react-icons/bi'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollRef } from '@/contexts/ScrollRefContext'
import { shouldHideFloatingActions } from '@/constants/layout'
import { useUserStore } from '@/stores/userStore'

const SCROLL_TOP_BUTTON_THRESHOLD = 300

export default function FloatingActions() {
  const pathname = usePathname()
  const router = useRouter()
  const scrollRef = useScrollRef()
  const { user } = useUserStore()

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isHidden = shouldHideFloatingActions(pathname)
  const isHome = pathname === '/'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      setShowScrollTop(el.scrollTop > SCROLL_TOP_BUTTON_THRESHOLD)
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollRef])

  const handleAddSauna = () => {
    if (user) {
      router.push('/saunas/new')
    } else {
      router.push('/login?next=/saunas/new')
    }
  }

  if (!mounted || isHidden) return null

  // fixed 대신 absolute 사용 — AppFrame 컨테이너(relative) 기준으로 위치
  // 네브바 높이(h-16 = 4rem) + 여백(1rem)
  return (
    <AnimatePresence>
      {isHome && (
        <m.button
          key="add-sauna"
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          onClick={handleAddSauna}
          className="absolute right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-point shadow-lg text-white transition active:scale-90"
          style={{ bottom: 'calc(4rem + 1rem)' }}
          aria-label="사우나 등록"
        >
          <BiPlus size={24} />
        </m.button>
      )}

      {showScrollTop && (
        <m.button
          key="scroll-top"
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          onClick={scrollToTop}
          className="absolute right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-bg-sub shadow-card border border-border-main text-text-sub transition active:scale-90"
          style={{
            bottom: isHome ? 'calc(4rem + 5rem)' : 'calc(4rem + 1rem)',
          }}
          aria-label="맨 위로"
        >
          <BiArrowToTop size={20} />
        </m.button>
      )}
    </AnimatePresence>
  )
}
