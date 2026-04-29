'use client'

import { useEffect } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useRouter } from 'next/navigation'
import { SaunaSummaryDto } from '@/types/sauna'
import { useState } from 'react'
import { useKakaoReady } from '@/hooks/useKakaoReady'
import Loading from '@/components/ui/Loading'

export default function SaunaMap() {
  const router = useRouter()
  const { isReady: isLoaded, isError: loadError } = useKakaoReady()
  const [center, setCenter] = useState({ lat: 37.545, lng: 126.84 })
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)

  const { data: saunas = [], isLoading, isError } = useQuery({
    queryKey: ['saunas'],
    queryFn: () => api.saunas.getAll(),
  })

  useEffect(() => {
    if (saunas && saunas.length > 0) {
      setCenter({ lat: saunas[0].latitude, lng: saunas[0].longitude })
    }
  }, [saunas])

  const handleMarkerClick = (sauna: SaunaSummaryDto) => {
    router.push(`/saunas/${sauna.id}`)
  }

  if (loadError) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-red-50 rounded-xl p-4 text-center">
        <p className="text-red-600 font-bold mb-2">지도를 불러올 수 없습니다 😢</p>
        <p className="text-sm text-red-500">
          브라우저의 <b>추적 방지(Tracking Prevention)</b> 기능이나 <b>광고 차단 확장 프로그램</b>, 또는 <b>시크릿 모드</b> 때문에 카카오맵이 차단되었을 수 있습니다.<br />설정을 해제하고 새로고침 해주세요.
        </p>
      </div>
    )
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center bg-gray-100 rounded-xl">
        <Loading />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-red-500 font-medium">데이터를 불러오는데 실패했습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-xl overflow-hidden shadow-sm relative">
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
                size: { width: 32, height: 32 },
                options: { offset: { x: 16, y: 32 } },
              }}
              onMouseOver={() => setHoveredMarkerId(sauna.id)}
              onMouseOut={() => setHoveredMarkerId(null)}
              onClick={() => handleMarkerClick(sauna)}
            />
            {hoveredMarkerId === sauna.id && (
              <CustomOverlayMap
                position={{ lat: sauna.latitude, lng: sauna.longitude }}
                yAnchor={2.2}
                xAnchor={0.5}
                zIndex={10}
              >
                <div className="relative px-3 py-2 rounded-lg shadow-md border bg-white border-gray-200 text-gray-800 text-sm font-bold whitespace-nowrap -mt-1 cursor-default">
                  {sauna.name}
                  <div className="absolute w-2.5 h-2.5 border-b border-r transform rotate-45 left-1/2 -bottom-[6px] -translate-x-1/2 rounded-sm z-0 bg-white border-gray-200"></div>
                </div>
              </CustomOverlayMap>
            )}
          </div>
        ))}
      </Map>
    </div>
  )
}
