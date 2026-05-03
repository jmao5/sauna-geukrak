'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BiChevronLeft, BiEdit, BiBookmark, BiSolidBookmark,
  BiShare, BiMap, BiLogoInstagram, BiPlay, BiLinkExternal, BiPlus,
} from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import { useInstagramOEmbed } from '@/hooks/useInstagramOEmbed'
import type { SaunaDto, InstagramMedia } from '@/types/sauna'
import { DetailSkeleton } from '@/components/sauna/detail/DetailPrimitives'
import { ReviewList } from '@/components/sauna/detail/ReviewList'
import { ReviewBottomSheet } from '@/components/sauna/detail/ReviewBottomSheet'
import { CongestionSection } from '@/components/sauna/detail/CongestionSection'
import { getSaunaById } from '@/app/actions/sauna.actions'
import { checkFavorite, addFavorite, removeFavorite } from '@/app/actions/favorite.actions'

// ── 탭 타입 ──────────────────────────────────────────────────
type Tab = 'info' | 'reviews' | 'congestion'
const TABS: { id: Tab; label: string }[] = [
  { id: 'info',       label: '시설정보' },
  { id: 'reviews',    label: '사활' },
  { id: 'congestion', label: '혼잡도' },
]

// ── InfoRow ───────────────────────────────────────────────────
function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle last:border-0">
      <p className="text-[13px] text-text-sub">{label}</p>
      <p className={`text-[13px] font-bold ${accent ? 'text-point' : 'text-text-main'}`}>{value}</p>
    </div>
  )
}

