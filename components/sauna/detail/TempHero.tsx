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
      <div className="flex flex-1 flex-col items-center justify-center py-6 px-4">
        <p className="mb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Sauna</p>
        {maxSaunaTemp !== null ? (
          <>
            <div className="temp-display text-6xl text-sauna leading-none">{maxSaunaTemp}</div>
            <p className="mt-1 text-[13px] font-bold text-sauna/60">°C</p>
          </>
        ) : (
          <div className="temp-display text-6xl text-text-muted/30 leading-none">—</div>
        )}
        {sauna.sauna_rooms?.length > 0 && (
          <p className="mt-2 text-[10px] text-text-muted">
            {sauna.sauna_rooms.map((r) => r.type).join(' · ')}
          </p>
        )}
      </div>
      <div className="w-px bg-border-subtle my-6" />
      <div className="flex flex-1 flex-col items-center justify-center py-6 px-4">
        <p className="mb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Cold Bath</p>
        {minColdTemp !== null ? (
          <>
            <div className="temp-display text-6xl text-cold leading-none">{minColdTemp}</div>
            <p className="mt-1 text-[13px] font-bold text-cold/60">°C</p>
          </>
        ) : (
          <div className="temp-display text-6xl text-text-muted/30 leading-none">—</div>
        )}
        {sauna.cold_baths?.some((b) => b.is_groundwater) && (
          <p className="mt-2 text-[10px] text-text-muted">🏔️ 지하수</p>
        )}
      </div>
    </div>
  )
}
