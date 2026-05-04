'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SaunaSummaryDto } from '@/types/sauna'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import { BiSearch, BiMap, BiX, BiChevronDown, BiSortAlt2 } from 'react-icons/bi'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import Loading from '@/components/ui/Loading'
import { getSaunas } from './actions/sauna.actions'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

// ── 타입 ──────────────────────────────────────────────────────
type Condition = 'autoloyly' | 'groundwater' | 'jjimjilbang' | 'tattoo' | 'female' | 'male' | 'parking'
type SortKey = 'default' | 'rating' | 'reviews' | 'temp_hot' | 'temp_cold' | 'price_asc'

// ── 상수 ──────────────────────────────────────────────────────
const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전',
  '광주', '울산', '세종', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주',
]

const CONDITIONS: { id: Condition; label: string; emoji: string }[] = [
  { id: 'autoloyly', label: '오토 로우리', emoji: '💦' },
  { id: 'groundwater', label: '지하수 냉탕', emoji: '🏔️' },
  { id: 'jjimjilbang', label: '찜질방', emoji: '🧖' },
  { id: 'tattoo', label: '타투 OK', emoji: '🖋️' },
  { id: 'female', label: '여성 가능', emoji: '👩' },
  { id: 'male', label: '남성 가능', emoji: '👨' },
  { id: 'parking', label: '주차', emoji: '🅿️' },
]

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'default', label: '등록순' },
  { id: 'rating', label: '평점 높은순' },
  { id: 'reviews', label: '사활 많은순' },
  { id: 'temp_hot', label: '사우나 온도 높은순' },
  { id: 'temp_cold', label: '냉탕 온도 낮은순' },
  { id: 'price_asc', label: '가격 낮은순' },
]

const PAGE_SIZE = 20

// ── 스켈레톤 ──────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-4 border-b border-border-subtle">
      <Skeleton className="skeleton-shimmer flex-shrink-0 rounded-xl" width={80} height={80} variant="rect" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="skeleton-shimmer h-3 w-2/3" variant="text" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/2" variant="text" />
        <Skeleton className="skeleton-shimmer h-6 w-full" variant="text" />
        <Skeleton className="skeleton-shimmer h-2.5 w-1/3" variant="text" />
      </div>
    </div>
  )
}

