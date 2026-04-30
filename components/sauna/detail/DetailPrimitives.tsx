import type { SaunaDto } from '@/types/sauna'

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border-main bg-bg-main px-3 py-1 text-[10px] font-bold text-text-sub shadow-sm transition-all duration-150 hover:border-border-strong">
      {children}
    </span>
  )
}

export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="px-4 py-3 bg-bg-main border-b border-border-subtle">
        <p className="text-[10px] font-black tracking-widest text-text-muted uppercase">{title}</p>
      </div>
      <div className="bg-bg-card">{children}</div>
    </div>
  )
}

export function InfoRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle last:border-0 transition-colors duration-150 hover:bg-bg-sub">
      <p className="text-[12px] text-text-sub">{label}</p>
      <p className={`text-[12px] font-bold ${accent ? 'text-point' : 'text-text-main'}`}>
        {value}
      </p>
    </div>
  )
}

export function AmenityGrid({ amenities }: { amenities: SaunaDto['amenities'] }) {
  const items = [
    { label: '수건', ok: amenities.towel, emoji: '🧤' },
    { label: '샴푸', ok: amenities.shampoo, emoji: '🧴' },
    { label: '바디워시', ok: amenities.body_wash, emoji: '🚿' },
    { label: '드라이어', ok: amenities.hair_dryer, emoji: '💨' },
    ...(amenities.water_dispenser !== undefined
      ? [{ label: '정수기', ok: amenities.water_dispenser, emoji: '💧' }]
      : []),
  ]
  return (
    <div className="grid grid-cols-4 divide-x divide-border-subtle">
      {items.map(({ label, ok, emoji }) => (
        <div
          key={label}
          className={`flex flex-col items-center gap-1.5 py-4 px-2 transition-colors duration-150 ${
            ok ? 'hover:bg-bg-sub' : ''
          }`}
        >
          <span className={`text-lg transition-opacity duration-150 ${ok ? 'opacity-100' : 'opacity-20'}`}>
            {emoji}
          </span>
          <span className={`text-[10px] font-bold ${ok ? 'text-text-sub' : 'text-text-muted/40'}`}>
            {label}
          </span>
          <span className={`text-[9px] font-black ${ok ? 'text-confirm' : 'text-text-muted/30'}`}>
            {ok ? '있음' : '없음'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="h-56 bg-bg-main skeleton-shimmer" />
      <div className="h-32 bg-bg-card" />
      <div className="h-4 bg-bg-main" />
      <div className="flex-1 bg-bg-card" />
    </div>
  )
}
