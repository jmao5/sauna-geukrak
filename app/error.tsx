'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { BiErrorCircle, BiRefresh, BiHomeAlt } from 'react-icons/bi'

export default function Error({
  error,
  reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-bg-main p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <BiErrorCircle size={64} className="text-danger opacity-80" />
        <h2 className="text-2xl font-extrabold text-text-main">문제가 발생했습니다</h2>
        <p className="max-w-[280px] text-sm text-text-sub leading-relaxed">
          시스템 오류가 발생하여 페이지를 불러오지 못했습니다. <br />
          잠시 후 다시 시도해 주세요.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-point px-6 py-3.5 font-bold text-white shadow-lg shadow-point/20 transition-all hover:bg-point/90 active:scale-95"
        >
          <BiRefresh size={20} />
          다시 시도하기
        </button>
        <button
          onClick={() => {
            router.push('/')
            router.refresh()
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-bg-sub px-6 py-3.5 font-bold text-text-main border border-border-main transition-all hover:bg-bg-main active:scale-95"
        >
          <BiHomeAlt size={20} />
          홈으로 가기
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-left text-xs font-mono text-red-800 dark:bg-red-950/20 dark:text-red-400 max-w-md overflow-auto">
          {error.message}
        </div>
      )}
    </div>
  )
}
