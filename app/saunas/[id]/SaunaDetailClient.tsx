'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useRouter } from 'next/navigation'
import { SaunaDto } from '@/types/sauna'
import { BiChevronLeft, BiShare, BiBookmark, BiMap, BiPhone, BiTime } from 'react-icons/bi'
import { MdOutlineLocalParking } from 'react-icons/md'

// ── 온도 히어로 ──────────────────────────────────────────────
function TempHero({ sauna }: { sauna: SaunaDto }) {
  const maxSaunaTemp = sauna.sauna_rooms?.length > 0
    ? Math.max(...sauna.sauna_rooms.map((r) => r.temp))
    : null
  const minColdTemp = sauna.cold_baths?.length > 0
    ? Math.min(...sauna.cold_baths.map((b) => b.temp))
    : null

  return (
    <div className="flex items-stretch bg-bg-card border-b border-border-subtle">
      {/* 사우나 온도 */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 px-4">
        <p className="mb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Sauna</p>
        {maxSaunaTemp !== null ? (
          <>
            <div className="temp-display text-6xl text-sauna leading-none">{maxSaunaTemp}</div>
            <p className="mt-1 text-[13px] font-bold text-sauna/60">°C</p>
          </>
        ) : (
          <div className="temp-display text-6xl text-text-muted/30 leading-none">—</div>
        )}
        {sauna.sauna_rooms?.length > 0 && (
          <p className="mt-2 text-[10px] text-text-muted">
            {sauna.sauna_rooms.map(r => r.type).join(' · ')}
          </p>
        )}
      </div>

      {/* 구분선 */}
      <div className="w-px bg-border-subtle my-6" />

      {/* 냉탕 온도 */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 px-4">
        <p className="mb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Cold Bath</p>
        {minColdTemp !== null ? (
          <>
            <div className="temp-display text-6xl text-cold leading-none">{minColdTemp}</div>
            <p className="mt-1 text-[13px] font-bold text-cold/60">°C</p>
          </>
        ) : (
          <div className="temp-display text-6xl text-text-muted/30 leading-none">—</div>
        )}
        {sauna.cold_baths?.some(b => b.is_groundwater) && (
          <p className="mt-2 text-[10px] text-text-muted">🏔️ 지하수</p>
        )}
      </div>
    </div>
  )
}

// ── 섹션 ─────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 py-3 bg-bg-main border-b border-border-subtle">
        <p className="text-[10px] font-black tracking-widest text-text-muted uppercase">{title}</p>
      </div>
      <div className="bg-bg-card">{children}</div>
    </div>
  )
}

// ── 인포 행 ──────────────────────────────────────────────────
function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle last:border-0">
      <p className="text-[12px] text-text-sub">{label}</p>
      <p className={`text-[12px] font-bold ${accent ? 'text-point' : 'text-text-main'}`}>{value}</p>
    </div>
  )
}

