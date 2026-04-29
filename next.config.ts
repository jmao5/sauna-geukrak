import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // 카카오 CDN (이미지 폴백)
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'place.map.kakao.com',
      },
      // 카카오 장소 og:image가 다양한 호스트에서 서빙됨
      {
        protocol: 'https',
        hostname: '*.kakao.com',
      },
      {
        protocol: 'https',
        hostname: '*.daumcdn.net',
      },
    ],
  },
  turbopack: {},
}

export default withBundleAnalyzer(nextConfig)
