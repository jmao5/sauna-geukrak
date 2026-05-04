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
  preferredGender?: 'male' | 'female'
  priority?: boolean
}

// 성별별 데이터 추출
function getGenderData(sauna: SaunaSummaryDto, gender: 'male' | 'female') {
  const rooms = (sauna.sauna_rooms ?? []).filter((r) => {
    const g = (r as any).gender ?? 'male'
    return g === 'both' || g === gender
  })
  const baths = (sauna.cold_baths ?? []).filter((b) => {
    const g = (b as any).gender ?? 'male'
    return g === 'both' || g === gender
  })

  const saunaTemp  = rooms.length ? Math.max(...rooms.map((r) => r.temp)) : null
  const coldTemp   = baths.length ? Math.min(...baths.map((b) => b.temp)) : null
  const hasOutdoor = (sauna as any).resting_area
    ? ((sauna as any).resting_area.outdoor_seats ?? 0) > 0
    : false
  const hasLoyly   = rooms.some((r) => r.has_auto_loyly || r.has_self_loyly)

  return { saunaTemp, coldTemp, hasOutdoor, hasLoyly, hasRooms: rooms.length > 0 }
}

// 온도/시설 행 컴포넌트
function GenderRow({ label, color, data }: {
  label: '남' | '여'
  color: string
  data: ReturnType<typeof getGenderData>
}) {
  if (!data.hasRooms && data.saunaTemp === null && data.coldTemp === null) return null

  const cell = (val: number | null, unit: string, colorClass: string) =>
    val !== null ? (
      <span className={`font-black ${colorClass}`}>
        {unit}<span className="temp-number">{val}</span>
      </span>
    ) : (
      <span className="text-text-muted">
        {unit}<span>–</span>
      </span>
    )

  return (
    <div className="flex items-center gap-2">
      {/* 성별 뱃지 */}
      <span
        className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black text-white"
        style={{ background: color }}
      >
        {label}
      </span>

      {/* 사우나 온도 */}
      <span className="text-[11px] text-text-muted">사</span>
      {cell(data.saunaTemp, '', 'text-sauna text-[12px]')}

      {/* 냉탕 온도 */}
      <span className="text-[11px] text-text-muted ml-1">냉</span>
      {cell(data.coldTemp, '', 'text-cold text-[12px]')}

      {/* 외기욕 */}
      <span className="text-[11px] text-text-muted ml-1">외</span>
      <span className={`text-[11px] font-bold ${data.hasOutdoor ? 'text-text-main' : 'text-text-muted'}`}>
        {data.hasOutdoor ? '○' : '–'}
      </span>

      {/* 로우리 */}
      <span className="text-[11px] text-text-muted ml-1">로</span>
      <span className={`text-[11px] font-bold ${data.hasLoyly ? 'text-text-main' : 'text-text-muted'}`}>
        {data.hasLoyly ? '○' : '–'}
      </span>
    </div>
  )
}

