import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getSaunas } from '@/app/actions/sauna.actions'
import MapClient from './MapClient'

export const metadata = { title: '지도' }

export default async function MapPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['saunas', 'all'],
    queryFn: () => getSaunas(0, 200),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MapClient />
    </HydrationBoundary>
  )
}