// ── 어메니티 그리드 ──────────────────────────────────────────
function AmenityGrid({ amenities }: { amenities: SaunaDto['amenities'] }) {
  const items = [
    { label: '수건', ok: amenities.towel },
    { label: '샴푸', ok: amenities.shampoo },
    { label: '바디워시', ok: amenities.body_wash },
    { label: '드라이어', ok: amenities.hair_dryer },
    ...(amenities.water_dispenser !== undefined ? [{ label: '정수기', ok: amenities.water_dispenser }] : []),
  ]
  return (
    <div className="grid grid-cols-4 gap-0 divide-x divide-border-subtle">
      {items.map(({ label, ok }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 py-4 px-2">
          <span className="text-lg">{ok ? '✓' : '✕'}</span>
          <span className={`text-[10px] font-bold ${ok ? 'text-text-sub' : 'text-text-muted/40'}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── 스켈레톤 ────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="h-56 bg-bg-main" />
      <div className="h-32 bg-bg-card" />
      <div className="h-4 bg-bg-main" />
      <div className="flex-1 bg-bg-card" />
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────────
export function SaunaDetailClient({ id }: { id: string }) {
  const router = useRouter()

  const { data: sauna, isLoading, isError } = useQuery<SaunaDto>({
    queryKey: ['sauna', id],
    queryFn: () => api.saunas.getById(id),
    enabled: !!id,
  })

  if (isLoading) return <DetailSkeleton />

  if (isError || !sauna) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg-main p-6 text-center">
        <span className="text-4xl">😢</span>
        <p className="font-bold text-text-main">사우나 정보를 찾을 수 없어요</p>
        <button
          onClick={() => router.back()}
          className="rounded-full bg-point px-5 py-2.5 text-sm font-bold text-white"
        >
          돌아가기
        </button>
      </div>
    )
  }

  const thumbnail = sauna.images?.[0]

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ── 히어로 이미지 ── */}
        <div className="relative h-56 w-full flex-shrink-0">
          {thumbnail ? (
            <img src={thumbnail} alt={sauna.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg via-bg-main to-cold-bg">
              <span className="text-6xl opacity-10">🧖</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* 상단 버튼 */}
          <div className="absolute left-4 top-4 z-10">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90"
            >
              <BiChevronLeft size={22} />
            </button>
          </div>
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
              <BiBookmark size={16} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
              <BiShare size={16} />
            </button>
          </div>

          {/* 이름/주소 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h1 className="text-[22px] font-black text-white leading-tight">{sauna.name}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
              <BiMap size={11} />
              {sauna.address}
            </p>
          </div>
        </div>

        {/* ── 온도 히어로 ── */}
        <TempHero sauna={sauna} />

        {/* ── 액션 버튼 ── */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-bg-card border-b border-border-subtle">
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-point py-3 text-[13px] font-black text-white transition active:scale-[0.97]">
            ❤️ 극락가고싶다
          </button>
          <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border-main bg-bg-main py-3 text-[13px] font-black text-text-main transition active:scale-[0.97]">
            ✏️ 사활 기록
          </button>
        </div>

        {/* ── 태그 ── */}
        {sauna.rules && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3 bg-bg-card border-b border-border-subtle">
            {sauna.rules.tattoo_allowed && (
              <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">🖋️ 타투OK</span>
            )}
            {sauna.rules.female_allowed && (
              <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">👩 여성가능</span>
            )}
            {sauna.rules.male_allowed && (
              <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">👨 남성가능</span>
            )}
            {sauna.parking && (
              <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">🅿️ 주차가능</span>
            )}
            {sauna.kr_specific?.has_jjimjilbang && (
              <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">🧖 찜질방</span>
            )}
          </div>
        )}

        <div className="section-divider" />

        {/* ── 사우나실 ── */}
        {sauna.sauna_rooms?.length > 0 && (
          <Section title="Sauna Rooms">
            {sauna.sauna_rooms.map((room, i) => (
              <div key={i} className="border-b border-border-subtle last:border-0">
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-[13px] font-black text-text-main">{room.type} 사우나</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[10px] text-text-muted">👥 {room.capacity}인</span>
                      {room.has_auto_loyly && <span className="text-[10px] text-text-muted">· 💦 오토 로우리</span>}
                      {room.has_self_loyly && <span className="text-[10px] text-text-muted">· 🌿 셀프 로우리</span>}
                      {room.has_tv && <span className="text-[10px] text-text-muted">· 📺 TV</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="temp-display text-3xl text-sauna">{room.temp}</span>
                    <span className="text-[13px] font-bold text-sauna/50">°C</span>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* ── 냉탕 ── */}
        {sauna.cold_baths?.length > 0 && (
          <Section title="Cold Baths">
            {sauna.cold_baths.map((bath, i) => (
              <div key={i} className="border-b border-border-subtle last:border-0">
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-[13px] font-black text-text-main">냉탕 {i + 1}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[10px] text-text-muted">👥 {bath.capacity}인</span>
                      {bath.depth > 0 && <span className="text-[10px] text-text-muted">· 수심 {bath.depth}cm</span>}
                      {bath.is_groundwater && <span className="text-[10px] text-text-muted">· 🏔️ 지하수</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="temp-display text-3xl text-cold">{bath.temp}</span>
                    <span className="text-[13px] font-bold text-cold/50">°C</span>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* ── 휴식 공간 ── */}
        {sauna.resting_area && (
          <Section title="Resting Area">
            {sauna.resting_area.outdoor_seats > 0 && (
              <InfoRow label="외기욕 의자" value={`${sauna.resting_area.outdoor_seats}개`} />
            )}
            {sauna.resting_area.indoor_seats > 0 && (
              <InfoRow label="실내 의자" value={`${sauna.resting_area.indoor_seats}개`} />
            )}
            {(sauna.resting_area.infinity_chairs ?? 0) > 0 && (
              <InfoRow label="인피니티 의자" value={`${sauna.resting_area.infinity_chairs}개`} />
            )}
            {(sauna.resting_area.deck_chairs ?? 0) > 0 && (
              <InfoRow label="데크 의자" value={`${sauna.resting_area.deck_chairs}개`} />
            )}
          </Section>
        )}

        {/* ── 어메니티 ── */}
        {sauna.amenities && (
          <Section title="Amenities">
            <AmenityGrid amenities={sauna.amenities} />
          </Section>
        )}

        {/* ── 요금 ── */}
        {sauna.pricing && (
          <Section title="Pricing">
            {sauna.pricing.adult_day > 0 && (
              <InfoRow label="성인 (낮)" value={`${sauna.pricing.adult_day.toLocaleString()}원`} />
            )}
            {sauna.pricing.adult_night > 0 && (
              <InfoRow label="성인 (야간)" value={`${sauna.pricing.adult_night.toLocaleString()}원`} />
            )}
            {sauna.pricing.child > 0 && (
              <InfoRow label="어린이" value={`${sauna.pricing.child.toLocaleString()}원`} />
            )}
          </Section>
        )}

        {/* ── 한국 특화 ── */}
        {sauna.kr_specific && (
          <Section title="Korean Special">
            {sauna.kr_specific.sesin_price_male > 0 && (
              <InfoRow label="때밀이 (남)" value={`${sauna.kr_specific.sesin_price_male.toLocaleString()}원`} />
            )}
            {sauna.kr_specific.sesin_price_female > 0 && (
              <InfoRow label="때밀이 (여)" value={`${sauna.kr_specific.sesin_price_female.toLocaleString()}원`} />
            )}
            {sauna.kr_specific.food?.length > 0 && (
              <InfoRow label="식음료" value={sauna.kr_specific.food.join(', ')} />
            )}
          </Section>
        )}

        {/* ── 이용 정보 ── */}
        <Section title="Info">
          {sauna.business_hours && (
            <InfoRow label="운영 시간" value={sauna.business_hours} />
          )}
          {sauna.contact && (
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
              <p className="text-[12px] text-text-sub">연락처</p>
              <a href={`tel:${sauna.contact}`} className="text-[12px] font-bold text-point">
                {sauna.contact}
              </a>
            </div>
          )}
          <InfoRow label="주차" value={sauna.parking ? '가능' : '불가'} />
        </Section>

        <div className="h-8" />
      </div>
    </div>
  )
}
