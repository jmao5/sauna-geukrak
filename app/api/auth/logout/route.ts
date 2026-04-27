import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9050'

async function logoutHandler() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value

  // BE Redis에서 refreshToken 정리 (토큰 탈취 방어)
  if (accessToken || refreshToken) {
    try {
      await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      })
    } catch (e) {
      // BE 호출 실패해도 클라이언트 쿠키는 반드시 삭제
      logger.warn(`[Logout] BE 로그아웃 API 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const cookieDefaults = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax' as const,
    maxAge: 0,
  }

  const response = NextResponse.json({ message: 'Logged out successfully' })
  response.cookies.set('accessToken', '', cookieDefaults)
  response.cookies.set('refreshToken', '', cookieDefaults)

  return response
}

export const GET = logoutHandler
export const POST = logoutHandler
