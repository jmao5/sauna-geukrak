import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api-instance'
import MapClient from './MapClient'

export const metadata = { title: '지도' }

export default async function MapPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['saunas'],
    queryFn: async () => {
      const supabase = await createClient()
      return api.saunas.getAll(supabase)
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MapClient />
    </HydrationBoundary>
  )
}
