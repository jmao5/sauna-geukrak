'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { createSauna } from '@/app/actions/sauna.actions'
import { BiChevronLeft } from 'react-icons/bi'
import toast from 'react-hot-toast'
import { useKakaoReady } from '@/hooks/useKakaoReady'
import { useSaunaForm } from '@/hooks/useSaunaForm'
import KakaoSearchStep, { KakaoPlace } from '@/components/sauna/new/KakaoSearchStep'
import DetailFormStep from '@/components/sauna/new/DetailFormStep'



/* ────────────────────────────────────────────────────────────
   메인 클라이언트
──────────────────────────────────────────────────────────── */
type Step = 'search' | 'detail'

export default function SaunaNewClient() {
  const router = useRouter()
  const { user } = useUserStore()
  const [step, setStep] = useState<Step>('search')
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null)
  const {
    form, setForm, onChange,
    updateRoom, addRoom, removeRoom,
    updateBath, addBath, removeBath,
  } = useSaunaForm()

  const { isReady: kakaoReady } = useKakaoReady()

  useEffect(() => {
    if (!user) router.replace('/login?next=/saunas/new')
  }, [user, router])

  const handlePlaceSelect = (place: KakaoPlace) => {
    setSelectedPlace(place)
    setForm((prev) => ({
      ...prev,
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
      contact: place.phone,
    }))
    setStep('detail')
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('로그인이 필요합니다')
      if (!form.name || !form.address) throw new Error('시설명과 주소를 입력해주세요')
      const result = await createSauna(form)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: (created) => {
      toast.success(`${created.name} 등록 완료! 🎉`)
      router.push(`/saunas/${created.id}`)
    },
    onError: (error) => {
      toast.error(error.message || '등록 중 오류가 발생했습니다')
    },
  })

  if (!user) return null

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-bg-sub px-4 py-3 shadow-[0_1px_0_var(--border-main)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step === 'detail' ? setStep('search') : router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-bg-main active:scale-90"
          >
            <BiChevronLeft size={28} className="text-text-main" />
          </button>
          <div>
            <h1 className="text-base font-black text-text-main">
              {step === 'search' ? '사우나 검색' : '상세 정보 입력'}
            </h1>
            {step === 'detail' && selectedPlace && (
              <p className="text-[11px] text-text-sub truncate max-w-[220px]">
                {selectedPlace.place_name}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`h-2 w-6 rounded-full transition-colors ${step === 'search' ? 'bg-point' : 'bg-border-main'}`} />
            <div className={`h-2 w-6 rounded-full transition-colors ${step === 'detail' ? 'bg-point' : 'bg-border-main'}`} />
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div data-scroll-main className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4">
        {step === 'search' ? (
          <>
            {!kakaoReady && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-warning/30 border-t-warning flex-shrink-0" />
                <p className="text-xs font-semibold text-warning">지도 서비스 로드 중...</p>
              </div>
            )}
            <KakaoSearchStep isKakaoReady={kakaoReady} onSelect={handlePlaceSelect} />
          </>
        ) : (
          <DetailFormStep
            form={form}
            onChange={onChange}
            updateRoom={updateRoom}
            addRoom={addRoom}
            removeRoom={removeRoom}
            updateBath={updateBath}
            addBath={addBath}
            removeBath={removeBath}
            onSubmit={() => createMutation.mutate()}
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}
