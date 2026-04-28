'use client'

import Link from 'next/link'
import Image from 'next/image'
import { SaunaSummaryDto } from '@/types/sauna'
import { BiChevronRight } from 'react-icons/bi'

interface SaunaCardProps {
  sauna: SaunaSummaryDto & { images?: string[]; rules?: any; kr_specific?: any; pricing?: any }
  className?: string
  /** 'grid' = 카드형(홈), 'row' = 리스트 행(검색) */
  variant?: 'grid' | 'row'
}

function TempPill({ type, temp }: { type: 'sauna' | 'cold'; temp: number }) {
  if (type === 'sauna') {
    return (
      <span className="flex items-center gap-0.5">
        <span className="text-[10px]">🔥</span>
        <span className="temp-number text-[13px] font-black text-sauna">{temp}°</span>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-0.5">
      <span className="text-[10px]">❄️</span>
      <span className="temp-number text-[13px] font-black text-cold">{temp}°</span>
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

  if (variant === 'row') {
    return (
      <Link href={`/saunas/${sauna.id}`} className={`sauna-row flex items-center gap-3 px-4 py-3.5 ${className}`}>
        {/* 썸네일 */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
          {thumbnail ? (
            <img src={thumbnail} alt={sauna.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
              <span className="text-xl opacity-30">🧖</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 truncate text-[13px] font-black text-text-main">{sauna.name}</p>
          <p className="mb-1.5 truncate text-[11px] text-text-sub">{sauna.address}</p>
          <div className="flex items-center gap-2">
            {maxSaunaTemp !== null && <TempPill type="sauna" temp={maxSaunaTemp} />}
            {minColdTemp !== null && <TempPill type="cold" temp={minColdTemp} />}
            {price && (
              <span className="text-[11px] text-text-muted">
                {price.toLocaleString()}원~
              </span>
            )}
          </div>
        </div>

        <BiChevronRight size={18} className="flex-shrink-0 text-text-muted" />
      </Link>
    )
  }

  // grid variant (카드형)
  return (
    <Link href={`/saunas/${sauna.id}`} className={`sauna-card block overflow-hidden ${className}`}>
      {/* 이미지 */}
      <div className="relative h-32 w-full overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={sauna.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
            <span className="text-3xl opacity-20">🧖</span>
          </div>
        )}
        {/* 온도 오버레이 */}
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

      {/* 텍스트 */}
      <div className="p-3">
        <p className="mb-0.5 truncate text-[12px] font-black text-text-main">{sauna.name}</p>
        <p className="truncate text-[10px] text-text-sub">{sauna.address}</p>
        {features.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {features.slice(0, 2).map((f) => (
              <span
                key={f}
                className="rounded-sm bg-bg-main px-1.5 py-0.5 text-[9px] font-bold text-text-muted"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
