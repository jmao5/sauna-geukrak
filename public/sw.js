// 사우나 극락 Service Worker
// 전략: Network First (항상 최신 데이터 우선) + 오프라인 fallback

const CACHE_NAME = 'sauna-geukrak-v1'

// 앱 셸 — 오프라인에서도 반드시 필요한 리소스
const APP_SHELL = [
  '/',
  '/offline',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
  '/lottie/sauna-loading.json',
]

// ── Install: 앱 셸 캐시 ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// ── Activate: 구버전 캐시 정리 ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: Network First 전략 ────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 1. Chrome Extension / non-http 요청 스킵
  if (!url.protocol.startsWith('http')) return

  // 2. Supabase API / 외부 API — 캐시 없이 네트워크만
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('dapi.kakao.com') ||
    url.hostname.includes('kakao.com') ||
    url.hostname.includes('k.kakaocdn.net')
  ) {
    return
  }

  // 3. Next.js HMR / dev 요청 스킵
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // 4. _next/static — Cache First (해시가 붙어 있어 불변)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
      )
    )
    return
  }

  // 5. 나머지 — Network First + 오프라인 fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        // GET 요청만 캐시
        if (request.method === 'GET' && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return res
      })
      .catch(async () => {
        // 네트워크 실패 → 캐시에서 찾기
        const cached = await caches.match(request)
        if (cached) return cached

        // HTML 요청이면 오프라인 페이지
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/offline') ?? Response.error()
        }

        return Response.error()
      })
  )
})
