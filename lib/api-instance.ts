import { logger } from '@/lib/logger'

const isServer = typeof window === 'undefined'
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9050'
const PROXY_URL = '/api/proxy'

export class ApiError extends Error {
  response?: { status: number; data: unknown }

  constructor(message: string, status?: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    if (status !== undefined) this.response = { status, data }
  }
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
  auth?: boolean
  skipRedirectOn401?: boolean
}

/**
 * [통합 API 인스턴스]
 *
 * [BUG FIX] SSR 401 재발급 로직 제거
 * proxy.ts(미들웨어)가 이미 페이지 렌더링 전에 accessToken을 선제 갱신하므로
 * api-instance.ts에서 중복으로 /reissue를 호출할 필요가 없습니다.
 * 두 곳이 동시에 호출되면 race condition으로 TOKEN_NOT_MATCH(401)가 발생합니다.
 *
 * SSR에서 401이 오면 → 그냥 에러를 throw하고 클라이언트가 /api/proxy를 통해 재처리합니다.
 */
export async function apiInstance<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, auth = true, skipRedirectOn401 = false, ...fetchOptions } = options

  // 1. URL 구성
  const baseUrl = isServer ? BACKEND_URL : PROXY_URL
  let fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
  }

  // 2. 헤더 설정
  const headers = new Headers(fetchOptions.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  if (isServer && auth) {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const token = cookieStore.get('accessToken')?.value
      if (token) headers.set('Authorization', `Bearer ${token}`)
    } catch {
      // ignore — 쿠키 접근 불가 환경
    }
  }

  // 3. 요청 실행
  if (isServer) logger.info(`[API REQ] [${fetchOptions.method || 'GET'}] ${fullUrl}`)
  const startTime = Date.now()

  try {
    const response = await fetch(fullUrl, { ...fetchOptions, headers })

    if (isServer) {
      logger.info(`[API RES] [${response.status}] ${fullUrl} (${Date.now() - startTime}ms)`)
    }

    if (!response.ok) {
      // 클라이언트 사이드 401 → 콘솔 경고 (인증이 필요한 API 호출 실패)
      if (!isServer && response.status === 401 && !skipRedirectOn401) {
        console.warn('[API] 인증이 필요한 요청이 실패했습니다:', fullUrl)
      }

      const errorData = await response.json().catch(() => ({}))
      const errorMessage =
        errorData.message || errorData.error || response.statusText || `HTTP Error ${response.status}`
      throw new ApiError(errorMessage, response.status, errorData)
    }

    // 4. 응답 파싱
    const text = await response.text()
    if (!text) return {} as T

    try {
      const data = JSON.parse(text)
      // ApiResponse({ success: true, data: ... }) 자동 언래핑
      if (data && typeof data === 'object' && 'success' in data && typeof data.success === 'boolean') {
        return data.data as T
      }
      return data as T
    } catch {
      return text as unknown as T
    }
  } catch (error) {
    if (isServer && !(error instanceof ApiError)) {
      logger.error(`[API FAIL] ${fullUrl} - ${error instanceof Error ? error.message : String(error)}`)
    }
    throw error
  }
}
