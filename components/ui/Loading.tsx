'use client'

import { clsx } from 'clsx'
import Lottie from 'lottie-react'; // 🚀 lottie-react 라이브러리 추가
import Image from 'next/image'
import { ReactNode, useEffect, useState } from 'react'

// 1. 'lottie' 타입을 추가합니다.
type LoadingVariant = 'spinner' | 'dots' | 'image' | 'lottie'

interface LoadingProps {
  /** 로딩 스타일: 'lottie' 로 설정하면 Lottie 애니메이션이 나옵니다. */
  variant?: LoadingVariant
  /** 화면 전체를 덮을지 여부 (기본값: true) */
  fullScreen?: boolean
  /** 표시할 메시지 */
  message?: ReactNode
  /** 메시지를 표시하기 전 대기 시간 (ms) */
  messageDelay?: number
  /** 커스텀 클래스 */
  className?: string
  /** 점 또는 스피너의 색상 */
  color?: string
  /** 🖼️ 정적 이미지 경로 (variant="image" 일 때 사용) */
  imageSrc?: string
  /** 🖼️ 이미지/Lottie 너비 및 높이 (기본값: 150) */
  imageSize?: number
  /** ✨ [추가됨] Lottie 애니메이션 JSON 데이터 */
  animationData?: unknown
}

/**
 * 사우나 극락 전용 공통 로딩 컴포넌트
 */
export default function Loading({
  variant = 'lottie', // ✨ 기본값
  fullScreen = true,
  message,
  messageDelay = 1000,
  className,
  color = '#ea580c',
  imageSrc = '/sauna-loading.png',
  imageSize = 100,
  animationData, // 외부에서 안 넘겨주면 빈 값으로 둠
}: LoadingProps) {
  const [mounted, setMounted] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [lottieData, setLottieData] = useState<unknown>(animationData)

  useEffect(() => {
    // 만약 animationData가 안 넘어왔고, lottie 스타일이라면 JSON을 fetch 해옵니다.
    if (!animationData && variant === 'lottie' && !lottieData) {
      fetch('/lottie/waiting.json')
        .then((res) => res.json())
        .then((data) => setLottieData(data))
        .catch((err) => console.error('Lottie load error:', err))
    }
  }, [animationData, variant, lottieData])

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
        fullScreen ? 'fixed inset-0 z-[9999] h-screen w-full bg-white/80 dark:bg-dark-main/80 backdrop-blur-md' : 'w-full py-10',
        className
      )}
    >
      {variant === 'lottie' && (
        <div className="relative flex items-center justify-center">
          {lottieData ? (
            <Lottie
              animationData={lottieData}
              loop={true}
              style={{ width: imageSize, height: imageSize }}
              rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
            />
          ) : (
            // Lottie 로딩 전까지는 스피너 표시 (CPU 절약)
            <div 
              className="animate-loading-spin rounded-full border-4 border-border-main border-t-point" 
              style={{ width: 40, height: 40 }} 
            />
          )}
        </div>
      )}

      {/* 🖼️ 기존 커스텀 이미지 영역 (CSS 애니메이션으로 교체) */}
      {variant === 'image' && imageSrc && (
        <div className="relative flex items-center justify-center animate-loading-pulse">
          <Image
            src={imageSrc}
            alt="로딩 중..."
            width={imageSize}
            height={imageSize}
            className="object-contain"
            priority
          />
        </div>
      )}

      {/* 🟢 점 로딩 (CSS 애니메이션으로 교체) */}
      {variant === 'dots' && (
        <div className="flex gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-3 w-3 rounded-full animate-loading-bounce"
              style={{ 
                backgroundColor: color,
                animationDelay: `${index * 0.15}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 🟢 스피너 (추가) */}
      {variant === 'spinner' && (
        <div 
          className="animate-loading-spin rounded-full border-4 border-border-main border-t-point" 
          style={{ width: 40, height: 40, borderTopColor: color }} 
        />
      )}

      {/* 메시지 영역 */}
      {message && showMessage && (
        <div
          className={clsx(
            'animate-pulse text-center font-bold tracking-wider text-gray-700 dark:text-gray-300 transition-opacity duration-500',
            fullScreen ? 'text-base' : 'text-sm'
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