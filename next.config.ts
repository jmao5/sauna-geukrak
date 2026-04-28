import type { NextConfig } from 'next'

// Bundle analyzer 설정 (환경변수 ANALYZE=true로 활성화)
import bundleAnalyzer from '@next/bundle-analyzer'
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'k.kakaocdn.net',
      },
    ],
  },
  turbopack: {
    // Turbopack 설정을 명시해줍니다 (빈 객체라도 상관없음).
  },
}

export default withBundleAnalyzer(nextConfig)
