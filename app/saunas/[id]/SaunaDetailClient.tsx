'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useRouter } from 'next/navigation'
import { SaunaDto } from '@/types/sauna'
import { useUserStore } from '@/stores/userStore'
import {
  BiChevronLeft, BiShare, BiBookmark, BiMap, BiX, BiStar,
} from 'react-icons/bi'
import toast from 'react-hot-toast'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'

// ── 온도 히어로 ──────────────────────────────────────────────
function TempHero({ sauna }: { sauna: SaunaDto }) {
  const maxSaunaTemp = sauna.sauna_rooms?.length > 0
    ? Math.max(...sauna.sauna_rooms.map((r) => r.temp)) : null
  const minColdTemp = sauna.cold_baths?.length > 0
    ? Math.min(...sauna.cold_baths.map((b) => b.temp)) : null

  return (
    <div className="flex items-stretch bg-bg-card border-b border-border-subtle">
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
          <p className="mt-2 text-[10px] text-text-muted">{sauna.sauna_rooms.map(r => r.type).join(' · ')}</p>
        )}
      </div>
      <div className="w-px bg-border-subtle my-6" />
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

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle last:border-0">
      <p className="text-[12px] text-text-sub">{label}</p>
      <p className={`text-[12px] font-bold ${accent ? 'text-point' : 'text-text-main'}`}>{value}</p>
    </div>
  )
}

