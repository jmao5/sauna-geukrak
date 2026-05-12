'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'framer-motion'
import { BiX } from 'react-icons/bi'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [portalEl, setPortalEl] = useState<Element | null>(null)
  
  useEffect(() => {
    setPortalEl(document.getElementById('app-root'))
  }, [])
  
  if (!portalEl) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* 딤 */}
          <m.div
            key="dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* 시트 */}
          <m.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }}
            className="absolute bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col rounded-t-3xl bg-bg-main"
          >
            <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-border-strong" />
            </div>
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border-subtle px-5 py-3">
              <h2 className="text-base font-black text-text-main">{title}</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-sub"
              >
                <BiX size={18} className="text-text-sub" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-safe">
              {children}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>,
    portalEl
  )
}
