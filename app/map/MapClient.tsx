'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSaunas, getSaunasByLocation } from '@/app/actions/sauna.actions'
import { useRouter } from 'next/navigation'
import { SaunaSummaryDto } from '@/types/sauna'
import { BiCurrentLocation, BiSearch, BiX, BiChevronRight, BiRefresh } from 'react-icons/bi'
import { m, AnimatePresence } from 'framer-motion'
import { useKakaoReady } from '@/hooks/useKakaoReady'

const PANEL_PEEK = 52
const PANEL_LIST = 240
const PANEL_FULL = 420

type Filter = 'female' | 'male' | 'tattoo' | 'autoloyly'

const FILTER_OPTIONS: { id: Filter; label: string }[] = [
  { id: 'female',    label: '여성가능' },
  { id: 'male',      label: '남성가능' },
  { id: 'tattoo',    label: '타투OK' },
  { id: 'autoloyly', label: '오토 로우리' },
]

// ── 마커 이미지 (메모이즈) ──────────────────────────────────
const MARKER_DEFAULT: kakao.maps.MarkerImageOptions = {
  src: '/marker-default.png',
  size: { width: 32, height: 40 },
  options: { offset: { x: 16, y: 40 } },
}
const MARKER_SELECTED: kakao.maps.MarkerImageOptions = {
  src: '/marker-selected.png',
  size: { width: 36, height: 46 },
  options: { offset: { x: 18, y: 46 } },
}

// 마커 이미지가 없을 경우 기본 파비콘 fallback
const FALLBACK_MARKER = {
  src: '/favicon.ico',
  size: { width: 28, height: 28 },
  options: { offset: { x: 14, y: 28 } },
}

// ── 카드 이미지 프리로드 ───────────────────────────────────
function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    if (!url) return
    const img = new window.Image()
    img.src = url
  })
}

// ── 스와이프 패널 ──────────────────────────────────────────
function SwipePanel({
  snapHeights,
  currentSnap,
  onSnapChange,
  children,
}: {
  snapHeights: number[]
  currentSnap: number
  onSnapChange: (h: number) => void
  children: React.ReactNode
}) {
  const dragStartY   = useRef(0)
  const dragStartSnap = useRef(currentSnap)

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartY.current    = e.clientY
    dragStartSnap.current = currentSnap
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return
    const delta = dragStartY.current - e.clientY
    const liveH = Math.max(0, Math.min(snapHeights.at(-1)!, dragStartSnap.current + delta))
    onSnapChange(liveH)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    const delta   = dragStartY.current - e.clientY
    const biased  = currentSnap + delta * 0.3
    const closest = snapHeights.reduce((p, c) =>
      Math.abs(c - biased) < Math.abs(p - biased) ? c : p
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
        className="flex cursor-grab flex-col items-center pt-2.5 pb-1 select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-border-main" />
      </div>
      <div className="h-full overflow-hidden">{children}</div>
    </m.div>
  )
}

