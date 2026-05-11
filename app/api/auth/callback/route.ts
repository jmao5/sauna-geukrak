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

  // 로그인 전에 저장해둔 next 경로 읽기 (없으면 홈)
  const rawNext = cookieStore.get('oauth_redirect_next')?.value
  const next = rawNext ? decodeURIComponent(rawNext) : '/'

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
  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    const redirectUrl = new URL('/login', origin)
    redirectUrl.searchParams.set('error', exchangeError.message)
    return NextResponse.redirect(redirectUrl)
  }

  // public.users 레코드 보장
  const authUser = sessionData?.user
  let isNewUser = false
  if (authUser) {
    const nickname =
      authUser.user_metadata?.name ??
      authUser.user_metadata?.full_name ??
      authUser.email?.split('@')[0] ??
      '익명'
    const avatar_url = authUser.user_metadata?.avatar_url ?? null

    const { data: existing } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('id', authUser.id)
      .single()

    if (!existing) {
      // 신규 유저 — insert
      await supabase.from('users').insert({ id: authUser.id, nickname, avatar_url })
      isNewUser = true
    } else {
      // 기존 유저 — avatar만 갱신
      await supabase.from('users').update({ avatar_url }).eq('id', authUser.id)
    }
  }

  // oauth_redirect_next 쿠키 삭제
  const finalNext = isNewUser ? `/onboarding?next=${encodeURIComponent(next)}` : next

  const response = NextResponse.redirect(
    process.env.NODE_ENV === 'development'
      ? `${origin}${finalNext}`
      : `https://${request.headers.get('x-forwarded-host') ?? new URL(origin).host}${finalNext}`
  )
  response.cookies.delete('oauth_redirect_next')

  return response
}
