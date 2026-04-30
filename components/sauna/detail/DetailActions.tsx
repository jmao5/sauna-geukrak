'use client'

interface DetailActionsProps {
  isFav: boolean
  onToggleFav: () => void
  onWriteReview: () => void
}

export function DetailActions({ isFav, onToggleFav, onWriteReview }: DetailActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-bg-card border-b border-border-subtle">
      <button
        onClick={onToggleFav}
        className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-black transition active:scale-[0.97] ${
          isFav ? 'bg-point text-white' : 'border border-border-main bg-bg-main text-text-main'
        }`}
      >
        {isFav ? '❤️ 찜됨' : '🤍 극락가고싶다'}
      </button>
      <button
        onClick={onWriteReview}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-border-main bg-bg-main py-3 text-[13px] font-black text-text-main transition active:scale-[0.97]"
      >
        ✏️ 사활 기록
      </button>
    </div>
  )
}
