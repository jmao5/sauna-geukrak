'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { BiChevronLeft } from 'react-icons/bi'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error'))

  // 이미 로그인된 경우 홈으로
  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(searchParams.get('next') ?? '/')}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
    // 성공 시 자동으로 Google 로그인 페이지로 이동
  }

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-bg-sub active:scale-90"
        >
          <BiChevronLeft size={28} className="text-text-main" />
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16">
        {/* 로고 */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sauna-bg to-cold-bg border border-border-main shadow-card">
              <span className="text-4xl">🔥</span>
            </div>
          </div>
          <h1 className="font-juache text-2xl font-bold text-text-main">사우나 극락</h1>
          <p className="mt-1.5 text-sm text-text-sub">로그인하고 사활을 기록해보세요</p>
        </div>

        {/* 혜택 안내 */}
        <div className="mb-8 w-full rounded-2xl border border-border-main bg-bg-card p-4 space-y-2.5">
          {[
            { emoji: '❤️', text: '가고 싶은 사우나 찜하기' },
            { emoji: '✏️', text: '나만의 사활(방문기록) 남기기' },
            { emoji: '🏢', text: '새로운 사우나 시설 등록하기' },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-base">{emoji}</span>
              <span className="text-sm font-semibold text-text-main">{text}</span>
            </div>
          ))}
        </div>

        {/* 에러 */}
        {error && (
          <div className="mb-4 w-full rounded-xl border border-danger/20 bg-danger/5 px-4 py-3">
            <p className="text-xs font-semibold text-danger">{decodeURIComponent(error)}</p>
          </div>
        )}

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border-main bg-bg-card px-6 py-4 text-sm font-black text-text-main shadow-card transition active:scale-[0.97] disabled:opacity-60"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-main border-t-text-main" />
          ) : (
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {isLoading ? '연결 중...' : 'Google로 시작하기'}
        </button>

        <p className="mt-6 text-center text-[11px] text-text-muted leading-relaxed">
          로그인 시{' '}
          <span className="underline">이용약관</span>
          {' '}및{' '}
          <span className="underline">개인정보처리방침</span>에 동의합니다
        </p>
      </div>
    </div>
  )
}
