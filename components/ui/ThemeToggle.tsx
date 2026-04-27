'use client'

import { useUiStore } from '@/stores/uiStore'
import { BiSun, BiMoon } from 'react-icons/bi'
import { m, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUiStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-10 w-10" />

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-bg-sub shadow-sm transition-all hover:scale-110 active:scale-95 border border-border-main"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait">
        {theme === 'light' ? (
          <m.div
            key="sun"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <BiSun size={24} className="text-amber-500" />
          </m.div>
        ) : (
          <m.div
            key="moon"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <BiMoon size={24} className="text-point" />
          </m.div>
        )}
      </AnimatePresence>
    </button>
  )
}
