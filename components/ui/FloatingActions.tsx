'use client'

import { useEffect, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { BiArrowToTop } from 'react-icons/bi'
import { usePathname } from 'next/navigation'
import { useScrollRef } from '@/contexts/ScrollRefContext'
import { shouldHideFloatingActions } from '@/constants/layout'

const SCROLL_TOP_BUTTON_THRESHOLD = 300

export default function FloatingActions() {
  const pathname = usePathname()
  const scrollRef = useScrollRef()
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isHidden = shouldHideFloatingActions(pathname)

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

  if (!mounted || isHidden) return null

  return (
    <AnimatePresence>
      {showScrollTop && (
        <m.button
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          onClick={scrollToTop}
          className="fixed right-4 bottom-20 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-bg-sub shadow-card border border-border-main text-text-sub transition active:scale-90"
          aria-label="맨 위로"
        >
          <BiArrowToTop size={20} />
        </m.button>
      )}
    </AnimatePresence>
  )
}
