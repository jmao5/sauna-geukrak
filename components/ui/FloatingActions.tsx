'use client'

import { useEffect, useState, type ElementType } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { BiArrowToTop, BiSun, BiMoon } from 'react-icons/bi'
import { usePathname } from 'next/navigation'
import { useScrollRef } from '@/contexts/ScrollRefContext'
import { useUiStore } from '@/stores/uiStore'
import { shouldHideFloatingActions } from '@/constants/layout'

/** 맨 위로 버튼 표시 기준 스크롤 위치 (px) */
const SCROLL_TOP_BUTTON_THRESHOLD = 300
import { Tooltip } from '@base-ui-components/react'

interface IconButtonProps {
  onClick: () => void
  icon: ElementType
  label: string
  className?: string
  show?: boolean
}

function IconButton({ onClick, icon: Icon, label, className, show = true }: IconButtonProps) {
  return (
    <AnimatePresence>
      {show && (
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <button
                onClick={onClick}
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-bg-sub shadow-lg border border-border-main backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${className}`}
                aria-label={label}
              >
                <m.div
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1,  y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 10 }}
                >
                  <Icon size={24} />
                </m.div>
              </button>
            }
          />
          <Tooltip.Portal>
            <Tooltip.Positioner side="left" sideOffset={12}>
              <Tooltip.Popup className="z-[100] rounded-md bg-text-main px-2.5 py-1.5 text-xs font-medium text-bg-main shadow-md transition-opacity duration-200 data-[entering]:opacity-100 data-[exiting]:opacity-0">
                {label}
                <Tooltip.Arrow className="fill-text-main" />
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </AnimatePresence>
  )
}

export default function FloatingActions() {
  const pathname = usePathname()
  const scrollRef = useScrollRef()
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  const { theme, toggleTheme } = useUiStore()

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
    <Tooltip.Provider delay={300}>
      <div className="fixed right-6 bottom-24 z-50 flex flex-col gap-3">
        {/* 1. 맨 위로 버튼 */}
        <IconButton
          show={showScrollTop}
          onClick={scrollToTop}
          icon={BiArrowToTop}
          label="맨 위로 가기"
          className="text-gray-700 dark:text-gray-200"
        />

        {/* 2. 테마 토글 버튼 */}
        <IconButton
          onClick={toggleTheme}
          icon={theme === 'light' ? BiSun : BiMoon}
          label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          className={theme === 'light' ? 'text-amber-500' : 'text-blue-400'}
        />
      </div>
    </Tooltip.Provider>
  )
}
