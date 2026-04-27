'use client'

import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'rect' | 'circle' | 'text'
  width?: string | number
  height?: string | number
}

export default function Skeleton({
  className,
  variant = 'rect',
  width,
  height }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-bg-sub/80 dark:bg-bg-sub/30',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-lg',
        variant === 'text' && 'h-3 rounded',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height }}
    />
  )
}
