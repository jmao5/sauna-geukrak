'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/stores/userStore'
import { api } from '@/lib/api-instance'
import { SaunaDto, SaunaRoom, ColdBath } from '@/types/sauna'
import { SectionCard, Toggle, NumberInput, TextInput } from '@/components/sauna/SaunaFormComponents'
import ImageUploader from '@/components/ui/ImageUploader'
import { BiChevronLeft, BiPlus, BiX, BiCheck } from 'react-icons/bi'
import toast from 'react-hot-toast'

type FormState = Omit<SaunaDto, 'id' | 'created_at'>

const defaultSaunaRoom = (): SaunaRoom => ({
  type: '건식', temp: 85, capacity: 10,
  has_tv: false, has_auto_loyly: false, has_self_loyly: false,
})
const defaultColdBath = (): ColdBath => ({
  temp: 15, capacity: 4, is_groundwater: false, depth: 80,
})

function EditSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="h-14 bg-bg-sub border-b border-border-main" />
      <div className="flex-1 p-4 space-y-3">
        <div className="h-40 rounded-2xl bg-bg-card" />
        <div className="h-36 rounded-2xl bg-bg-card" />
        <div className="h-52 rounded-2xl bg-bg-card" />
        <div className="h-40 rounded-2xl bg-bg-card" />
      </div>
    </div>
  )
}

