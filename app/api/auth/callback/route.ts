import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase Google OAuth 콜백 처리
 * Google이 이 URL로 code를 리다이렉트하면 세션으로 교환합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // 에러 파라미터가 있으면 로그인 페이지로 리다이렉트
  if (error) {
    const redirectUrl = new URL('/login', origin)
    redirectUrl.searchParams.set('error', errorDescription ?? error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  )

  // code를 세션으로 교환 — Supabase가 자동으로 쿠키에 access_token / refresh_token 저장
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    const redirectUrl = new URL('/login', origin)
    redirectUrl.searchParams.set('error', exchangeError.message)
    return NextResponse.redirect(redirectUrl)
  }

  // 성공: next 파라미터 경로 또는 홈으로 이동
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
