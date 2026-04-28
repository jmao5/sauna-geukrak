'use client'

import { useEffect, useState } from 'react'
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { m, AnimatePresence } from 'framer-motion'
import { SaunaSummaryDto } from '@/types/sauna'
import { MdClose, MdNavigation, MdInfoOutline } from 'react-icons/md'

export default function SaunaMap() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [center, setCenter] = useState({ lat: 37.545, lng: 126.84 }) // 기본 서울 강서구 중심
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [selectedSauna, setSelectedSauna] = useState<SaunaSummaryDto | null>(null)

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
    if (saunas && saunas.length > 0 && !selectedSauna) {
      setCenter({ lat: saunas[0].latitude, lng: saunas[0].longitude })
    }
  }, [saunas])

  // 마커 클릭 핸들러
  const handleMarkerClick = (sauna: SaunaSummaryDto) => {
    setSelectedSauna(sauna)
    setCenter({ lat: sauna.latitude, lng: sauna.longitude })
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
        onClick={() => setSelectedSauna(null)} // 빈 맵 클릭 시 닫기
      >
        {saunas.map((sauna) => (
          <div key={sauna.id}>
            <MapMarker
              position={{ lat: sauna.latitude, lng: sauna.longitude }}
              image={{
                src: '/favicon.ico',
                size: { width: selectedSauna?.id === sauna.id ? 40 : 32, height: selectedSauna?.id === sauna.id ? 40 : 32 },
                options: { offset: { x: selectedSauna?.id === sauna.id ? 20 : 16, y: selectedSauna?.id === sauna.id ? 40 : 32 } },
              }}
              onMouseOver={() => setHoveredMarkerId(sauna.id)}
              onMouseOut={() => setHoveredMarkerId(null)}
              onClick={() => handleMarkerClick(sauna)}
            />
            {/* 호버 시 혹은 선택 시 말풍선 노출 */}
            {(hoveredMarkerId === sauna.id || selectedSauna?.id === sauna.id) && (
              <CustomOverlayMap
                position={{ lat: sauna.latitude, lng: sauna.longitude }}
                yAnchor={selectedSauna?.id === sauna.id ? 2.5 : 2.6} 
                xAnchor={0.5}
                zIndex={10}
              >
                <div className={`relative px-3 py-2 rounded-lg shadow-md border text-sm font-bold whitespace-nowrap -mt-1 cursor-default ${selectedSauna?.id === sauna.id ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                  {sauna.name}
                  {/* 말풍선 꼬리 */}
                  <div className={`absolute w-2.5 h-2.5 border-b border-r transform rotate-45 left-1/2 -bottom-[6px] -translate-x-1/2 rounded-sm z-0 ${selectedSauna?.id === sauna.id ? 'bg-orange-500 border-orange-600' : 'bg-white border-gray-200'}`}></div>
                </div>
              </CustomOverlayMap>
            )}
          </div>
        ))}
      </Map>

      {/* 바텀 시트 (선택된 사우나 정보) */}
      <AnimatePresence>
        {selectedSauna && (
          <m.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
          >
            {/* 시트 헤더 */}
            <div className="flex justify-between items-start p-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedSauna.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{selectedSauna.address}</p>
              </div>
              <button 
                onClick={() => setSelectedSauna(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MdClose size={18} />
              </button>
            </div>
            
            {/* 시트 내용 */}
            <div className="p-4 space-y-4">
              {/* 스펙 요약 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded-md">사우나</span>
                  <div className="text-sm text-gray-700 flex gap-2">
                    {selectedSauna.sauna_rooms?.length > 0 
                      ? selectedSauna.sauna_rooms.map((r, i) => <span key={i}>{r.temp}°C {r.type}</span>)
                      : <span className="text-gray-400">정보 없음</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-md">냉 탕</span>
                  <div className="text-sm text-gray-700 flex gap-2">
                    {selectedSauna.cold_baths?.length > 0 
                      ? selectedSauna.cold_baths.map((b, i) => <span key={i}>{b.temp}°C</span>)
                      : <span className="text-gray-400">정보 없음</span>}
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors border border-gray-200">
                  <MdNavigation size={16} /> 길찾기
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  <MdInfoOutline size={16} /> 상세 정보
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
