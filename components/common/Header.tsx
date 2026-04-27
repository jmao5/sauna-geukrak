'use client'

import { useRouter } from 'next/navigation'
import { BiChevronLeft } from 'react-icons/bi'
import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface HeaderProps {
  title?: string
  isTransparent?: boolean // 배경 투명 여부 (상세페이지용)
  rightAction?: ReactNode // 우측 버튼 (공유하기 등)
  onBack?: () => void // 뒤로가기 커스텀 동작
  className?: string
}

export default function Header({
  title,
  isTransparent = false,
  rightAction,
  onBack,
  className }: HeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  return (
    <header
      className={clsx(
        'absolute top-0 z-50 flex h-14 w-full items-center justify-between px-2 transition-colors',
        isTransparent ? 'bg-transparent text-white' : 'relative bg-bg-sub text-text-main shadow-sm border-b border-border-main',
        className,
      )}
    >
      {/* 뒤로가기 버튼 */}
      <button
        onClick={handleBack}
        className={clsx(
          'rounded-full p-2 transition active:scale-95',
          isTransparent ? 'hover:bg-white/10' : 'hover:bg-bg-main',
        )}
      >
        <BiChevronLeft size={32} />
      </button>

      {/* 타이틀 */}
      {title && (
        <h1 className="flex-1 truncate px-2 text-center text-lg font-bold drop-shadow-sm">
          {title}
        </h1>
      )}

      {/* 우측 액션 (없으면 공간만 차지해서 타이틀 중앙 정렬 유지) */}
      <div className="flex w-12 justify-end">{rightAction || <div className="w-8" />}</div>
    </header>
  )
}
