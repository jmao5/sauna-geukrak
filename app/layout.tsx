import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import localFont from 'next/font/local'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'
import { MotionProvider } from '@/components/providers/MotionProvider'
import ClientLayout from '@/components/ClientLayout'
import AuthProvider from '@/components/providers/AuthProvider'
import AppFrame from '@/components/layout/AppFrame'
import { Toaster } from 'react-hot-toast'
import { Suspense } from 'react'
import Loading from '@/components/ui/Loading'

const pretendard = localFont({
  src: './fonts/Pretendard-Regular.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '100 900',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
})

const juache = localFont({
  src: './fonts/Juache.woff',
  variable: '--font-juache',
  display: 'swap',
  weight: '400'
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#1a1714' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: { template: '%s | 사우나 극락', default: '사우나 극락' },
  description: '전국의 사우나, 찜질방 정보를 확인하고 나만의 방문 기록을 남겨보세요.',
  keywords: ['사우나', '찜질방', '온천', '목욕', '사우나 추천', '사우나 극락'],
  openGraph: {
    title: '사우나 극락',
    description: '한국의 사우나·찜질방을 발견하고 기록하는 서비스',
    url: 'https://sauna-geukrak.vercel.app',
    siteName: '사우나 극락',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: '사우나 극락', description: '한국의 사우나·찜질방을 발견하고 기록하는 서비스' },
  verification: { google: '0nTgDHM2T8QPuBOP45Kg1NFw7cgi_hMnXdyi5cZuEgk' },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '사우나 극락' },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${pretendard.variable} ${juache.variable}`}>
      <head>
        {/* 테마 플리커 방지 인라인 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ui-storage');if(t){var p=JSON.parse(t);if(p.state&&p.state.theme==='dark')document.documentElement.classList.add('dark');}}catch(e){}})();`
          }}
        />
        {/*
          카카오 SDK: afterInteractive → 지도 화면 진입 전에 파싱 완료.
          lazyOnload 는 onload 이벤트 후에야 다운로드 시작하므로 지도 진입 시 항상 늦음.
          afterInteractive 는 hydration 직후 바로 실행 → 체감 1-2초 단축.
        */}
        <script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services,clusterer&autoload=false`}
          async
        />
      </head>
      <body className="antialiased overflow-hidden">
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`}
        </Script>
        <QueryProvider>
          <ThemeProvider>
            <MotionProvider>
              <AuthProvider>
                <AppFrame>
                  <Suspense fallback={<Loading message="준비 중입니다..." />}>
                    <ClientLayout>{children}</ClientLayout>
                  </Suspense>
                </AppFrame>
              </AuthProvider>
            </MotionProvider>
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: 'font-pretendard text-sm font-medium shadow-lg',
                style: { background: 'rgba(30, 30, 30, 0.9)', color: '#fff', padding: '12px 20px', borderRadius: '99px', backdropFilter: 'blur(10px)' },
                success: { iconTheme: { primary: '#FF007A', secondary: 'white' } },
                error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
