'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BiBookmark, BiChevronLeft, BiEdit, BiMap,
  BiShare, BiSolidBookmark,
} from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
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

// ── 메인 ─────────────────────────────────────────────────────
export function SaunaDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const [showReview, setShowReview] = useState(false)

  // ── 찜 ───────────────────────────────────────────────────
  const { data: isFav = false } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: () => (user ? checkFavorite(user.id, id) : Promise.resolve(false)),
    enabled: !!user && !!id,
  })

  const favMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not_logged_in')
      if (isFav) {
        await removeFavorite(user.id, id)
        return 'removed' as const
      } else {
        await addFavorite(user.id, id)
        return 'added' as const
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorite', id, user?.id] })
      const prev = queryClient.getQueryData(['favorite', id, user?.id])
      queryClient.setQueryData(['favorite', id, user?.id], !isFav)
      return { prev }
    },
    onSuccess: (status) => {
      if (status === 'removed') toast.success('찜 목록에서 제거했어요')
      if (status === 'added') toast.success('찜 목록에 추가했어요 ❤️')
    },
    onError: (error: Error, _, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(['favorite', id, user?.id], ctx.prev)
      }
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

  // ── 공유 ─────────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: sauna?.name ?? '사우나 극락', text: '여기 사우나 어때요?', url })
      } catch {
        // 사용자가 공유 취소한 경우 무시
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('링크가 복사되었습니다')
    }
  }

  // ── 데이터 ───────────────────────────────────────────────
  const { data: sauna, isLoading, isError } = useQuery<SaunaDto>({
    queryKey: ['sauna', id],
    queryFn: () => getSaunaById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: kakaoImage } = useKakaoSaunaImage(
    sauna?.name ?? '',
    sauna?.address,
    sauna?.images?.[0]
  )

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

  const thumbnail = sauna.images?.[0] ?? kakaoImage

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <DetailHero
          id={id}
          saunaName={sauna.name}
          saunaAddress={sauna.address}
          thumbnail={thumbnail}
          isFav={isFav}
          isFavPending={favMutation.isPending}
          onToggleFav={toggleFav}
          onShare={handleShare}
          isUser={!!user}
        />

        <TempHero sauna={sauna} />

        <DetailActions
          isFav={isFav}
          onToggleFav={toggleFav}
          onWriteReview={() => setShowReview(true)}
        />

        {/* 태그 */}
        {sauna.rules && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3 bg-bg-card border-b border-border-subtle">
            {sauna.rules.tattoo_allowed && <Tag>🖋️ 타투OK</Tag>}
            {sauna.rules.female_allowed && <Tag>👩 여성가능</Tag>}
            {sauna.rules.male_allowed && <Tag>👨 남성가능</Tag>}
            {sauna.parking && <Tag>🅿️ 주차가능</Tag>}
            {sauna.kr_specific?.has_jjimjilbang && <Tag>🧖 찜질방</Tag>}
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
              <a href={`tel:${sauna.contact}`} className="text-[12px] font-bold text-point">
                {sauna.contact}
              </a>
            </div>
          )}
          <InfoRow label="주차" value={sauna.parking ? '가능' : '불가'} />
        </Section>

        <div className="section-divider" />

        {/* 사활 기록 목록 */}
        <Section title="사활 기록">
          <ReviewList saunaId={id} onWrite={() => setShowReview(true)} />
        </Section>

        <div className="h-8" />
      </div>

      {showReview && (
        <ReviewBottomSheet sauna={sauna} onClose={() => setShowReview(false)} />
      )}
    </div>
  )
}
