'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { SaunaSummaryDto } from '@/types/sauna'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'

interface SaunaCardProps {
  sauna: SaunaSummaryDto
  className?: string
  variant?: 'grid' | 'row'
}

export default function SaunaCard({ sauna, className = '', variant = 'grid' }: SaunaCardProps) {
  const maxSaunaTemp = sauna.sauna_rooms?.length
    ? Math.max(...sauna.sauna_rooms.map((r) => r.temp))
    : null
  const minColdTemp = sauna.cold_baths?.length
    ? Math.min(...sauna.cold_baths.map((b) => b.temp))
    : null
  const maxCapacity = sauna.sauna_rooms?.length
    ? Math.max(...sauna.sauna_rooms.map((r) => r.capacity))
    : null

  const features: string[] = []
  if (sauna.sauna_rooms?.some((r) => r.has_auto_loyly)) features.push('오토 로우리')
  if (sauna.cold_baths?.some((b) => b.is_groundwater))  features.push('지하수')
  if (sauna.kr_specific?.has_jjimjilbang)               features.push('찜질방')
  if (sauna.rules?.tattoo_allowed)                       features.push('타투 OK')
  if (sauna.rules?.female_allowed)                       features.push('여성 가능')

  const thumbnail   = sauna.images?.[0]
  const price       = sauna.pricing?.adult_day
  const avgRating   = sauna.avg_rating
  const reviewCount = sauna.review_count

  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useIntersectionObserver({
    rootMargin: '100px',
    onObserve: () => setIsVisible(true),
    enabled: !isVisible,
  })
  const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, thumbnail, isVisible)
  const displayImage = thumbnail ?? kakaoImage

  // 성별 제공 여부
  const hasMale   = sauna.rules?.male_allowed   !== false
  const hasFemale = sauna.rules?.female_allowed

  /* ── row ── */
  if (variant === 'row') {
    return (
      <Link href={`/saunas/${sauna.id}`} className={`flex items-center gap-3.5 px-4 py-4 border-b border-border-subtle bg-bg-card transition active:opacity-70 ${className}`}>
        {/* 썸네일 */}
        <div ref={observerRef} className="relative flex-shrink-0 overflow-hidden rounded-xl border border-border-main" style={{ width: 64, height: 64, background: 'var(--bg-sub)' }}>
          {displayImage ? (
            <Image src={displayImage} alt={sauna.name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-2xl opacity-10">♨</span>
            </div>
          )}
          {/* 성별 뱃지 */}
          <div className="absolute bottom-0.5 left-0.5 flex gap-0.5">
            {hasMale   && <span className="rounded-sm bg-point/90 px-1 py-0.5 text-[8px] font-black text-white">남</span>}
            {hasFemale && <span className="rounded-sm bg-pink-500/90 px-1 py-0.5 text-[8px] font-black text-white">여</span>}
          </div>
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-text-main leading-tight">{sauna.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-text-muted">{sauna.address}</p>

          {/* 온도 + 가격 */}
          <div className="mt-1.5 flex items-center gap-3">
            {maxSaunaTemp !== null && (
              <div className="flex items-baseline gap-0.5">
                <span className="temp-number text-[13px] text-sauna">{maxSaunaTemp}</span>
                <span className="text-[9px] font-bold text-sauna/50">°</span>
              </div>
            )}
            {minColdTemp !== null && (
              <div className="flex items-baseline gap-0.5">
                <span className="temp-number text-[13px] text-cold">{minColdTemp}</span>
                <span className="text-[9px] font-bold text-cold/50">°</span>
              </div>
            )}
            {price != null && price > 0 && (
              <span className="text-[10px] text-text-muted">¥ {price.toLocaleString()}~</span>
            )}
            {avgRating != null && (
              <span className="ml-auto text-[11px] font-black text-gold tabular-nums">★{avgRating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  /* ── grid ── */
  return (
    <Link href={`/saunas/${sauna.id}`} className={`sauna-card group block ${className}`}>
      {/* 이미지 */}
      <div ref={observerRef} className="relative w-full overflow-hidden bg-bg-sub" style={{ height: 130 }}>
        {displayImage ? (
          <Image
            src={displayImage}
            alt={sauna.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 50vw, 320px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl opacity-10">♨</span>
          </div>
        )}

        {/* 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* 성별 뱃지 — 좌상단 */}
        <div className="absolute left-2 top-2 flex gap-1">
          {hasMale   && <span className="rounded-md bg-point/90 px-1.5 py-0.5 text-[9px] font-black text-white">남</span>}
          {hasFemale && <span className="rounded-md bg-pink-500/90 px-1.5 py-0.5 text-[9px] font-black text-white">여</span>}
        </div>

        {/* 별점 — 우상단 */}
        {avgRating != null && (
          <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md bg-black/50 px-1.5 py-0.5">
            <span className="text-[9px] text-gold">★</span>
            <span className="temp-number text-[10px] text-white">{avgRating.toFixed(1)}</span>
          </div>
        )}

        {/* 온도 — 하단 */}
        <div className="absolute bottom-2 left-0 right-0 flex items-end justify-between px-2">
          <div className="flex items-end gap-2">
            {maxSaunaTemp !== null && (
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-sauna/80 uppercase">♨</span>
                <span className="temp-number text-[18px] leading-none text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                  {maxSaunaTemp}°
                </span>
              </div>
            )}
            {minColdTemp !== null && (
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-cold/80 uppercase">❄</span>
                <span className="temp-number text-[18px] leading-none text-cold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                  {minColdTemp}°
                </span>
              </div>
            )}
          </div>
          {price != null && price > 0 && (
            <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white/90">
              {price.toLocaleString()}원~
            </span>
          )}
        </div>
      </div>

      {/* 바디 */}
      <div className="p-2.5 pb-3">
        <p className="truncate text-[12px] font-black text-text-main leading-tight">{sauna.name}</p>
        <p className="mt-0.5 truncate text-[10px] text-text-muted">{sauna.address}</p>

        {/* 스펙 칩 */}
        {features.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {features.slice(0, 2).map((f) => (
              <span key={f} className="rounded-md border border-border-main bg-bg-sub px-1.5 py-0.5 text-[9px] font-bold text-text-sub">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
