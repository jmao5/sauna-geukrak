'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { SaunaSummaryDto } from '@/types/sauna'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import { BiSearch, BiMap, BiChevronRight } from 'react-icons/bi'

type Filter = 'all' | 'autoloyly' | 'groundwater' | 'jjimjilbang' | 'tattoo' | 'female'

const FILTER_OPTIONS: { id: Filter; label: string; emoji: string }[] = [
  { id: 'all', label: '전체', emoji: '' },
  { id: 'autoloyly', label: '오토 로우리', emoji: '💦' },
  { id: 'groundwater', label: '지하수', emoji: '🏔️' },
  { id: 'jjimjilbang', label: '찜질방', emoji: '🧖' },
  { id: 'tattoo', label: '타투OK', emoji: '🖋️' },
  { id: 'female', label: '여성가능', emoji: '👩' },
]

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

  const { data: allSaunas = [], isLoading } = useQuery<(SaunaSummaryDto & { images?: string[]; rules?: any; kr_specific?: any; pricing?: any })[]>({
    queryKey: ['saunas'],
    queryFn: () => api.saunas.getAll(),
  })

  const filteredSaunas = useMemo(() => {
    if (activeFilter === 'all') return allSaunas
    return allSaunas.filter((s) => {
      switch (activeFilter) {
        case 'autoloyly': return s.sauna_rooms?.some((r) => r.has_auto_loyly)
        case 'groundwater': return s.cold_baths?.some((b) => b.is_groundwater)
        case 'jjimjilbang': return s.kr_specific?.has_jjimjilbang
        case 'tattoo': return s.rules?.tattoo_allowed
        case 'female': return s.rules?.female_allowed
        default: return true
      }
    })
  }, [allSaunas, activeFilter])

  return (
    <div className="flex h-full flex-col bg-bg-main">

      {/* ── 헤더 ── */}
      <div className="flex-shrink-0 bg-bg-sub border-b border-border-main">
        <div className="px-4 pt-4 pb-3">
          {/* 로고 + 지도 */}
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

          {/* 검색창 */}
          <Link
            href="/search"
            className="flex w-full items-center gap-2.5 rounded-xl border border-border-main bg-bg-main px-3.5 py-2.5 transition active:scale-[0.99]"
          >
            <BiSearch size={16} className="flex-shrink-0 text-text-muted" />
            <span className="text-[13px] text-text-muted">사우나 이름, 지역으로 검색...</span>
          </Link>
        </div>

        {/* 필터 탭 */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-3 gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
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

        {/* 픽업 배너 (이키타이 스타일 에디토리얼) */}
        {!isLoading && activeFilter === 'all' && filteredSaunas.length > 0 && (
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-black text-text-muted tracking-widest uppercase">Editor's Pick</p>
            </div>
            {/* 피처드 카드 - 가로 전체 */}
            <Link href={`/saunas/${filteredSaunas[0].id}`} className="block relative h-44 w-full rounded-2xl overflow-hidden mb-1">
              {filteredSaunas[0].images?.[0] ? (
                <img
                  src={filteredSaunas[0].images[0]}
                  alt={filteredSaunas[0].name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-sauna-bg via-bg-main to-cold-bg" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] font-bold text-white/60 mb-1 tracking-widest uppercase">Featured</p>
                <p className="text-lg font-black text-white leading-tight">{filteredSaunas[0].name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {filteredSaunas[0].sauna_rooms?.length > 0 && (
                    <span className="text-[12px] font-black text-orange-300">
                      🔥 {Math.max(...filteredSaunas[0].sauna_rooms.map((r) => r.temp))}°C
                    </span>
                  )}
                  {filteredSaunas[0].cold_baths?.length > 0 && (
                    <span className="text-[12px] font-black text-blue-300">
                      ❄️ {Math.min(...filteredSaunas[0].cold_baths.map((b) => b.temp))}°C
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* 섹션 구분 */}
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
                ? filteredSaunas.slice(activeFilter === 'all' ? 1 : 0).map((sauna) => (
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

        <div className="h-6" />
      </div>
    </div>
  )
}