// ── 사우나 하단 카드 ───────────────────────────────────────
function SaunaBottomCard({
  sauna,
  pref,
}: {
  sauna: SaunaSummaryDto
  pref?: 'male' | 'female'
}) {
  const router = useRouter()
  const rooms = useMemo(() =>
    pref ? sauna.sauna_rooms?.filter(r => (r as any).gender === 'both' || (r as any).gender === pref) : sauna.sauna_rooms
  , [sauna, pref])
  const baths = useMemo(() =>
    pref ? sauna.cold_baths?.filter(b => (b as any).gender === 'both' || (b as any).gender === pref) : sauna.cold_baths
  , [sauna, pref])

  const maxT = rooms?.length ? Math.max(...rooms.map(r => r.temp)) : null
  const minC = baths?.length ? Math.min(...baths.map(b => b.temp)) : null

  return (
    <button
      onClick={() => router.push(`/saunas/${sauna.id}`)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-bg-main"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-bg-main">
        {sauna.images?.[0] ? (
          <img src={sauna.images[0]} alt={sauna.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
            <span className="text-2xl">🧖</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-black text-text-main">{sauna.name}</p>
        <p className="truncate text-[11px] text-text-sub mt-0.5">{sauna.address}</p>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {maxT !== null && (
            <span className="flex items-center gap-0.5 rounded-md bg-sauna-bg px-1.5 py-0.5">
              <span className="text-[10px]">🔥</span>
              <span className="text-[11px] font-black text-sauna">{maxT}°</span>
            </span>
          )}
          {minC !== null && (
            <span className="flex items-center gap-0.5 rounded-md bg-cold-bg px-1.5 py-0.5">
              <span className="text-[10px]">❄️</span>
              <span className="text-[11px] font-black text-cold">{minC}°</span>
            </span>
          )}
          {!!sauna.review_count && sauna.review_count > 0 && (
            <span className="text-[11px] text-text-muted">
              사활 <span className="font-black text-point">{sauna.review_count}</span>
            </span>
          )}
        </div>
      </div>
      <BiChevronRight size={18} className="flex-shrink-0 text-text-muted" />
    </button>
  )
}

// ── 메인 ──────────────────────────────────────────────────
export default function MapClient() {
  const router       = useRouter()
  const queryClient  = useQueryClient()
  const { isReady: kakaoReady, isError: kakaoError } = useKakaoReady()

  const [userLocation,   setUserLocation]   = useState<{ lat: number; lng: number } | null>(null)
  const [queryLocation,  setQueryLocation]  = useState<{ lat: number; lng: number } | null>(null)
  const [center,         setCenter]         = useState({ lat: 37.545, lng: 126.84 })
  const [mapCenter,      setMapCenter]      = useState({ lat: 37.545, lng: 126.84 })
  const [hoveredId,      setHoveredId]      = useState<string | null>(null)
  const [selectedSauna,  setSelectedSauna]  = useState<SaunaSummaryDto | null>(null)
  const [isLocating,     setIsLocating]     = useState(true)
  const [activeFilters,  setActiveFilters]  = useState<Filter[]>([])
  const [searchQuery,    setSearchQuery]    = useState('')
  const [showResearch,   setShowResearch]   = useState(false)
  const [panelSnap,      setPanelSnap]      = useState(PANEL_LIST)
  const [mapBounds,      setMapBounds]      = useState<{
    swLat: number; swLng: number; neLat: number; neLng: number
  } | null>(null)

  const prevCenterRef = useRef(center)
  const mapRef        = useRef<kakao.maps.Map | null>(null)

  // ── 진입 시 즉시 위치 요청 (Kakao 로드와 병렬) ───────────
  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = { lat: 37.545, lng: 126.84 }
      setCenter(fallback); setQueryLocation(fallback)
      prevCenterRef.current = fallback; setIsLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude }
        setUserLocation(loc); setQueryLocation(loc)
        setCenter(loc); prevCenterRef.current = loc; setIsLocating(false)
      },
      () => {
        const fallback = { lat: 37.545, lng: 126.84 }
        setCenter(fallback); setQueryLocation(fallback)
        prevCenterRef.current = fallback; setIsLocating(false)
      },
      { timeout: 6000, enableHighAccuracy: false }
    )
  }, [])

  // ── 데이터 패칭 ───────────────────────────────────────────
  const { data: saunas = [], isLoading } = useQuery<SaunaSummaryDto[]>({
    queryKey: ['saunas', 'location', queryLocation?.lat, queryLocation?.lng],
    queryFn: () => getSaunasByLocation(queryLocation!.lat, queryLocation!.lng, 15),
    enabled: !!queryLocation,
    staleTime: 1000 * 60 * 3,
  })

  // ── 데이터 오면 이미지 프리로드 ──────────────────────────
  useEffect(() => {
    if (!saunas.length) return
    const urls = saunas
      .slice(0, 20)
      .map(s => s.images?.[0])
      .filter(Boolean) as string[]
    preloadImages(urls)
  }, [saunas])

  // ── 필터 적용 ─────────────────────────────────────────────
  const pref = useMemo((): 'female' | 'male' | undefined => {
    const f = activeFilters.includes('female')
    const m = activeFilters.includes('male')
    return (f && !m) ? 'female' : (!f && m) ? 'male' : undefined
  }, [activeFilters])

  const filteredSaunas = useMemo(() => {
    return saunas.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.address.includes(q)) return false
      }
      if (activeFilters.includes('female') && !s.rules?.female_allowed) return false
      if (activeFilters.includes('male')   && !s.rules?.male_allowed)   return false
      if (activeFilters.includes('tattoo') && !s.rules?.tattoo_allowed) return false
      if (activeFilters.includes('autoloyly') && !s.sauna_rooms?.some(r => r.has_auto_loyly)) return false
      return true
    })
  }, [saunas, searchQuery, activeFilters])

  // ── 뷰포트 내 마커만 렌더 (가상화) ───────────────────────
  const visibleSaunas = useMemo(() => {
    if (!mapBounds) return filteredSaunas
    return filteredSaunas.filter(s =>
      s.latitude  >= mapBounds.swLat && s.latitude  <= mapBounds.neLat &&
      s.longitude >= mapBounds.swLng && s.longitude <= mapBounds.neLng
    )
  }, [filteredSaunas, mapBounds])

  // ── 지도 콜백 ─────────────────────────────────────────────
  const updateBounds = useCallback((map: kakao.maps.Map) => {
    const b  = map.getBounds()
    const sw = b.getSouthWest()
    const ne = b.getNorthEast()
    setMapBounds({ swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() })
  }, [])

  const handleMapCreate = useCallback((map: kakao.maps.Map) => {
    mapRef.current = map
    updateBounds(map)
  }, [updateBounds])

  const handleCenterChanged = useCallback((map: kakao.maps.Map) => {
    const lat = map.getCenter().getLat()
    const lng = map.getCenter().getLng()
    setCenter({ lat, lng }); setMapCenter({ lat, lng })
    const dist = Math.sqrt((lat - prevCenterRef.current.lat) ** 2 + (lng - prevCenterRef.current.lng) ** 2)
    setShowResearch(dist > 0.01)
    updateBounds(map)
  }, [updateBounds])

  const handleResearch = () => {
    prevCenterRef.current = mapCenter
    setQueryLocation(mapCenter); setShowResearch(false)
  }

  const handleLocate = () => {
    if (userLocation) {
      setCenter(userLocation); setQueryLocation(userLocation)
      prevCenterRef.current = userLocation; setShowResearch(false)
      return
    }
    setIsLocating(true)
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude }
        setUserLocation(loc); setQueryLocation(loc); setCenter(loc)
        prevCenterRef.current = loc; setIsLocating(false); setShowResearch(false)
      },
      () => setIsLocating(false),
      { timeout: 5000 }
    )
  }

  const handleMarkerClick = (sauna: SaunaSummaryDto) => {
    setSelectedSauna(sauna); setPanelSnap(180)
    setCenter({ lat: sauna.latitude - 0.003, lng: sauna.longitude })

    // 클릭한 사우나 데이터를 TanStack Query 캐시에 등록 → 상세 페이지 진입 시 즉시 사용
    queryClient.setQueryData(['sauna', sauna.id], sauna)
  }

  const toggleFilter = (f: Filter) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  // ── 에러 화면 ─────────────────────────────────────────────
  if (kakaoError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bg-main p-6 text-center">
        <span className="mb-3 text-4xl">🗺️</span>
        <p className="mb-1 font-bold text-text-main">지도를 불러올 수 없어요</p>
        <p className="text-xs text-text-sub">광고 차단 확장 프로그램을 해제하고 새로고침해 주세요.</p>
      </div>
    )
  }

  const snapHeights = selectedSauna
    ? [PANEL_PEEK, 180, PANEL_LIST]
    : [PANEL_PEEK, PANEL_LIST, PANEL_FULL]

  return (
    <div className="relative h-full w-full overflow-hidden">

      {/* ── 상단 검색 + 필터 ── */}
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
                <button onClick={() => setSearchQuery('')}>
                  <BiX size={16} className="text-text-muted" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 pb-2">
            {FILTER_OPTIONS.map(opt => {
              const isOn = activeFilters.includes(opt.id)
              return (
                <button key={opt.id} onClick={() => toggleFilter(opt.id)}
                  className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm transition active:scale-95 ${
                    isOn ? 'bg-point text-white' : 'border border-border-main bg-bg-card text-text-sub'
                  }`}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 지도 ── */}
      <div className="absolute inset-0">
        {/* Kakao SDK 미로드 → 스켈레톤만 표시 (지도 영역 예열) */}
        {!kakaoReady ? (
          <div className="relative h-full w-full bg-[#e8e0d8] animate-pulse flex flex-col items-center justify-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white/80" />
            <p className="text-[12px] font-bold text-white/70">지도 불러오는 중...</p>
          </div>
        ) : (
          <Map
            center={center}
            onCenterChanged={handleCenterChanged}
            onCreate={handleMapCreate}
            style={{ width: '100%', height: '100%' }}
            level={6}
          >
            {/*
              ★ 성능 핵심: CustomOverlayMap은 hover/selected 마커에만 렌더
              기존: visibleSaunas 전체에 렌더 → DOM 노드 × 2
              개선: MapMarker 전체 + Overlay는 1개만
            */}
            {visibleSaunas.map(sauna => {
              const isSelected = selectedSauna?.id === sauna.id
              const markerImg = isSelected ? MARKER_SELECTED : MARKER_DEFAULT
              return (
                <MapMarker
                  key={sauna.id}
                  position={{ lat: sauna.latitude, lng: sauna.longitude }}
                  image={markerImg}
                  onMouseOver={() => setHoveredId(sauna.id)}
                  onMouseOut={() => setHoveredId(null)}
                  onClick={() => handleMarkerClick(sauna)}
                  zIndex={isSelected ? 20 : 10}
                />
              )
            })}

            {/* Overlay는 hover된 마커 1개만 렌더 (DOM 폭발 방지) */}
            {(() => {
              const target = hoveredId
                ? visibleSaunas.find(s => s.id === hoveredId)
                : selectedSauna
              if (!target) return null

              const rooms = pref
                ? target.sauna_rooms?.filter(r => (r as any).gender === 'both' || (r as any).gender === pref)
                : target.sauna_rooms
              const baths = pref
                ? target.cold_baths?.filter(b => (b as any).gender === 'both' || (b as any).gender === pref)
                : target.cold_baths
              const maxT = rooms?.length ? Math.max(...rooms.map(r => r.temp)) : null
              const minC = baths?.length ? Math.min(...baths.map(b => b.temp)) : null

              return (
                <CustomOverlayMap
                  position={{ lat: target.latitude, lng: target.longitude }}
                  yAnchor={2.2} xAnchor={0.5}
                  zIndex={30}
                >
                  <div className="relative whitespace-nowrap rounded-xl border border-border-main bg-bg-sub px-3 py-2 text-[11px] font-black text-text-main shadow-card">
                    {target.name}
                    {maxT !== null && <span className="ml-1.5 text-sauna">{maxT}°</span>}
                    {minC !== null && <span className="ml-1 text-cold">{minC}°</span>}
                    <div className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border-main bg-bg-sub" />
                  </div>
                </CustomOverlayMap>
              )
            })()}
          </Map>
        )}
      </div>

      {/* ── 재검색 버튼 ── */}
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

      {/* ── 현재 위치 버튼 ── */}
      <div className="absolute right-3 z-20 transition-all duration-300" style={{ bottom: panelSnap + 12 }}>
        <button onClick={handleLocate} disabled={isLocating}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-main bg-bg-card shadow-card transition active:scale-90">
          {isLocating
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-main border-t-point" />
            : <BiCurrentLocation size={18} className="text-point" />}
        </button>
      </div>

      {/* ── 스와이프 패널 ── */}
      <SwipePanel snapHeights={snapHeights} currentSnap={panelSnap} onSnapChange={setPanelSnap}>
        <div className="flex flex-col h-full">

          {selectedSauna && (
            <>
              <div className="flex items-center justify-between px-4 py-1">
                <button onClick={() => { setSelectedSauna(null); setPanelSnap(PANEL_LIST) }}
                  className="flex items-center gap-1 text-[11px] font-bold text-text-muted">
                  <BiX size={14} /> 닫기
                </button>
                <span className="text-[11px] text-text-muted">{filteredSaunas.length}개</span>
                <button onClick={() => setPanelSnap(PANEL_FULL)} className="text-[11px] font-bold text-point">
                  목록 펼치기
                </button>
              </div>
              <SaunaBottomCard sauna={selectedSauna} pref={pref} />
              <div className="mx-4 h-px bg-border-main" />
            </>
          )}

          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-[12px] font-black text-text-main">
              {isLoading ? '검색 중...' : `${filteredSaunas.length}개의 사우나`}
            </p>
            {panelSnap < PANEL_FULL && (
              <button onClick={() => setPanelSnap(PANEL_FULL)} className="text-[11px] font-bold text-point">
                전체 보기
              </button>
            )}
          </div>

          {/* 가로 스크롤 카드 */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[140px] h-[132px] rounded-xl border border-border-main bg-bg-sub animate-pulse" />
              ))
            ) : (
              filteredSaunas.slice(0, 30).map(sauna => {
                const rooms = pref ? sauna.sauna_rooms?.filter(r => (r as any).gender === 'both' || (r as any).gender === pref) : sauna.sauna_rooms
                const baths = pref ? sauna.cold_baths?.filter(b => (b as any).gender === 'both' || (b as any).gender === pref) : sauna.cold_baths
                const maxT = rooms?.length ? Math.max(...rooms.map(r => r.temp)) : null
                const minC = baths?.length ? Math.min(...baths.map(b => b.temp)) : null
                return (
                  <button key={sauna.id} onClick={() => handleMarkerClick(sauna)}
                    className={`flex-shrink-0 w-[140px] rounded-xl border text-left overflow-hidden transition active:scale-[0.97] ${
                      selectedSauna?.id === sauna.id ? 'border-point ring-1 ring-point/30' : 'border-border-main'
                    } bg-bg-card`}
                  >
                    <div className="h-20 w-full overflow-hidden bg-bg-main">
                      {sauna.images?.[0]
                        ? <img src={sauna.images[0]} alt={sauna.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg"><span className="text-2xl">🧖</span></div>
                      }
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
              })
            )}
          </div>

          {panelSnap >= PANEL_FULL - 20 && (
            <div className="flex-1 overflow-y-auto scrollbar-hide border-t border-border-main">
              {filteredSaunas.map(sauna => (
                <div key={sauna.id} className="border-b border-border-main last:border-0">
                  <SaunaBottomCard sauna={sauna} pref={pref} />
                </div>
              ))}
            </div>
          )}
        </div>
      </SwipePanel>
    </div>
  )
}
