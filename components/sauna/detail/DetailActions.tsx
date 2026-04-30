'use client'

interface DetailActionsProps {
  isFav: boolean
  onToggleFav: () => void
  onWriteReview: () => void
}

export function DetailActions({ isFav, onToggleFav, onWriteReview }: DetailActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 py-3.5 bg-bg-card border-b border-border-subtle">
      <button
        onClick={onToggleFav}
        className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-black shadow-sm transition-all duration-200 active:scale-[0.97] ${
          isFav
            ? 'bg-point text-white hover:bg-point-hover hover:shadow-md'
            : 'border border-border-main bg-bg-main text-text-main hover:border-border-strong hover:shadow-md'
        }`}
      >
        {isFav ? '❤️ 찜됨' : '🤍 극락가고싶다'}
      </button>
      <button
        onClick={onWriteReview}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-border-main bg-bg-main py-3 text-[13px] font-black text-text-main shadow-sm transition-all duration-200 hover:border-border-strong hover:shadow-md active:scale-[0.97]"
      >
        ✏️ 사활 기록
      </button>
    </div>
  )
}
