'use client'

import { useState, useMemo, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { SaunaSummaryDto } from '@/types/sauna'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import Image from 'next/image'
import { BiSearch, BiMap } from 'react-icons/bi'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import Loading from '@/components/ui/Loading'

type Filter = 'all' | 'autoloyly' | 'groundwater' | 'jjimjilbang' | 'tattoo' | 'female'

const FILTER_OPTIONS: { id: Filter; label: string; emoji: string }[] = [
  { id: 'all', label: '전체', emoji: '' },
  { id: 'autoloyly', label: '오토 로우리', emoji: '💦' },
  { id: 'groundwater', label: '지하수', emoji: '🏔️' },
  { id: 'jjimjilbang', label: '찜질방', emoji: '🧖' },
  { id: 'tattoo', label: '타투OK', emoji: '🖋️' },
  { id: 'female', label: '여성가능', emoji: '👩' },
]

const PAGE_SIZE = 20

function CardSkeleton() {
  return (
    <div className="sauna-card overflow-hidden">
      <Skeleton className="skeleton-shimmer h-32 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="skeleton-shimmer h-3 w-3/4 rounded" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/2 rounded" />
      </div>
    </div>
  )
}

export default function HomeClient() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['saunas', 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const result = await api.saunas.getAll(undefined, pageParam, PAGE_SIZE)
      // 항상 배열을 반환 — undefined/null 방어
      return (Array.isArray(result) ? result : []) as SaunaSummaryDto[]
    },
    initialPageParam: 0,
    // lastPage는 queryFn이 항상 SaunaSummaryDto[]를 반환하므로 절대 undefined가 되지 않음
    getNextPageParam: (lastPage: SaunaSummaryDto[], allPages: SaunaSummaryDto[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    // gcTime을 0으로 설정 — 컴포넌트 언마운트 즉시 캐시 제거
    // → 탭 전환 후 재마운트 시 손상된 pages 캐시를 읽지 않음
    gcTime: 0,
    staleTime: 1000 * 60 * 5,
  })

  const allSaunas = useMemo(
    () => (data?.pages ?? []).flat() as SaunaSummaryDto[],
    [data]
  )

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver({
    rootMargin: '200px',
    onObserve: loadMore,
    enabled: !!hasNextPage && !isFetchingNextPage,
  })

  const filteredSaunas = useMemo(() => {
    if (activeFilter === 'all') return allSaunas
    return allSaunas.filter((s) => {
      switch (activeFilter) {
        case 'autoloyly':   return s.sauna_rooms?.some((r) => r.has_auto_loyly)
        case 'groundwater': return s.cold_baths?.some((b) => b.is_groundwater)
        case 'jjimjilbang': return s.kr_specific?.has_jjimjilbang
        case 'tattoo':      return s.rules?.tattoo_allowed
        case 'female':      return s.rules?.female_allowed
        default:            return true
      }
    })
  }, [allSaunas, activeFilter])

  const featured = useMemo(() => {
    if (activeFilter !== 'all') return null
    return allSaunas.find((s) => s.is_featured)
      ?? [...allSaunas].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))[0]
      ?? null
  }, [allSaunas, activeFilter])

  const { data: featuredKakaoImage } = useKakaoSaunaImage(
    featured?.name ?? '',
    featured?.address,
    featured?.images?.[0],
    activeFilter === 'all' && !!featured,
  )

  return (
    <div className="flex h-full flex-col bg-bg-main">

      {/* ── 헤더 ── */}
      <div className="flex-shrink-0 bg-bg-sub border-b border-border-main">
        <div className="px-4 pt-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="font-juache text-[22px] font-bold tracking-tight text-text-main leading-none">
                사우나 극락
              </h1>
              <p className="mt-0.5 text-[11px] text-text-muted tracking-wide">
                {isLoading ? '로딩 중...' : `전국 ${allSaunas.length}곳`}
              </p>
            </div>
            <Link
              href="/map"
              className="flex items-center gap-1 rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-sub transition active:scale-95"
            >
              <BiMap size={13} />
              지도
            </Link>
          </div>

          <Link
            href="/search"
            className="flex w-full items-center gap-2.5 rounded-xl border border-border-main bg-bg-main px-3.5 py-2.5 transition active:scale-[0.99]"
          >
            <BiSearch size={16} className="flex-shrink-0 text-text-muted" />
            <span className="text-[13px] text-text-muted">사우나 이름, 지역으로 검색...</span>
          </Link>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-3 gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                aria-pressed={isActive}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-point text-white'
                    : 'border border-border-main bg-bg-main text-text-sub'
                }`}
              >
                {opt.emoji && <span className="mr-0.5">{opt.emoji}</span>}
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 목록 ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Editor's Pick */}
        {!isLoading && activeFilter === 'all' && featured && (
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-black text-text-muted tracking-widest uppercase">Editor's Pick</p>
              {featured.is_featured && (
                <span className="text-[9px] font-bold text-point">CURATED</span>
              )}
            </div>
            <Link href={`/saunas/${featured.id}`} className="block relative h-44 w-full rounded-2xl overflow-hidden mb-1">
              {(featured.images?.[0] || featuredKakaoImage) ? (
                <Image
                  src={featured.images?.[0] ?? featuredKakaoImage!}
                  alt={featured.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 680px"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-sauna-bg via-bg-main to-cold-bg" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] font-bold text-white/60 mb-1 tracking-widest uppercase">Featured</p>
                <p className="text-lg font-black text-white leading-tight">{featured.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {featured.sauna_rooms && featured.sauna_rooms.length > 0 && (
                    <span className="text-[12px] font-black text-orange-300">
                      🔥 {Math.max(...featured.sauna_rooms.map((r) => r.temp))}°C
                    </span>
                  )}
                  {featured.cold_baths && featured.cold_baths.length > 0 && (
                    <span className="text-[12px] font-black text-blue-300">
                      ❄️ {Math.min(...featured.cold_baths.map((b) => b.temp))}°C
                    </span>
                  )}
                  {featured.avg_rating != null && (
                    <span className="text-[12px] font-black text-yellow-300">
                      ⭐ {featured.avg_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* 섹션 헤더 */}
        {!isLoading && (
          <div className="flex items-center justify-between px-4 pb-2.5">
            <p className="text-[11px] font-black text-text-muted tracking-widest uppercase">
              {activeFilter === 'all' ? 'All Saunas' : FILTER_OPTIONS.find(f => f.id === activeFilter)?.label}
            </p>
            <p className="text-[11px] text-text-muted">{filteredSaunas.length}곳</p>
          </div>
        )}

        {/* 2열 그리드 */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-2.5">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : filteredSaunas.length > 0
                ? filteredSaunas
                    .filter((s) => !(activeFilter === 'all' && featured && s.id === featured.id))
                    .map((sauna) => (
                      <SaunaCard key={sauna.id} sauna={sauna} variant="grid" />
                    ))
                : (
                  <div className="col-span-2 flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="text-4xl">🧖</span>
                    <p className="text-sm font-bold text-text-sub">해당 조건의 사우나가 없어요</p>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="rounded-full bg-point px-4 py-2 text-xs font-bold text-white"
                    >
                      전체 보기
                    </button>
                  </div>
                )
            }
          </div>
        </div>

        <div className="h-4" />

        {/* 무한 스크롤 sentinel */}
        {isFetchingNextPage && (
          <Loading variant="dots" fullScreen={false} color="var(--color-point)" />
        )}
      </div>
    </div>
  )
}