export default function SaunaCard({ sauna, className = '', variant = 'grid', preferredGender, priority = false }: SaunaCardProps) {
  const filteredRooms = preferredGender 
    ? (sauna.sauna_rooms ?? []).filter(r => (r as any).gender === 'both' || (r as any).gender === preferredGender)
    : sauna.sauna_rooms
  const filteredBaths = preferredGender 
    ? (sauna.cold_baths ?? []).filter(b => (b as any).gender === 'both' || (b as any).gender === preferredGender)
    : sauna.cold_baths

  const maxSaunaTemp = filteredRooms?.length ? Math.max(...filteredRooms.map((r) => r.temp)) : null
  const minColdTemp = filteredBaths?.length ? Math.min(...filteredBaths.map((b) => b.temp)) : null

  const features: string[] = []
  if (sauna.sauna_rooms?.some((r) => r.has_auto_loyly)) features.push('오토 로우리')
  if (sauna.cold_baths?.some((b) => b.is_groundwater))  features.push('지하수')
  if (sauna.kr_specific?.has_jjimjilbang)               features.push('찜질방')
  if (sauna.rules?.tattoo_allowed)                       features.push('타투 OK')

  const thumbnail   = sauna.images?.[0]
  const price       = sauna.pricing?.adult_day
  const avgRating   = sauna.avg_rating
  const reviewCount = sauna.review_count

  const [isVisible, setIsVisible] = useState(false)
  const observerRef = useIntersectionObserver({
    rootMargin: '300px',
    onObserve: () => setIsVisible(true),
    enabled: !isVisible,
  })
  const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, thumbnail, isVisible)
  const displayImage = thumbnail ?? kakaoImage

  const hasMale   = sauna.rules?.male_allowed !== false
  const hasFemale = !!sauna.rules?.female_allowed

  /* ── row ── */
  if (variant === 'row') {
    const maleData   = hasMale && (!preferredGender || preferredGender === 'male') ? getGenderData(sauna, 'male')   : null
    const femaleData = hasFemale && (!preferredGender || preferredGender === 'female') ? getGenderData(sauna, 'female') : null

    return (
      <Link
        href={`/saunas/${sauna.id}`}
        className={`flex gap-3.5 px-4 py-4 border-b border-border-subtle bg-bg-card transition active:opacity-70 ${className}`}
      >
        {/* 썸네일 */}
        <div
          ref={observerRef}
          className="relative flex-shrink-0 overflow-hidden rounded-xl border border-border-main"
          style={{ width: 84, height: 84, background: 'var(--bg-sub)' }}
        >
          {displayImage ? (
            <Image src={displayImage} alt={sauna.name} fill className="object-cover" sizes="84px"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl opacity-10">♨</span>
            </div>
          )}
          {/* 별점 */}
          {avgRating != null && (
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5">
              <span className="text-[8px] text-gold">★</span>
              <span className="text-[9px] font-black text-white">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0 flex-1">
          {/* 이름 */}
          <p className="truncate text-[14px] font-black text-text-main leading-tight">{sauna.name}</p>
          {/* 주소 */}
          <p className="mt-0.5 truncate text-[11px] text-text-muted">{sauna.address}</p>

          {/* 남/여 분리 온도 데이터 */}
          <div className="mt-2 space-y-1">
            {maleData && (
              <GenderRow label="남" color="var(--point-color)" data={maleData} />
            )}
            {femaleData && (
              <GenderRow label="여" color="#ec4899" data={femaleData} />
            )}
          </div>

          {/* 가격 + 피처 태그 */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {price != null && price > 0 && (
              <span className="text-[11px] font-bold text-text-sub">
                💰 {price.toLocaleString()}원~
              </span>
            )}
            {features.slice(0, 2).map((f) => (
              <span
                key={f}
                className="rounded-md border border-border-main bg-bg-sub px-1.5 py-0.5 text-[9px] font-bold text-text-sub"
              >
                {f}
              </span>
            ))}
          </div>

          {/* 사활 */}
          {(reviewCount != null && reviewCount > 0) && (
            <div className="mt-1.5 flex items-center gap-3">
              <span className="text-[11px] text-text-muted">
                사활 <span className="font-black text-point tabular-nums">{reviewCount.toLocaleString()}</span>
              </span>
            </div>
          )}
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
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl opacity-10">♨</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* 성별 뱃지 */}
        <div className="absolute left-2 top-2 flex gap-1">
          {hasMale   && <span className="rounded-md bg-point/90 px-1.5 py-0.5 text-[9px] font-black text-white">남</span>}
          {hasFemale && <span className="rounded-md bg-pink-500/90 px-1.5 py-0.5 text-[9px] font-black text-white">여</span>}
        </div>

        {/* 별점 */}
        {avgRating != null && (
          <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md bg-black/50 px-1.5 py-0.5">
            <span className="text-[9px] text-gold">★</span>
            <span className="temp-number text-[10px] text-white">{avgRating.toFixed(1)}</span>
          </div>
        )}

        {/* 온도 */}
        <div className="absolute bottom-2 left-0 right-0 flex items-end justify-between px-2">
          <div className="flex items-end gap-2">
            {maxSaunaTemp !== null && (
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-sauna/80 uppercase">♨</span>
                <span className="temp-number text-[18px] leading-none text-sauna" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
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
        
        {/* 사활 & 별점 */}
        <div className="mt-1.5 flex items-center gap-2">
          {reviewCount != null && reviewCount > 0 && (
            <span className="text-[10px] text-text-muted">
              사활 <span className="font-black text-point">{reviewCount.toLocaleString()}</span>
            </span>
          )}
          {avgRating != null && (
            <span className="text-[10px] text-text-muted">
              ★ <span className="font-black text-text-main">{avgRating.toFixed(1)}</span>
            </span>
          )}
        </div>

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
