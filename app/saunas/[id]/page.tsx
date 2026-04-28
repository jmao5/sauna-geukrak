import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api-instance'
import { SaunaDetailClient } from './SaunaDetailClient'
import { notFound } from 'next/navigation'

export default async function SaunaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const queryClient = new QueryClient()

  // 서버 사이드에서 데이터를 미리 패칭 (SSR)
  await queryClient.prefetchQuery({
    queryKey: ['sauna', id],
    queryFn: async () => {
      const supabase = await createClient()
      const data = await api.saunas.getById(id, supabase)
      if (!data) throw new Error('Not found')
      return data
    },
  })

  // 패칭된 데이터가 없으면 404 처리
  const sauna = queryClient.getQueryData(['sauna', id])
  if (!sauna) {
    notFound()
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SaunaDetailClient id={id} />
    </HydrationBoundary>
  )
}
