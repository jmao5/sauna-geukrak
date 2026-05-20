'use client'

import { BiCheck, BiPlus, BiX } from 'react-icons/bi'
import ImageUploader from '@/components/ui/ImageUploader'
import InstagramMediaUploader from '@/components/ui/InstagramMediaUploader'
import FloorPlanUploader from '@/components/ui/FloorPlanUploader'
import { FormState } from '@/hooks/useSaunaForm'
import { ColdBath, SaunaRoom } from '@/types/sauna'
import {
  GenderSelect,
  NumberInput,
  SectionCard,
  TextInput,
  Toggle,
} from '@/components/sauna/SaunaFormComponents'

export default function DetailFormStep({
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

      {/* ── 내부 모형도 ── */}
      <SectionCard title="내부 모형도" emoji="🗺️">
        <FloorPlanUploader
          images={form.floor_plan_images}
          onChange={(urls) => onChange({ floor_plan_images: urls })}
          maxCount={3}
        />
      </SectionCard>

      {/* ── 인스타그램 미디어 ── */}
      <SectionCard title="인스타그램" emoji="📸">
        <InstagramMediaUploader
          media={form.instagram_media}
          onChange={(media) => onChange({ instagram_media: media })}
          maxCount={10}
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
              <GenderSelect value={room.gender ?? 'male'} onChange={(v) => updateRoom(i, { gender: v })} />
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
              <GenderSelect value={(bath as any).gender ?? 'male'} onChange={(v) => updateBath(i, { gender: v } as any)} />
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
          <div className="grid grid-cols-2 gap-2">
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
