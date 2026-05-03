import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '@/lib/getQueryClient'
import { getSaunas } from '@/app/actions/sauna.actions'
import MapClient from './MapClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: '지도' }

export default async function MapPage() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['saunas', 'all'],
    queryFn: () => getSaunas(0, 200),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MapClient />
    </HydrationBoundary>
  )
}
