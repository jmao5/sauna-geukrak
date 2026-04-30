'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { SaunaSummaryDto } from '@/types/sauna'
import { BiChevronRight } from 'react-icons/bi'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'

interface SaunaCardProps {
  sauna: SaunaSummaryDto
  className?: string
  /** 'grid' = 카드형(홈), 'row' = 리스트 행(검색) */
  variant?: 'grid' | 'row'
}

function TempPill({ type, temp }: { type: 'sauna' | 'cold'; temp: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <span className="text-[10px]">{type === 'sauna' ? '🔥' : '❄️'}</span>
      <span className={`temp-number text-[13px] font-black ${type === 'sauna' ? 'text-sauna' : 'text-cold'}`}>
        {temp}°
      </span>
    </span>
  )
}

export default function SaunaCard({ sauna, className = '', variant = 'grid' }: SaunaCardProps) {
  const maxSaunaTemp =
    sauna.sauna_rooms?.length > 0 ? Math.max(...sauna.sauna_rooms.map((r) => r.temp)) : null
  const minColdTemp =
    sauna.cold_baths?.length > 0 ? Math.min(...sauna.cold_baths.map((b) => b.temp)) : null

  const features: string[] = []
  if (sauna.sauna_rooms?.some((r) => r.has_auto_loyly)) features.push('오토 로우리')
  if (sauna.cold_baths?.some((b) => b.is_groundwater)) features.push('지하수')
  if (sauna.kr_specific?.has_jjimjilbang) features.push('찜질방')
  if (sauna.rules?.tattoo_allowed) features.push('타투OK')
  if (sauna.rules?.female_allowed) features.push('여성가능')

  const thumbnail = sauna.images?.[0]
  const price = sauna.pricing?.adult_day
  const avgRating = sauna.avg_rating
  const reviewCount = sauna.review_count

  // 뷰포트 진입 전까지 카카오 이미지 fetch 지연 (기존 useIsVisible 인라인 훅 → 공용 훅으로 교체)
  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useIntersectionObserver({
    rootMargin: '100px',
    onObserve: () => setIsVisible(true),
    enabled: !isVisible, // 한 번 진입하면 비활성화
  })
  const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, thumbnail, isVisible)
  const displayImage = thumbnail ?? kakaoImage

  if (variant === 'row') {
    return (
      <Link
        href={`/saunas/${sauna.id}`}
        className={`flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle transition active:bg-bg-sub ${className}`}
      >
        <div ref={observerRef} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-bg-main">
          {displayImage ? (
            <Image src={displayImage} alt={sauna.name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
              <span className="text-xl opacity-30">🧖</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 truncate text-[13px] font-black text-text-main">{sauna.name}</p>
          <p className="mb-1.5 truncate text-[11px] text-text-sub">{sauna.address}</p>
          <div className="flex items-center gap-2">
            {maxSaunaTemp !== null && <TempPill type="sauna" temp={maxSaunaTemp} />}
            {minColdTemp !== null && <TempPill type="cold" temp={minColdTemp} />}
            {price != null && price > 0 && (
              <span className="text-[11px] text-text-muted">{price.toLocaleString()}원~</span>
            )}
            {avgRating != null && (
              <span className="ml-auto text-[11px] font-bold text-yellow-500">⭐ {avgRating.toFixed(1)}</span>
            )}
          </div>
        </div>
        <BiChevronRight size={18} className="flex-shrink-0 text-text-muted" />
      </Link>
    )
  }

  // grid variant
  return (
    <Link
      href={`/saunas/${sauna.id}`}
      className={`sauna-card block overflow-hidden ${className}`}
    >
      <div ref={observerRef} className="relative h-32 w-full overflow-hidden bg-bg-main">
        {displayImage ? (
          <Image src={displayImage} alt={sauna.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 340px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
            <span className="text-3xl opacity-20">🧖</span>
          </div>
        )}
        {(maxSaunaTemp !== null || minColdTemp !== null) && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
            {maxSaunaTemp !== null && <TempPill type="sauna" temp={maxSaunaTemp} />}
            {maxSaunaTemp !== null && minColdTemp !== null && (
              <span className="text-[10px] text-white/40">·</span>
            )}
            {minColdTemp !== null && <TempPill type="cold" temp={minColdTemp} />}
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="mb-0.5 truncate text-[12px] font-black text-text-main">{sauna.name}</p>
        <p className="truncate text-[10px] text-text-sub">{sauna.address}</p>
        {features.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {features.slice(0, 2).map((f) => (
              <span key={f} className="rounded-sm bg-bg-main px-1.5 py-0.5 text-[9px] font-bold text-text-muted">
                {f}
              </span>
            ))}
          </div>
        )}
        {avgRating != null && (
          <p className="mt-1.5 text-[10px] font-bold text-yellow-500">
            ⭐ {avgRating.toFixed(1)}
            {reviewCount != null && reviewCount > 0 && (
              <span className="ml-0.5 font-normal text-text-muted">({reviewCount})</span>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}