function AmenityGrid({ amenities }: { amenities: SaunaDto['amenities'] }) {
  const items = [
    { label: '수건', ok: amenities.towel },
    { label: '샴푸', ok: amenities.shampoo },
    { label: '바디워시', ok: amenities.body_wash },
    { label: '드라이어', ok: amenities.hair_dryer },
    ...(amenities.water_dispenser !== undefined ? [{ label: '정수기', ok: amenities.water_dispenser }] : []),
  ]
  return (
    <div className="grid grid-cols-4 divide-x divide-border-subtle">
      {items.map(({ label, ok }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 py-4 px-2">
          <span className="text-lg">{ok ? '✓' : '✕'}</span>
          <span className={`text-[10px] font-bold ${ok ? 'text-text-sub' : 'text-text-muted/40'}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

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

// ── 사활 기록 바텀시트 ────────────────────────────────────────
function ReviewBottomSheet({
  sauna,
  onClose,
}: {
  sauna: SaunaDto
  onClose: () => void
}) {
  const { user } = useUserStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10))
  const [visitTime, setVisitTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('afternoon')

  const VISIT_TIMES = [
    { id: 'morning', label: '아침', emoji: '🌅' },
    { id: 'afternoon', label: '오후', emoji: '☀️' },
    { id: 'evening', label: '저녁', emoji: '🌆' },
    { id: 'night', label: '야간', emoji: '🌙' },
  ] as const

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('로그인 필요')
      return api.reviews.create({
        sauna_id: sauna.id,
        user_id: user.id,
        rating,
        content: content.trim() || undefined,
        visit_date: visitDate,
        visit_time: visitTime,
      })
    },
    onSuccess: () => {
      toast.success('사활 기록 완료! 🔥')
      queryClient.invalidateQueries({ queryKey: ['reviews', sauna.id] })
      onClose()
    },
    onError: (e: Error) => {
      toast.error(e.message || '저장 중 오류가 발생했습니다')
    },
  })

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
        <div
          className="w-full rounded-t-2xl bg-bg-card border-t border-border-main p-6 text-center"
          onClick={e => e.stopPropagation()}
        >
          <p className="mb-1 text-base font-black text-text-main">로그인이 필요해요</p>
          <p className="mb-5 text-[12px] text-text-sub">사활 기록은 로그인 후 작성 가능합니다</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-xl bg-point py-3 text-[13px] font-black text-white"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-card border-t border-border-main"
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 + 헤더 */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3.5">
          <div>
            <p className="text-[10px] font-black tracking-widest text-text-muted uppercase">Review</p>
            <p className="text-[14px] font-black text-text-main">{sauna.name} 사활 기록</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-main text-text-sub">
            <BiX size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* 별점 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <BiStar
                    size={30}
                    className={n <= rating ? 'text-gold fill-gold' : 'text-border-main'}
                    style={{ fill: n <= rating ? 'currentColor' : 'none' }}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-1 self-center text-[12px] font-bold text-text-sub">
                  {['', '별로예요', '그저그래요', '괜찮아요', '좋아요', '극락이에요'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* 방문 날짜 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">Visit Date</p>
            <input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-[13px] text-text-main outline-none focus:border-point"
            />
          </div>

          {/* 방문 시간대 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">Time</p>
            <div className="grid grid-cols-4 gap-2">
              {VISIT_TIMES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setVisitTime(id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-bold transition active:scale-95 ${
                    visitTime === id
                      ? 'border-point bg-point/5 text-point'
                      : 'border-border-main bg-bg-main text-text-sub'
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 한줄 기록 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">Memo (선택)</p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="오늘의 극락 한 줄 기록..."
              rows={3}
              maxLength={200}
              className="w-full resize-none rounded-xl border border-border-main bg-bg-main px-3 py-2.5 text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-point"
            />
            <p className="mt-1 text-right text-[10px] text-text-muted">{content.length}/200</p>
          </div>

          {/* 제출 */}
          <button
            onClick={() => mutation.mutate()}
            disabled={rating === 0 || mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-point py-3.5 text-[13px] font-black text-white transition active:scale-[0.97] disabled:opacity-50"
          >
            {mutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : '🔥 사활 기록 저장'}
          </button>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────────
export function SaunaDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { user } = useUserStore()
  const [showReview, setShowReview] = useState(false)

  // 찜 상태
  const { data: isFav = false, refetch: refetchFav } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: () => user ? api.favorites.check(user.id, id) : Promise.resolve(false),
    enabled: !!user && !!id,
  })

  const toggleFav = async () => {
    if (!user) { router.push('/login'); return }
    try {
      if (isFav) {
        await api.favorites.remove(user.id, id)
        toast.success('찜 목록에서 제거했어요')
      } else {
        await api.favorites.add(user.id, id)
        toast.success('찜 목록에 추가했어요 ❤️')
      }
      refetchFav()
    } catch {
      toast.error('잠시 후 다시 시도해주세요')
    }
  }

  const { data: sauna, isLoading, isError } = useQuery<SaunaDto>({
    queryKey: ['sauna', id],
    queryFn: () => api.saunas.getById(id),
    enabled: !!id,
  })

  // DB 이미지가 없으면 카카오맵에서 폴백 이미지 가져옴
  const [kakaoImage, setKakaoImage] = useState<string | null>(null)
  useEffect(() => {
    if (!sauna || sauna.images?.[0]) return
    api.kakao.getPlaceImage(sauna.name, sauna.address).then(setKakaoImage)
  }, [sauna?.id, sauna?.images?.[0], sauna?.name, sauna?.address])

  if (isLoading) return <DetailSkeleton />
  if (isError || !sauna) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg-main p-6 text-center">
        <span className="text-4xl">😢</span>
        <p className="font-bold text-text-main">사우나 정보를 찾을 수 없어요</p>
        <button onClick={() => router.back()} className="rounded-full bg-point px-5 py-2.5 text-sm font-bold text-white">
          돌아가기
        </button>
      </div>
    )
  }

  const thumbnail = sauna.images?.[0] ?? kakaoImage

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* 히어로 이미지 */}
        <div className="relative h-56 w-full flex-shrink-0">
          {thumbnail ? (
            <img src={thumbnail} alt={sauna.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg via-bg-main to-cold-bg">
              <span className="text-6xl opacity-10">🧖</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 z-10">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90"
            >
              <BiChevronLeft size={22} />
            </button>
          </div>
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            {/* 찜 버튼 — 실제 동작 */}
            <button
              onClick={toggleFav}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90 ${
                isFav ? 'bg-point text-white' : 'bg-black/40 text-white'
              }`}
            >
              <BiBookmark size={16} style={{ fill: isFav ? 'currentColor' : 'none' }} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
              <BiShare size={16} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h1 className="text-[22px] font-black text-white leading-tight">{sauna.name}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
              <BiMap size={11} />
              {sauna.address}
            </p>
          </div>
        </div>

        <TempHero sauna={sauna} />

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-bg-card border-b border-border-subtle">
          <button
            onClick={toggleFav}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-black transition active:scale-[0.97] ${
              isFav ? 'bg-point text-white' : 'border border-border-main bg-bg-main text-text-main'
            }`}
          >
            {isFav ? '❤️ 찜됨' : '🤍 극락가고싶다'}
          </button>
          <button
            onClick={() => setShowReview(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border-main bg-bg-main py-3 text-[13px] font-black text-text-main transition active:scale-[0.97]"
          >
            ✏️ 사활 기록
          </button>
        </div>

        {/* 태그 */}
        {sauna.rules && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3 bg-bg-card border-b border-border-subtle">
            {sauna.rules.tattoo_allowed && <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">🖋️ 타투OK</span>}
            {sauna.rules.female_allowed && <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">👩 여성가능</span>}
            {sauna.rules.male_allowed && <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">👨 남성가능</span>}
            {sauna.parking && <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">🅿️ 주차가능</span>}
            {sauna.kr_specific?.has_jjimjilbang && <span className="rounded-full border border-border-main bg-bg-main px-2.5 py-1 text-[10px] font-bold text-text-sub">🧖 찜질방</span>}
          </div>
        )}

        <div className="section-divider" />

        {/* 사우나실 */}
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

        {/* 냉탕 */}
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

        {/* 휴식 공간 */}
        {sauna.resting_area && (
          <Section title="Resting Area">
            {sauna.resting_area.outdoor_seats > 0 && <InfoRow label="외기욕 의자" value={`${sauna.resting_area.outdoor_seats}개`} />}
            {sauna.resting_area.indoor_seats > 0 && <InfoRow label="실내 의자" value={`${sauna.resting_area.indoor_seats}개`} />}
            {(sauna.resting_area.infinity_chairs ?? 0) > 0 && <InfoRow label="인피니티 의자" value={`${sauna.resting_area.infinity_chairs}개`} />}
            {(sauna.resting_area.deck_chairs ?? 0) > 0 && <InfoRow label="데크 의자" value={`${sauna.resting_area.deck_chairs}개`} />}
          </Section>
        )}

        {/* 어메니티 */}
        {sauna.amenities && (
          <Section title="Amenities">
            <AmenityGrid amenities={sauna.amenities} />
          </Section>
        )}

        {/* 요금 */}
        {sauna.pricing && (
          <Section title="Pricing">
            {sauna.pricing.adult_day > 0 && <InfoRow label="성인 (낮)" value={`${sauna.pricing.adult_day.toLocaleString()}원`} />}
            {sauna.pricing.adult_night > 0 && <InfoRow label="성인 (야간)" value={`${sauna.pricing.adult_night.toLocaleString()}원`} />}
            {sauna.pricing.child > 0 && <InfoRow label="어린이" value={`${sauna.pricing.child.toLocaleString()}원`} />}
          </Section>
        )}

        {/* 한국 특화 */}
        {sauna.kr_specific && (
          <Section title="Korean Special">
            {sauna.kr_specific.sesin_price_male > 0 && <InfoRow label="때밀이 (남)" value={`${sauna.kr_specific.sesin_price_male.toLocaleString()}원`} />}
            {sauna.kr_specific.sesin_price_female > 0 && <InfoRow label="때밀이 (여)" value={`${sauna.kr_specific.sesin_price_female.toLocaleString()}원`} />}
            {sauna.kr_specific.food?.length > 0 && <InfoRow label="식음료" value={sauna.kr_specific.food.join(', ')} />}
          </Section>
        )}

        {/* 이용 정보 */}
        <Section title="Info">
          {sauna.business_hours && <InfoRow label="운영 시간" value={sauna.business_hours} />}
          {sauna.contact && (
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
              <p className="text-[12px] text-text-sub">연락처</p>
              <a href={`tel:${sauna.contact}`} className="text-[12px] font-bold text-point">{sauna.contact}</a>
            </div>
          )}
          <InfoRow label="주차" value={sauna.parking ? '가능' : '불가'} />
        </Section>

        <div className="h-8" />
      </div>

      {/* 사활 기록 바텀시트 */}
      {showReview && <ReviewBottomSheet sauna={sauna} onClose={() => setShowReview(false)} />}
    </div>
  )
}
