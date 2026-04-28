'use client'

import { useEffect, useState } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { createClient } from '@/lib/supabase/client'

// 사우나 데이터 타입 정의
interface Sauna {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  sauna_rooms: any[]
  cold_baths: any[]
}

export default function SaunaMap() {
  const [saunas, setSaunas] = useState<Sauna[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [center, setCenter] = useState({ lat: 37.545, lng: 126.84 }) // 기본 서울 강서구 중심
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)

  useEffect(() => {
    // 1. 카카오맵 스크립트 로드 확인
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

  useEffect(() => {
    // 2. Supabase에서 사우나 데이터 가져오기
    const fetchSaunas = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('saunas')
        .select('id, name, address, latitude, longitude, sauna_rooms, cold_baths')

      if (data) {
        setSaunas(data)
        // 첫 번째 데이터 위치로 지도 중심 이동
        if (data.length > 0) {
          setCenter({ lat: data[0].latitude, lng: data[0].longitude })
        }
      } else if (error) {
        console.error('Error fetching saunas:', error)
      }
    }

    fetchSaunas()
  }, [])

  if (!isLoaded) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-gray-500 font-medium">지도를 불러오는 중입니다...</p>
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
