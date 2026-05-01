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
  variant?: 'grid' | 'row'
}

function TempPill({ type, temp }: { type: 'sauna' | 'cold'; temp: number }) {
  const isSauna = type === 'sauna'
  return (
    <span
      className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
      style={
        isSauna
          ? {
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.2)',
            }
          : {
              background: 'rgba(14,165,233,0.10)',
              border: '1px solid rgba(14,165,233,0.2)',
            }
      }
    >
      <span className="text-[9px]">{isSauna ? '🔥' : '❄️'}</span>
      <span
        className="temp-number text-[11px]"
        style={{ color: isSauna ? '#f97316' : '#0ea5e9' }}
      >
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

  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useIntersectionObserver({
    rootMargin: '100px',
    onObserve: () => setIsVisible(true),
    enabled: !isVisible,
  })
  const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, thumbnail, isVisible)
  const displayImage = thumbnail ?? kakaoImage

  if (variant === 'row') {
    return (
      <Link
        href={`/saunas/${sauna.id}`}
        className={`sauna-row flex items-center gap-4 px-5 py-4 transition-all duration-200 ${className}`}
      >
        {/* 썸네일 */}
        <div
          ref={observerRef}
          className="relative flex-shrink-0 overflow-hidden"
          style={{
            width: 64,
            height: 64,
            borderRadius: '0.875rem',
            border: '1px solid #e0f2fe',
            boxShadow: '0 2px 8px rgba(14,165,233,0.08)',
          }}
        >
          {displayImage ? (
            <Image src={displayImage} alt={sauna.name} fill className="object-cover" sizes="64px" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' }}
            >
              <span className="text-xl" style={{ opacity: 0.4 }}>🧖</span>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 truncate text-[13px] font-black" style={{ color: '#0c1a2e' }}>
            {sauna.name}
          </p>
          <p className="mb-2 truncate text-[11px]" style={{ color: '#7ba4c7' }}>
            {sauna.address}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {maxSaunaTemp !== null && <TempPill type="sauna" temp={maxSaunaTemp} />}
            {minColdTemp !== null && <TempPill type="cold" temp={minColdTemp} />}
            {price != null && price > 0 && (
              <span className="text-[10px]" style={{ color: '#7ba4c7' }}>
                {price.toLocaleString()}원~
              </span>
            )}
            {avgRating != null && (
              <span className="ml-auto text-[10px] font-bold" style={{ color: '#f59e0b' }}>
                ⭐ {avgRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <BiChevronRight size={18} style={{ color: '#bae6fd', flexShrink: 0 }} />
      </Link>
    )
  }

  // grid variant
  return (
    <Link
      href={`/saunas/${sauna.id}`}
      className={`sauna-card group block overflow-hidden ${className}`}
    >
      {/* 이미지 영역 */}
      <div ref={observerRef} className="relative h-36 w-full overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={sauna.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 50vw, 340px"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%)',
            }}
          >
            <span className="text-3xl" style={{ opacity: 0.2 }}>🧖</span>
          </div>
        )}

        {/* 온도 배지 */}
        {(maxSaunaTemp !== null || minColdTemp !== null) && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1"
            style={{
              background: 'rgba(4,13,26,0.55)',
              backdropFilter: 'blur(8px)',
              borderRadius: '999px',
              padding: '3px 8px',
              border: '1px solid rgba(186,230,253,0.15)',
            }}
          >
            {maxSaunaTemp !== null && (
              <span className="temp-number text-[11px]" style={{ color: '#fed7aa' }}>
                🔥{maxSaunaTemp}°
              </span>
            )}
            {maxSaunaTemp !== null && minColdTemp !== null && (
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>·</span>
            )}
            {minColdTemp !== null && (
              <span className="temp-number text-[11px]" style={{ color: '#bae6fd' }}>
                ❄️{minColdTemp}°
              </span>
            )}
          </div>
        )}
      </div>

      {/* 카드 바디 */}
      <div className="p-3">
        <p
          className="mb-0.5 truncate text-[12px] font-black leading-tight"
          style={{ color: '#0c1a2e' }}
        >
          {sauna.name}
        </p>
        <p className="truncate text-[10px]" style={{ color: '#7ba4c7' }}>
          {sauna.address}
        </p>

        {/* 특징 태그 */}
        {features.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {features.slice(0, 2).map((f) => (
              <span
                key={f}
                className="text-[9px] font-bold rounded-md px-1.5 py-0.5"
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* 별점 */}
        {avgRating != null && (
          <p className="mt-1.5 text-[10px] font-bold" style={{ color: '#f59e0b' }}>
            ⭐ {avgRating.toFixed(1)}
            {reviewCount != null && reviewCount > 0 && (
              <span className="ml-0.5 font-normal" style={{ color: '#7ba4c7' }}>
                ({reviewCount})
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}
