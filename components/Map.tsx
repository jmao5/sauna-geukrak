'use client'

import { useEffect, useState } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useRouter } from 'next/navigation'
import { SaunaSummaryDto } from '@/types/sauna'

export default function SaunaMap() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [center, setCenter] = useState({ lat: 37.545, lng: 126.84 }) // 기본 서울 강서구 중심
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)

  // 1. 카카오맵 스크립트 로드 확인
  useEffect(() => {
    let attempts = 0
    const checkKakaoMap = setInterval(() => {
      attempts++
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setIsLoaded(true)
        })
        clearInterval(checkKakaoMap)
      } else if (attempts > 50) { // 5초 이상 로드 실패 시 (100ms * 50)
        clearInterval(checkKakaoMap)
        setLoadError(true)
      }
    }, 100)

    return () => clearInterval(checkKakaoMap)
  }, [])

  // 2. TanStack Query를 사용하여 사우나 데이터 가져오기
  const { data: saunas = [], isLoading, isError } = useQuery({
    queryKey: ['saunas'],
    queryFn: () => api.saunas.getAll(),
  })

  // 데이터가 로드되면 중심점 이동
  useEffect(() => {
    if (saunas && saunas.length > 0) {
      setCenter({ lat: saunas[0].latitude, lng: saunas[0].longitude })
    }
  }, [saunas])

  // 마커 클릭 핸들러: 상세 페이지로 라우팅
  const handleMarkerClick = (sauna: SaunaSummaryDto) => {
    router.push(`/saunas/${sauna.id}`)
  }

  if (loadError) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-red-50 rounded-xl p-4 text-center">
        <p className="text-red-600 font-bold mb-2">지도를 불러올 수 없습니다 😢</p>
        <p className="text-sm text-red-500">
          브라우저의 <b>추적 방지(Tracking Prevention)</b> 기능이나 <b>광고 차단 확장 프로그램</b>, 또는 <b>시크릿 모드</b> 때문에 카카오맵이 차단되었을 수 있습니다.<br/>설정을 해제하고 새로고침 해주세요.
        </p>
      </div>
    )
  }

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
      {/* 맵 */}
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
              onClick={() => handleMarkerClick(sauna)}
            />
            {/* 호버 시 말풍선 노출 */}
            {hoveredMarkerId === sauna.id && (
              <CustomOverlayMap
                position={{ lat: sauna.latitude, lng: sauna.longitude }}
                yAnchor={2.2} 
                xAnchor={0.5}
                zIndex={10}
              >
                <div className="relative px-3 py-2 rounded-lg shadow-md border bg-white border-gray-200 text-gray-800 text-sm font-bold whitespace-nowrap -mt-1 cursor-default">
                  {sauna.name}
                  {/* 말풍선 꼬리 */}
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
