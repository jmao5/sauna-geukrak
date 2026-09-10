'use client'

import { useState } from 'react'
import { PassportBadgeInfo } from './utils/passportStats'
import { BiTrophy, BiLockAlt, BiCheck } from 'react-icons/bi'

interface SaunaBadgeCollectionProps {
  badges: PassportBadgeInfo[]
}

export default function SaunaBadgeCollection({ badges }: SaunaBadgeCollectionProps) {
  const [selectedBadge, setSelectedBadge] = useState<PassportBadgeInfo | null>(null)
  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div className="mx-4 rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <BiTrophy size={16} className="text-[#f59e0b]" />
          <span className="text-[11px] font-black uppercase tracking-wider text-text-main">
            사우너 업적 뱃지
          </span>
        </div>
        <span className="text-[10px] font-bold text-text-muted tabular-nums">
          <strong className="text-text-main">{unlockedCount}</strong> / {badges.length}개 달성
        </span>
      </div>

      {/* 뱃지 가로 스크롤 리스트 */}
      <div
        className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
        {badges.map((badge) => (
          <button
            key={badge.id}
            type="button"
            onClick={() => setSelectedBadge(badge)}
            className={`group relative flex w-[105px] flex-shrink-0 flex-col items-center rounded-2xl border p-3 text-center transition active:scale-95 ${
              badge.unlocked
                ? `border-border-main bg-gradient-to-b ${badge.color} shadow-sm`
                : 'border-border-subtle bg-bg-sub/40 opacity-50 grayscale hover:grayscale-0'
            }`}
          >
            {/* 해금/잠김 표시 아이콘 */}
            <div className="absolute top-2 right-2">
              {badge.unlocked ? (
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                  <BiCheck size={10} />
                </div>
              ) : (
                <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-500/30 text-[8px] text-text-muted">
                  <BiLockAlt size={9} />
                </div>
              )}
            </div>

            {/* 이모지 */}
            <span className="text-2xl mb-1 transition-transform group-hover:scale-110">{badge.emoji}</span>

            {/* 뱃지 이름 */}
            <p className={`text-[11px] font-black truncate w-full ${badge.unlocked ? badge.textColor : 'text-text-muted'}`}>
              {badge.name}
            </p>

            {/* 진행률 바 */}
            <div className="mt-2 w-full">
              <div className="flex justify-between text-[8px] font-bold text-text-muted mb-0.5 tabular-nums">
                <span>{badge.unlocked ? '완료' : `${badge.current}/${badge.target}`}</span>
                <span>{badge.progressPercent}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    badge.unlocked ? 'bg-emerald-500' : 'bg-point'
                  }`}
                  style={{ width: `${badge.progressPercent}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 뱃지 상세 툴팁 바텀 안내 */}
      {selectedBadge && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-border-subtle bg-bg-sub/80 p-3 text-left">
          <span className="text-2xl flex-shrink-0">{selectedBadge.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[12px] font-black text-text-main">{selectedBadge.name}</p>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                  selectedBadge.unlocked
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {selectedBadge.unlocked ? '획득 완료 🏅' : `도전 중 (${selectedBadge.progressPercent}%)`}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-text-sub">{selectedBadge.desc}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-text-muted">
              💡 해금 조건: {selectedBadge.hint}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