// ── 바텀시트 래퍼 ─────────────────────────────────────────────
function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-t-3xl bg-bg-main max-h-[80vh] flex flex-col">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-border-strong" />
        </div>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle flex-shrink-0">
          <h2 className="text-base font-black text-text-main">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-sub">
            <BiX size={18} className="text-text-sub" />
          </button>
        </div>
        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export default function HomeClient() {
  const router = useRouter()

  // 검색 상태
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedConds, setSelectedConds] = useState<Condition[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // 시트
  const [regionOpen, setRegionOpen] = useState(false)
  const [conditionOpen, setConditionOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // 무한 쿼리
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

  // 필터링
  const filtered = useMemo(() => {
    let list = allSaunas

    // 지역
    if (selectedRegion) {
      list = list.filter((s) => s.address?.includes(selectedRegion))
    }

    // 조건
    if (selectedConds.length > 0) {
      const isFemale = selectedConds.includes('female')
      const isMale = selectedConds.includes('male')
      const pref = (isFemale && !isMale) ? 'female' : (!isFemale && isMale) ? 'male' : null

      list = list.filter((s) =>
        selectedConds.every((cond) => {
          switch (cond) {
            case 'autoloyly':
              if (pref) {
                return s.sauna_rooms?.some((r) => r.has_auto_loyly && ((r as any).gender === pref || (r as any).gender === 'both'))
              }
              return s.sauna_rooms?.some((r) => r.has_auto_loyly)
            case 'groundwater':
              if (pref) {
                return s.cold_baths?.some((b) => b.is_groundwater && ((b as any).gender === pref || (b as any).gender === 'both'))
              }
              return s.cold_baths?.some((b) => b.is_groundwater)
            case 'jjimjilbang': return s.kr_specific?.has_jjimjilbang
            case 'tattoo': return s.rules?.tattoo_allowed
            case 'female': return s.rules?.female_allowed
            case 'male': return s.rules?.male_allowed !== false
            case 'parking': return (s as any).parking
            default: return true
          }
        })
      )
    }

    // 키워드 (디바운스된 값 사용)
    if (debouncedKeyword.trim()) {
      const kw = debouncedKeyword.trim().toLowerCase()
      list = list.filter((s) =>
        s.name?.toLowerCase().includes(kw) ||
        s.address?.toLowerCase().includes(kw)
      )
    }

    // 정렬
    const isFemale = selectedConds.includes('female')
    const isMale = selectedConds.includes('male')
    const pref = (isFemale && !isMale) ? 'female' : (!isFemale && isMale) ? 'male' : null

    switch (sortKey) {
      case 'rating':
        list = [...list].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
        break
      case 'reviews':
        list = [...list].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0))
        break
      case 'temp_hot':
        list = [...list].sort((a, b) => {
          const aRooms = pref
            ? a.sauna_rooms?.filter(r => (r as any).gender === pref || (r as any).gender === 'both')
            : a.sauna_rooms
          const bRooms = pref
            ? b.sauna_rooms?.filter(r => (r as any).gender === pref || (r as any).gender === 'both')
            : b.sauna_rooms

          const aMax = aRooms?.length ? Math.max(...aRooms.map((r) => r.temp)) : 0
          const bMax = bRooms?.length ? Math.max(...bRooms.map((r) => r.temp)) : 0
          return bMax - aMax
        })
        break
      case 'temp_cold':
        list = [...list].sort((a, b) => {
          const aBaths = pref
            ? a.cold_baths?.filter(b => (b as any).gender === pref || (b as any).gender === 'both')
            : a.cold_baths
          const bBaths = pref
            ? b.cold_baths?.filter(b => (b as any).gender === pref || (b as any).gender === 'both')
            : b.cold_baths

          const aMin = aBaths?.length ? Math.min(...aBaths.map((r) => r.temp)) : 99
          const bMin = bBaths?.length ? Math.min(...bBaths.map((r) => r.temp)) : 99
          return aMin - bMin
        })
        break
      case 'price_asc':
        list = [...list].sort((a, b) =>
          (a.pricing?.adult_day ?? 99999) - (b.pricing?.adult_day ?? 99999)
        )
        break
      default:
        break
    }

    return list
  }, [allSaunas, selectedRegion, selectedConds, debouncedKeyword, sortKey])

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver({
    rootMargin: '200px',
    onObserve: loadMore,
    enabled: !!hasNextPage && !isFetchingNextPage,
  })

  const toggleCond = (cond: Condition) =>
    setSelectedConds((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    )

  const hasFilter = !!selectedRegion || selectedConds.length > 0 || !!keyword.trim()
  const resetAll = () => {
    setSelectedRegion(null)
    setSelectedConds([])
    setKeyword('')
    setSortKey('default')
  }

  const currentSort = SORT_OPTIONS.find((o) => o.id === sortKey)!

  // 조건 칩 - 기본 3개 노출, 더보기로 전체
  const visibleConds = showMoreFilters ? CONDITIONS : CONDITIONS.slice(0, 3)

  // ── 가상화 ──────────────────────────────────────────────────
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 134, // SaunaCard row 높이 대략 134px
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // 무한 스크롤 트리거 (가상화 대응)
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    if (lastItem.index >= filtered.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [virtualItems, filtered.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex h-full flex-col bg-bg-main">

      {/* ── 헤더 ── */}
      <div className="flex-shrink-0 bg-bg-main border-b border-border-main">

        {/* 로고 + 지도 버튼 */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
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

        {/* 지역 + 조건 버튼 */}
        <div className="flex gap-2.5 px-4 pb-3">
          <button
            onClick={() => setRegionOpen(true)}
            className={`flex flex-1 items-center justify-between rounded-2xl border px-4 py-3 transition active:scale-[0.98] ${selectedRegion
              ? 'border-point bg-point/5 text-point'
              : 'border-border-main bg-bg-sub text-text-sub'
              }`}
          >
            <div className="text-left">
              <p className="text-[10px] font-black tracking-wider uppercase opacity-60">지역</p>
              <p className="text-[13px] font-black mt-0.5">{selectedRegion ?? '선택하기'}</p>
            </div>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-[14px] font-black ${selectedRegion ? 'bg-point' : 'bg-text-muted'
              }`}>
              {selectedRegion ? '✓' : '+'}
            </div>
          </button>

          <button
            onClick={() => setConditionOpen(true)}
            className={`flex flex-1 items-center justify-between rounded-2xl border px-4 py-3 transition active:scale-[0.98] ${selectedConds.length > 0
              ? 'border-point bg-point/5 text-point'
              : 'border-border-main bg-bg-sub text-text-sub'
              }`}
          >
            <div className="text-left">
              <p className="text-[10px] font-black tracking-wider uppercase opacity-60">조건</p>
              <p className="text-[13px] font-black mt-0.5">
                {selectedConds.length > 0
                  ? `${selectedConds.length}개 선택`
                  : '선택하기'}
              </p>
            </div>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-[14px] font-black ${selectedConds.length > 0 ? 'bg-point' : 'bg-text-muted'
              }`}>
              {selectedConds.length > 0 ? selectedConds.length : '+'}
            </div>
          </button>
        </div>

        {/* 키워드 검색 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 rounded-2xl border border-border-main bg-bg-sub px-4 py-3">
            <BiSearch size={15} className="flex-shrink-0 text-text-muted" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="시설명, 에리어 검색"
              className="flex-1 bg-transparent text-[13px] text-text-main placeholder:text-text-muted outline-none"
            />
            {keyword && (
              <button onClick={() => setKeyword('')} className="rounded-full p-0.5">
                <BiX size={15} className="text-text-muted" />
              </button>
            )}
          </div>
        </div>

        {/* 조건 칩 + 더보기 */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {visibleConds.map((opt) => {
              const isActive = selectedConds.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleCond(opt.id)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${isActive
                    ? 'bg-point text-white'
                    : 'border border-border-main bg-bg-main text-text-sub'
                    }`}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              )
            })}
            <button
              onClick={() => setShowMoreFilters((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-muted transition active:scale-95"
            >
              {showMoreFilters ? '접기' : '더보기'}
              <BiChevronDown size={12} className={`transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* 필터 초기화 */}
          {hasFilter && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 text-[11px] font-bold text-text-muted"
            >
              <BiX size={12} />
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* ── 결과 + 정렬 ── */}
      {!isLoading && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-bg-main">
          <p className="text-[13px] font-black text-text-main">
            검색결과{' '}
            <span className="text-point">{filtered.length.toLocaleString()}</span>
            <span className="text-text-muted font-bold">건</span>
          </p>
          <button
            onClick={() => setSortOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-sub px-3 py-1.5"
          >
            <BiSortAlt2 size={13} className="text-text-sub" />
            <span className="text-[11px] font-bold text-text-sub">{currentSort.label}</span>
            <BiChevronDown size={12} className="text-text-muted" />
          </button>
        </div>
      )}

      {/* ── 리스트 ── */}
      <div
        ref={parentRef}
        data-scroll-main
        className="flex-1 overflow-y-auto scrollbar-hide"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-8">
            <span className="text-5xl opacity-20">♨</span>
            <p className="text-[14px] font-bold text-text-sub">해당 조건의 사우나가 없어요</p>
            <button onClick={resetAll} className="rounded-full bg-point px-5 py-2 text-[12px] font-bold text-white">
              필터 초기화
            </button>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const sauna = filtered[virtualRow.index]
              const isFemale = selectedConds.includes('female')
              const isMale = selectedConds.includes('male')
              const pref = (isFemale && !isMale) ? 'female' : (!isFemale && isMale) ? 'male' : undefined

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <SaunaCard
                    sauna={sauna}
                    variant="row"
                    preferredGender={pref}
                    priority={virtualRow.index === 0}
                  />
                </div>
              )
            })}
          </div>
        )}

        {isFetchingNextPage && (
          <div className="py-4 flex items-center justify-center">
            <Loading variant="dots" fullScreen={false} color="var(--color-point)" />
          </div>
        )}
        <div className="h-20" />{/* 네브바 여백 */}
      </div>

      {/* ── 지역 바텀시트 ── */}
      <BottomSheet open={regionOpen} onClose={() => setRegionOpen(false)} title="지역 선택">
        <div className="p-4">
          {/* 전체 */}
          <button
            onClick={() => { setSelectedRegion(null); setRegionOpen(false) }}
            className={`mb-3 flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-[13px] font-bold transition active:scale-[0.98] ${!selectedRegion ? 'border-point bg-point/5 text-point' : 'border-border-main text-text-sub'
              }`}
          >
            전체 지역
            {!selectedRegion && <span className="text-[16px]">✓</span>}
          </button>
          <div className="grid grid-cols-3 gap-2">
            {REGIONS.map((region) => {
              const isActive = selectedRegion === region
              return (
                <button
                  key={region}
                  onClick={() => { setSelectedRegion(region); setRegionOpen(false) }}
                  className={`rounded-2xl border py-3.5 text-[13px] font-bold transition active:scale-95 ${isActive ? 'border-point bg-point text-white' : 'border-border-main bg-bg-sub text-text-sub'
                    }`}
                >
                  {region}
                </button>
              )
            })}
          </div>
        </div>
      </BottomSheet>

      {/* ── 조건 바텀시트 ── */}
      <BottomSheet open={conditionOpen} onClose={() => setConditionOpen(false)} title="조건 선택">
        <div className="p-4 space-y-2">
          {CONDITIONS.map((opt) => {
            const isActive = selectedConds.includes(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => toggleCond(opt.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 transition active:scale-[0.98] ${isActive ? 'border-point bg-point/5' : 'border-border-main bg-bg-sub'
                  }`}
              >
                <span className="text-[18px]">{opt.emoji}</span>
                <span className={`flex-1 text-left text-[13px] font-bold ${isActive ? 'text-point' : 'text-text-main'}`}>
                  {opt.label}
                </span>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${isActive ? 'border-point bg-point' : 'border-border-main'
                  }`}>
                  {isActive && <span className="text-[10px] font-black text-white">✓</span>}
                </div>
              </button>
            )
          })}
          <div className="pt-2">
            <button
              onClick={() => setConditionOpen(false)}
              className="w-full rounded-2xl bg-point py-4 text-[14px] font-black text-white"
            >
              {selectedConds.length > 0 ? `${selectedConds.length}개 조건 적용` : '닫기'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── 정렬 바텀시트 ── */}
      <BottomSheet open={sortOpen} onClose={() => setSortOpen(false)} title="정렬 기준">
        <div className="p-4 space-y-2">
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortKey === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => { setSortKey(opt.id); setSortOpen(false) }}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-[13px] font-bold transition active:scale-[0.98] ${isActive ? 'border-point bg-point/5 text-point' : 'border-border-main text-text-sub'
                  }`}
              >
                {opt.label}
                {isActive && <span className="text-[16px]">✓</span>}
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </div>
  )
}
