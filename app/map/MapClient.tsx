'use client'

import { useEffect, useState, useRef } from 'react'
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery } from '@tanstack/react-query'
import { getSaunasByLocation } from '@/app/actions/sauna.actions'
import { useRouter } from 'next/navigation'
import { SaunaSummaryDto } from '@/types/sauna'
import { BiCurrentLocation, BiSearch, BiX, BiChevronRight, BiRefresh, BiPlus, BiMinus } from 'react-icons/bi'
import { m, AnimatePresence } from 'framer-motion'
import Loading from '@/components/ui/Loading'
import { useKakaoReady } from '@/hooks/useKakaoReady'
import Link from 'next/link'

type Filter = 'female' | 'male' | 'tattoo' | 'autoloyly' | 'groundwater' | 'deepcold' | 'infinitychair'

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'female', label: '여성 가능' },
  { id: 'male', label: '남성 가능' },
  { id: 'tattoo', label: '타투 가능' },
  { id: 'autoloyly', label: '오토 로울리' },
  { id: 'groundwater', label: '지하수 냉탕' },
  { id: 'deepcold', label: '깊은 냉탕(1m+)' },
  { id: 'infinitychair', label: '인피니티 체어' },
]

const PANEL_PEEK = 52
const PANEL_LIST = 240
const PANEL_FULL = 420

// 서울 fallback — page.tsx prefetch와 동일한 좌표여야 캐시 히트
const SEOUL_FALLBACK = { lat: 37.545, lng: 126.84 }

// ── 스와이프 패널 ─────────────────────────────────────────────
function SwipePanel({
  snapHeights, currentSnap, onSnapChange, children,
}: {
  snapHeights: number[]
  currentSnap: number
  onSnapChange: (h: number) => void
  children: React.ReactNode
}) {
  const dragStartY = useRef(0)
  const dragStartSnap = useRef(currentSnap)

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY
    dragStartSnap.current = currentSnap
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return
    const delta = dragStartY.current - e.clientY
    const liveH = Math.max(0, Math.min(snapHeights[snapHeights.length - 1], dragStartSnap.current + delta))
    onSnapChange(liveH)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    const delta = dragStartY.current - e.clientY
    const biased = currentSnap + delta * 0.3
    const closest = snapHeights.reduce((prev, cur) =>
      Math.abs(cur - biased) < Math.abs(prev - biased) ? cur : prev
    )
    onSnapChange(closest)
  }

  return (
    <m.section
      role="region"
      aria-label="사우나 목록 패널"
      aria-expanded={currentSnap > PANEL_PEEK}
      className="absolute bottom-[56px] left-0 right-0 z-20 rounded-t-2xl border-t border-border-main bg-bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      animate={{ height: currentSnap }}
      transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
      style={{ overflow: 'hidden', touchAction: 'none' }}
    >
      <div
        role="separator"
        aria-label="사우나 목록 패널 크기 조절"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onSnapChange(PANEL_FULL)
          if (e.key === 'ArrowDown') onSnapChange(PANEL_PEEK)
        }}
        className="flex cursor-grab active:cursor-grabbing flex-col items-center pt-2.5 pb-1 select-none focus-visible:outline-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-border-strong" />
      </div>
      <div className="h-full overflow-hidden">{children}</div>
    </m.section>
  )
}

