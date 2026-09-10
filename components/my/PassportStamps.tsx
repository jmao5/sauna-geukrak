'use client'

import { RegionStampInfo } from './utils/passportStats'
import { BiMapPin, BiNavigation } from 'react-icons/bi'
import Link from 'next/link'

interface PassportStampsProps {
  stamps: RegionStampInfo[]
}

const STAMP_STYLES = [
  {
    border: 'border-rose-600/70 dark:border-rose-500/70',
    bg: 'bg-rose-500/5 dark:bg-rose-950/20',
    text: 'text-rose-600 dark:text-rose-400',
    subtext: 'text-rose-500/80 dark:text-rose-400/80',
    rotate: 'rotate-[-4deg]',
  },
  {
    border: 'border-indigo-600/70 dark:border-indigo-500/70',
    bg: 'bg-indigo-500/5 dark:bg-indigo-950/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    subtext: 'text-indigo-500/80 dark:text-indigo-400/80',
    rotate: 'rotate-[3deg]',
  },
  {
    border: 'border-emerald-600/70 dark:border-emerald-500/70',
    bg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    subtext: 'text-emerald-500/80 dark:text-emerald-400/80',
    rotate: 'rotate-[-2deg]',
  },
  {
    border: 'border-amber-600/70 dark:border-amber-500/70',
    bg: 'bg-amber-500/5 dark:bg-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
    subtext: 'text-amber-500/80 dark:text-amber-400/80',
    rotate: 'rotate-[5deg]',
  },
]

export default function PassportStamps({ stamps }: PassportStampsProps) {
  return (
    <div className="mx-4 rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <BiMapPin size={16} className="text-point" />
          <span className="text-[11px] font-black uppercase tracking-wider text-text-main">
            사우나 여권 지역 스탬프 투어
          </span>
        </div>
        <span className="text-[10px] font-bold text-text-muted tabular-nums">
          총 {stamps.length}개 지역 정복
        </span>
      </div>

      {stamps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <span className="text-3xl mb-2 opacity-50">🧭</span>
          <p className="text-[12px] font-black text-text-main">아직 획득한 지역 스탬프가 없어요</p>
          <p className="text-[10px] text-text-muted mt-0.5">사우나 방문 후 사활을 남기면 여권 도장이 찍혀요!</p>
          <Link
            href="/map"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-point/10 px-3.5 py-1.5 text-[11px] font-black text-point transition active:scale-95 hover:bg-point/20"
          >
            <BiNavigation size={12} />
            내 주변 사우나 찾기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {stamps.map((stamp, idx) => {
            const style = STAMP_STYLES[idx % STAMP_STYLES.length]
            return (
              <div
                key={stamp.district}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${style.border} ${style.bg} p-3 text-center transition hover:scale-[1.02] ${style.rotate}`}
              >
                {/* 인장 상단 */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px]">♨️</span>
                  <span className={`text-[8px] font-black tracking-widest uppercase ${style.subtext}`}>
                    PASSPORT ENTRY
                  </span>
                </div>

                {/* 지역명 */}
                <p className={`my-1 text-[13px] font-black tracking-tight ${style.text}`}>
                  {stamp.district}
                </p>

                {/* 방문 횟수 및 인증 워터마크 */}
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-black tabular-nums ${style.subtext}`}>
                    {stamp.count}회 방문
                  </span>
                  <span className="text-[8px] opacity-40">·</span>
                  <span className={`text-[7px] font-bold uppercase tracking-wider ${style.subtext}`}>
                    정복 완료
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
