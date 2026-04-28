import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api-instance'
import SaunaMap from '@/components/Map'

export default async function HomePage() {
  const queryClient = new QueryClient()

  // 서버 사이드에서 모든 사우나 데이터를 미리 패칭 (SSR)
  await queryClient.prefetchQuery({
    queryKey: ['saunas'],
    queryFn: async () => {
      const supabase = await createClient()
      return api.saunas.getAll(supabase)
    },
  })

  return (
    <main className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-text-main">내 주변 사우나 극락</h1>
        <p className="text-text-sub text-sm">지도에서 사우나를 탐색해보세요</p>
      </div>
      
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SaunaMap />
      </HydrationBoundary>
    </main>
  )
}
