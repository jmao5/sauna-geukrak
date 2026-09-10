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
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < total - 1

  // 외부 initialIndex 변경 시 동기화
  useEffect(() => {
    setCurrentIndex(initialIndex)
    setDirection(0)
  }, [initialIndex])

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
    if (currentIndex <= 0) return
    setDirection(-1)
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [currentIndex])

  const nextImage = useCallback(() => {
    if (currentIndex >= total - 1) return
    setDirection(1)
    setCurrentIndex((prev) => Math.min(total - 1, prev + 1))
  }, [currentIndex, total])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) prevImage()
      if (e.key === 'ArrowRight' && hasNext) nextImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasNext, hasPrev, nextImage, onClose, prevImage])

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
      className="fixed inset-0 z-[400] flex flex-col justify-between bg-black/92 backdrop-blur-md select-none"
      onClick={onClose}
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
        {/* 좌측 이전 버튼 (첫 번째 사진이 아닐 때만 노출) */}
        {hasMultiple && hasPrev && (
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
              dragElastic={0.25}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipeThreshold = 40
                const velocityThreshold = 0.4

                // 왼쪽으로 드래그 (다음 사진)
                if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
                  if (hasNext) nextImage()
                }
                // 오른쪽으로 드래그 (이전 사진)
                else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
                  if (hasPrev) prevImage()
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

        {/* 우측 다음 버튼 (마지막 사진이 아닐 때만 노출) */}
        {hasMultiple && hasNext && (
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

      {/* ── 하단 썸네일 스트립 (1번부터 마지막 번호까지 순서대로) ── */}
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
