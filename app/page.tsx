import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getSaunas } from './actions/sauna.actions'
import HomeClient from './HomeClient'

/**
 * 개선: force-dynamic → ISR (revalidate: 60)
 *
 * 기존 문제:
 *   force-dynamic = 매 요청마다 서버에서 Supabase 쿼리 실행 후 HTML 생성
 *   → 사우나 목록은 실시간성 불필요한데 매번 100~300ms 지연 발생
 *   → CDN 캐시도 없어 모든 유저가 동일한 비용을 반복 지불
 *
 * 개선 결과:
 *   첫 요청만 Supabase 쿼리 실행, 이후 60초간 CDN에서 즉시 서빙
 *   → 대부분의 요청에서 서버 렌더링 지연 0ms
 *   → 사우나 등록/수정은 revalidatePath('/') 호출로 즉시 갱신 가능
 */
export const revalidate = 60

const PAGE_SIZE = 20

export default async function HomePage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['saunas', 'infinite'],
    queryFn: async () => {
      const result = await getSaunas({ page: 0, pageSize: PAGE_SIZE })
      return Array.isArray(result) ? result : []
    },
    initialPageParam: 0,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient />
    </HydrationBoundary>
  )
}
