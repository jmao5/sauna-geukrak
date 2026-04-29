import { Metadata } from 'next'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api-instance'
import { notFound } from 'next/navigation'
import SaunaEditClient from './SaunaEditClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = await createClient()
    const sauna = await api.saunas.getById(id, supabase)
    return { title: `${sauna.name} 수정` }
  } catch {
    return { title: '사우나 수정' }
  }
}

export default async function SaunaEditPage({ params }: Props) {
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
      <SaunaEditClient id={id} />
    </HydrationBoundary>
  )
}
