import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9050'

const COOKIE_DEFAULTS = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
}

const ACCESS_MAX_AGE = 60 * 60 * 24 * 7   // 7일
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7  // 7일

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // 1. Supabase SSR 세션 갱신 (기존 middleware.ts 로직)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  // 2. Custom Backend 토큰 갱신 (기존 proxy.ts 로직)
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  const isSecure = process.env.NODE_ENV === 'production'

  // accessToken 만료 선제 갱신
  if (!accessToken && refreshToken) {
    try {
      const reissueRes = await fetch(`${BACKEND_URL}/reissue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: 'EXPIRED', refreshToken }),
      })

      if (reissueRes.ok) {
        const data = await reissueRes.json()
        const newAccessToken = data.data?.accessToken || data.accessToken
        const newRefreshToken = data.data?.refreshToken || data.refreshToken

        if (newAccessToken) {
          response.cookies.set('accessToken', newAccessToken, {
            ...COOKIE_DEFAULTS,
            secure: isSecure,
            maxAge: ACCESS_MAX_AGE,
          })
          if (newRefreshToken) {
            response.cookies.set('refreshToken', newRefreshToken, {
              ...COOKIE_DEFAULTS,
              secure: isSecure,
              maxAge: REFRESH_MAX_AGE,
            })
          }
        }
      } else {
        // refreshToken도 만료됨 → 쿠키 삭제 후 통과
        response.cookies.set('accessToken', '', { ...COOKIE_DEFAULTS, maxAge: 0 })
        response.cookies.set('refreshToken', '', { ...COOKIE_DEFAULTS, maxAge: 0 })
      }
    } catch {
      // 네트워크 오류 등 예외 상황은 그냥 통과
    }
  }

  return response
}

// 미들웨어가 적용될 경로 설정 (정적 파일, 이미지 등 제외)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|workbox-.*|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
