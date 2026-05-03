'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BiBookmark, BiChevronLeft, BiEdit, BiMap,
  BiShare, BiSolidBookmark, BiLogoInstagram, BiPlay, BiLinkExternal,
} from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import { useInstagramOEmbed } from '@/hooks/useInstagramOEmbed'
import type { SaunaDto } from '@/types/sauna'
import { TempHero } from '@/components/sauna/detail/TempHero'
import { DetailHero } from '@/components/sauna/detail/DetailHero'
import { DetailActions } from '@/components/sauna/detail/DetailActions'
import {
  Section,
  InfoRow,
  AmenityGrid,
  DetailSkeleton,
  Tag,
} from '@/components/sauna/detail/DetailPrimitives'
import { ReviewList } from '@/components/sauna/detail/ReviewList'
import { ReviewBottomSheet } from '@/components/sauna/detail/ReviewBottomSheet'
import { getSaunaById } from '@/app/actions/sauna.actions'
import { checkFavorite, addFavorite, removeFavorite } from '@/app/actions/favorite.actions'
import type { InstagramMedia } from '@/types/sauna'

// ── 내부 모형도 섹션 ─────────────────────────────────────────
function FloorPlanSection({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const isDragging = useRef(false)
  const MIN_SWIPE = 40

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length)
  const next = () => setCurrent((i) => (i + 1) % images.length)

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchEndX.current = null }
  const onTouchMove  = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX }
  const onTouchEnd   = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const delta = touchStartX.current - touchEndX.current
    if (Math.abs(delta) >= MIN_SWIPE) delta > 0 ? next() : prev()
    touchStartX.current = null; touchEndX.current = null
  }
  const onMouseDown = (e: React.MouseEvent) => { touchStartX.current = e.clientX; touchEndX.current = null; isDragging.current = false }
  const onMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current === null) return
    touchEndX.current = e.clientX
    if (Math.abs(e.clientX - touchStartX.current) > 5) isDragging.current = true
  }
  const onMouseUp = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const delta = touchStartX.current - touchEndX.current
    if (Math.abs(delta) >= MIN_SWIPE) delta > 0 ? next() : prev()
    touchStartX.current = null; touchEndX.current = null
  }

  return (
    <>
      <div className="relative select-none">
        <div
          className="relative overflow-hidden cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onClick={() => { if (!isDragging.current) setFullscreenIndex(current) }}
        >
          <img src={images[current]} alt={`모형도 ${current + 1}`} className="w-full object-contain" style={{ maxHeight: '260px' }} />
          <div className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2 py-0.5">
            <span className="text-[9px] text-white">눌러서 전체보기</span>
          </div>
        </div>
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-point' : 'w-1.5 h-1.5 bg-border-strong'}`}
              />
            ))}
            <span className="ml-1 text-[10px] text-text-muted">{current + 1} / {images.length}</span>
          </div>
        )}
      </div>

      {fullscreenIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchEndX.current = null }}
          onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX }}
          onTouchEnd={() => {
            if (touchStartX.current === null || touchEndX.current === null) return
            const delta = touchStartX.current - touchEndX.current
            if (Math.abs(delta) >= MIN_SWIPE) setFullscreenIndex((fullscreenIndex + (delta > 0 ? 1 : -1) + images.length) % images.length)
            touchStartX.current = null; touchEndX.current = null
          }}
          onMouseDown={(e) => { touchStartX.current = e.clientX; touchEndX.current = null; isDragging.current = false }}
          onMouseMove={(e) => { if (touchStartX.current === null) return; touchEndX.current = e.clientX; if (Math.abs(e.clientX - touchStartX.current) > 5) isDragging.current = true }}
          onMouseUp={() => {
            if (touchStartX.current === null || touchEndX.current === null) { setFullscreenIndex(null); return }
            const delta = touchStartX.current - touchEndX.current
            if (Math.abs(delta) >= MIN_SWIPE) setFullscreenIndex((fullscreenIndex + (delta > 0 ? 1 : -1) + images.length) % images.length)
            else if (!isDragging.current) setFullscreenIndex(null)
            touchStartX.current = null; touchEndX.current = null
          }}
        >
          <button type="button" onClick={() => setFullscreenIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white text-xl font-bold"
          >✕</button>
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1">
              <span className="text-[11px] font-bold text-white">{fullscreenIndex + 1} / {images.length}</span>
            </div>
          )}
          <img src={images[fullscreenIndex]} alt={`모형도 ${fullscreenIndex + 1}`} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-6 flex items-center gap-1.5">
              {images.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${i === fullscreenIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ── 인스타그램 카드 (썸네일 개별 fetch) ───────────────────────
function InstagramCard({ item }: { item: InstagramMedia }) {
  const isReel = item.type === 'reel'
  // item.thumbnail_url (직접 등록) 우선, 없으면 oEmbed 시도
  const { data, isLoading } = useInstagramOEmbed(item.url, !item.thumbnail_url)
  const thumbnailUrl = item.thumbnail_url ?? data?.thumbnail_url ?? null
  const authorName   = data?.author_name ?? null

  // shortcode 추출 (fallback 표시용)
  const shortcode = (() => {
    const match = item.url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
    return match ? match[1] : null
  })()

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl transition-opacity active:opacity-70"
      style={{
        border: '1px solid var(--border-main)',
        background: 'var(--bg-card)',
        padding: '12px',
        display: 'flex',
      }}
    >
      {/* 썸네일 */}
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-lg"
        style={{
          width: 64,
          height: 64,
          background: 'var(--bg-sub)',
          border: '1px solid var(--border-main)',
        }}
      >
        {isLoading ? (
          // 로딩 shimmer
          <div className="skeleton-shimmer h-full w-full" />
        ) : thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={item.caption ?? (isReel ? 'Instagram Reels' : 'Instagram Post')}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized // 인스타 CDN은 next/image 최적화 불필요
          />
        ) : (
          // 썸네일 없을 때 fallback
          <div className="flex h-full w-full items-center justify-center">
            <BiLogoInstagram size={26} style={{ color: '#E1306C', opacity: 0.7 }} />
          </div>
        )}

        {/* 릴스 배지 */}
        {isReel && (
          <div
            className="absolute bottom-1 right-1 flex items-center justify-center rounded-sm"
            style={{ background: '#7c3aed', width: 16, height: 16 }}
          >
            <BiPlay size={10} style={{ color: '#fff' }} />
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black" style={{ color: 'var(--text-main)' }}>
          {isReel ? 'Instagram Reels' : 'Instagram Post'}
        </p>

        {/* 작성자 */}
        {authorName && (
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--point-color)' }}>
            @{authorName}
          </p>
        )}

        {/* 캡션 or shortcode */}
        {item.caption ? (
          <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-sub)' }}>
            {item.caption}
          </p>
        ) : shortcode && !authorName ? (
          <p className="mt-0.5 truncate text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            /{shortcode.slice(0, 16)}{shortcode.length > 16 ? '…' : ''}
          </p>
        ) : null}
      </div>

      {/* 보기 버튼 */}
      <div
        className="flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
        style={{
          background: 'var(--bg-sub)',
          border: '1px solid var(--border-main)',
          color: 'var(--text-sub)',
        }}
      >
        <BiLinkExternal size={12} />
        보기
      </div>
    </a>
  )
}

