'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { SaunaSummaryDto } from '@/types/sauna'
import { BiChevronRight } from 'react-icons/bi'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'

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

/**
 * 뷰포트에 진입한 순간 한 번만 true로 바뀌는 훅.
 * 카드가 화면에 보일 때만 카카오 이미지를 fetch하기 위해 사용.
 */
function useIsVisible(rootMargin = '100px') {
  const ref = useRef<HTMLAnchorElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // 한 번 진입하면 더 이상 감시 불필요
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isVisible, rootMargin])

  return { ref, isVisible }
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

  // 뷰포트 진입 전까지 카카오 이미지 fetch 지연
  const { ref, isVisible } = useIsVisible()
  const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, thumbnail, isVisible)
  const displayImage = thumbnail ?? kakaoImage

  if (variant === 'row') {
    return (
      <Link
        ref={ref}
        href={`/saunas/${sauna.id}`}
        className={`flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle transition active:bg-bg-sub ${className}`}
      >
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-bg-main">
          {displayImage ? (
            <img src={displayImage} alt={sauna.name} className="h-full w-full object-cover" />
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
          </div>
        </div>
        <BiChevronRight size={18} className="flex-shrink-0 text-text-muted" />
      </Link>
    )
  }

  // grid variant
  return (
    <Link
      ref={ref}
      href={`/saunas/${sauna.id}`}
      className={`sauna-card block overflow-hidden ${className}`}
    >
      <div className="relative h-32 w-full overflow-hidden bg-bg-main">
        {displayImage ? (
          <img src={displayImage} alt={sauna.name} className="h-full w-full object-cover" />
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
      </div>
    </Link>
  )
}
