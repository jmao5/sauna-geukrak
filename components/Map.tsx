'use client'

import { useEffect, useState } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'

export default function SaunaMap() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [center, setCenter] = useState({ lat: 37.545, lng: 126.84 }) // 기본 서울 강서구 중심
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)

  // 1. 카카오맵 스크립트 로드 확인
  useEffect(() => {
    const checkKakaoMap = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setIsLoaded(true)
        })
        clearInterval(checkKakaoMap)
      }
    }, 100)

    return () => clearInterval(checkKakaoMap)
  }, [])

  // 2. TanStack Query를 사용하여 사우나 데이터 가져오기
  const { data: saunas = [], isLoading, isError } = useQuery({
    queryKey: ['saunas'],
    queryFn: api.saunas.getAll,
  })

  // 데이터가 로드되면 중심점 이동
  useEffect(() => {
    if (saunas && saunas.length > 0) {
      setCenter({ lat: saunas[0].latitude, lng: saunas[0].longitude })
    }
  }, [saunas])

  if (!isLoaded || isLoading) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-gray-500 font-medium">지도를 불러오는 중입니다...</p>
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
        level={6} // 축척 레벨
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
            />
            {hoveredMarkerId === sauna.id && (
              <CustomOverlayMap
                position={{ lat: sauna.latitude, lng: sauna.longitude }}
                yAnchor={2.2} // 마커 위쪽으로 더 띄움
                xAnchor={0.5}
                zIndex={10}
              >
                <div className="relative bg-white px-3 py-2 rounded-lg shadow-md border border-gray-200 text-sm font-bold text-gray-800 whitespace-nowrap -mt-1 cursor-default">
                  {sauna.name}
                  {/* 말풍선 꼬리 (아래쪽 화살표) */}
                  <div className="absolute w-2.5 h-2.5 bg-white border-b border-r border-gray-200 transform rotate-45 left-1/2 -bottom-[6px] -translate-x-1/2 rounded-sm z-0"></div>
                </div>
              </CustomOverlayMap>
            )}
          </div>
        ))}
      </Map>
    </div>
  )
}
