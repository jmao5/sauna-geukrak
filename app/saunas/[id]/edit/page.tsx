import { Metadata } from 'next'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '@/lib/getQueryClient'
import { notFound } from 'next/navigation'
import { getSaunaById } from '@/app/actions/sauna.actions'
import SaunaEditClient from './SaunaEditClient'

type Props = { params: Promise<{ id: string }> }

async function prefetchSauna(id: string) {
  const queryClient = getQueryClient()
  await queryClient.fetchQuery({
    queryKey: ['sauna', id],
    queryFn: () => getSaunaById(id),
    staleTime: 1000 * 60 * 5,
  })
  return queryClient
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const queryClient = await prefetchSauna(id)
    const sauna = queryClient.getQueryData<{ name: string }>(['sauna', id])
    if (!sauna) return { title: '사우나 수정' }
    return { title: `${sauna.name} 수정` }
  } catch {
    return { title: '사우나 수정' }
  }
}

export default async function SaunaEditPage({ params }: Props) {
  const { id } = await params
  
  let queryClient
  try {
    queryClient = await prefetchSauna(id)
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
