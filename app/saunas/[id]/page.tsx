'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MdArrowBack, MdLocationOn, MdInfoOutline, MdLocalDrink, MdOutlineTv } from 'react-icons/md'
import { FaFireAlt, FaTemperatureLow, FaBed, FaShower } from 'react-icons/fa'

export default function SaunaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: sauna, isLoading, isError } = useQuery({
    queryKey: ['sauna', id],
    queryFn: () => api.saunas.getById(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-gray-500 font-medium">사우나 정보를 불러오는 중입니다...</p>
      </div>
    )
  }

  if (isError || !sauna) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center gap-4">
        <p className="text-red-500 font-medium">사우나 정보를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-200 rounded-lg font-bold">
          메인으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* 1. 상단 네비게이션 및 히어로 이미지 영역 */}
      <div className="relative h-72 bg-gray-300">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
        {/* Placeholder for real image */}
        <img 
          src="https://images.unsplash.com/photo-1544365558-35aa4afcf11f?auto=format&fit=crop&q=80&w=1000" 
          alt={sauna.name} 
          className="w-full h-full object-cover"
        />
        
        {/* 뒤로 가기 버튼 */}
        <div className="absolute top-4 left-4 z-20">
          <Link href="/" className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition">
            <MdArrowBack size={20} />
          </Link>
        </div>

        {/* 타이틀 정보 */}
        <div className="absolute bottom-12 left-0 right-0 px-5 z-20 text-white max-w-screen-md mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">{sauna.name}</h1>
          <p className="flex items-center text-sm text-gray-200">
            <MdLocationOn className="mr-1 flex-shrink-0" size={16} /> 
            <span className="truncate">{sauna.address}</span>
          </p>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-4 -mt-8 relative z-30 space-y-4">
        
        {/* 2. 핵심 온도 및 액션 버튼 (이키타이 스펙 요약) */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 flex flex-col md:flex-row gap-6 justify-between">
          
          <div className="flex gap-8 items-center justify-center md:justify-start flex-1">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex items-center gap-1 mb-2">
                <FaFireAlt /> 사우나
              </span>
              <div className="text-4xl font-black text-gray-900">
                {sauna.sauna_rooms?.length > 0 ? `${Math.max(...sauna.sauna_rooms.map(r => r.temp))}°` : '-'}
              </div>
            </div>
            
            <div className="h-12 w-px bg-gray-200" />
            
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center gap-1 mb-2">
                <FaTemperatureLow /> 냉탕
              </span>
              <div className="text-4xl font-black text-gray-900">
                {sauna.cold_baths?.length > 0 ? `${Math.min(...sauna.cold_baths.map(b => b.temp))}°` : '-'}
              </div>
            </div>
          </div>
          
          <div className="flex flex-row md:flex-col gap-3 md:w-48">
            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
              <FaFireAlt /> 이키타이
            </button>
            <button className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
              ✏️ 사활 기록
            </button>
          </div>
        </div>

        {/* 3. 사우나실 상세 정보 */}
        {sauna.sauna_rooms?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <FaFireAlt size={14} />
              </span>
              사우나 상세 스펙
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sauna.sauna_rooms.map((room, idx) => (
                <div key={idx} className="bg-orange-50/50 rounded-xl p-5 border border-orange-100/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-800 text-lg">{room.type} 사우나</span>
                    <span className="text-2xl font-black text-orange-600">{room.temp}°C</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 font-medium">
                    <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">수용 인원: {room.capacity}명</span>
                    {room.has_tv && <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5"><MdOutlineTv size={16} className="text-gray-400" /> TV 있음</span>}
                    {room.has_auto_loyly && <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">💦 오토 로우리</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. 부대 시설 및 어메니티 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FaShower size={14} />
            </span>
            부대 시설 및 어메니티
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 외기욕 */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="text-gray-500 text-xs font-bold flex items-center gap-1"><FaBed size={14} /> 외기욕 의자</div>
              <div className="text-gray-900 font-black text-lg">{sauna.resting_area?.outdoor_seats || 0}개</div>
            </div>
            
            {/* 내기욕 */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="text-gray-500 text-xs font-bold">내기욕 의자</div>
              <div className="text-gray-900 font-black text-lg">{sauna.resting_area?.indoor_seats || 0}개</div>
            </div>

            {/* 수건 */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="text-gray-500 text-xs font-bold">수건 제공</div>
              <div className="text-gray-900 font-bold text-sm">{sauna.amenities?.towel ? '✅ 무료 제공' : '❌ 개별 지참'}</div>
            </div>

            {/* 정수기 */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center gap-2">
              <div className="text-gray-500 text-xs font-bold flex items-center gap-1"><MdLocalDrink size={14} /> 정수기</div>
              <div className="text-gray-900 font-bold text-sm">{sauna.amenities?.water_dispenser ? '✅ 있음' : '❌ 없음'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