// ── 인스타그램 섹션 ───────────────────────────────────────────
function InstagramSection({ media }: { media: InstagramMedia[] }) {
  return (
    <div className="space-y-2 p-4">
      {media.map((item, i) => (
        <InstagramCard key={`${item.url}-${i}`} item={item} />
      ))}
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export function SaunaDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUserStore()
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
        <DetailHero
          id={id} saunaName={sauna.name} saunaAddress={sauna.address} thumbnail={thumbnail}
          isFav={isFav} isFavPending={favMutation.isPending}
          onToggleFav={toggleFav} onShare={handleShare} isUser={!!user}
        />

        <TempHero sauna={sauna} />
        <DetailActions isFav={isFav} onToggleFav={toggleFav} onWriteReview={() => setShowReview(true)} />

        {sauna.rules && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3 bg-bg-card border-b border-border-subtle">
            {sauna.rules.tattoo_allowed && <Tag>🖋️ 타투OK</Tag>}
            {sauna.rules.female_allowed && <Tag>👩 여성가능</Tag>}
            {sauna.rules.male_allowed   && <Tag>👨 남성가능</Tag>}
            {sauna.parking              && <Tag>🅿️ 주차가능</Tag>}
            {sauna.kr_specific?.has_jjimjilbang && <Tag>🧖 찜질방</Tag>}
          </div>
        )}

        <div className="section-divider" />

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
                      {room.has_tv        && <span className="text-[10px] text-text-muted">· 📺 TV</span>}
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

        {sauna.cold_baths?.length > 0 && (
          <Section title="Cold Baths">
            {sauna.cold_baths.map((bath, i) => (
              <div key={i} className="border-b border-border-subtle last:border-0">
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-[13px] font-black text-text-main">냉탕 {i + 1}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[10px] text-text-muted">👥 {bath.capacity}인</span>
                      {bath.depth > 0       && <span className="text-[10px] text-text-muted">· 수심 {bath.depth}cm</span>}
                      {bath.is_groundwater  && <span className="text-[10px] text-text-muted">· 🏔️ 지하수</span>}
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

        {sauna.resting_area && (
          <Section title="Resting Area">
            {sauna.resting_area.outdoor_seats > 0    && <InfoRow label="외기욕 의자"    value={`${sauna.resting_area.outdoor_seats}개`} />}
            {sauna.resting_area.indoor_seats > 0     && <InfoRow label="실내 의자"      value={`${sauna.resting_area.indoor_seats}개`} />}
            {(sauna.resting_area.infinity_chairs ?? 0) > 0 && <InfoRow label="인피니티 의자" value={`${sauna.resting_area.infinity_chairs}개`} />}
            {(sauna.resting_area.deck_chairs ?? 0) > 0     && <InfoRow label="데크 의자"     value={`${sauna.resting_area.deck_chairs}개`} />}
          </Section>
        )}

        {sauna.amenities && (
          <Section title="Amenities">
            <AmenityGrid amenities={sauna.amenities} />
          </Section>
        )}

        {sauna.pricing && (
          <Section title="Pricing">
            {sauna.pricing.adult_day   > 0 && <InfoRow label="성인 (낮)"  value={`${sauna.pricing.adult_day.toLocaleString()}원`} />}
            {sauna.pricing.adult_night > 0 && <InfoRow label="성인 (야간)" value={`${sauna.pricing.adult_night.toLocaleString()}원`} />}
            {sauna.pricing.child       > 0 && <InfoRow label="어린이"      value={`${sauna.pricing.child.toLocaleString()}원`} />}
          </Section>
        )}

        {sauna.kr_specific && (
          <Section title="Korean Special">
            {sauna.kr_specific.sesin_price_male   > 0 && <InfoRow label="때밀이 (남)" value={`${sauna.kr_specific.sesin_price_male.toLocaleString()}원`} />}
            {sauna.kr_specific.sesin_price_female > 0 && <InfoRow label="때밀이 (여)" value={`${sauna.kr_specific.sesin_price_female.toLocaleString()}원`} />}
            {sauna.kr_specific.food?.length > 0        && <InfoRow label="식음료"      value={sauna.kr_specific.food.join(', ')} />}
          </Section>
        )}

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

        {sauna.floor_plan_images?.length > 0 && (
          <>
            <div className="section-divider" />
            <Section title="Floor Plan">
              <FloorPlanSection images={sauna.floor_plan_images} />
            </Section>
          </>
        )}

        {sauna.instagram_media?.length > 0 && (
          <>
            <div className="section-divider" />
            <Section title="Instagram">
              <InstagramSection media={sauna.instagram_media} />
            </Section>
          </>
        )}

        <div className="section-divider" />

        <Section title="사활 기록">
          <ReviewList saunaId={id} onWrite={() => setShowReview(true)} />
        </Section>

        <div className="h-8" />
      </div>

      {showReview && <ReviewBottomSheet sauna={sauna} onClose={() => setShowReview(false)} />}
    </div>
  )
}
