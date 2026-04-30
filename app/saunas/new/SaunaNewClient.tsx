'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { api } from '@/lib/api-instance'
import { SaunaRoom, ColdBath } from '@/types/sauna'
import {
  BiChevronLeft, BiSearch, BiPlus, BiX, BiCheck,
} from 'react-icons/bi'
import toast from 'react-hot-toast'
import { useKakaoReady } from '@/hooks/useKakaoReady'
import ImageUploader from '@/components/ui/ImageUploader'
import { useSaunaForm, FormState } from '@/hooks/useSaunaForm'
import {
  SectionCard, Toggle, NumberInput, TextInput,
} from '@/components/sauna/SaunaFormComponents'

/* ────────────────────────────────────────────────────────────
   타입
──────────────────────────────────────────────────────────── */
interface KakaoPlace {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  x: string   // longitude
  y: string   // latitude
  phone: string
  category_group_name: string
}

type Step = 'search' | 'detail'

/* ────────────────────────────────────────────────────────────
   STEP 1: 카카오 장소 검색
──────────────────────────────────────────────────────────── */
function KakaoSearchStep({
  isKakaoReady,
  onSelect,
}: {
  isKakaoReady: boolean
  onSelect: (place: KakaoPlace) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [noResult, setNoResult] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return
    if (!isKakaoReady) {
      toast.error('카카오 지도 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setIsSearching(true)
    setNoResult(false)

    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(
      query + ' 사우나',
      (data: KakaoPlace[], status: string) => {
        setIsSearching(false)
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data.slice(0, 15))
          setNoResult(data.length === 0)
        } else {
          setResults([])
          setNoResult(true)
        }
      },
      { size: 15 }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-sauna/20 bg-sauna-bg p-4">
        <p className="text-xs font-bold text-sauna-text">
          🔍 카카오 장소 검색으로 사우나를 선택하면
        </p>
        <p className="mt-0.5 text-[11px] text-sauna-text/80">
          이름, 주소, 연락처 등 기본 정보가 자동으로 입력됩니다
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border-main bg-bg-main px-3">
          <BiSearch size={16} className="flex-shrink-0 text-text-sub" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="사우나 이름 또는 지역 입력"
            className="flex-1 bg-transparent py-3 text-sm text-text-main placeholder:text-text-muted outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}>
              <BiX size={16} className="text-text-sub" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim() || !isKakaoReady}
          className="rounded-xl bg-point px-4 py-2.5 text-sm font-black text-white transition active:scale-95 disabled:opacity-50"
        >
          {isSearching ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : '검색'}
        </button>
      </div>

      {noResult && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-bold text-text-sub">검색 결과가 없어요</p>
          <p className="text-xs text-text-muted">다른 이름이나 지역으로 검색해보세요</p>
        </div>
      )}

      <div className="space-y-2">
        {results.map((place) => (
          <button
            key={place.id}
            onClick={() => onSelect(place)}
            className="sauna-card flex w-full items-start gap-3 p-3.5 text-left"
          >
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sauna-bg">
              <span className="text-base">🔥</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-black text-text-main">{place.place_name}</p>
              <p className="truncate text-[11px] text-text-sub">
                {place.road_address_name || place.address_name}
              </p>
              {place.phone && (
                <p className="text-[11px] text-text-muted">{place.phone}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center">
              <BiChevronLeft size={18} className="rotate-180 text-text-muted" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   STEP 2: 상세 정보 입력 폼
──────────────────────────────────────────────────────────── */
function DetailFormStep({
  form,
  onChange,
  updateRoom,
  addRoom,
  removeRoom,
  updateBath,
  addBath,
  removeBath,
  onSubmit,
  isSubmitting,
}: {
  form: FormState
  onChange: (updated: Partial<FormState>) => void
  updateRoom: (i: number, patch: Partial<SaunaRoom>) => void
  addRoom: () => void
  removeRoom: (i: number) => void
  updateBath: (i: number, patch: Partial<ColdBath>) => void
  addBath: () => void
  removeBath: (i: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const SAUNA_TYPES = ['건식', '습식', '핀란드식', '한증막', '불가마']

  return (
    <div className="space-y-3">

      {/* ── 기본 정보 ── */}
      <SectionCard title="기본 정보" emoji="📍">
        <div className="space-y-3">
          <TextInput label="시설명" value={form.name} onChange={(v) => onChange({ name: v })} placeholder="사우나 이름" />
          <TextInput label="주소" value={form.address} onChange={(v) => onChange({ address: v })} placeholder="도로명 주소" />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="연락처" value={form.contact} onChange={(v) => onChange({ contact: v })} placeholder="02-1234-5678" />
            <TextInput label="영업시간" value={form.business_hours} onChange={(v) => onChange({ business_hours: v })} placeholder="24시간" />
          </div>
          <Toggle checked={form.parking} onChange={(v) => onChange({ parking: v })} label="주차 가능" />
        </div>
      </SectionCard>

      {/* ── 사진 업로드 ── */}
      <SectionCard title="사진" emoji="📷">
        <ImageUploader
          images={form.images}
          onChange={(urls) => onChange({ images: urls })}
          maxCount={5}
        />
      </SectionCard>

      {/* ── 사우나실 ── */}
      <SectionCard title="사우나실" emoji="🔥">
        <div className="space-y-3">
          {form.sauna_rooms.map((room, i) => (
            <div key={i} className="rounded-xl border border-sauna/20 bg-sauna-bg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sauna-text">사우나실 {i + 1}</span>
                {form.sauna_rooms.length > 1 && (
                  <button onClick={() => removeRoom(i)} className="rounded-full p-1 hover:bg-danger/10">
                    <BiX size={16} className="text-danger" />
                  </button>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold text-text-sub">종류</p>
                <div className="flex flex-wrap gap-1.5">
                  {SAUNA_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateRoom(i, { type: t })}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold transition active:scale-95 ${
                        room.type === t ? 'bg-sauna text-white' : 'border border-border-main bg-bg-card text-text-sub'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="온도 (°C)" value={room.temp} onChange={(v) => updateRoom(i, { temp: v })} min={40} unit="°C" />
                <NumberInput label="수용 인원" value={room.capacity} onChange={(v) => updateRoom(i, { capacity: v })} min={1} unit="명" />
              </div>
              <div className="space-y-2">
                <Toggle checked={room.has_auto_loyly} onChange={(v) => updateRoom(i, { has_auto_loyly: v })} label="💦 오토 로우리" />
                <Toggle checked={!!room.has_self_loyly} onChange={(v) => updateRoom(i, { has_self_loyly: v })} label="🌿 셀프 로우리" />
                <Toggle checked={room.has_tv} onChange={(v) => updateRoom(i, { has_tv: v })} label="📺 TV" />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addRoom}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sauna/40 py-3 text-xs font-bold text-sauna-text transition active:scale-[0.98]"
          >
            <BiPlus size={16} />
            사우나실 추가
          </button>
        </div>
      </SectionCard>

      {/* ── 냉탕 ── */}
      <SectionCard title="냉탕" emoji="❄️">
        <div className="space-y-3">
          {form.cold_baths.map((bath, i) => (
            <div key={i} className="rounded-xl border border-cold/20 bg-cold-bg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cold-text">냉탕 {i + 1}</span>
                {form.cold_baths.length > 1 && (
                  <button onClick={() => removeBath(i)} className="rounded-full p-1 hover:bg-danger/10">
                    <BiX size={16} className="text-danger" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="온도 (°C)" value={bath.temp} onChange={(v) => updateBath(i, { temp: v })} min={0} unit="°C" />
                <NumberInput label="수용 인원" value={bath.capacity} onChange={(v) => updateBath(i, { capacity: v })} min={1} unit="명" />
              </div>
              <NumberInput label="수심 (cm)" value={bath.depth} onChange={(v) => updateBath(i, { depth: v })} min={0} unit="cm" />
              <Toggle checked={bath.is_groundwater} onChange={(v) => updateBath(i, { is_groundwater: v })} label="🏔️ 지하수" />
            </div>
          ))}
          <button
            type="button"
            onClick={addBath}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cold/40 py-3 text-xs font-bold text-cold-text transition active:scale-[0.98]"
          >
            <BiPlus size={16} />
            냉탕 추가
          </button>
        </div>
      </SectionCard>

      {/* ── 휴식 공간 ── */}
      <SectionCard title="휴식 공간" emoji="🌿">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="외기욕 의자" value={form.resting_area.outdoor_seats} onChange={(v) => onChange({ resting_area: { ...form.resting_area, outdoor_seats: v } })} unit="개" />
          <NumberInput label="실내 의자" value={form.resting_area.indoor_seats} onChange={(v) => onChange({ resting_area: { ...form.resting_area, indoor_seats: v } })} unit="개" />
          <NumberInput label="인피니티 의자" value={form.resting_area.infinity_chairs} onChange={(v) => onChange({ resting_area: { ...form.resting_area, infinity_chairs: v } })} unit="개" />
          <NumberInput label="데크 의자" value={form.resting_area.deck_chairs} onChange={(v) => onChange({ resting_area: { ...form.resting_area, deck_chairs: v } })} unit="개" />
        </div>
      </SectionCard>

      {/* ── 어메니티 ── */}
      <SectionCard title="어메니티" emoji="🛁">
        <div className="space-y-2">
          {([
            ['towel', '🧴 수건 무료 제공'],
            ['shampoo', '🧴 샴푸 비치'],
            ['body_wash', '🛁 바디워시 비치'],
            ['hair_dryer', '💨 드라이어 비치'],
            ['water_dispenser', '💧 정수기 비치'],
          ] as [keyof typeof form.amenities, string][]).map(([key, label]) => (
            <Toggle
              key={key}
              checked={!!form.amenities[key]}
              onChange={(v) => onChange({ amenities: { ...form.amenities, [key]: v } })}
              label={label}
            />
          ))}
        </div>
      </SectionCard>

      {/* ── 이용 규칙 ── */}
      <SectionCard title="이용 규칙" emoji="📋">
        <div className="space-y-2">
          <Toggle checked={form.rules.male_allowed} onChange={(v) => onChange({ rules: { ...form.rules, male_allowed: v } })} label="👨 남성 이용 가능" />
          <Toggle checked={form.rules.female_allowed} onChange={(v) => onChange({ rules: { ...form.rules, female_allowed: v } })} label="👩 여성 이용 가능" />
          <Toggle checked={form.rules.tattoo_allowed} onChange={(v) => onChange({ rules: { ...form.rules, tattoo_allowed: v } })} label="🖋️ 타투 이용 가능" />
        </div>
      </SectionCard>

      {/* ── 한국 특화 ── */}
      <SectionCard title="한국 특화 정보" emoji="🇰🇷">
        <div className="space-y-3">
          <Toggle checked={form.kr_specific.has_jjimjilbang} onChange={(v) => onChange({ kr_specific: { ...form.kr_specific, has_jjimjilbang: v } })} label="🧖 찜질방 있음" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold text-text-sub">때밀이 요금 (남)</label>
              <input type="number" value={form.kr_specific.sesin_price_male || ''} onChange={(e) => onChange({ kr_specific: { ...form.kr_specific, sesin_price_male: Number(e.target.value) } })} placeholder="0" className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main outline-none focus:border-point" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold text-text-sub">때밀이 요금 (여)</label>
              <input type="number" value={form.kr_specific.sesin_price_female || ''} onChange={(e) => onChange({ kr_specific: { ...form.kr_specific, sesin_price_female: Number(e.target.value) } })} placeholder="0" className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main outline-none focus:border-point" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 요금 ── */}
      <SectionCard title="이용 요금" emoji="💳">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-text-sub">성인 (낮)</label>
            <input type="number" value={form.pricing.adult_day || ''} onChange={(e) => onChange({ pricing: { ...form.pricing, adult_day: Number(e.target.value) } })} placeholder="0" className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main outline-none focus:border-point" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-text-sub">성인 (야간)</label>
            <input type="number" value={form.pricing.adult_night || ''} onChange={(e) => onChange({ pricing: { ...form.pricing, adult_night: Number(e.target.value) } })} placeholder="0" className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main outline-none focus:border-point" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold text-text-sub">어린이</label>
            <input type="number" value={form.pricing.child || ''} onChange={(e) => onChange({ pricing: { ...form.pricing, child: Number(e.target.value) } })} placeholder="0" className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main outline-none focus:border-point" />
          </div>
        </div>
      </SectionCard>

      {/* ── 등록 버튼 ── */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !form.name || !form.address}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-point py-4 text-sm font-black text-white shadow-md transition active:scale-[0.97] disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            <BiCheck size={20} />
            사우나 등록하기
          </>
        )}
      </button>

      <div className="h-4" />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   메인 클라이언트
──────────────────────────────────────────────────────────── */
export default function SaunaNewClient() {
  const router = useRouter()
  const { user, isAdmin } = useUserStore()
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
    else if (!isAdmin()) {
      toast.error('관리자만 사우나를 등록할 수 있습니다.')
      router.replace('/')
    }
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
      if (!user) throw new Error('not_logged_in')
      if (!form.name || !form.address) throw new Error('missing_fields')
      return await api.saunas.create(form)
    },
    onSuccess: (created) => {
      toast.success(`${created.name} 등록 완료! 🎉`)
      router.push(`/saunas/${created.id}`)
    },
    onError: (error) => {
      if (error.message === 'not_logged_in') toast.error('로그인이 필요합니다')
      else if (error.message === 'missing_fields') toast.error('시설명과 주소를 입력해주세요')
      else toast.error(error.message || '등록 중 오류가 발생했습니다')
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
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4">
        {step === 'search' ? (
          <>
            {!kakaoReady && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-warning/30 border-t-warning flex-shrink-0" />
                <p className="text-xs font-semibold text-warning">카카오 지도 서비스 로드 중...</p>
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
