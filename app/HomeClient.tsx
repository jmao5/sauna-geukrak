'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { SaunaSummaryDto } from '@/types/sauna'
import { getSaunas } from './actions/sauna.actions'
import { useDebounce } from '@/hooks/useDebounce'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import HomeHeader from '@/components/home/HomeHeader'
import SaunaList from '@/components/home/SaunaList'
import FilterBottomSheets from '@/components/home/FilterBottomSheets'

const PAGE_SIZE = 20

export default function HomeClient() {
  const { keyword, selectedRegion, selectedConds, sortKey } = useHomeFilterStore()
  const debouncedKeyword = useDebounce(keyword, 300)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['saunas', 'infinite', debouncedKeyword, selectedRegion, selectedConds, sortKey],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const result = await getSaunas({
        page: pageParam,
        pageSize: PAGE_SIZE,
        keyword: debouncedKeyword,
        region: selectedRegion ?? undefined,
        conditions: selectedConds,
        sort: sortKey,
      })
      return (Array.isArray(result) ? result : []) as SaunaSummaryDto[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: 1000 * 60 * 5,
  })

  const allSaunas = (data?.pages ?? []).flat() as SaunaSummaryDto[]

  const isFemale = selectedConds.includes('female')
  const isMale = selectedConds.includes('male')
  const pref = isFemale && !isMale ? 'female' : !isFemale && isMale ? 'male' : null

  let filtered = allSaunas

  switch (sortKey) {
    case 'temp_hot':
      filtered = [...filtered].sort((a, b) => {
        const aR = pref ? a.sauna_rooms?.filter((r) => (r as any).gender === pref || (r as any).gender === 'both') : a.sauna_rooms
        const bR = pref ? b.sauna_rooms?.filter((r) => (r as any).gender === pref || (r as any).gender === 'both') : b.sauna_rooms
        return (bR?.length ? Math.max(...bR.map((r) => r.temp)) : 0) - (aR?.length ? Math.max(...aR.map((r) => r.temp)) : 0)
      })
      break
    case 'temp_cold':
      filtered = [...filtered].sort((a, b) => {
        const aB = pref ? a.cold_baths?.filter((b) => (b as any).gender === pref || (b as any).gender === 'both') : a.cold_baths
        const bB = pref ? b.cold_baths?.filter((b) => (b as any).gender === pref || (b as any).gender === 'both') : b.cold_baths
        return (aB?.length ? Math.min(...aB.map((r) => r.temp)) : 99) - (bB?.length ? Math.min(...bB.map((r) => r.temp)) : 99)
      })
      break
    case 'price_asc':
      filtered = [...filtered].sort((a, b) => (a.pricing?.adult_day ?? 99999) - (b.pricing?.adult_day ?? 99999))
      break
  }

  const hasActiveFilter = !!selectedRegion || selectedConds.length > 0 || !!debouncedKeyword.trim()

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <HomeHeader />

      <SaunaList
        filtered={filtered}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        hasActiveFilter={hasActiveFilter}
      />

      <FilterBottomSheets />
    </div>
  )
}