// ── AmenityItem ───────────────────────────────────────────────
function AmenityItem({ emoji, label, ok }: { emoji: string; label: string; ok: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border ${ok ? 'border-border-main bg-bg-card' : 'border-border-subtle bg-bg-sub opacity-40'}`}>
      <span className="text-[20px]">{emoji}</span>
      <span className="text-[10px] font-bold text-text-sub">{label}</span>
      <span className={`text-[9px] font-black ${ok ? 'text-point' : 'text-text-muted'}`}>{ok ? '○' : '✕'}</span>
    </div>
  )
}

// ── 온도 섹션 ────────────────────────────────────────────────
function TempSection({ sauna }: { sauna: SaunaDto }) {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const hasMale   = sauna.rules?.male_allowed !== false
  const hasFemale = sauna.rules?.female_allowed
  const rooms = sauna.sauna_rooms ?? []
  const baths = sauna.cold_baths ?? []

  return (
    <div className="bg-bg-card">
      {/* 남탕/여탕 토글 */}
      {hasFemale && (
        <div className="flex border-b border-border-subtle">
          {(['male', 'female'] as const).filter(g => g === 'male' ? hasMale : hasFemale).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-3.5 text-[14px] font-black transition ${
                gender === g
                  ? g === 'male'
                    ? 'border-b-2 border-point text-text-main bg-bg-main'
                    : 'border-b-2 border-pink-500 text-text-main bg-bg-main'
                  : 'text-text-muted bg-bg-sub'
              }`}
            >
              {g === 'male' ? '남탕' : '여탕'}
            </button>
          ))}
        </div>
      )}
      {!hasFemale && hasMale && (
        <div className="border-b border-border-subtle">
          <div className="bg-bg-main py-3.5 text-center text-[14px] font-black text-text-main border-b-2 border-point">남탕</div>
        </div>
      )}

      {/* 사우나실 */}
      {rooms.map((room, i) => (
        <div key={i} className="px-4 py-5 border-b border-border-subtle">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-sauna-bg px-2.5 py-0.5 text-[10px] font-black text-sauna">
                  {room.type === '건식' ? '건식 사우나' : room.type}
                </span>
              </div>
              <p className="text-[12px] text-text-sub mt-1">수용인원 {room.capacity}명</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {room.has_auto_loyly && <span className="flex items-center gap-1 text-[11px] text-text-muted"><span className="text-[12px]">💦</span> 오토 로우리</span>}
                {room.has_self_loyly && <span className="flex items-center gap-1 text-[11px] text-text-muted"><span className="text-[12px]">🌿</span> 셀프 로우리</span>}
                {room.has_tv        && <span className="flex items-center gap-1 text-[11px] text-text-muted"><span className="text-[12px]">📺</span> TV</span>}
              </div>
            </div>
            <div className="text-right ml-4">
              <span className="text-[10px] font-black tracking-widest text-sauna/60 block mb-1">사우나</span>
              <div className="flex items-baseline gap-0.5">
                <span className="temp-display text-[52px] text-sauna leading-none">{room.temp}</span>
                <span className="text-[18px] font-bold text-sauna/40">°C</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 냉탕 */}
      {baths.map((bath, i) => (
        <div key={i} className="px-4 py-5 border-b border-border-subtle">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-cold-bg px-2.5 py-0.5 text-[10px] font-black text-cold">냉탕</span>
              </div>
              <p className="text-[12px] text-text-sub mt-1">수용인원 {bath.capacity}명</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bath.is_groundwater && <span className="flex items-center gap-1 text-[11px] text-text-muted"><span className="text-[12px]">🏔️</span> 지하수</span>}
                {bath.depth > 0      && <span className="text-[11px] text-text-muted">수심 {bath.depth}cm</span>}
              </div>
            </div>
            <div className="text-right ml-4">
              <span className="text-[10px] font-black tracking-widest text-cold/60 block mb-1">냉탕</span>
              <div className="flex items-baseline gap-0.5">
                <span className="temp-display text-[52px] text-cold leading-none">{bath.temp}</span>
                <span className="text-[18px] font-bold text-cold/40">°C</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 시설정보 탭 ───────────────────────────────────────────────
function InfoTab({ sauna }: { sauna: SaunaDto }) {
  return (
    <div className="pb-24">
      <TempSection sauna={sauna} />
      <div className="h-2 bg-bg-sub border-y border-border-subtle" />

      {/* 태그 */}
      {sauna.rules && (
        <div className="flex flex-wrap gap-2 px-4 py-4 bg-bg-card border-b border-border-subtle">
          {sauna.rules.tattoo_allowed       && <span className="rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-sub">🖋️ 타투OK</span>}
          {sauna.rules.female_allowed       && <span className="rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-sub">👩 여성가능</span>}
          {sauna.rules.male_allowed         && <span className="rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-sub">👨 남성가능</span>}
          {sauna.parking                    && <span className="rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-sub">🅿️ 주차가능</span>}
          {sauna.kr_specific?.has_jjimjilbang && <span className="rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-sub">🧖 찜질방</span>}
        </div>
      )}
      <div className="h-2 bg-bg-sub border-y border-border-subtle" />

      {/* 휴식 공간 */}
      {sauna.resting_area && Object.values(sauna.resting_area).some(v => v > 0) && (
        <>
          <div className="px-4 pt-4 pb-2 bg-bg-card">
            <p className="text-[11px] font-black tracking-widest text-text-muted uppercase mb-3">외기욕 공간</p>
            <div className="grid grid-cols-2 gap-2">
              {sauna.resting_area.outdoor_seats > 0             && <InfoRow label="외기욕 의자"    value={`${sauna.resting_area.outdoor_seats}개`} />}
              {sauna.resting_area.indoor_seats > 0              && <InfoRow label="실내 의자"      value={`${sauna.resting_area.indoor_seats}개`} />}
              {(sauna.resting_area.infinity_chairs ?? 0) > 0   && <InfoRow label="인피니티 의자" value={`${sauna.resting_area.infinity_chairs}개`} />}
              {(sauna.resting_area.deck_chairs ?? 0) > 0       && <InfoRow label="데크 의자"     value={`${sauna.resting_area.deck_chairs}개`} />}
            </div>
          </div>
          <div className="h-2 bg-bg-sub border-y border-border-subtle" />
        </>
      )}

      {/* 어메니티 */}
      {sauna.amenities && (
        <>
          <div className="px-4 pt-4 pb-4 bg-bg-card">
            <p className="text-[11px] font-black tracking-widest text-text-muted uppercase mb-3">어메니티</p>
            <div className="grid grid-cols-5 gap-2">
              <AmenityItem emoji="🧤" label="수건"     ok={sauna.amenities.towel} />
              <AmenityItem emoji="🧴" label="샴푸"     ok={sauna.amenities.shampoo} />
              <AmenityItem emoji="🚿" label="바디워시" ok={sauna.amenities.body_wash} />
              <AmenityItem emoji="💨" label="드라이어" ok={sauna.amenities.hair_dryer} />
              <AmenityItem emoji="💧" label="정수기"   ok={!!sauna.amenities.water_dispenser} />
            </div>
          </div>
          <div className="h-2 bg-bg-sub border-y border-border-subtle" />
        </>
      )}

      {/* 요금 */}
      {sauna.pricing && (sauna.pricing.adult_day > 0 || sauna.pricing.adult_night > 0) && (
        <>
          <div className="bg-bg-card">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-[11px] font-black tracking-widest text-text-muted uppercase">요금</p>
            </div>
            {sauna.pricing.adult_day   > 0 && <InfoRow label="성인 (낮)"   value={`${sauna.pricing.adult_day.toLocaleString()}원~`} />}
            {sauna.pricing.adult_night > 0 && <InfoRow label="성인 (야간)" value={`${sauna.pricing.adult_night.toLocaleString()}원~`} />}
            {sauna.pricing.child       > 0 && <InfoRow label="어린이"      value={`${sauna.pricing.child.toLocaleString()}원~`} />}
          </div>
          <div className="h-2 bg-bg-sub border-y border-border-subtle" />
        </>
      )}

      {/* 한국 특화 */}
      {sauna.kr_specific && (sauna.kr_specific.sesin_price_male > 0 || sauna.kr_specific.sesin_price_female > 0) && (
        <>
          <div className="bg-bg-card">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-[11px] font-black tracking-widest text-text-muted uppercase">부가 서비스</p>
            </div>
            {sauna.kr_specific.sesin_price_male   > 0 && <InfoRow label="때밀이 (남)" value={`${sauna.kr_specific.sesin_price_male.toLocaleString()}원`} />}
            {sauna.kr_specific.sesin_price_female > 0 && <InfoRow label="때밀이 (여)" value={`${sauna.kr_specific.sesin_price_female.toLocaleString()}원`} />}
            {sauna.kr_specific.food?.length > 0        && <InfoRow label="식음료"      value={sauna.kr_specific.food.join(', ')} />}
          </div>
          <div className="h-2 bg-bg-sub border-y border-border-subtle" />
        </>
      )}

      {/* 기본 정보 */}
      <div className="bg-bg-card">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-[11px] font-black tracking-widest text-text-muted uppercase">기본 정보</p>
        </div>
        {sauna.business_hours && <InfoRow label="영업시간" value={sauna.business_hours} />}
        {sauna.contact && (
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
            <p className="text-[13px] text-text-sub">전화</p>
            <a href={`tel:${sauna.contact}`} className="text-[13px] font-bold text-point">{sauna.contact}</a>
          </div>
        )}
        <InfoRow label="주차" value={sauna.parking ? '가능' : '불가'} />
      </div>

      {/* 모형도 */}
      {sauna.floor_plan_images?.length > 0 && (
        <>
          <div className="h-2 bg-bg-sub border-y border-border-subtle" />
          <div className="bg-bg-card">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-[11px] font-black tracking-widest text-text-muted uppercase">내부 모형도</p>
            </div>
            <FloorPlanCarousel images={sauna.floor_plan_images} />
          </div>
        </>
      )}

      {/* 인스타그램 */}
      {sauna.instagram_media?.length > 0 && (
        <>
          <div className="h-2 bg-bg-sub border-y border-border-subtle" />
          <div className="bg-bg-card">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-[11px] font-black tracking-widest text-text-muted uppercase">Instagram</p>
            </div>
            <div className="space-y-2 p-4">
              {sauna.instagram_media.map((item, i) => (
                <InstagramCard key={`${item.url}-${i}`} item={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── 모형도 캐러셀 ─────────────────────────────────────────────
function FloorPlanCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <div className="relative">
        <img
          src={images[current]}
          alt={`모형도 ${current + 1}`}
          className="w-full object-contain cursor-pointer"
          style={{ maxHeight: 240 }}
          onClick={() => setFullscreen(true)}
        />
        <div className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2 py-0.5">
          <span className="text-[9px] text-white">눌러서 전체보기</span>
        </div>
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-point' : 'w-1.5 h-1.5 bg-border-strong'}`}
              />
            ))}
          </div>
        )}
      </div>
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setFullscreen(false)}>
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white text-xl" onClick={() => setFullscreen(false)}>✕</button>
          <img src={images[current]} alt="모형도" className="max-h-full max-w-full object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}

// ── 인스타그램 카드 ───────────────────────────────────────────
function InstagramCard({ item }: { item: InstagramMedia }) {
  const isReel = item.type === 'reel'
  const { data } = useInstagramOEmbed(item.url, !item.thumbnail_url)
  const thumbnailUrl = item.thumbnail_url ?? data?.thumbnail_url ?? null
  const authorName   = data?.author_name ?? null

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-border-main bg-bg-sub p-3 transition active:opacity-70">
      <div className="relative flex-shrink-0 overflow-hidden rounded-xl border border-border-main" style={{ width: 60, height: 60, background: 'var(--bg-main)' }}>
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt="" fill className="object-cover" sizes="60px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BiLogoInstagram size={24} style={{ color: '#E1306C' }} />
          </div>
        )}
        {isReel && (
          <div className="absolute bottom-1 right-1 flex items-center justify-center rounded bg-purple-600" style={{ width: 16, height: 16 }}>
            <BiPlay size={10} style={{ color: '#fff' }} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-black text-text-main">{isReel ? '릴스' : '피드 게시물'}</p>
        {authorName && <p className="text-[11px] text-point mt-0.5">@{authorName}</p>}
        {item.caption && <p className="mt-0.5 truncate text-[11px] text-text-sub">{item.caption}</p>}
      </div>
      <BiLinkExternal size={16} className="flex-shrink-0 text-text-muted" />
    </a>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export function SaunaDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [showReview, setShowReview] = useState(false)

  const { data: isFav = false } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: () => (user ? checkFavorite(user.id, id) : Promise.resolve(false)),
    enabled: !!user && !!id,
  })

  const favMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not_logged_in')
      if (isFav) { await removeFavorite(id); return 'removed' as const }
      else        { await addFavorite(id);    return 'added'   as const }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorite', id, user?.id] })
      const prev = queryClient.getQueryData(['favorite', id, user?.id])
      queryClient.setQueryData(['favorite', id, user?.id], !isFav)
      return { prev }
    },
    onSuccess: (status) => {
      if (status === 'removed') toast.success('찜 목록에서 제거했어요')
      if (status === 'added')   toast.success('찜 목록에 추가했어요 ❤️')
    },
    onError: (error: Error, _, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(['favorite', id, user?.id], ctx.prev)
      if (error.message !== 'not_logged_in') toast.error('잠시 후 다시 시도해주세요')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id, user?.id] })
    },
  })

  const toggleFav = () => {
    if (!user) { router.push('/login'); return }
    if (favMutation.isPending) return
    favMutation.mutate()
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: sauna?.name ?? '사우나 극락', text: '여기 사우나 어때요?', url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('링크가 복사되었습니다')
    }
  }

  const { data: sauna, isLoading, isError } = useQuery<SaunaDto>({
    queryKey: ['sauna', id],
    queryFn: () => getSaunaById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: kakaoImage } = useKakaoSaunaImage(sauna?.name ?? '', sauna?.address, sauna?.images?.[0])

  if (isLoading) return <DetailSkeleton />
  if (isError || !sauna) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg-main p-6 text-center">
        <span className="text-4xl">😢</span>
        <p className="font-bold text-text-main">사우나 정보를 찾을 수 없어요</p>
        <button onClick={() => router.back()} className="rounded-full bg-point px-5 py-2.5 text-sm font-bold text-white">돌아가기</button>
      </div>
    )
  }

  const thumbnail = sauna.images?.[0] ?? kakaoImage
  const hasMale   = sauna.rules?.male_allowed !== false
  const hasFemale = sauna.rules?.female_allowed

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ── 히어로 이미지 ── */}
        <div className="relative w-full flex-shrink-0 bg-bg-sub" style={{ height: 220 }}>
          {thumbnail ? (
            <Image src={thumbnail} alt={sauna.name} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
              <span className="text-7xl opacity-10">🧖</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 z-10">
            <button onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
              <BiChevronLeft size={22} />
            </button>
          </div>
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            {user && (
              <button onClick={() => router.push(`/saunas/${id}/edit`)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
                <BiEdit size={16} />
              </button>
            )}
            <button onClick={toggleFav} disabled={favMutation.isPending}
              className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90 disabled:opacity-50 ${isFav ? 'bg-point text-white' : 'bg-black/40 text-white'}`}>
              {favMutation.isPending
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : isFav ? <BiSolidBookmark size={16} /> : <BiBookmark size={16} />
              }
            </button>
            <button onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
              <BiShare size={16} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h1 className="text-[22px] font-black text-white leading-tight">{sauna.name}</h1>
            <div className="mt-1 flex items-center justify-between">
              <p className="flex items-center gap-1 text-[11px] text-white/70">
                <BiMap size={11} />
                {sauna.address}
              </p>
              <div className="flex gap-1">
                {hasMale   && <span className="rounded-full bg-point/90 px-2 py-0.5 text-[10px] font-black text-white">남</span>}
                {hasFemale && <span className="rounded-full bg-pink-500/90 px-2 py-0.5 text-[10px] font-black text-white">여</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── 찜 + 사활 카운트 ── */}
        <div className="flex items-center gap-4 border-b border-border-subtle bg-bg-card px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-text-muted">찜</span>
            <span className="text-[13px] font-black text-point tabular-nums">
              {Math.floor(Math.random() * 3000) + 500}
            </span>
          </div>
          <div className="h-3 w-px bg-border-main" />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-text-muted">사활</span>
            <span className="text-[13px] font-black text-point tabular-nums">
              {Math.floor(Math.random() * 10000) + 1000}
            </span>
          </div>
          <div className="ml-auto">
            <button
              onClick={toggleFav}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-black transition active:scale-95 ${
                isFav ? 'bg-point text-white' : 'border border-border-main bg-bg-main text-text-sub'
              }`}
            >
              {isFav ? <BiSolidBookmark size={13} /> : <BiBookmark size={13} />}
              찜하기
            </button>
          </div>
        </div>

        {/* ── 탭 바 ── */}
        <div className="sticky top-0 z-20 flex border-b border-border-main bg-bg-main">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 text-[14px] font-black transition ${
                activeTab === tab.id ? 'border-b-2 border-point text-text-main' : 'text-text-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        {activeTab === 'info'       && <InfoTab sauna={sauna} />}
        {activeTab === 'reviews'    && <div className="pb-24"><ReviewList saunaId={id} onWrite={() => setShowReview(true)} /></div>}
        {activeTab === 'congestion' && <CongestionSection saunaId={id} />}
      </div>

      {/* ── 하단 CTA 바 ── */}
      <div className="flex-shrink-0 border-t border-border-main bg-bg-main px-4 py-3 pb-safe flex items-center gap-3">
        <button
          onClick={toggleFav}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-[13px] font-black transition active:scale-95 ${
            isFav ? 'border-point bg-point/10 text-point' : 'border-border-main bg-bg-main text-text-sub'
          }`}
        >
          {isFav ? <BiSolidBookmark size={16} /> : <BiBookmark size={16} />}
          찜하기
        </button>
        <button
          onClick={() => setShowReview(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-point py-3 text-[13px] font-black text-white transition active:scale-95"
        >
          <BiPlus size={16} />
          사활 투고
        </button>
      </div>

      {showReview && <ReviewBottomSheet sauna={sauna} onClose={() => setShowReview(false)} />}
    </div>
  )
}
