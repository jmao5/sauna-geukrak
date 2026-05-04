import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getSaunasByLocation } from '@/app/actions/sauna.actions'
import MapClient from './MapClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: '지도' }

// 서울 중심 fallback — 위치 권한 없는 유저도 즉시 마커 표시
const SEOUL = { lat: 37.545, lng: 126.84 }

export default async function MapPage() {
  const queryClient = new QueryClient()

  // 서버에서 서울 기준 15km 사우나 미리 fetch
  // → 클라이언트 hydration 즉시 마커 표시, 위치 확인 후 재쿼리
  await queryClient.prefetchQuery({
    queryKey: ['saunas', 'location', SEOUL.lat, SEOUL.lng],
    queryFn: () => getSaunasByLocation(SEOUL.lat, SEOUL.lng, 15),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MapClient />
    </HydrationBoundary>
  )
}
