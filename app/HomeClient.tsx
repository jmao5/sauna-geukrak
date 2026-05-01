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
      <Skeleton className="skeleton-shimmer h-36 w-full rounded-none" />
      <div className="p-3.5 space-y-2">
        <Skeleton className="skeleton-shimmer h-3 w-3/4 rounded-full" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/2 rounded-full" />
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
      const result = await getSaunas(pageParam, PAGE_SIZE)
      return (Array.isArray(result) ? result : []) as SaunaSummaryDto[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: SaunaSummaryDto[], allPages: SaunaSummaryDto[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
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

      {/* ── 헤더: 포카리 감성 ── */}
      <div className="flex-shrink-0 relative overflow-hidden">
        {/* 배경 그라디언트 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(160deg, #e0f2fe 0%, #f0f9ff 60%, #ffffff 100%)',
          }}
        />
        {/* 장식용 블러 원 */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="absolute top-4 -left-10 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)',
            filter: 'blur(16px)',
          }}
        />

        <div className="relative px-5 pt-5 pb-4">
          {/* 상단 로고 + 지도 버튼 */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <h1
                  className="font-juache tracking-tight leading-none"
                  style={{
                    fontSize: '26px',
                    background: 'linear-gradient(135deg, #0c1a2e 0%, #0369a1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  사우나 극락
                </h1>
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: '#7dd3fc' }}
                >
                  KOREA
                </span>
              </div>
              <p className="mt-1 text-[11px] tracking-wide" style={{ color: '#7ba4c7' }}>
                {isLoading ? '로딩 중...' : `전국 ${allSaunas.length}곳의 사우나`}
              </p>
            </div>

            <Link
              href="/map"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold transition-all duration-200 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1.5px solid #bae6fd',
                color: '#0ea5e9',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 12px rgba(14,165,233,0.12)',
              }}
            >
              <BiMap size={14} />
              지도 보기
            </Link>
          </div>

          {/* 검색바 — 포카리 글래스 스타일 */}
          <Link
            href="/search"
            className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 active:scale-[0.99]"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1.5px solid #bae6fd',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 2px 16px rgba(14,165,233,0.08)',
            }}
          >
            <BiSearch size={17} style={{ color: '#7dd3fc', flexShrink: 0 }} />
            <span className="text-[13px]" style={{ color: '#7ba4c7' }}>
              사우나 이름, 지역으로 검색...
            </span>
          </Link>
        </div>

        {/* 필터 탭 — 수평 스크롤 */}
        <div className="flex overflow-x-auto scrollbar-hide px-5 pb-4 gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                aria-pressed={isActive}
                className="flex-shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all duration-200 active:scale-95"
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        color: '#fff',
                        boxShadow: '0 3px 12px rgba(14,165,233,0.35)',
                        border: '1.5px solid transparent',
                      }
                    : {
                        background: 'rgba(255,255,255,0.75)',
                        border: '1.5px solid #bae6fd',
                        color: '#334e68',
                        backdropFilter: 'blur(6px)',
                      }
                }
              >
                {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* 헤더 하단 구분선 */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #bae6fd, transparent)' }} />
      </div>

      {/* ── 목록 ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Editor's Pick — 포카리 히어로 카드 */}
        {!isLoading && activeFilter === 'all' && featured && (
          <div className="px-4 pt-5 pb-2">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[10px] font-black tracking-widest uppercase"
                style={{ color: '#7ba4c7', letterSpacing: '0.15em' }}
              >
                ✦ Editor's Pick
              </p>
              {featured.is_featured && (
                <span
                  className="text-[9px] font-bold tracking-widest uppercase rounded-full px-2 py-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                    color: '#0369a1',
                  }}
                >
                  Curated
                </span>
              )}
            </div>

            <Link
              href={`/saunas/${featured.id}`}
              className="group block relative h-52 w-full overflow-hidden transition-all duration-300 active:scale-[0.99]"
              style={{ borderRadius: '1.25rem', boxShadow: '0 8px 32px rgba(14,165,233,0.18)' }}
            >
              {(featured.images?.[0] || featuredKakaoImage) ? (
                <Image
                  src={featured.images?.[0] ?? featuredKakaoImage!}
                  alt={featured.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 100vw, 680px"
                  priority
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
                  }}
                />
              )}

              {/* 하단 그라디언트 오버레이 */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(4,13,26,0.82) 0%, rgba(4,13,26,0.15) 55%, transparent 100%)',
                }}
              />

              {/* 상단 뱃지 */}
              <div className="absolute top-3.5 left-3.5">
                <span
                  className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  FEATURED
                </span>
              </div>

              {/* 정보 영역 */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p
                  className="text-[18px] font-black text-white leading-tight mb-2"
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
                >
                  {featured.name}
                </p>
                <div className="flex items-center gap-2.5">
                  {featured.sauna_rooms && featured.sauna_rooms.length > 0 && (
                    <span
                      className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full"
                      style={{
                        background: 'rgba(249,115,22,0.25)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(249,115,22,0.4)',
                        color: '#fed7aa',
                      }}
                    >
                      🔥 {Math.max(...featured.sauna_rooms.map((r) => r.temp))}°C
                    </span>
                  )}
                  {featured.cold_baths && featured.cold_baths.length > 0 && (
                    <span
                      className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full"
                      style={{
                        background: 'rgba(14,165,233,0.25)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(14,165,233,0.4)',
                        color: '#bae6fd',
                      }}
                    >
                      ❄️ {Math.min(...featured.cold_baths.map((b) => b.temp))}°C
                    </span>
                  )}
                  {featured.avg_rating != null && (
                    <span
                      className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full ml-auto"
                      style={{
                        background: 'rgba(245,158,11,0.25)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#fde68a',
                      }}
                    >
                      ⭐ {featured.avg_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* 호버 시 오른쪽 화살표 */}
              <div
                className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                >
                  <BiChevronRight size={18} className="text-white" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* 섹션 헤더 */}
        {!isLoading && (
          <div className="flex items-center justify-between px-5 py-3">
            <p
              className="text-[10px] font-black tracking-widest uppercase"
              style={{ color: '#7ba4c7', letterSpacing: '0.15em' }}
            >
              {activeFilter === 'all' ? '✦ All Saunas' : FILTER_OPTIONS.find(f => f.id === activeFilter)?.label}
            </p>
            <p className="text-[11px]" style={{ color: '#7ba4c7' }}>{filteredSaunas.length}곳</p>
          </div>
        )}

        {/* 2열 그리드 */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
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
                    <p className="text-sm font-bold" style={{ color: '#334e68' }}>
                      해당 조건의 사우나가 없어요
                    </p>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="rounded-full px-5 py-2 text-xs font-bold text-white transition-all duration-200 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
                      }}
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
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loading variant="dots" fullScreen={false} color="var(--color-point)" />
          )}
        </div>
      </div>
    </div>
  )
}
