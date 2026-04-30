import { Metadata } from 'next'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { getSaunaById } from '@/app/actions/sauna.actions'
import SaunaEditClient from './SaunaEditClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const sauna = await getSaunaById(id)
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
      queryFn: () => getSaunaById(id),
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