export default function SaunaEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { user } = useUserStore()
  const queryClient = useQueryClient()

  // SSR prefetch 캐시 구독
  const { data: sauna, isLoading, isError } = useQuery<SaunaDto>({
    queryKey: ['sauna', id],
    queryFn: () => api.saunas.getById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  })

  const [form, setForm] = useState<FormState | null>(null)

  // sauna 로드 완료 시 폼 초기화 (한 번만)
  useEffect(() => {
    if (sauna && !form) {
      setForm({
        name: sauna.name,
        address: sauna.address,
        latitude: sauna.latitude,
        longitude: sauna.longitude,
        sauna_rooms: sauna.sauna_rooms?.length ? sauna.sauna_rooms : [defaultSaunaRoom()],
        cold_baths: sauna.cold_baths?.length ? sauna.cold_baths : [defaultColdBath()],
        resting_area: sauna.resting_area ?? { indoor_seats: 0, outdoor_seats: 0, infinity_chairs: 0, deck_chairs: 0 },
        amenities: sauna.amenities ?? { towel: false, shampoo: false, body_wash: false, hair_dryer: false, water_dispenser: false },
        rules: sauna.rules ?? { tattoo_allowed: false, female_allowed: true, male_allowed: true },
        kr_specific: sauna.kr_specific ?? { has_jjimjilbang: false, sesin_price_male: 0, sesin_price_female: 0, food: [] },
        pricing: sauna.pricing ?? { adult_day: 0, adult_night: 0, child: 0 },
        business_hours: sauna.business_hours ?? '',
        contact: sauna.contact ?? '',
        parking: sauna.parking ?? false,
        images: sauna.images ?? [],
      })
    }
  }, [sauna, form])

  // 비로그인 차단
  useEffect(() => {
    if (!user) router.replace(`/login?next=/saunas/${id}/edit`)
  }, [user, router, id])

  const mutation = useMutation({
    mutationFn: (payload: FormState) => {
      if (!user) throw new Error('로그인이 필요합니다')
      return api.saunas.update(id, payload)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['sauna', id], updated)
      queryClient.invalidateQueries({ queryKey: ['saunas'] })
      toast.success('수정 완료! ✅')
      router.push(`/saunas/${id}`)
    },
    onError: (e: Error) => {
      toast.error(e.message || '수정 중 오류가 발생했습니다')
    },
  })

  const onChange = (patch: Partial<FormState>) =>
    setForm((prev) => prev ? { ...prev, ...patch } : prev)

  /* ── 사우나실 helpers ── */
  const updateRoom = (i: number, patch: Partial<SaunaRoom>) => {
    if (!form) return
    const rooms = [...form.sauna_rooms]
    rooms[i] = { ...rooms[i], ...patch }
    onChange({ sauna_rooms: rooms })
  }
  const addRoom = () => form && onChange({ sauna_rooms: [...form.sauna_rooms, defaultSaunaRoom()] })
  const removeRoom = (i: number) => form && onChange({ sauna_rooms: form.sauna_rooms.filter((_, idx) => idx !== i) })

  /* ── 냉탕 helpers ── */
  const updateBath = (i: number, patch: Partial<ColdBath>) => {
    if (!form) return
    const baths = [...form.cold_baths]
    baths[i] = { ...baths[i], ...patch }
    onChange({ cold_baths: baths })
  }
  const addBath = () => form && onChange({ cold_baths: [...form.cold_baths, defaultColdBath()] })
  const removeBath = (i: number) => form && onChange({ cold_baths: form.cold_baths.filter((_, idx) => idx !== i) })

  const handleSubmit = () => {
    if (!form) return
    if (!form.name || !form.address) { toast.error('시설명과 주소를 입력해주세요'); return }
    mutation.mutate(form)
  }

  if (!user) return null
  if (isLoading || !form) return <EditSkeleton />
  if (isError) return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-4xl">😢</span>
      <p className="font-bold text-text-main">사우나 정보를 불러올 수 없어요</p>
      <button onClick={() => router.back()} className="rounded-full bg-point px-5 py-2.5 text-sm font-bold text-white">돌아가기</button>
    </div>
  )

  const SAUNA_TYPES = ['건식', '습식', '핀란드식', '한증막', '불가마']

  return (
    <div className="flex h-full flex-col">

      {/* 헤더 */}
      <div className="flex-shrink-0 bg-bg-sub px-4 py-3 shadow-[0_1px_0_var(--border-main)]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-bg-main active:scale-90">
            <BiChevronLeft size={28} className="text-text-main" />
          </button>
          <div>
            <h1 className="text-base font-black text-text-main">사우나 수정</h1>
            <p className="text-[11px] text-text-sub truncate max-w-[220px]">{sauna?.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-point">수정 중</span>
            <div className="h-1.5 w-1.5 rounded-full bg-point animate-pulse" />
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 space-y-3">

        {/* 기본 정보 */}
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

        {/* 사진 */}
        <SectionCard title="사진" emoji="📷">
          <ImageUploader
            images={form.images}
            onChange={(urls) => onChange({ images: urls })}
            saunaId={id}
            maxCount={5}
          />
        </SectionCard>

        {/* 사우나실 */}
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
                      <button key={t} type="button" onClick={() => updateRoom(i, { type: t })}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold transition active:scale-95 ${
                          room.type === t ? 'bg-sauna text-white' : 'border border-border-main bg-bg-card text-text-sub'
                        }`}>
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
            <button type="button" onClick={addRoom}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sauna/40 py-3 text-xs font-bold text-sauna-text transition active:scale-[0.98]">
              <BiPlus size={16} />사우나실 추가
            </button>
          </div>
        </SectionCard>

        {/* 냉탕 */}
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
            <button type="button" onClick={addBath}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cold/40 py-3 text-xs font-bold text-cold-text transition active:scale-[0.98]">
              <BiPlus size={16} />냉탕 추가
            </button>
          </div>
        </SectionCard>

        {/* 휴식 공간 */}
        <SectionCard title="휴식 공간" emoji="🌿">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="외기욕 의자" value={form.resting_area.outdoor_seats} onChange={(v) => onChange({ resting_area: { ...form.resting_area, outdoor_seats: v } })} unit="개" />
            <NumberInput label="실내 의자" value={form.resting_area.indoor_seats} onChange={(v) => onChange({ resting_area: { ...form.resting_area, indoor_seats: v } })} unit="개" />
            <NumberInput label="인피니티 의자" value={form.resting_area.infinity_chairs} onChange={(v) => onChange({ resting_area: { ...form.resting_area, infinity_chairs: v } })} unit="개" />
            <NumberInput label="데크 의자" value={form.resting_area.deck_chairs} onChange={(v) => onChange({ resting_area: { ...form.resting_area, deck_chairs: v } })} unit="개" />
          </div>
        </SectionCard>

        {/* 어메니티 */}
        <SectionCard title="어메니티" emoji="🛁">
          <div className="space-y-2">
            {([
              ['towel', '🧴 수건 무료 제공'],
              ['shampoo', '🧴 샴푸 비치'],
              ['body_wash', '🛁 바디워시 비치'],
              ['hair_dryer', '💨 드라이어 비치'],
              ['water_dispenser', '💧 정수기 비치'],
            ] as [keyof typeof form.amenities, string][]).map(([key, label]) => (
              <Toggle key={key} checked={!!form.amenities[key]}
                onChange={(v) => onChange({ amenities: { ...form.amenities, [key]: v } })}
                label={label} />
            ))}
          </div>
        </SectionCard>

        {/* 이용 규칙 */}
        <SectionCard title="이용 규칙" emoji="📋">
          <div className="space-y-2">
            <Toggle checked={form.rules.male_allowed} onChange={(v) => onChange({ rules: { ...form.rules, male_allowed: v } })} label="👨 남성 이용 가능" />
            <Toggle checked={form.rules.female_allowed} onChange={(v) => onChange({ rules: { ...form.rules, female_allowed: v } })} label="👩 여성 이용 가능" />
            <Toggle checked={form.rules.tattoo_allowed} onChange={(v) => onChange({ rules: { ...form.rules, tattoo_allowed: v } })} label="🖋️ 타투 이용 가능" />
          </div>
        </SectionCard>

        {/* 한국 특화 */}
        <SectionCard title="한국 특화 정보" emoji="🇰🇷">
          <div className="space-y-3">
            <Toggle checked={form.kr_specific.has_jjimjilbang} onChange={(v) => onChange({ kr_specific: { ...form.kr_specific, has_jjimjilbang: v } })} label="🧖 찜질방 있음" />
            <div className="grid grid-cols-2 gap-3">
              {(['sesin_price_male', 'sesin_price_female'] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-[10px] font-bold text-text-sub">
                    {key === 'sesin_price_male' ? '때밀이 요금 (남)' : '때밀이 요금 (여)'}
                  </label>
                  <input type="number" value={form.kr_specific[key] || ''} placeholder="0"
                    onChange={(e) => onChange({ kr_specific: { ...form.kr_specific, [key]: Number(e.target.value) } })}
                    className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main outline-none focus:border-point" />
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* 요금 */}
        <SectionCard title="이용 요금" emoji="💳">
          <div className="grid grid-cols-3 gap-3">
            {([
              ['adult_day', '성인 (낮)'],
              ['adult_night', '성인 (야간)'],
              ['child', '어린이'],
            ] as [keyof typeof form.pricing, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-[10px] font-bold text-text-sub">{label}</label>
                <input type="number" value={form.pricing[key] || ''} placeholder="0"
                  onChange={(e) => onChange({ pricing: { ...form.pricing, [key]: Number(e.target.value) } })}
                  className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main outline-none focus:border-point" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 제출 */}
        <button type="button" onClick={handleSubmit}
          disabled={mutation.isPending || !form.name || !form.address}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-point py-4 text-sm font-black text-white shadow-md transition active:scale-[0.97] disabled:opacity-50">
          {mutation.isPending
            ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <><BiCheck size={20} />수정 완료</>
          }
        </button>

        <div className="h-4" />
      </div>
    </div>
  )
}
