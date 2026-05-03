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
import { checkFavorite, addFavorite, removeFavorite, getFavoriteCount } from '@/app/actions/favorite.actions'

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
  const hasMale   = sauna.rules?.male_allowed !== false
  const hasFemale = !!sauna.rules?.female_allowed
  const [gender, setGender] = useState<'male' | 'female'>(hasMale ? 'male' : 'female')

  const rooms = (sauna.sauna_rooms ?? []).filter(r => {
    const g = (r as any).gender ?? 'male'
    return g === 'both' || g === gender
  })
  const baths = (sauna.cold_baths ?? []).filter(b => {
    const g = (b as any).gender ?? 'male'
    return g === 'both' || g === gender
  })

  return (
    <div className="bg-bg-card">
      {hasMale && hasFemale ? (
        <div className="flex border-b border-border-subtle">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-3.5 text-[14px] font-black transition ${
                gender === g
                  ? g === 'male'
                    ? 'border-b-2 border-point text-text-main bg-bg-main'
                    : 'border-b-2 border-pink-500 text-text-main bg-bg-main'
                  : 'text-text-muted'
              }`}
            >
              {g === 'male' ? '👨 남탕' : '👩 여탕'}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex">
        {/* 사우나 */}
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <p className="mb-2 text-[9px] font-black tracking-widest text-text-muted uppercase">Sauna</p>
          {rooms.length > 0 ? (
            <>
              <div className="temp-display text-[56px] text-sauna leading-none tabular-nums">
                {Math.max(...rooms.map(r => r.temp))}
              </div>
              <p className="mt-1 text-[12px] font-bold text-sauna/50">°C</p>
              <p className="mt-2 text-center text-[10px] text-text-muted leading-relaxed">
                {rooms.map(r => r.type).join(' · ')}
              </p>
            </>
          ) : (
            <div className="temp-display text-[56px] text-text-muted/20">—</div>
          )}
        </div>

        <div className="w-px bg-border-subtle my-6" />

        {/* 냉탕 */}
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <p className="mb-2 text-[9px] font-black tracking-widest text-text-muted uppercase">Cold Bath</p>
          {baths.length > 0 ? (
            <>
              <div className="temp-display text-[56px] text-cold leading-none tabular-nums">
                {Math.min(...baths.map(b => b.temp))}
              </div>
              <p className="mt-1 text-[12px] font-bold text-cold/50">°C</p>
              {baths.some(b => b.is_groundwater) && (
                <p className="mt-2 text-[10px] text-text-muted">🏔️ 지하수</p>
              )}
            </>
          ) : (
            <div className="temp-display text-[56px] text-text-muted/20">—</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── InfoTab ───────────────────────────────────────────────────
function InfoTab({ sauna }: { sauna: SaunaDto }) {
  return (
    <div className="divide-y divide-border-subtle pb-4">
      <TempSection sauna={sauna} />

      {/* 시설 */}
      {sauna.amenities && (
        <div className="px-4 py-4">
          <p className="mb-3 text-[10px] font-black tracking-widest text-text-muted uppercase">Amenities</p>
          <div className="grid grid-cols-4 gap-2">
            <AmenityItem emoji="🧤" label="수건"     ok={sauna.amenities.towel} />
            <AmenityItem emoji="🧴" label="샴푸"     ok={sauna.amenities.shampoo} />
            <AmenityItem emoji="🚿" label="바디워시" ok={sauna.amenities.body_wash} />
            <AmenityItem emoji="💨" label="드라이어" ok={sauna.amenities.hair_dryer} />
            {sauna.amenities.water_dispenser !== undefined && (
              <AmenityItem emoji="💧" label="정수기" ok={sauna.amenities.water_dispenser} />
            )}
          </div>
        </div>
      )}

      {/* 가격 */}
      {sauna.pricing && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Pricing</p>
          {sauna.pricing.adult_day   > 0 && <InfoRow label="성인 (낮)"  value={`${sauna.pricing.adult_day.toLocaleString()}원`} />}
          {sauna.pricing.adult_night > 0 && <InfoRow label="성인 (야간)" value={`${sauna.pricing.adult_night.toLocaleString()}원`} />}
          {sauna.pricing.child       > 0 && <InfoRow label="어린이"     value={`${sauna.pricing.child.toLocaleString()}원`} />}
        </div>
      )}

      {/* 한국 특화 */}
      {sauna.kr_specific && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Korean Special</p>
          {sauna.kr_specific.sesin_price_male   > 0 && <InfoRow label="때밀이 (남)" value={`${sauna.kr_specific.sesin_price_male.toLocaleString()}원`} />}
          {sauna.kr_specific.sesin_price_female > 0 && <InfoRow label="때밀이 (여)" value={`${sauna.kr_specific.sesin_price_female.toLocaleString()}원`} />}
          {sauna.kr_specific.food?.length > 0         && <InfoRow label="식음료"     value={sauna.kr_specific.food.join(', ')} />}
        </div>
      )}

      {/* 기본 정보 */}
      <div>
        <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Info</p>
        {sauna.business_hours && <InfoRow label="운영 시간" value={sauna.business_hours} />}
        {sauna.contact && (
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
            <p className="text-[13px] text-text-sub">연락처</p>
            <a href={`tel:${sauna.contact}`} className="text-[13px] font-bold text-point">{sauna.contact}</a>
          </div>
        )}
        <InfoRow label="주차" value={sauna.parking ? '가능' : '불가'} />
      </div>

      {/* 모형도 */}
      {sauna.floor_plan_images?.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Floor Plan</p>
          <div className="px-4">
            <img src={sauna.floor_plan_images[0]} alt="모형도" className="w-full rounded-xl object-contain" style={{ maxHeight: 240 }} />
          </div>
        </div>
      )}

      {/* 인스타그램 */}
      {sauna.instagram_media?.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Instagram</p>
          <div className="space-y-2 px-4 pb-2">
            {sauna.instagram_media.map((item, i) => (
              <InstagramCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 인스타그램 카드 ───────────────────────────────────────────
function InstagramCard({ item }: { item: InstagramMedia }) {
  const isReel = item.type === 'reel'
  const { data, isLoading } = useInstagramOEmbed(item.url)
  const thumbnailUrl = data?.thumbnail_url ?? null
  const authorName   = data?.author_name   ?? null
  const shortcode    = (() => {
    const match = item.url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
    return match ? match[1] : null
  })()

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl transition-opacity active:opacity-70"
      style={{ border: '1px solid var(--border-main)', background: 'var(--bg-card)', padding: '12px' }}
    >
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-lg"
        style={{ width: 64, height: 64, background: 'var(--bg-sub)', border: '1px solid var(--border-main)' }}
      >
        {isLoading ? (
          <div className="skeleton-shimmer h-full w-full" />
        ) : thumbnailUrl ? (
          <Image src={thumbnailUrl} alt={item.caption ?? ''} fill className="object-cover" sizes="64px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BiLogoInstagram size={26} style={{ color: '#E1306C', opacity: 0.7 }} />
          </div>
        )}
        {isReel && (
          <div className="absolute bottom-1 right-1 flex items-center justify-center rounded-sm" style={{ background: '#7c3aed', width: 16, height: 16 }}>
            <BiPlay size={10} style={{ color: '#fff' }} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black" style={{ color: 'var(--text-main)' }}>
          {isReel ? 'Instagram Reels' : 'Instagram Post'}
        </p>
        {authorName && <p className="mt-0.5 text-[11px]" style={{ color: 'var(--point-color)' }}>@{authorName}</p>}
        {item.caption ? (
          <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-sub)' }}>{item.caption}</p>
        ) : shortcode ? (
          <p className="mt-0.5 truncate text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>/{shortcode.slice(0, 16)}</p>
        ) : null}
      </div>
      <div className="flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
        style={{ background: 'var(--bg-sub)', border: '1px solid var(--border-main)', color: 'var(--text-sub)' }}>
        <BiLinkExternal size={12} />
        보기
      </div>
    </a>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export function SaunaDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const [showReview, setShowReview] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const { data: isFav = false } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: () => (user ? checkFavorite(user.id, id) : Promise.resolve(false)),
    enabled: !!user && !!id,
  })

  // 찜 수 — 실제 DB 카운트
  const { data: favCount = 0 } = useQuery({
    queryKey: ['favorite-count', id],
    queryFn: () => getFavoriteCount(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
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
      // 찜 수 optimistic update
      queryClient.setQueryData(['favorite-count', id], (old: number) =>
        isFav ? Math.max(0, old - 1) : old + 1
      )
      return { prev }
    },
    onSuccess: (status) => {
      if (status === 'removed') toast.success('찜 목록에서 제거했어요')
      if (status === 'added')   toast.success('찜 목록에 추가했어요 ❤️')
    },
    onError: (error: Error, _, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(['favorite', id, user?.id], ctx.prev)
      queryClient.invalidateQueries({ queryKey: ['favorite-count', id] })
      if (error.message !== 'not_logged_in') toast.error('잠시 후 다시 시도해주세요')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['favorite-count', id] })
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

  const thumbnail  = sauna.images?.[0] ?? kakaoImage
  const hasMale    = sauna.rules?.male_allowed !== false
  const hasFemale  = sauna.rules?.female_allowed
  
  // 사활 수 — DB의 review_count 컬럼 (트리거로 자동 갱신)
  const reviewCount = sauna.review_count ?? 0

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <div data-scroll-main className="flex-1 overflow-y-auto scrollbar-hide">

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

        {/* ── 찜 + 사활 카운트 — 실제 데이터 ── */}
        <div className="flex items-center gap-4 border-b border-border-subtle bg-bg-card px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-text-muted">찜</span>
            <span className="text-[13px] font-black text-point tabular-nums">
              {favCount.toLocaleString()}
            </span>
          </div>
          <div className="h-3 w-px bg-border-main" />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-text-muted">사활</span>
            <span className="text-[13px] font-black text-point tabular-nums">
              {reviewCount.toLocaleString()}
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
              {tab.id === 'reviews'
                ? `사활 ${reviewCount > 0 ? reviewCount : ''}`
                : tab.label}
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
