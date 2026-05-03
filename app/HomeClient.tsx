'use client'

import { useState, useMemo, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { SaunaSummaryDto } from '@/types/sauna'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import Image from 'next/image'
import { BiSearch, BiMap, BiSliderAlt } from 'react-icons/bi'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import Loading from '@/components/ui/Loading'
import { getSaunas } from './actions/sauna.actions'

type Filter = 'all' | 'autoloyly' | 'groundwater' | 'jjimjilbang' | 'tattoo' | 'female'

const FILTER_OPTIONS: { id: Filter; label: string; emoji: string }[] = [
  { id: 'all',         label: '전체',       emoji: '♨️' },
  { id: 'autoloyly',   label: '오토 로우리', emoji: '💦' },
  { id: 'groundwater', label: '지하수',      emoji: '🏔️' },
  { id: 'jjimjilbang', label: '찜질방',      emoji: '🧖' },
  { id: 'tattoo',      label: '타투 OK',     emoji: '🖋️' },
  { id: 'female',      label: '여성 가능',   emoji: '👩' },
]

const PAGE_SIZE = 20

function CardSkeleton() {
  return (
    <div className="sauna-card">
      <Skeleton className="skeleton-shimmer w-full" height={140} variant="rect" />
      <div className="p-3 space-y-2">
        <Skeleton className="skeleton-shimmer h-3 w-3/4" variant="text" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/2" variant="text" />
        <Skeleton className="skeleton-shimmer h-7 w-full" variant="text" />
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
    <div className="flex h-full flex-col bg-bg-main">

      {/* ── 헤더 ── */}
      <div className="flex-shrink-0 bg-bg-main border-b border-border-main">

        {/* 로고 + 지도 버튼 */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <h1 className="font-juache text-[28px] leading-none text-text-main" style={{ letterSpacing: '-0.02em' }}>
            사우나 극락
          </h1>
          <Link
            href="/map"
            className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-sub px-3.5 py-2 text-[12px] font-bold text-text-sub transition active:opacity-70"
          >
            <BiMap size={14} />
            지도
          </Link>
        </div>

        {/* 검색바 */}
        <div className="px-4 pb-3">
          <Link
            href="/search"
            className="flex w-full items-center gap-2.5 rounded-2xl border border-border-main bg-bg-sub px-4 py-3 transition active:opacity-70"
          >
            <BiSearch size={16} className="flex-shrink-0 text-text-muted" />
            <span className="text-[13px] text-text-muted">에리어 · 시설명 · 키워드</span>
            <div className="ml-auto flex items-center gap-1.5 rounded-full border border-border-main bg-bg-main px-2.5 py-1">
              <BiSliderAlt size={12} className="text-text-sub" />
              <span className="text-[10px] font-bold text-text-sub">필터</span>
            </div>
          </Link>
        </div>

        {/* 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                aria-pressed={isActive}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all active:scale-95"
                style={isActive
                  ? { background: 'var(--point-color)', color: '#fff', border: '1.5px solid var(--point-color)' }
                  : { background: 'transparent', color: 'var(--text-sub)', border: '1.5px solid var(--border-main)' }
                }
              >
                <span className="text-[11px]">{opt.emoji}</span>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* 피처드 배너 */}
        {!isLoading && activeFilter === 'all' && featured && (() => {
          const img = featured.images?.[0] ?? featuredKakaoImage
          const maxTemp = featured.sauna_rooms?.length ? Math.max(...featured.sauna_rooms.map((r) => r.temp)) : null
          const minTemp = featured.cold_baths?.length ? Math.min(...featured.cold_baths.map((b) => b.temp)) : null

          return (
            <Link href={`/saunas/${featured.id}`} className="group block border-b border-border-main">
              <div className="relative w-full overflow-hidden bg-bg-sub" style={{ height: 200 }}>
                {img ? (
                  <Image src={img} alt={featured.name} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="100vw" priority />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-5xl opacity-10">♨</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* PICK 배지 */}
                <div className="absolute left-3 top-3">
                  <span className="rounded-full bg-point px-2.5 py-1 text-[10px] font-black text-white tracking-widest uppercase">
                    Editor's Pick
                  </span>
                </div>

                {/* 온도 */}
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {maxTemp !== null && (
                    <div className="flex flex-col items-center rounded-xl bg-black/50 px-3 py-2 backdrop-blur-sm">
                      <span className="text-[9px] font-black text-sauna/80 uppercase tracking-wider">Sauna</span>
                      <span className="temp-number text-[20px] text-sauna leading-none">{maxTemp}°</span>
                    </div>
                  )}
                  {minTemp !== null && (
                    <div className="flex flex-col items-center rounded-xl bg-black/50 px-3 py-2 backdrop-blur-sm">
                      <span className="text-[9px] font-black text-cold/80 uppercase tracking-wider">Cold</span>
                      <span className="temp-number text-[20px] text-cold leading-none">{minTemp}°</span>
                    </div>
                  )}
                </div>

                {/* 이름 */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[20px] font-black text-white leading-tight">{featured.name}</p>
                  <p className="mt-0.5 text-[11px] text-white/70">{featured.address}</p>
                </div>
              </div>
            </Link>
          )
        })()}

        {/* 카운트 헤더 */}
        {!isLoading && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <p className="text-[12px] font-bold text-text-sub">
              {activeFilter !== 'all'
                ? FILTER_OPTIONS.find((f) => f.id === activeFilter)?.label
                : '전체 사우나'}
            </p>
            <p className="text-[12px] font-bold tabular-nums text-text-muted">
              {filteredSaunas.length}곳
            </p>
          </div>
        )}

        {/* 카드 그리드 */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2.5">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : filteredSaunas.length > 0
                ? filteredSaunas
                    .filter((s) => !(activeFilter === 'all' && featured && s.id === featured.id))
                    .map((sauna) => <SaunaCard key={sauna.id} sauna={sauna} variant="grid" />)
                : (
                  <div className="col-span-2 flex flex-col items-center gap-4 py-20 text-center">
                    <span className="text-5xl opacity-20">♨</span>
                    <p className="text-[14px] font-bold text-text-sub">해당 조건의 사우나가 없어요</p>
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
          {isFetchingNextPage && <Loading variant="dots" fullScreen={false} color="var(--color-point)" />}
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
