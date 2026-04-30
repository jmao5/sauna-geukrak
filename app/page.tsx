import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import HomeClient from './HomeClient'
import getQueryClient from '@/lib/getQueryClient'

const PAGE_SIZE = 20

export default async function HomePage() {
  const queryClient = getQueryClient()

  // 서버에서 무한 스크롤의 첫 페이지 데이터를 미리 가져옵니다. (Prefetch)
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['saunas', 'infinite'],
    queryFn: async () => {
      // 서버에서 실행되므로 훨씬 빠르게 데이터를 확보합니다.
      const result = await api.saunas.getAll(undefined, 0, PAGE_SIZE)
      return (Array.isArray(result) ? result : [])
    },
    initialPageParam: 0,
  })

  return (
    // dehydrate를 통해 서버에서 가져온 캐시를 클라이언트로 안전하게 넘겨줍니다.
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeClient />
    </HydrationBoundary>
  )
}