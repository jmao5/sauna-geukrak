'use client'

import { useState, useMemo, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { SaunaSummaryDto } from '@/types/sauna'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import Image from 'next/image'
import { BiSearch, BiMap, BiChevronRight } from 'react-icons/bi'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import Loading from '@/components/ui/Loading'
import { getSaunas } from './actions/sauna.actions'

type Filter = 'all' | 'autoloyly' | 'groundwater' | 'jjimjilbang' | 'tattoo' | 'female'

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'autoloyly',  label: '오토 로우리' },
  { id: 'groundwater',label: '지하수' },
  { id: 'jjimjilbang',label: '찜질방' },
  { id: 'tattoo',     label: '타투 OK' },
  { id: 'female',     label: '여성 가능' },
]

const PAGE_SIZE = 20

function CardSkeleton() {
  return (
    <div className="sauna-card overflow-hidden">
      <Skeleton className="skeleton-shimmer h-36 w-full rounded-none" style={{ borderRadius: '12px 12px 0 0' }} />
      <div className="p-3 space-y-2">
        <Skeleton className="skeleton-shimmer h-3 w-3/4 rounded" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/2 rounded" />
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
    getNextPageParam: (lastPage, allPages) =>
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

      {/* ══════════════════════════════════════
          헤더
      ══════════════════════════════════════ */}
      <div className="flex-shrink-0 border-b border-border-subtle bg-bg-main">

        {/* 로고 행 */}
        <div className="flex items-end justify-between px-5 pt-6 pb-4">
          <div>
            {/* 작은 라벨 */}
            <p
              className="mb-1 text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: 'var(--point-color)' }}
            >
              Sauna Guide
            </p>
            {/* 타이틀 — 크고 무게감 있게 */}
            <h1
              className="font-juache leading-none tracking-tight"
              style={{ fontSize: '30px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}
            >
              사우나 극락
            </h1>
          </div>

          <div className="flex items-center gap-2 pb-1">
            {/* 카운트 */}
            {!isLoading && (
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                {allSaunas.length}곳
              </span>
            )}
            {/* 지도 버튼 */}
            <Link
              href="/map"
              className="btn-outline flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
            >
              <BiMap size={13} />
              지도
            </Link>
          </div>
        </div>

        {/* 검색바 — 최대한 단순하게 */}
        <div className="px-5 pb-4">
          <Link
            href="/search"
            className="flex w-full items-center gap-3 rounded-xl border border-border-main bg-bg-sub px-4 py-3 transition-colors duration-150 hover:border-border-strong active:opacity-80"
          >
            <BiSearch size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              이름, 지역으로 검색
            </span>
          </Link>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-4">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                aria-pressed={isActive}
                className="flex-shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all duration-150 active:opacity-70"
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

      {/* ══════════════════════════════════════
          목록
      ══════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ── 피처드 카드 ── */}
        {!isLoading && activeFilter === 'all' && featured && (
          <div className="px-5 pt-5 pb-4">
            {/* 섹션 라벨 */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-bold tracking-[0.15em] uppercase"
                style={{ color: 'var(--point-color)' }}
              >
                Pick
              </span>
            </div>

            {/* 카드 */}
            <Link
              href={`/saunas/${featured.id}`}
              className="group block overflow-hidden rounded-2xl border border-border-main bg-bg-card transition-all duration-200 hover:border-point active:opacity-90"
            >
              {/* 이미지 */}
              <div className="relative h-48 w-full overflow-hidden bg-bg-sub">
                {(featured.images?.[0] || featuredKakaoImage) ? (
                  <Image
                    src={featured.images?.[0] ?? featuredKakaoImage!}
                    alt={featured.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="100vw"
                    priority
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center"
                    style={{ background: 'var(--bg-sub)' }}
                  >
                    <span style={{ fontSize: 40, opacity: 0.12 }}>🧖</span>
                  </div>
                )}

                {/* 오버레이는 하단 그라디언트만 — 단색, 얇게 */}
                <div
                  className="absolute inset-x-0 bottom-0 h-24"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
                />

                {/* 온도 뱃지 — 이미지 위 */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  {featured.sauna_rooms && featured.sauna_rooms.length > 0 && (
                    <span
                      className="temp-number text-[15px]"
                      style={{ color: '#fff' }}
                    >
                      🔥 {Math.max(...featured.sauna_rooms.map((r) => r.temp))}°
                    </span>
                  )}
                  {featured.cold_baths && featured.cold_baths.length > 0 && (
                    <span
                      className="temp-number text-[15px]"
                      style={{ color: '#93b8ff' }}
                    >
                      ❄️ {Math.min(...featured.cold_baths.map((b) => b.temp))}°
                    </span>
                  )}
                </div>
              </div>

              {/* 텍스트 바디 */}
              <div className="flex items-start justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[17px] font-black leading-tight tracking-tight"
                    style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
                  >
                    {featured.name}
                  </p>
                  <p
                    className="mt-0.5 text-[12px] truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {featured.address}
                  </p>
                  {featured.avg_rating != null && (
                    <p
                      className="mt-2 text-[12px] font-bold"
                      style={{ color: 'var(--text-sub)' }}
                    >
                      ★ {featured.avg_rating.toFixed(1)}
                    </p>
                  )}
                </div>
                <BiChevronRight
                  size={20}
                  style={{ color: 'var(--border-strong)', flexShrink: 0, marginTop: 2 }}
                />
              </div>
            </Link>
          </div>
        )}

        {/* ── All 섹션 헤더 ── */}
        {!isLoading && (
          <div className="flex items-center justify-between px-5 pb-3">
            <span
              className="text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ color: 'var(--point-color)' }}
            >
              {activeFilter === 'all'
                ? 'All'
                : FILTER_OPTIONS.find((f) => f.id === activeFilter)?.label}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {filteredSaunas.length}곳
            </span>
          </div>
        )}

        {/* ── 2열 그리드 ── */}
        <div className="px-5">
          <div className="grid grid-cols-2 gap-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : filteredSaunas.length > 0
                ? filteredSaunas
                    .filter((s) => !(activeFilter === 'all' && featured && s.id === featured.id))
                    .map((sauna) => <SaunaCard key={sauna.id} sauna={sauna} variant="grid" />)
                : (
                  <div className="col-span-2 flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="text-4xl">🧖</span>
                    <p
                      className="text-[13px] font-bold"
                      style={{ color: 'var(--text-sub)' }}
                    >
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

        <div className="h-6" />

        {/* 무한 스크롤 sentinel */}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loading variant="dots" fullScreen={false} color="var(--color-point)" />
          )}
        </div>
      </div>
    </div>
  )
}
