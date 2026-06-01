'use client'

import { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import Loading from '@/components/ui/Loading'
import { LINKS } from '@/constants/links'
import { SaunaSummaryDto } from '@/types/sauna'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { SORT_OPTIONS } from '@/constants/home'
import { BiSortAlt2, BiChevronDown } from 'react-icons/bi'

const INSTAGRAM_BANNER_ITEM = '__INSTAGRAM_BANNER__' as const
type ListItem = SaunaSummaryDto | typeof INSTAGRAM_BANNER_ITEM

// ── 인스타그램 배너 ───────────────────────────────────────────
function InstagramBanner() {
  return (
    <a
      href={LINKS.INSTAGRAM}
      target="_blank"
      rel="noopener noreferrer"
      className="mx-4 my-1.5 flex items-center gap-3.5 rounded-lg border border-border-main bg-bg-card px-4 py-3.5 transition active:opacity-70"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md"
        style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="white" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-black text-text-main">@sauna_road_kr</p>
        <p className="mt-0.5 text-[11px] leading-snug text-text-muted">사우나 극락 인스타그램 · 새 사우나 소식</p>
      </div>
      <div
        className="flex-shrink-0 rounded-md px-3.5 py-1.5 text-[11px] font-black text-white"
        style={{ background: 'linear-gradient(135deg, #f09433, #dc2743, #bc1888)' }}
      >
        팔로우
      </div>
    </a>
  )
}

// ── 스켈레톤 ──────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex gap-3.5 border-b border-border-subtle px-4 py-4">
      <Skeleton className="skeleton-shimmer flex-shrink-0 rounded-xl" width={84} height={84} variant="rect" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="skeleton-shimmer h-3 w-2/3" variant="text" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/2" variant="text" />
        <Skeleton className="skeleton-shimmer h-6 w-full" variant="text" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/3" variant="text" />
      </div>
    </div>
  )
}

interface SaunaListProps {
  filtered: SaunaSummaryDto[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  hasActiveFilter: boolean
}

export default function SaunaList({
  filtered,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  hasActiveFilter,
}: SaunaListProps) {
  const { sortKey, setSortOpen, selectedConds, resetAll } = useHomeFilterStore()
  const currentSort = SORT_OPTIONS.find((o) => o.id === sortKey)!

  const listItems: ListItem[] =
    hasActiveFilter || filtered.length === 0 ? filtered : [INSTAGRAM_BANNER_ITEM, ...filtered]

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: listItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (listItems[index] === INSTAGRAM_BANNER_ITEM ? 68 : 155),
    overscan: 5,
    measureElement: typeof window !== 'undefined' ? (el) => el.getBoundingClientRect().height : undefined,
  })

  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return
    if (lastItem.index >= listItems.length - 1 && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [virtualItems, listItems.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const isFemale = selectedConds.includes('female')
  const isMale = selectedConds.includes('male')
  const prefGender = isFemale && !isMale ? 'female' : !isFemale && isMale ? 'male' : undefined

  return (
    <>
      {!isLoading && (
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border-subtle bg-bg-main px-4 py-2.5">
          <p className="text-[13px] font-black text-text-main">
            검색결과 <span className="text-point">{filtered.length.toLocaleString()}</span>
            <span className="font-bold text-text-muted">건</span>
          </p>
          <button
            onClick={() => setSortOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border-main bg-bg-sub px-3 py-1.5 transition active:scale-95"
          >
            <BiSortAlt2 size={13} className="text-text-sub" />
            <span className="text-[11px] font-bold text-text-sub">{currentSort.label}</span>
            <BiChevronDown size={12} className="text-text-muted" />
          </button>
        </div>
      )}

      {/* 리스트 영역 */}
      <div ref={parentRef} data-scroll-main className="scrollbar-hide flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-8 py-20 text-center">
            <span className="text-5xl opacity-20">♨</span>
            <p className="text-[14px] font-bold text-text-sub">해당 조건의 사우나가 없어요</p>
            <button
              onClick={resetAll}
              className="rounded-md bg-point px-5 py-2 text-[12px] font-bold text-white transition active:scale-95"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualItems.map((virtualRow) => {
              const item = listItems[virtualRow.index]
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item === INSTAGRAM_BANNER_ITEM ? (
                    <InstagramBanner />
                  ) : (
                    <SaunaCard
                      sauna={item}
                      variant="row"
                      preferredGender={prefGender}
                      priority={virtualRow.index === 0}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loading variant="dots" fullScreen={false} color="var(--color-point)" />
          </div>
        )}
        <div className="h-20" />
      </div>
    </>
  )
}
