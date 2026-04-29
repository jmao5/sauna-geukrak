'use client'

import { useEffect, useState } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useRouter } from 'next/navigation'
import { SaunaSummaryDto } from '@/types/sauna'
import { BiCurrentLocation } from 'react-icons/bi'
import Loading from '@/components/ui/Loading'

export default function MapClient() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [center, setCenter] = useState({ lat: 37.545, lng: 126.84 })
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    let attempts = 0
    const check = setInterval(() => {
      attempts++
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => setIsLoaded(true))
        clearInterval(check)
      } else if (attempts > 50) {
        clearInterval(check)
        setLoadError(true)
      }
    }, 100)
    return () => clearInterval(check)
  }, [])

  const { data: saunas = [], isLoading } = useQuery<SaunaSummaryDto[]>({
    queryKey: ['saunas'],
    queryFn: () => api.saunas.getAll(),
    staleTime: 1000 * 60 * 5, // SSR prefetch 코드와 동일한 캐시 전략
  })

  useEffect(() => {
    if (saunas.length > 0) {
      setCenter({ lat: saunas[0].latitude, lng: saunas[0].longitude })
    }
  }, [saunas])

  const handleLocate = () => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsLocating(false)
      },
      () => setIsLocating(false),
      { timeout: 5000 }
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bg-main p-6 text-center">
        <span className="mb-3 text-4xl">🗺️</span>
        <p className="mb-1 font-bold text-text-main">지도를 불러올 수 없어요</p>
        <p className="text-xs text-text-sub">
          광고 차단 확장 프로그램을 해제하고 새로고침해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-bg-sub px-4 py-3.5 border-b border-border-main">
        <p className="text-[10px] font-black tracking-widest text-text-muted uppercase mb-0.5">Map View</p>
        <h1 className="font-juache text-[18px] font-bold text-text-main leading-tight">지도로 탐색</h1>
      </div>

      {/* 지도 */}
      <div className="relative flex-1">
        {(!isLoaded || isLoading) ? (
          <div className="flex h-full items-center justify-center bg-bg-main">
            <Loading />
          </div>
        ) : (
          <Map
            center={center}
            style={{ width: '100%', height: '100%' }}
            level={6}
          >
            {saunas.map((sauna) => (
              <div key={sauna.id}>
                <MapMarker
                  position={{ lat: sauna.latitude, lng: sauna.longitude }}
                  image={{
                    src: '/favicon.ico',
                    size: { width: 26, height: 26 },
                    options: { offset: { x: 13, y: 26 } },
                  }}
                  onMouseOver={() => setHoveredMarkerId(sauna.id)}
                  onMouseOut={() => setHoveredMarkerId(null)}
                  onClick={() => router.push(`/saunas/${sauna.id}`)}
                />
                <CustomOverlayMap
                  position={{ lat: sauna.latitude, lng: sauna.longitude }}
                  yAnchor={2.2}
                  xAnchor={0.5}
                  zIndex={hoveredMarkerId === sauna.id ? 20 : 10}
                >
                  <div className={`relative whitespace-nowrap rounded-xl border border-border-main bg-bg-sub px-3 py-2 text-[11px] font-black text-text-main shadow-card transition-opacity duration-200 ${hoveredMarkerId === sauna.id
                    ? 'opacity-100'
                    : 'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:pointer-events-none'
                    }`}>
                    {sauna.name}
                    {sauna.sauna_rooms?.length > 0 && (
                      <span className="ml-1.5 text-sauna">
                        {Math.max(...sauna.sauna_rooms.map((r) => r.temp))}°
                      </span>
                    )}
                    {sauna.cold_baths?.length > 0 && (
                      <span className="ml-1 text-cold">
                        {Math.min(...sauna.cold_baths.map((b) => b.temp))}°
                      </span>
                    )}
                    <div className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border-main bg-bg-sub" />
                  </div>
                </CustomOverlayMap>
              </div>
            ))}
          </Map>
        )}

        {/* 현재 위치 버튼 */}
        <button
          onClick={handleLocate}
          disabled={isLocating}
          className="absolute bottom-5 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-bg-sub shadow-card border border-border-main transition active:scale-90"
          aria-label="현재 위치"
        >
          {isLocating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-main border-t-point" />
          ) : (
            <BiCurrentLocation size={18} className="text-point" />
          )}
        </button>
      </div>
    </div>
  )
}
