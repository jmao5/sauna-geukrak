'use client'

import { ReactNode, useEffect, useState } from 'react'
import { SyncLoader } from 'react-spinners'
import { m } from 'framer-motion'
import { clsx } from 'clsx'

type LoadingVariant = 'spinner' | 'dots'

interface LoadingProps {
  /** 로딩 스타일: 'spinner' (기본값) 또는 'dots' */
  variant?: LoadingVariant
  /** 화면 전체를 덮을지 여부 (기본값: true) */
  fullScreen?: boolean
  /** 표시할 메시지 */
  message?: ReactNode
  /** 메시지를 표시하기 전 대기 시간 (ms, 기본값: 1000) */
  messageDelay?: number
  /** 커스텀 클래스 */
  className?: string
  /** 점 또는 스피너의 색상 (Tailwind 컬러가 아닌 hex 등, 기본값: #FF007A) */
  color?: string
}

/**
 * 앱 전역에서 사용하는 공통 로딩 컴포넌트
 */
export default function Loading({
  variant = 'spinner',
  fullScreen = true,
  message,
  messageDelay = 1000,
  className,
  color = '#FF007A' }: LoadingProps) {
  const [mounted, setMounted] = useState(false)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (message) {
      const timer = setTimeout(() => setShowMessage(true), messageDelay)
      return () => clearTimeout(timer)
    }
  }, [message, messageDelay])

  if (!mounted) return null

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={clsx(
        'flex flex-col items-center justify-center gap-6',
        fullScreen ? 'fixed inset-0 z-[9999] h-screen w-full bg-bg-main/80 backdrop-blur-sm' : 'w-full py-10',
        className
      )}
    >
      {/* 로딩 애니메이션 영역 */}
      {variant === 'spinner' ? (
        <SyncLoader color={color} size={10} margin={3} speedMultiplier={0.7} />
      ) : (
        <div className="flex gap-2">
          {[0, 1, 2].map((index) => (
            <m.div
              key={index}
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
              animate={{
                y: ['0%', '-100%', '0%'],
                scale: [1, 0.8, 1],
                opacity: [1, 0.7, 1] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* 메시지 영역 */}
      {message && showMessage && (
        <div
          className={clsx(
            'animate-pulse text-center font-medium tracking-wider text-text-sub transition-opacity duration-500',
            fullScreen ? 'text-sm' : 'text-xs'
          )}
        >
          {message}
        </div>
      )}
      
      <span className="sr-only">로딩 중...</span>
    </div>
  )

  return content
}
