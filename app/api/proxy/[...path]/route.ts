import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9050'

// BE와 동일하게 맞춘 쿠키 수명
const ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7   // 7일 — 쿠키는 오래 유지, JWT 만료 시 proxy가 자동 재발급
const REFRESH_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  // 7일  (BE refreshTokenExpireIn과 동일)

// 동시 요청 Race Condition 방어 — 진행 중인 reissue promise를 공유
let reissuePromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null

async function doReissue(
  accessToken: string | undefined,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const reissueRes = await fetch(`${BASE_URL}/reissue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: accessToken || 'EXPIRED', refreshToken }),
    })

    if (!reissueRes.ok) {
      const errorText = await reissueRes.text().catch(() => '')
      logger.error(`[Proxy] 토큰 갱신 실패 (HTTP ${reissueRes.status}): ${errorText}`)
      return null
    }

    const data = await reissueRes.json()
    const newAccessToken = data.data?.accessToken || data.accessToken
    const newRefreshToken = data.data?.refreshToken || data.refreshToken

    if (!newAccessToken) return null
    return { accessToken: newAccessToken, refreshToken: newRefreshToken || refreshToken }
  } catch (e) {
    logger.error(`[Proxy] 토큰 갱신 중 예외: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathString = path.join('/')
  const query = request.nextUrl.search
  const backendUrl = `${BASE_URL}/${pathString}${query}`
  const method = request.method

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value

  const makeHeaders = (token?: string) => {
    const headers = new Headers()
    headers.set('Content-Type', request.headers.get('content-type') || 'application/json')
    headers.set('Accept', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  }

  let body: string | null = null
  if (!['GET', 'HEAD'].includes(method)) {
    body = await request.text()
  }

  const cookieDefaults = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax' as const,
  }

  try {
    // ── 1차 시도 ──────────────────────────────────────────
    let response = await fetch(backendUrl, {
      method,
      headers: makeHeaders(accessToken),
      body,
      cache: 'no-store',
    })

    // ── 401 → 토큰 갱신 ───────────────────────────────────
    if (response.status === 401 && refreshToken) {
      logger.info(`[Proxy] 401 감지 (${pathString}). 토큰 갱신 시도...`)

      // Race Condition 방어: 동시에 여러 요청이 401 받아도 reissue는 1번만 실행
      if (!reissuePromise) {
        reissuePromise = doReissue(accessToken, refreshToken).finally(() => {
          reissuePromise = null
        })
      }

      const tokens = await reissuePromise

      if (tokens) {
        logger.info('[Proxy] 토큰 갱신 성공. 요청 재시도...')

        // 원래 요청 재시도
        response = await fetch(backendUrl, {
          method,
          headers: makeHeaders(tokens.accessToken),
          body,
          cache: 'no-store',
        })

        const nextResp = new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })

        // BE JWT 만료 시간과 정확히 맞춘 쿠키 수명
        nextResp.cookies.set('accessToken', tokens.accessToken, {
          ...cookieDefaults,
          maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
        })
        nextResp.cookies.set('refreshToken', tokens.refreshToken, {
          ...cookieDefaults,
          maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
        })

        return nextResp
      } else {
        // 갱신 실패 → 쿠키 제거 (강제 로그아웃)
        logger.warn('[Proxy] 토큰 갱신 실패. 쿠키 삭제.')
        const nextResp = NextResponse.json(
          { message: '세션이 만료되었습니다. 다시 로그인해주세요.' },
          { status: 401 }
        )
        nextResp.cookies.set('accessToken', '', { ...cookieDefaults, maxAge: 0 })
        nextResp.cookies.set('refreshToken', '', { ...cookieDefaults, maxAge: 0 })
        return nextResp
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (error) {
    logger.error(`[Proxy Error] ${error instanceof Error ? error.message : String(error)}`)
    return NextResponse.json({ message: 'Proxy Error' }, { status: 500 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
export const PATCH = proxy
