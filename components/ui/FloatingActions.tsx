'use client'

import { useEffect, useRef, useState } from 'react'
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

  const getScrollEl = () =>
    scrollRef.current?.querySelector<HTMLElement>('[data-scroll-main]') ?? null

  const scrollToTop = () => getScrollEl()?.scrollTo({ top: 0, behavior: 'smooth' })

  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isHidden = shouldHideFloatingActions(pathname)
  const isHome = pathname === '/'

  // cleanup ref: 이전 리스너를 명시적으로 추적해 누수 방지
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // 이전 리스너가 있으면 먼저 해제
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    // pathname 전환 후 DOM이 반영될 때까지 잠깐 대기
    const timer = setTimeout(() => {
      const el = getScrollEl()
      if (!el) return

      const handleScroll = () =>
        setShowScrollTop(el.scrollTop > SCROLL_TOP_BUTTON_THRESHOLD)

      el.addEventListener('scroll', handleScroll, { passive: true })

      // cleanup을 ref에 저장 → 다음 effect 실행 시 또는 언마운트 시 해제
      cleanupRef.current = () => el.removeEventListener('scroll', handleScroll)
    }, 100)

    return () => {
      clearTimeout(timer)
      // 언마운트 또는 pathname 변경 시 리스너 해제
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

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
      {isHome && (
        <m.button
          key="add-sauna"
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          onClick={handleAddSauna}
          className="absolute right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-point shadow-lg text-white active:scale-90"
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
          className="absolute right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-bg-sub shadow-card border border-border-main text-text-sub active:scale-90"
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
