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

  const features: string[] = []
  if (sauna.sauna_rooms?.some((r) => r.has_auto_loyly)) features.push('오토 로우리')
  if (sauna.cold_baths?.some((b) => b.is_groundwater))  features.push('지하수')
  if (sauna.kr_specific?.has_jjimjilbang)               features.push('찜질방')
  if (sauna.rules?.tattoo_allowed)                       features.push('타투 OK')
  if (sauna.rules?.female_allowed)                       features.push('여성 가능')

  const thumbnail  = sauna.images?.[0]
  const price      = sauna.pricing?.adult_day
  const avgRating  = sauna.avg_rating
  const reviewCount = sauna.review_count

  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useIntersectionObserver({
    rootMargin: '100px',
    onObserve: () => setIsVisible(true),
    enabled: !isVisible,
  })
  const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, thumbnail, isVisible)
  const displayImage = thumbnail ?? kakaoImage

  /* ── row ── */
  if (variant === 'row') {
    return (
      <Link
        href={`/saunas/${sauna.id}`}
        className={`sauna-row flex items-center gap-4 px-5 py-4 ${className}`}
      >
        {/* 썸네일 */}
        <div
          ref={observerRef}
          className="relative flex-shrink-0 overflow-hidden rounded-lg"
          style={{
            width: 60,
            height: 60,
            background: 'var(--bg-sub)',
            border: '1px solid var(--border-main)',
          }}
        >
          {displayImage ? (
            <Image src={displayImage} alt={sauna.name} fill className="object-cover" sizes="60px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span style={{ fontSize: 20, opacity: 0.15 }}>♨</span>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-black leading-tight"
            style={{ color: 'var(--text-main)', letterSpacing: '-0.01em' }}
          >
            {sauna.name}
          </p>
          <p
            className="mt-0.5 truncate text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {sauna.address}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            {maxSaunaTemp !== null && (
              <span
                className="temp-number text-[11px]"
                style={{ color: 'var(--sauna-color)' }}
              >
                {maxSaunaTemp}°
              </span>
            )}
            {minColdTemp !== null && (
              <span
                className="temp-number text-[11px]"
                style={{ color: 'var(--point-color)' }}
              >
                {minColdTemp}°
              </span>
            )}
            {price != null && price > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {price.toLocaleString()}원~
              </span>
            )}
            {avgRating != null && (
              <span
                className="ml-auto text-[11px] font-black tabular-nums"
                style={{ color: 'var(--text-sub)' }}
              >
                ★{avgRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  /* ── grid ── */
  return (
    <Link
      href={`/saunas/${sauna.id}`}
      className={`sauna-card group block ${className}`}
    >
      {/* 이미지 */}
      <div
        ref={observerRef}
        className="relative w-full overflow-hidden"
        style={{ height: 120, background: 'var(--bg-sub)' }}
      >
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
            <span style={{ fontSize: 28, opacity: 0.1 }}>♨</span>
          </div>
        )}

        {/* 온도 — 우하단, 심플하게 */}
        {(maxSaunaTemp !== null || minColdTemp !== null) && (
          <div
            className="absolute bottom-2 right-2.5 flex items-baseline gap-2"
          >
            {maxSaunaTemp !== null && (
              <span
                className="temp-number text-[13px]"
                style={{
                  color: '#fff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {maxSaunaTemp}°
              </span>
            )}
            {minColdTemp !== null && (
              <span
                className="temp-number text-[13px]"
                style={{
                  color: '#90c8ff',
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {minColdTemp}°
              </span>
            )}
          </div>
        )}
      </div>

      {/* 바디 */}
      <div className="p-2.5">
        <p
          className="truncate text-[12px] font-black leading-tight"
          style={{ color: 'var(--text-main)', letterSpacing: '-0.01em' }}
        >
          {sauna.name}
        </p>
        <p
          className="mt-0.5 truncate text-[10px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {sauna.address}
        </p>

        {/* 태그 — 최대 1개만, 작게 */}
        {features.length > 0 && (
          <span
            className="mt-1.5 inline-block rounded text-[9px] font-bold px-1.5 py-0.5"
            style={{
              background: 'var(--cold-bg)',
              color: 'var(--point-color)',
              border: '1px solid var(--border-main)',
            }}
          >
            {features[0]}
          </span>
        )}

        {/* 별점 */}
        {avgRating != null && (
          <p
            className="mt-1 text-[10px] font-bold tabular-nums"
            style={{ color: 'var(--text-sub)' }}
          >
            ★{avgRating.toFixed(1)}
            {reviewCount != null && reviewCount > 0 && (
              <span className="ml-0.5 font-normal" style={{ color: 'var(--text-muted)' }}>
                ({reviewCount})
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}
