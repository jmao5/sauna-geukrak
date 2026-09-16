'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BiChevronRight } from 'react-icons/bi'
import { getThemeSaunas } from '@/app/actions/sauna.actions'
import { THEMES, ThemeId } from '@/constants/home'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { SaunaSummaryDto } from '@/types/sauna'
import SaunaCard from '@/components/sauna/SaunaCard'
import Skeleton from '@/components/ui/Skeleton'
import { hapticFeedback } from '@/utils/haptic'

// 카드 자체에 안 보이는 테마 값(세신 요금)만 캡션으로 보강
function getThemeCaption(theme: ThemeId, sauna: SaunaSummaryDto): string | null {
  if (theme !== 'sesin') return null
  const prices = [sauna.kr_specific?.sesin_price_male, sauna.kr_specific?.sesin_price_female]
    .filter((p): p is number => typeof p === 'number' && p > 0)
  if (!prices.length) return null
  return `세신 ${Math.min(...prices).toLocaleString()}원~`
}

export default function ThemeCuration() {
  const { data, isLoading } = useQuery({
    queryKey: ['theme-saunas'],
    queryFn: () => getThemeSaunas(),
    staleTime: 1000 * 60 * 5,
  })
  const { toggleCondition, setSortKey } = useHomeFilterStore()
  const [selectedId, setSelectedId] = useState<ThemeId | null>(null)

  const available = THEMES.filter((t) => (data?.[t.id]?.length ?? 0) > 0)
  if (!isLoading && available.length === 0) return null

  const active = available.find((t) => t.id === selectedId) ?? available[0]
  const saunas = active ? data?.[active.id] ?? [] : []

  const handleMore = () => {
    if (!active?.action) return
    hapticFeedback('light')
    if (active.action.type === 'condition') toggleCondition(active.action.value)
    else setSortKey(active.action.value)
  }

  return (
    <section className="border-b border-border-main bg-bg-card py-3 select-none">
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-baseline gap-1.5">
          <h2 className="text-[12px] font-black tracking-tight text-text-main">테마별 사우나</h2>
          {active && <span className="text-[10px] font-bold text-text-muted">{active.description}</span>}
        </div>
        {active?.action && (
          <button
            type="button"
            onClick={handleMore}
            className="flex items-center text-[11px] font-bold text-point transition active:opacity-70"
          >
            전체 보기 <BiChevronRight size={13} />
          </button>
        )}
      </div>

      {/* 테마 칩 */}
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 scrollbar-hide">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="skeleton-shimmer flex-shrink-0 rounded-full" width={92} height={28} />
            ))
          : available.map((theme) => {
              const isActive = theme.id === active?.id
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => { hapticFeedback('light'); setSelectedId(theme.id) }}
                  className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black transition active:scale-95 shadow-xs ${
                    isActive ? 'bg-point text-white ring-1 ring-point' : 'border border-border-main bg-bg-main text-text-sub hover:bg-bg-sub'
                  }`}
                >
                  <span>{theme.emoji}</span>{theme.label}
                </button>
              )
            })}
      </div>

      {/* 카드 레일 */}
      <div
        className="flex gap-2.5 overflow-x-auto px-4 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="skeleton-shimmer flex-shrink-0 rounded-lg" width={160} height={210} />
            ))
          : saunas.map((sauna, idx) => {
              const caption = active ? getThemeCaption(active.id, sauna) : null
              return (
                <div key={sauna.id} className="w-[160px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-black text-white">
                      {idx + 1}
                    </span>
                    <SaunaCard sauna={sauna} variant="grid" />
                  </div>
                  {caption && (
                    <p className="mt-1 truncate px-0.5 text-[10.5px] font-bold text-text-sub">{caption}</p>
                  )}
                </div>
              )
            })}
      </div>
    </section>
  )
}
