import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api-instance'
import { SaunaDetailClient } from './SaunaDetailClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = await createClient()
    const sauna = await api.saunas.getById(id, supabase)
    return {
      title: sauna.name,
      description: `${sauna.address} · 사우나 극락에서 ${sauna.name}의 온도, 시설 정보와 사활을 확인하세요.`,
    }
  } catch {
    return { title: '사우나 상세' }
  }
}

export default async function SaunaDetailPage({ params }: Props) {
  const { id } = await params
  const queryClient = new QueryClient()

  try {
    await queryClient.prefetchQuery({
      queryKey: ['sauna', id],
      queryFn: async () => {
        const supabase = await createClient()
        return api.saunas.getById(id, supabase)
      },
    })
  } catch {
    notFound()
  }

  const sauna = queryClient.getQueryData(['sauna', id])
  if (!sauna) notFound()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SaunaDetailClient id={id} />
    </HydrationBoundary>
  )
}
