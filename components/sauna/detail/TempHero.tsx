'use client'

import type { SaunaDto } from '@/types/sauna'

export function TempHero({ sauna }: { sauna: SaunaDto }) {
  const maxSaunaTemp =
    sauna.sauna_rooms?.length > 0
      ? Math.max(...sauna.sauna_rooms.map((r) => r.temp))
      : null
  const minColdTemp =
    sauna.cold_baths?.length > 0
      ? Math.min(...sauna.cold_baths.map((b) => b.temp))
      : null

  return (
    <div className="flex items-stretch bg-bg-card border-b border-border-subtle">
      {/* 사우나 온도 */}
      <div className="group flex flex-1 flex-col items-center justify-center py-7 px-4 transition-colors duration-200 hover:bg-sauna-bg/40">
        <p className="mb-2.5 text-[10px] font-black tracking-widest text-text-muted uppercase">Sauna</p>
        {maxSaunaTemp !== null ? (
          <>
            <div className="temp-display text-6xl text-sauna leading-none tabular-nums">
              {maxSaunaTemp}
            </div>
            <p className="mt-1.5 text-[13px] font-bold text-sauna/50">°C</p>
          </>
        ) : (
          <div className="temp-display text-6xl text-text-muted/20 leading-none">—</div>
        )}
        {sauna.sauna_rooms?.length > 0 && (
          <p className="mt-2.5 text-[10px] text-text-muted text-center leading-relaxed">
            {sauna.sauna_rooms.map((r) => r.type).join(' · ')}
          </p>
        )}
      </div>

      {/* 구분선 */}
      <div className="w-px bg-border-subtle my-6" />

      {/* 냉탕 온도 */}
      <div className="group flex flex-1 flex-col items-center justify-center py-7 px-4 transition-colors duration-200 hover:bg-cold-bg/40">
        <p className="mb-2.5 text-[10px] font-black tracking-widest text-text-muted uppercase">Cold Bath</p>
        {minColdTemp !== null ? (
          <>
            <div className="temp-display text-6xl text-cold leading-none tabular-nums">
              {minColdTemp}
            </div>
            <p className="mt-1.5 text-[13px] font-bold text-cold/50">°C</p>
          </>
        ) : (
          <div className="temp-display text-6xl text-text-muted/20 leading-none">—</div>
        )}
        {sauna.cold_baths?.some((b) => b.is_groundwater) && (
          <p className="mt-2.5 text-[10px] text-text-muted">🏔️ 지하수</p>
        )}
      </div>
    </div>
  )
}
