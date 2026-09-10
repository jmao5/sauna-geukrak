'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { m, AnimatePresence } from 'framer-motion'
import { BiX, BiChevronLeft, BiChevronRight } from 'react-icons/bi'

interface ImageSliderModalProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '60%' : '-60%',
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '60%' : '-60%',
    opacity: 0,
    scale: 0.95,
  }),
}

export default function ImageSliderModal({
  images,
  initialIndex = 0,
  onClose,
}: ImageSliderModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [direction, setDirection] = useState(0)
  const [portalEl, setPortalEl] = useState<Element | null>(null)

  const total = images.length
  const hasMultiple = total > 1

  // 키보드 & 포털 & 바디 스크롤 제어
  useEffect(() => {
    setPortalEl(document.getElementById('app-root') || document.body)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const prevImage = useCallback(() => {
    if (!hasMultiple) return
    setDirection(-1)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1))
  }, [hasMultiple, total])

  const nextImage = useCallback(() => {
    if (!hasMultiple) return
    setDirection(1)
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0))
  }, [hasMultiple, total])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextImage, onClose, prevImage])

  // 터치 스와이프 제어
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diffX = e.changedTouches[0].clientX - touchStartX.current
    const diffY = e.changedTouches[0].clientY - (touchStartY.current ?? 0)

    // 수평 스와이프 거리 > 40px 및 수평 방향 우선
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0) {
        nextImage()
      } else {
        prevImage()
      }
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const handleThumbnailClick = (idx: number) => {
    if (idx === currentIndex) return
    setDirection(idx > currentIndex ? 1 : -1)
    setCurrentIndex(idx)
  }

  if (!portalEl || total === 0) return null

  return createPortal(
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[400] flex flex-col justify-between bg-black/92 backdrop-blur-md select-none touch-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 상단 헤더 바 (카운터 & 닫기 버튼) ── */}
      <div
        className="relative z-[410] flex items-center justify-between px-4 pt-4 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 인덱스 뱃지 */}
        {hasMultiple ? (
          <div className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold text-white/90 backdrop-blur-md tabular-nums border border-white/10">
            <span>{currentIndex + 1}</span>
            <span className="mx-1 text-white/40">/</span>
            <span>{total}</span>
          </div>
        ) : (
          <div />
        )}

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition active:scale-90 hover:bg-white/20"
          title="닫기 (ESC)"
        >
          <BiX size={24} />
        </button>
      </div>

      {/* ── 메인 이미지 슬라이더 영역 ── */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-3"
        onClick={onClose}
      >
        {/* 좌측 이전 버튼 (데스크톱/모바일) */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
            className="absolute left-3 z-[410] flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/15 transition active:scale-90 hover:bg-black/80"
            title="이전 사진"
          >
            <BiChevronLeft size={28} />
          </button>
        )}

        {/* 슬라이드 이미지 (Framer Motion 드래그 & 전환) */}
        <div
          className="relative flex h-full w-full items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <m.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 350, damping: 32 },
                opacity: { duration: 0.18 },
                scale: { duration: 0.18 },
              }}
              drag={hasMultiple ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x
                if (swipe < -80 || offset.x < -50) {
                  nextImage()
                } else if (swipe > 80 || offset.x > 50) {
                  prevImage()
                }
              }}
              className="flex max-h-[76vh] max-w-full items-center justify-center cursor-grab active:cursor-grabbing"
            >
              <img
                src={images[currentIndex]}
                alt={`사활 사진 ${currentIndex + 1}`}
                className="max-h-[74vh] w-auto max-w-[92vw] rounded-2xl object-contain shadow-2xl pointer-events-none"
                draggable={false}
              />
            </m.div>
          </AnimatePresence>
        </div>

        {/* 우측 다음 버튼 */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
            className="absolute right-3 z-[410] flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/15 transition active:scale-90 hover:bg-black/80"
            title="다음 사진"
          >
            <BiChevronRight size={28} />
          </button>
        )}
      </div>

      {/* ── 하단 썸네일 스트립 ── */}
      {hasMultiple && (
        <div
          className="relative z-[410] flex items-center justify-center gap-2 overflow-x-auto px-4 pb-6 pt-2 scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => {
            const isActive = idx === currentIndex
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleThumbnailClick(idx)}
                className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                  isActive
                    ? 'border-point ring-2 ring-point scale-110 shadow-lg'
                    : 'border-white/30 opacity-50 hover:opacity-90'
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            )
          })}
        </div>
      )}
    </m.div>,
    portalEl
  )
}
