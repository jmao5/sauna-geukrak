'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery } from '@tanstack/react-query'
import { getSaunasByLocation } from '@/app/actions/sauna.actions'
import { useRouter } from 'next/navigation'
import { SaunaSummaryDto } from '@/types/sauna'
import { BiCurrentLocation, BiSearch, BiX, BiChevronRight, BiRefresh } from 'react-icons/bi'
import { m, AnimatePresence } from 'framer-motion'
import Loading from '@/components/ui/Loading'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'

type Filter = 'female' | 'male' | 'tattoo' | 'autoloyly'

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'female', label: '여성가능' },
  { id: 'male', label: '남성가능' },
  { id: 'tattoo', label: '타투OK' },
  { id: 'autoloyly', label: '오토 로우리' },
]

const PANEL_PEEK = 52
const PANEL_LIST = 240
const PANEL_FULL = 420

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
    <m.div
      className="absolute bottom-0 left-0 right-0 z-20 rounded-t-2xl border-t border-border-main bg-bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      animate={{ height: currentSnap }}
      transition={{ type: 'spring', stiffness: 400, damping: 38, mass: 0.8 }}
      style={{ overflow: 'hidden', touchAction: 'none' }}
    >
      <div
        className="flex cursor-grab active:cursor-grabbing flex-col items-center pt-2.5 pb-1 select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-border-strong" />
      </div>
      <div className="h-full overflow-hidden">{children}</div>
    </m.div>
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
            <span className="flex items-center gap-0.5 rounded-md bg-[#fff3ee] px-1.5 py-0.5">
              <span className="text-[10px]">🔥</span>
              <span className="text-[11px] font-black text-sauna">{maxSaunaTemp}°</span>
            </span>
          )}
          {minColdTemp !== null && (
            <span className="flex items-center gap-0.5 rounded-md bg-[#eef3ff] px-1.5 py-0.5">
              <span className="text-[10px]">❄️</span>
              <span className="text-[11px] font-black text-cold">{minColdTemp}°</span>
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
  const isMobile = useIsMobile()

  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [queryLocation, setQueryLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [center, setCenter] = useState(SEOUL_FALLBACK)
  const currentCenterRef = useRef(SEOUL_FALLBACK)
  const prevCenterRef = useRef(SEOUL_FALLBACK)
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [selectedSauna, setSelectedSauna] = useState<SaunaSummaryDto | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showResearch, setShowResearch] = useState(false)
  const [panelSnap, setPanelSnap] = useState(PANEL_LIST)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const [mapBounds, setMapBounds] = useState<{
    swLat: number; swLng: number; neLat: number; neLng: number
  } | null>(null)

  // ── SDK 로드 + 위치 요청 병렬 시작 ──────────────────────────
  useEffect(() => {
    // 1) 카카오 SDK — 폴링 대신 load() 콜백 직접 사용
    const initKakao = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => setIsLoaded(true))
      } else {
        // SDK 스크립트가 아직 파싱 중이면 짧게 대기 후 재시도
        const t = setTimeout(initKakao, 50)
        return () => clearTimeout(t)
      }
    }
    initKakao()

    // 2) 위치 요청 — SDK와 무관하게 동시 시작
    if (!navigator.geolocation) {
      setQueryLocation(SEOUL_FALLBACK)
      setCenter(SEOUL_FALLBACK)
      currentCenterRef.current = SEOUL_FALLBACK
      prevCenterRef.current = SEOUL_FALLBACK
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setQueryLocation(loc)
        setCenter(loc)
        currentCenterRef.current = loc
        prevCenterRef.current = loc
        setIsLocating(false)
      },
      () => {
        // 거부/실패 → 서울 폴백
        setQueryLocation(SEOUL_FALLBACK)
        setCenter(SEOUL_FALLBACK)
        currentCenterRef.current = SEOUL_FALLBACK
        prevCenterRef.current = SEOUL_FALLBACK
        setIsLocating(false)
      },
      { timeout: 3000, enableHighAccuracy: false } // 6초 → 3초
    )
  }, [])

  // SDK 로드 실패 감지 (10초 후에도 isLoaded가 false면 에러)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isLoaded) setLoadError(true)
    }, 10000)
    return () => clearTimeout(t)
  }, [isLoaded])

  const { data: saunas = [], isLoading } = useQuery<SaunaSummaryDto[]>({
    queryKey: ['saunas', 'location', queryLocation?.lat, queryLocation?.lng],
    queryFn: () => getSaunasByLocation(queryLocation!.lat, queryLocation!.lng, 15),
    enabled: !!queryLocation,
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
    return true
  })

  const preferredGender = activeFilters.includes('female') && !activeFilters.includes('male')
    ? 'female'
    : !activeFilters.includes('female') && activeFilters.includes('male')
    ? 'male'
    : undefined

  const updateBounds = useCallback((map: kakao.maps.Map) => {
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    setMapBounds({ swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() })
  }, [])

  const handleMapCreate = useCallback((map: kakao.maps.Map) => {
    mapRef.current = map
    updateBounds(map)
  }, [updateBounds])

  const handleCenterChanged = useCallback((map: kakao.maps.Map) => {
    currentCenterRef.current = { lat: map.getCenter().getLat(), lng: map.getCenter().getLng() }
  }, [])

  const handleDragEnd = useCallback(() => {
    const { lat, lng } = currentCenterRef.current
    const dist = Math.sqrt(
      Math.pow(lat - prevCenterRef.current.lat, 2) +
      Math.pow(lng - prevCenterRef.current.lng, 2)
    )
    setShowResearch(dist > 0.01)
  }, [])

  const handleIdle = useCallback((map: kakao.maps.Map) => {
    updateBounds(map)
    setCenter(currentCenterRef.current)
  }, [updateBounds])

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

  const handleMarkerClick = (sauna: SaunaSummaryDto) => {
    setSelectedSauna(sauna)
    setPanelSnap(180)
    const newCenter = { lat: sauna.latitude - 0.003, lng: sauna.longitude }
    setCenter(newCenter)
    currentCenterRef.current = newCenter
  }

  // 뷰포트 안 마커만 렌더
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

  const snapHeights = selectedSauna ? [PANEL_PEEK, 180, PANEL_LIST] : [PANEL_PEEK, PANEL_LIST, PANEL_FULL]

  return (
    <div className="relative h-full w-full overflow-hidden">

      {/* 헤더 */}
      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 rounded-2xl border border-border-main bg-bg-card shadow-card px-3.5 py-2.5">
              <BiSearch size={16} className="flex-shrink-0 text-text-muted" />
              <input
                type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="에리어·시설명 검색"
                className="flex-1 bg-transparent text-[13px] text-text-main placeholder:text-text-muted outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}><BiX size={16} className="text-text-muted" /></button>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 pb-2">
            {FILTER_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => toggleFilter(opt.id)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm transition-all active:scale-95 ${
                  activeFilters.includes(opt.id) ? 'bg-point text-white' : 'border border-border-main bg-bg-card text-text-sub'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 지도 — SDK 로드만 기다림, 데이터 로딩은 기다리지 않음 */}
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
                const isHovered  = hoveredMarkerId === sauna.id
                const isSelected = selectedSauna?.id === sauna.id

                return (
                  <div key={sauna.id}>
                    <MapMarker
                      position={{ lat: sauna.latitude, lng: sauna.longitude }}
                      image={{ src: '/favicon.ico', size: { width: 26, height: 26 }, options: { offset: { x: 13, y: 26 } } }}
                      onMouseOver={() => setHoveredMarkerId(sauna.id)}
                      onMouseOut={() => setHoveredMarkerId(null)}
                      onClick={() => handleMarkerClick(sauna)}
                    />
                    {/* 말풍선 — hover/선택된 것만 렌더 */}
                    {(isMobile || isHovered || isSelected) && (
                      <CustomOverlayMap
                        position={{ lat: sauna.latitude, lng: sauna.longitude }}
                        yAnchor={2.2} xAnchor={0.5}
                        zIndex={isHovered || isSelected ? 20 : 10}
                      >
                        <div className="relative whitespace-nowrap rounded-xl border border-border-main bg-bg-sub px-3 py-2 text-[11px] font-black text-text-main shadow-card">
                          {sauna.name}
                          {maxT !== null && <span className="ml-1.5 text-sauna">{maxT}°</span>}
                          {minC !== null && <span className="ml-1 text-cold">{minC}°</span>}
                          <div className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border-main bg-bg-sub" />
                        </div>
                      </CustomOverlayMap>
                    )}
                  </div>
                )
              })}
            </Map>

            {/* 데이터 로딩 오버레이 — 지도는 보이되 로딩 인디케이터만 표시 */}
            {isLoading && (
              <div className="absolute bottom-[260px] left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center gap-2 rounded-full border border-border-main bg-bg-card px-3.5 py-2 shadow-card">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border-main border-t-point" />
                  <span className="text-[11px] font-bold text-text-sub">사우나 불러오는 중...</span>
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
            <button onClick={handleResearch}
              className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-card px-4 py-2 text-[12px] font-bold text-text-main shadow-card active:scale-95 transition">
              <BiRefresh size={14} className="text-point" />
              이 장소에서 재검색
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* 현재 위치 버튼 */}
      <div className="absolute right-3 z-20 transition-all duration-300" style={{ bottom: panelSnap + 12 }}>
        <button onClick={handleLocate} disabled={isLocating}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-bg-card shadow-card transition active:scale-90">
          {isLocating
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-main border-t-point" />
            : <BiCurrentLocation size={18} className="text-point" />
          }
        </button>
      </div>

      {/* 스와이프 패널 */}
      <SwipePanel snapHeights={snapHeights} currentSnap={panelSnap} onSnapChange={setPanelSnap}>
        <div className="flex flex-col h-full">
          {selectedSauna && (
            <>
              <div className="flex items-center justify-between px-4 py-1">
                <button onClick={() => { setSelectedSauna(null); setPanelSnap(PANEL_LIST) }}
                  className="flex items-center gap-1 text-[11px] font-bold text-text-muted">
                  <BiX size={14} /> 닫기
                </button>
                <span className="text-[11px] text-text-muted">{filteredSaunas.length}개 표시 중</span>
                <button onClick={() => setPanelSnap(PANEL_FULL)} className="text-[11px] font-bold text-point">
                  목록 펼치기
                </button>
              </div>
              <SaunaBottomCard sauna={selectedSauna} preferredGender={preferredGender} />
              <div className="mx-4 h-px bg-border-main" />
            </>
          )}

          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-[12px] font-black text-text-main">
              {selectedSauna ? '근처 사우나' : `${filteredSaunas.length}개의 사우나`}
            </p>
            {panelSnap < PANEL_FULL && (
              <button onClick={() => setPanelSnap(PANEL_FULL)} className="text-[11px] font-bold text-point">
                전체 보기
              </button>
            )}
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-3">
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
                <button key={sauna.id} onClick={() => handleMarkerClick(sauna)}
                  className={`flex-shrink-0 w-[140px] rounded-xl border text-left overflow-hidden transition active:scale-[0.97] ${
                    selectedSauna?.id === sauna.id ? 'border-point ring-1 ring-point/30' : 'border-border-main'
                  } bg-bg-card`}
                >
                  <div className="h-20 w-full overflow-hidden">
                    {sauna.images?.[0] ? (
                      <img src={sauna.images[0]} alt={sauna.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eef3ff] to-[#fff3ee]">
                        <span className="text-2xl">🧖</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[11px] font-black text-text-main">{sauna.name}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {maxT !== null && <span className="text-[10px] font-black text-sauna">🔥{maxT}°</span>}
                      {minC !== null && <span className="text-[10px] font-black text-cold">❄️{minC}°</span>}
                    </div>
                  </div>
                </button>
              )
            })}
            <Link href="/search"
              className="flex-shrink-0 w-[70px] flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-main text-text-muted transition active:scale-95">
              <BiChevronRight size={18} />
              <span className="text-[10px] font-bold">전체</span>
            </Link>
          </div>

          {panelSnap >= PANEL_FULL - 20 && (
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