// ── 하단 카드 ─────────────────────────────────────────────────
function SaunaBottomCard({ sauna, preferredGender }: { sauna: SaunaSummaryDto; preferredGender?: 'male' | 'female' }) {
  const router = useRouter()
  const filteredRooms = preferredGender
    ? (sauna.sauna_rooms ?? []).filter(r => (r as any).gender === 'both' || (r as any).gender === preferredGender)
    : sauna.sauna_rooms
  const filteredBaths = preferredGender
    ? (sauna.cold_baths ?? []).filter(b => (b as any).gender === 'both' || (b as any).gender === preferredGender)
    : sauna.cold_baths

  const maxSaunaTemp = filteredRooms?.length ? Math.max(...filteredRooms.map(r => r.temp)) : null
  const minColdTemp  = filteredBaths?.length  ? Math.min(...filteredBaths.map(b => b.temp)) : null
  const price        = sauna.pricing?.adult_day

  return (
    <button
      onClick={() => router.push(`/saunas/${sauna.id}`)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-bg-main"
    >
      <div className="h-[64px] w-[64px] flex-shrink-0 overflow-hidden rounded-xl">
        {sauna.images?.[0] ? (
          <img src={sauna.images[0]} alt={sauna.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eef3ff] to-[#fff3ee]">
            <span className="text-2xl">🧖</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[14px] font-black text-text-main">{sauna.name}</p>
        <p className="truncate text-[11px] text-text-sub mt-0.5">{sauna.address}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {maxSaunaTemp !== null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sauna-bg border border-sauna/20 px-1.5 py-0.5 text-[11px] font-black text-sauna">
              🔥 {maxSaunaTemp}°
            </span>
          )}
          {minColdTemp !== null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-cold-bg border border-cold/20 px-1.5 py-0.5 text-[11px] font-black text-cold">
              ❄️ {minColdTemp}°
            </span>
          )}
          {!!sauna.review_count && (
            <span className="text-[11px] text-text-muted">
              사활 <span className="font-black text-point">{sauna.review_count.toLocaleString()}</span>
            </span>
          )}
          {price ? (
            <span className="text-[11px] text-text-muted">
              {price >= 10000 ? `${(price / 10000).toFixed(price % 10000 === 0 ? 0 : 1)}만원~` : `${price.toLocaleString()}원~`}
            </span>
          ) : null}
        </div>
      </div>
      <BiChevronRight size={18} className="flex-shrink-0 text-text-muted" />
    </button>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export default function MapClient() {
  const router = useRouter()

  // SDK 로드 — 폴링 없이 이벤트 기반
  const { isReady: isLoaded, isError: loadError } = useKakaoReady()

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  // ★ 초기값을 SEOUL_FALLBACK으로 — 서버 prefetch 캐시 즉시 히트
  const [queryLocation, setQueryLocation] = useState(SEOUL_FALLBACK)
  const [center, setCenter] = useState(SEOUL_FALLBACK)
  const currentCenterRef = useRef(SEOUL_FALLBACK)
  const prevCenterRef = useRef(SEOUL_FALLBACK)

  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false) // 초기 자동 위치 요청 중 여부
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showResearch, setShowResearch] = useState(false)
  const [panelSnap, setPanelSnap] = useState(PANEL_LIST)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const [mapBounds, setMapBounds] = useState<{
    swLat: number; swLng: number; neLat: number; neLng: number
  } | null>(null)

  // 위치 권한 요청 — SDK 로드와 완전히 분리, 마운트 즉시 시작
  useEffect(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setQueryLocation(loc)       // 실제 위치로 재쿼리 (캐시 미스 → 새 fetch)
        setCenter(loc)
        currentCenterRef.current = loc
        prevCenterRef.current = loc
        setIsLocating(false)
      },
      () => {
        // 거부/타임아웃 → 서울 fallback 유지 (이미 prefetch됨)
        setIsLocating(false)
      },
      { timeout: 5000, enableHighAccuracy: false }
    )
  }, [])

  const { data: saunas = [], isFetching } = useQuery<SaunaSummaryDto[]>({
    // 소수점 2자리 반올림 → 약 1km 격자, 캐시 히트율 향상
    queryKey: ['saunas', 'location',
      Math.round(queryLocation.lat * 100) / 100,
      Math.round(queryLocation.lng * 100) / 100,
    ],
    queryFn: () => getSaunasByLocation(queryLocation.lat, queryLocation.lng, 15),
    staleTime: 1000 * 60 * 3,
  })

  const filteredSaunas = saunas.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.address.includes(q)) return false
    }
    const isFemale = activeFilters.includes('female')
    const isMale   = activeFilters.includes('male')
    if (isFemale && !s.rules?.female_allowed) return false
    if (isMale   && !s.rules?.male_allowed)   return false
    if (activeFilters.includes('tattoo') && !s.rules?.tattoo_allowed) return false
    if (activeFilters.includes('autoloyly')) {
      if (isFemale && !isMale) {
        if (!s.sauna_rooms?.some(r => r.has_auto_loyly && ((r as any).gender === 'female' || (r as any).gender === 'both'))) return false
      } else if (isMale && !isFemale) {
        if (!s.sauna_rooms?.some(r => r.has_auto_loyly && ((r as any).gender === 'male' || (r as any).gender === 'both'))) return false
      } else {
        if (!s.sauna_rooms?.some(r => r.has_auto_loyly)) return false
      }
    }
    if (activeFilters.includes('groundwater')) {
      if (isFemale && !isMale) {
        if (!s.cold_baths?.some(b => b.is_groundwater && ((b as any).gender === 'female' || (b as any).gender === 'both'))) return false
      } else if (isMale && !isFemale) {
        if (!s.cold_baths?.some(b => b.is_groundwater && ((b as any).gender === 'male' || (b as any).gender === 'both'))) return false
      } else {
        if (!s.cold_baths?.some(b => b.is_groundwater)) return false
      }
    }
    if (activeFilters.includes('deepcold')) {
      if (isFemale && !isMale) {
        if (!s.cold_baths?.some(b => b.depth >= 100 && ((b as any).gender === 'female' || (b as any).gender === 'both'))) return false
      } else if (isMale && !isFemale) {
        if (!s.cold_baths?.some(b => b.depth >= 100 && ((b as any).gender === 'male' || (b as any).gender === 'both'))) return false
      } else {
        if (!s.cold_baths?.some(b => b.depth >= 100)) return false
      }
    }
    if (activeFilters.includes('infinitychair')) {
      if (!s.resting_area?.infinity_chairs || s.resting_area.infinity_chairs <= 0) return false
    }
    return true
  })

  const preferredGender = activeFilters.includes('female') && !activeFilters.includes('male')
    ? 'female'
    : !activeFilters.includes('female') && activeFilters.includes('male')
    ? 'male'
    : undefined

  const updateBounds = (map: kakao.maps.Map) => {
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    setMapBounds({ swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() })
  }

  const handleMapCreate = (map: kakao.maps.Map) => {
    mapRef.current = map
    updateBounds(map)
  }

  const handleCenterChanged = (map: kakao.maps.Map) => {
    currentCenterRef.current = { lat: map.getCenter().getLat(), lng: map.getCenter().getLng() }
  }

  const handleDragEnd = () => {
    const { lat, lng } = currentCenterRef.current
    const dist = Math.sqrt(
      Math.pow(lat - prevCenterRef.current.lat, 2) +
      Math.pow(lng - prevCenterRef.current.lng, 2)
    )
    setShowResearch(dist > 0.01)
  }

  const handleIdle = (map: kakao.maps.Map) => {
    updateBounds(map)
    setCenter(currentCenterRef.current)
  }

  const handleResearch = () => {
    const current = currentCenterRef.current
    prevCenterRef.current = current
    setQueryLocation(current)
    setShowResearch(false)
  }

  const handleLocate = () => {
    if (userLocation) {
      setCenter(userLocation)
      currentCenterRef.current = userLocation
      setQueryLocation(userLocation)
      prevCenterRef.current = userLocation
      setShowResearch(false)
      return
    }
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setQueryLocation(loc)
        setCenter(loc)
        currentCenterRef.current = loc
        prevCenterRef.current = loc
        setIsLocating(false)
        setShowResearch(false)
      },
      () => setIsLocating(false),
      { timeout: 5000 }
    )
  }

  const toggleFilter = (f: Filter) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const handleZoomIn = () => {
    if (!mapRef.current) return
    const currentLevel = mapRef.current.getLevel()
    if (currentLevel > 1) {
      mapRef.current.setLevel(currentLevel - 1, { animate: true })
    }
  }

  const handleZoomOut = () => {
    if (!mapRef.current) return
    const currentLevel = mapRef.current.getLevel()
    if (currentLevel < 14) {
      mapRef.current.setLevel(currentLevel + 1, { animate: true })
    }
  }

  const handleMarkerClick = (sauna: SaunaSummaryDto) => {
    router.push(`/saunas/${sauna.id}`)
  }

  const visibleSaunas = mapBounds
    ? filteredSaunas.filter(s =>
        s.latitude  >= mapBounds.swLat && s.latitude  <= mapBounds.neLat &&
        s.longitude >= mapBounds.swLng && s.longitude <= mapBounds.neLng
      )
    : filteredSaunas

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bg-main p-6 text-center">
        <span className="mb-3 text-4xl">🗺️</span>
        <p className="mb-1 font-bold text-text-main">지도를 불러올 수 없어요</p>
        <p className="text-xs text-text-sub">광고 차단 확장 프로그램을 해제하고 새로고침해 주세요.</p>
      </div>
    )
  }

  const snapHeights = [PANEL_PEEK, PANEL_LIST, PANEL_FULL]

  return (
    <div className="relative h-full w-full overflow-hidden">

      {/* 헤더 */}
      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <div role="search" className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 rounded-2xl border border-border-main bg-bg-card shadow-card px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-point">
              <BiSearch size={16} className="flex-shrink-0 text-text-muted" aria-hidden="true" />
              <input
                type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="지역·사우나명 검색"
                aria-label="지역 또는 사우나명 검색"
                className="flex-1 bg-transparent text-[13px] text-text-main placeholder:text-text-muted outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="검색어 지우기"
                  className="rounded-full p-0.5 hover:bg-bg-sub active:scale-90"
                >
                  <BiX size={16} className="text-text-muted" />
                </button>
              )}
            </div>
          </div>
          <nav aria-label="지도 사우나 필터" className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-3 pb-2">
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilters([])}
                aria-label="모든 필터 초기화"
                className="flex-shrink-0 flex items-center gap-1 rounded-full border border-border-main bg-bg-card px-3 py-1.5 text-[11px] font-bold text-text-muted transition-all active:scale-95 hover:text-text-main focus-visible:ring-2 focus-visible:ring-point outline-none"
              >
                <BiX size={13} /> 초기화
              </button>
            )}
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                role="button"
                aria-pressed={activeFilters.includes(opt.id)}
                aria-label={`${opt.label} 필터 ${activeFilters.includes(opt.id) ? '해제' : '적용'}`}
                onClick={() => toggleFilter(opt.id)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-point outline-none ${
                  activeFilters.includes(opt.id)
                    ? 'bg-point text-white ring-1 ring-point'
                    : 'border border-border-main bg-bg-card text-text-sub hover:bg-bg-sub'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 지도 */}
      <div className="absolute inset-0">
        {!isLoaded ? (
          <div className="flex h-full items-center justify-center bg-bg-main">
            <Loading />
          </div>
        ) : (
          <>
            <Map
              center={center}
              onCenterChanged={handleCenterChanged}
              onDragEnd={handleDragEnd}
              onIdle={handleIdle}
              onCreate={handleMapCreate}
              style={{ width: '100%', height: '100%' }}
              level={6}
            >
              {visibleSaunas.map(sauna => {
                const rooms = preferredGender
                  ? (sauna.sauna_rooms ?? []).filter(r => (r as any).gender === 'both' || (r as any).gender === preferredGender)
                  : sauna.sauna_rooms
                const baths = preferredGender
                  ? (sauna.cold_baths ?? []).filter(b => (b as any).gender === 'both' || (b as any).gender === preferredGender)
                  : sauna.cold_baths
                const maxT = rooms?.length ? Math.max(...rooms.map(r => r.temp)) : null
                const minC = baths?.length ? Math.min(...baths.map(b => b.temp)) : null
                const isHovered = hoveredMarkerId === sauna.id

                return (
                  <CustomOverlayMap
                    key={sauna.id}
                    position={{ lat: sauna.latitude, lng: sauna.longitude }}
                    yAnchor={1}
                    xAnchor={0.5}
                    zIndex={isHovered ? 45 : 10}
                  >
                    <button
                      type="button"
                      onClick={() => handleMarkerClick(sauna)}
                      onMouseEnter={() => setHoveredMarkerId(sauna.id)}
                      onMouseLeave={() => setHoveredMarkerId(null)}
                      onFocus={() => setHoveredMarkerId(sauna.id)}
                      onBlur={() => setHoveredMarkerId(null)}
                      aria-label={`${sauna.name}, ${maxT ? '사우나 ' + maxT + '도 ' : ''}${minC ? '냉탕 ' + minC + '도 ' : ''}상세보기로 이동`}
                      className="group relative flex flex-col items-center select-none transition-transform duration-150 active:scale-95 focus-visible:outline-none"
                    >
                      {/* 상세 툴팁 프리뷰 말풍선 (호버 또는 키보드 포커스 시) */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2.5 whitespace-nowrap rounded-xl border border-border-main bg-bg-card p-2.5 text-left shadow-xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
                          <p className="text-[12px] font-black text-text-main leading-tight">{sauna.name}</p>
                          <p className="mt-0.5 text-[10px] text-text-muted">{sauna.address.split(' ').slice(0, 3).join(' ')}</p>
                          <div className="mt-1.5 flex items-center gap-2 text-[10.5px]">
                            {sauna.avg_rating && sauna.avg_rating > 0 ? (
                              <span className="font-bold text-point">★ {sauna.avg_rating.toFixed(1)}</span>
                            ) : null}
                            {maxT !== null && <span className="font-black text-sauna">🔥 {maxT}°C</span>}
                            {minC !== null && <span className="font-black text-cold">❄️ {minC}°C</span>}
                          </div>
                          <div className="mt-1 text-[9.5px] font-bold text-point flex items-center gap-0.5">
                            탭하여 바로 상세 정보 보기 →
                          </div>
                          {/* 말풍선 꼬리 */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 border-b border-r border-border-main bg-bg-card" />
                        </div>
                      )}

                      {/* 사우나 이키타이 스타일 듀얼 메트릭 알약 핀 */}
                      <div className={`flex items-center gap-1.5 rounded-full border bg-bg-card px-2.5 py-1 shadow-md transition-all duration-150 group-hover:scale-105 group-hover:shadow-lg ${
                        isHovered ? 'border-point ring-2 ring-point/20' : 'border-border-main/90'
                      } group-focus-visible:ring-2 group-focus-visible:ring-point`}>
                        {/* 사우나 시설명 */}
                        <span className="max-w-[80px] truncate text-[11px] font-black tracking-tight text-text-main leading-none">
                          {sauna.name}
                        </span>

                        {/* 온도 지표 (사우나 / 냉탕) */}
                        {(maxT !== null || minC !== null) && (
                          <>
                            <span className="h-2.5 w-[1px] bg-border-main/80 flex-shrink-0" />
                            <div className="flex items-center gap-1 leading-none">
                              {maxT !== null && (
                                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-black text-sauna">
                                  <span className="text-[9px]">🔥</span>{maxT}°
                                </span>
                              )}
                              {minC !== null && (
                                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-black text-cold">
                                  <span className="text-[9px]">❄️</span>{minC}°
                                </span>
                              )}
                            </div>
                          </>
                        )}

                        {/* 온도가 없는 경우 */}
                        {maxT === null && minC === null && (
                          <span className="text-[10px] text-point font-black">♨️</span>
                        )}
                      </div>

                      {/* 핀 침 포인트 (지도 좌표 지향 꼭짓점) */}
                      <div className={`-mt-[5px] h-2 w-2 rotate-45 border-b border-r bg-bg-card transition-colors duration-150 shadow-xs ${
                        isHovered ? 'border-point' : 'border-border-main/90'
                      }`} />
                    </button>
                  </CustomOverlayMap>
                )
              })}
            </Map>

            {/* 데이터 로딩 인디케이터 — 지도는 이미 보임 */}
            {isFetching && (
              <div className="absolute bottom-[260px] left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-2 rounded-full border border-border-main bg-bg-card px-3.5 py-2 shadow-card">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border-main border-t-point" />
                  <span className="text-[11px] font-bold text-text-sub">
                    {isLocating ? '위치 확인 중...' : '사우나 불러오는 중...'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 이 장소에서 재검색 */}
      <AnimatePresence>
        {showResearch && (
          <m.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute left-1/2 top-28 z-20 -translate-x-1/2"
          >
            <button
              type="button"
              onClick={handleResearch}
              aria-label="현재 지도 영역에서 사우나 재검색"
              className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-card px-4 py-2 text-[12px] font-bold text-text-main shadow-card active:scale-95 transition hover:bg-bg-sub focus-visible:ring-2 focus-visible:ring-point outline-none"
            >
              <BiRefresh size={15} className="text-point" />
              현 지도에서 재검색
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* 줌 컨트롤 & 현재 위치 버튼 그룹 */}
      <div
        className="absolute right-3 z-20 flex flex-col items-center gap-2.5 transition-all duration-300"
        style={{ bottom: panelSnap + 56 + 12 }}
      >
        {/* 줌 인 / 줌 아웃 컨트롤러 */}
        <div
          role="group"
          aria-label="지도 확대 및 축소"
          className="flex flex-col overflow-hidden rounded-2xl border border-border-main bg-bg-card shadow-card"
        >
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="지도 확대"
            className="flex h-9 w-9 items-center justify-center text-text-main transition hover:bg-bg-sub active:scale-90 focus-visible:ring-2 focus-visible:ring-point outline-none"
          >
            <BiPlus size={18} />
          </button>
          <div className="h-px w-full bg-border-subtle" />
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="지도 축소"
            className="flex h-9 w-9 items-center justify-center text-text-main transition hover:bg-bg-sub active:scale-90 focus-visible:ring-2 focus-visible:ring-point outline-none"
          >
            <BiMinus size={18} />
          </button>
        </div>

        {/* 현재 위치 버튼 */}
        <button
          type="button"
          onClick={handleLocate}
          disabled={isLocating}
          aria-label="내 현재 위치로 지도 이동"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-bg-card shadow-card transition active:scale-90 focus-visible:ring-2 focus-visible:ring-point outline-none disabled:opacity-50"
        >
          {isLocating
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-main border-t-point" />
            : <BiCurrentLocation size={18} className={userLocation ? 'text-point' : 'text-text-muted'} />
          }
        </button>
      </div>

      {/* 스와이프 패널 */}
      <SwipePanel snapHeights={snapHeights} currentSnap={panelSnap} onSnapChange={setPanelSnap}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle">
            <p className="text-[12px] font-black text-text-main">
              {filteredSaunas.length > 0 ? `사우나 ${filteredSaunas.length}곳 발견` : '검색 결과 없음'}
            </p>
            <button
              type="button"
              onClick={() => setPanelSnap(panelSnap === PANEL_FULL ? PANEL_PEEK : PANEL_FULL)}
              aria-label={panelSnap === PANEL_FULL ? '목록 접기' : '전체 목록 펼치기'}
              className="text-[11px] font-bold text-point hover:underline"
            >
              {panelSnap === PANEL_FULL ? '목록 접기' : '전체 보기'}
            </button>
          </div>

          {filteredSaunas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <span className="text-3xl mb-2 opacity-30">🔍</span>
              <p className="text-[13px] font-black text-text-main">조건에 맞는 사우나가 없어요</p>
              <p className="mt-1 text-[11px] text-text-muted">
                지도를 다른 지역으로 이동하거나 필터를 초기화해 보세요
              </p>
              {(activeFilters.length > 0 || searchQuery) && (
                <button
                  type="button"
                  onClick={() => { setActiveFilters([]); setSearchQuery('') }}
                  aria-label="모든 검색 조건 초기화"
                  className="mt-3 rounded-full bg-point/10 px-4 py-1.5 text-[11px] font-black text-point transition active:scale-95"
                >
                  검색 조건 초기화
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 py-3">
              {filteredSaunas.slice(0, 30).map(sauna => {
                const rooms = preferredGender
                  ? (sauna.sauna_rooms ?? []).filter(r => (r as any).gender === 'both' || (r as any).gender === preferredGender)
                  : sauna.sauna_rooms
                const baths = preferredGender
                  ? (sauna.cold_baths ?? []).filter(b => (b as any).gender === 'both' || (b as any).gender === preferredGender)
                  : sauna.cold_baths
                const maxT = rooms?.length ? Math.max(...rooms.map(r => r.temp)) : null
                const minC = baths?.length ? Math.min(...baths.map(b => b.temp)) : null

                return (
                  <button
                    key={sauna.id}
                    type="button"
                    onClick={() => handleMarkerClick(sauna)}
                    aria-label={`${sauna.name} 상세 페이지로 이동`}
                    className="flex-shrink-0 w-[140px] rounded-xl border border-border-main bg-bg-card text-left overflow-hidden transition active:scale-[0.97] hover:border-point/40 focus-visible:ring-2 focus-visible:ring-point outline-none"
                  >
                    <div className="h-20 w-full overflow-hidden bg-bg-sub">
                      {sauna.images?.[0] ? (
                        <img src={sauna.images[0]} alt={sauna.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
                          <span className="text-2xl opacity-20">🧖</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-[11px] font-black text-text-main">{sauna.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {maxT !== null && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-sauna-bg border border-sauna/20 px-1 py-0.5 text-[9px] font-black text-sauna">
                            🔥 {maxT}°
                          </span>
                        )}
                        {minC !== null && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-cold-bg border border-cold/20 px-1 py-0.5 text-[9px] font-black text-cold">
                            ❄️ {minC}°
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              <Link
                href="/search"
                aria-label="검색 페이지로 이동하여 사우나 전체 보기"
                className="flex-shrink-0 w-[70px] flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-main text-text-muted transition active:scale-95 hover:border-point/40 hover:text-point"
              >
                <BiChevronRight size={18} />
                <span className="text-[10px] font-bold">전체</span>
              </Link>
            </div>
          )}

          {panelSnap >= PANEL_FULL - 20 && filteredSaunas.length > 0 && (
            <div data-scroll-main className="flex-1 overflow-y-auto scrollbar-hide border-t border-border-main">
              {filteredSaunas.map(sauna => (
                <div key={sauna.id} className="border-b border-border-main last:border-0">
                  <SaunaBottomCard sauna={sauna} preferredGender={preferredGender} />
                </div>
              ))}
            </div>
          )}
        </div>
      </SwipePanel>
    </div>
  )
}
