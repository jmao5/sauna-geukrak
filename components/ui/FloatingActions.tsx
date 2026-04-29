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

  return (
    <AnimatePresence>
      {/* 홈에서만 보이는 + 버튼 */}
      {isHome && (
        <m.button
          key="add-sauna"
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          onClick={handleAddSauna}
          className="fixed right-4 bottom-20 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-point shadow-lg text-white transition active:scale-90"
          aria-label="사우나 등록"
        >
          <BiPlus size={24} />
        </m.button>
      )}

      {/* 스크롤 상단 버튼 — 홈에선 + 버튼 위에 표시 */}
      {showScrollTop && (
        <m.button
          key="scroll-top"
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          onClick={scrollToTop}
          className={`fixed right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-bg-sub shadow-card border border-border-main text-text-sub transition active:scale-90 ${
            isHome ? 'bottom-36' : 'bottom-20'
          }`}
          aria-label="맨 위로"
        >
          <BiArrowToTop size={20} />
        </m.button>
      )}
    </AnimatePresence>
  )
}
