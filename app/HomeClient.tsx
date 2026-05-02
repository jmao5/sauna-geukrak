'use client'

import { useState, useMemo, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { SaunaSummaryDto } from '@/types/sauna'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import Image from 'next/image'
import { BiSearch, BiMap } from 'react-icons/bi'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import Loading from '@/components/ui/Loading'
import { getSaunas } from './actions/sauna.actions'

type Filter = 'all' | 'autoloyly' | 'groundwater' | 'jjimjilbang' | 'tattoo' | 'female'

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'all',         label: 'ALL' },
  { id: 'autoloyly',   label: '오토 로우리' },
  { id: 'groundwater', label: '지하수' },
  { id: 'jjimjilbang', label: '찜질방' },
  { id: 'tattoo',      label: '타투 OK' },
  { id: 'female',      label: '여성 가능' },
]

const PAGE_SIZE = 20

function CardSkeleton() {
  return (
    <div className="sauna-card">
      <Skeleton className="skeleton-shimmer w-full" height={120} variant="rect" />
      <div className="p-3 space-y-2">
        <Skeleton className="skeleton-shimmer h-3 w-3/4" variant="text" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/2" variant="text" />
      </div>
    </div>
  )
}

export default function HomeClient() {
  const [activeFilter, setActiveFilter] = useState<Filter>('all')

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['saunas', 'infinite'],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const result = await getSaunas(pageParam, PAGE_SIZE)
      return (Array.isArray(result) ? result : []) as SaunaSummaryDto[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: SaunaSummaryDto[], allPages: SaunaSummaryDto[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: 1000 * 60 * 5,
  })

  const allSaunas = useMemo(() => (data?.pages ?? []).flat() as SaunaSummaryDto[], [data])

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
        case 'autoloyly':    return s.sauna_rooms?.some((r) => r.has_auto_loyly)
        case 'groundwater':  return s.cold_baths?.some((b) => b.is_groundwater)
        case 'jjimjilbang':  return s.kr_specific?.has_jjimjilbang
        case 'tattoo':       return s.rules?.tattoo_allowed
        case 'female':       return s.rules?.female_allowed
        default:             return true
      }
    })
  }, [allSaunas, activeFilter])

  const featured = useMemo(() => {
    if (activeFilter !== 'all') return null
    return (
      allSaunas.find((s) => s.is_featured) ??
      [...allSaunas].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))[0] ??
      null
    )
  }, [allSaunas, activeFilter])

  const { data: featuredKakaoImage } = useKakaoSaunaImage(
    featured?.name ?? '',
    featured?.address,
    featured?.images?.[0],
    activeFilter === 'all' && !!featured,
  )

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-main)' }}>

      {/* ╔════════════════════════════════════╗
          ║  헤더                              ║
          ╚════════════════════════════════════╝ */}
      <div
        className="flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-main)' }}
      >
        {/* 로고 + 지도 */}
        <div className="flex items-end justify-between px-5 pt-7 pb-5">
          <div>
            <p
              className="mb-1.5 text-[9px] font-black tracking-[0.25em] uppercase"
              style={{ color: 'var(--point-color)' }}
            >
              Korea Sauna Guide
            </p>
            <h1
              className="font-juache leading-none"
              style={{
                fontSize: '34px',
                color: 'var(--text-main)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              사우나 극락
            </h1>
          </div>

          <div className="flex flex-col items-end gap-2 pb-0.5">
            {!isLoading && (
              <p
                className="text-[11px] font-bold tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                {allSaunas.length}
                <span className="ml-0.5 font-normal">곳</span>
              </p>
            )}
            <Link
              href="/map"
              className="btn-outline flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
            >
              <BiMap size={13} />
              지도
            </Link>
          </div>
        </div>

        {/* 검색바 */}
        <div className="px-5 pb-4">
          <Link
            href="/search"
            className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3 transition-opacity active:opacity-60"
            style={{
              background: 'var(--bg-sub)',
              border: '1px solid var(--border-main)',
            }}
          >
            <BiSearch size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              이름, 지역으로 검색
            </span>
          </Link>
        </div>

        {/* 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-4">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                aria-pressed={isActive}
                className="flex-shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all duration-100 active:opacity-70"
                style={
                  isActive
                    ? {
                        background: 'var(--point-color)',
                        color: '#fff',
                        border: '1.5px solid var(--point-color)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--text-sub)',
                        border: '1.5px solid var(--border-main)',
                      }
                }
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ╔════════════════════════════════════╗
          ║  목록                              ║
          ╚════════════════════════════════════╝ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* 피처드 */}
        {!isLoading && activeFilter === 'all' && featured && (() => {
          const img = featured.images?.[0] ?? featuredKakaoImage
          const maxTemp = featured.sauna_rooms?.length
            ? Math.max(...featured.sauna_rooms.map((r) => r.temp))
            : null
          const minTemp = featured.cold_baths?.length
            ? Math.min(...featured.cold_baths.map((b) => b.temp))
            : null

          return (
            <Link
              href={`/saunas/${featured.id}`}
              className="group block"
              style={{ borderBottom: '1px solid var(--border-main)' }}
            >
              <div
                className="relative w-full overflow-hidden"
                style={{ height: 220, background: 'var(--bg-sub)' }}
              >
                {img ? (
                  <Image
                    src={img}
                    alt={featured.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="100vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span style={{ fontSize: 48, opacity: 0.08 }}>♨</span>
                  </div>
                )}

                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: 80,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
                  }}
                />

                <div className="absolute bottom-3 left-4 flex items-baseline gap-3">
                  {maxTemp !== null && (
                    <span
                      className="temp-number"
                      style={{ fontSize: 22, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                    >
                      {maxTemp}°
                    </span>
                  )}
                  {minTemp !== null && (
                    <span
                      className="temp-number"
                      style={{ fontSize: 22, color: '#90c8ff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                    >
                      {minTemp}°
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-4" style={{ background: 'var(--bg-card)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="text-[18px] font-black leading-tight truncate"
                      style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
                    >
                      {featured.name}
                    </p>
                    <p
                      className="mt-1 text-[12px] truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {featured.address}
                    </p>
                  </div>
                  {featured.avg_rating != null && (
                    <p
                      className="flex-shrink-0 text-[13px] font-black tabular-nums"
                      style={{ color: 'var(--text-sub)' }}
                    >
                      ★ {featured.avg_rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })()}

        {/* 섹션 헤더 */}
        {!isLoading && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <p
              className="text-[9px] font-black tracking-[0.2em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {activeFilter === 'all'
                ? 'Saunas'
                : FILTER_OPTIONS.find((f) => f.id === activeFilter)?.label}
            </p>
            <p
              className="text-[11px] tabular-nums font-bold"
              style={{ color: 'var(--text-muted)' }}
            >
              {filteredSaunas.length}
            </p>
          </div>
        )}

        {/* 그리드 */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : filteredSaunas.length > 0
                ? filteredSaunas
                    .filter((s) => !(activeFilter === 'all' && featured && s.id === featured.id))
                    .map((sauna) => <SaunaCard key={sauna.id} sauna={sauna} variant="grid" />)
                : (
                  <div className="col-span-2 flex flex-col items-center gap-4 py-20 text-center">
                    <span style={{ fontSize: 40, opacity: 0.25 }}>♨</span>
                    <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                      해당 조건의 사우나가 없어요
                    </p>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="btn-primary rounded-full px-5 py-2 text-[12px] font-bold"
                    >
                      전체 보기
                    </button>
                  </div>
                )
            }
          </div>
        </div>

        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loading variant="dots" fullScreen={false} color="var(--color-point)" />
          )}
        </div>
      </div>
    </div>
  )
}
