import { createClient } from '@/lib/supabase/server'
import { SaunaDto } from '@/types/sauna'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MdArrowBack, MdLocationOn, MdInfoOutline, MdLocalDrink, MdOutlineTv } from 'react-icons/md'
import { FaFireAlt, FaTemperatureLow, FaBed, FaShower } from 'react-icons/fa'

export default async function SaunaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saunas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const sauna = data as SaunaDto

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. 상단 네비게이션 및 히어로 이미지 영역 */}
      <div className="relative h-64 bg-gray-300">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        {/* Placeholder for real image */}
        <img 
          src="https://images.unsplash.com/photo-1544365558-35aa4afcf11f?auto=format&fit=crop&q=80&w=1000" 
          alt={sauna.name} 
          className="w-full h-full object-cover"
        />
        
        {/* 뒤로 가기 버튼 */}
        <div className="absolute top-4 left-4 z-20">
          <Link href="/" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
            <MdArrowBack size={20} />
          </Link>
        </div>

        {/* 타이틀 정보 */}
        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{sauna.name}</h1>
          <p className="flex items-center text-sm text-gray-200">
            <MdLocationOn className="mr-1" /> {sauna.address}
          </p>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-4 -mt-6 relative z-30 space-y-4">
        
        {/* 2. 핵심 온도 및 액션 버튼 (이키타이 스펙 요약) */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <span className="text-xs font-bold text-orange-500 uppercase flex items-center justify-center gap-1 mb-1">
                <FaFireAlt /> 사우나
              </span>
              <div className="text-3xl font-black text-gray-900">
                {sauna.sauna_rooms?.length > 0 ? `${Math.max(...sauna.sauna_rooms.map(r => r.temp))}°` : '-'}
              </div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <span className="text-xs font-bold text-blue-500 uppercase flex items-center justify-center gap-1 mb-1">
                <FaTemperatureLow /> 냉탕
              </span>
              <div className="text-3xl font-black text-gray-900">
                {sauna.cold_baths?.length > 0 ? `${Math.min(...sauna.cold_baths.map(b => b.temp))}°` : '-'}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all transform hover:scale-105">
              + 이키타이
            </button>
            <button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-xl text-sm transition-all">
              ✏️ 사활 기록
            </button>
          </div>
        </div>

        {/* 3. 사우나실 상세 정보 */}
        {sauna.sauna_rooms?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaFireAlt className="text-orange-500" /> 사우나 상세 스펙
            </h2>
            <div className="space-y-3">
              {sauna.sauna_rooms.map((room, idx) => (
                <div key={idx} className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800 text-lg">{room.type} 사우나</span>
                    <span className="text-2xl font-black text-orange-600">{room.temp}°C</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <span className="bg-white px-2 py-1 rounded-md border border-orange-100">수용 인원: {room.capacity}명</span>
                    {room.has_tv && <span className="bg-white px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1"><MdOutlineTv /> TV 있음</span>}
                    {room.has_auto_loyly && <span className="bg-white px-2 py-1 rounded-md border border-orange-100">💦 오토 로우리</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. 부대 시설 및 어메니티 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaShower className="text-blue-500" /> 부대 시설 및 어메니티
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 외기욕 */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-gray-500 text-xs font-bold mb-1 flex items-center gap-1"><FaBed /> 외기욕 의자</div>
              <div className="text-gray-900 font-bold">{sauna.resting_area?.outdoor_seats || 0}개</div>
            </div>
            
            {/* 내기욕 */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-gray-500 text-xs font-bold mb-1">내기욕 의자</div>
              <div className="text-gray-900 font-bold">{sauna.resting_area?.indoor_seats || 0}개</div>
            </div>

            {/* 수건 */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-gray-500 text-xs font-bold mb-1">수건 제공</div>
              <div className="text-gray-900 font-bold">{sauna.amenities?.towel ? '✅ 무료 제공' : '❌ 개별 지참'}</div>
            </div>

            {/* 정수기 */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-gray-500 text-xs font-bold mb-1 flex items-center gap-1"><MdLocalDrink /> 정수기</div>
              <div className="text-gray-900 font-bold">{sauna.amenities?.water_dispenser ? '✅ 있음' : '❌ 없음'}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
