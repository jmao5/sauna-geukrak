// ──────────────────────────────────────────────────────────────
// 등록/수정 폼에서 공통으로 쓰는 UI 컴포넌트들
// ──────────────────────────────────────────────────────────────
import { BiMinus, BiPlus } from 'react-icons/bi'

export function SectionCard({
  title, emoji, children,
}: {
  title: string; emoji: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border-main bg-bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span>{emoji}</span>
        <h3 className="text-sm font-black text-text-main">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export function Toggle({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between w-full rounded-xl border px-3.5 py-3 transition active:scale-[0.98] ${
        checked ? 'border-point/40 bg-point/5' : 'border-border-main bg-bg-main'
      }`}
    >
      <span className="text-sm font-semibold text-text-main">{label}</span>
      <div className={`flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-point justify-end' : 'bg-border-main justify-start'
      }`}>
        <div className="m-0.5 h-4 w-4 rounded-full bg-white shadow" />
      </div>
    </button>
  )
}

export function NumberInput({
  label, value, onChange, min = 0, unit = '',
}: {
  label: string; value: number; onChange: (v: number) => void; min?: number; unit?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold text-text-sub">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border-main bg-bg-main transition active:scale-90"
        >
          <BiMinus size={14} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-full rounded-lg border border-border-main bg-bg-main px-2 text-center text-sm font-black text-text-main outline-none focus:border-point"
          min={min}
        />
        {unit && <span className="text-xs text-text-sub flex-shrink-0">{unit}</span>}
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border-main bg-bg-main transition active:scale-90"
        >
          <BiPlus size={14} />
        </button>
      </div>
    </div>
  )
}

export function TextInput({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold text-text-sub">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-sm text-text-main placeholder:text-text-muted outline-none focus:border-point"
      />
    </div>
  )
}
