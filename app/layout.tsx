import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import localFont from 'next/font/local'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'
import { MotionProvider } from '@/components/providers/MotionProvider'
import ClientLayout from '@/components/ClientLayout'
import AppFrame from '@/components/layout/AppFrame'
import { Toaster } from 'react-hot-toast'
import { Suspense } from 'react'
import Loading from '@/components/ui/Loading'

const pretendard = localFont({
  src: './fonts/Pretendard-Regular.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '400' })

const juache = localFont({
  src: './fonts/Juache.woff',
  variable: '--font-juache',
  display: 'swap',
  weight: '400' })

// 1. 뷰포트 설정
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false }

// 2. 글로벌 메타데이터 설정
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),

  title: {
    template: '%s | 사우나 극락',
    default: '사우나 극락 - 한국 사우나 탐색 및 기록',
  },
  description: '전국의 사우나, 찜질방 정보를 확인하고 나만의 방문 기록을 남겨보세요. 온도 정보부터 생생한 후기까지, 사우나 극락에서 확인하세요.',
  keywords: ['사우나', '찜질방', '온천', '목욕', '사우나 추천', '사우나 극락', '사우나 이키타이'],

  openGraph: {
    title: '사우나 극락',
    description: '한국의 사우나·찜질방을 발견하고 기록하는 서비스',
    url: 'https://sauna-geukrak.vercel.app',
    siteName: '사우나 극락',
    locale: 'ko_KR',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: '사우나 극락',
    description: '한국의 사우나·찜질방을 발견하고 기록하는 서비스',
  },

  verification: {
    google: '0nTgDHM2T8QPuBOP45Kg1NFw7cgi_hMnXdyi5cZuEgk',
  },

  icons: {
    icon: '/favicon.ico',
  },

  formatDetection: {
    telephone: false,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${pretendard.variable} ${juache.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('ui-storage');
                  if (theme) {
                    var parsed = JSON.parse(theme);
                    if (parsed.state && parsed.state.theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            ` }}
        />
      </head>
      <body className="antialiased overflow-hidden">
        <Script 
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services,clusterer&autoload=false`} 
          strategy="beforeInteractive" 
        />
        <QueryProvider>
          <ThemeProvider>
            <MotionProvider>
              <AppFrame>
                <Suspense fallback={<Loading fullScreen={false} message="준비 중입니다..." />}>
                  <ClientLayout>{children}</ClientLayout>
                </Suspense>
              </AppFrame>
            </MotionProvider>
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: 'font-pretendard text-sm font-medium shadow-lg',
                style: {
                  background: 'rgba(30, 30, 30, 0.9)',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '99px',
                  backdropFilter: 'blur(10px)' },
                success: {
                  iconTheme: {
                    primary: '#FF007A',
                    secondary: 'white' } },
                error: {
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: 'white' } } }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
