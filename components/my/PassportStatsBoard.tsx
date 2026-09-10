'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BiBuildingHouse, BiCalendarCheck, BiHeart, BiStar, BiChevronRight, BiTimeFive } from 'react-icons/bi'
import { RoutineRatioInfo, TopSaunaInfo } from './utils/passportStats'

interface PassportStatsBoardProps {
  totalVisits: number
  uniqueSaunasCount: number
  thisMonthVisits: number
  averageRating: number | null
  topSauna: TopSaunaInfo | null
  routine: RoutineRatioInfo
}

export default function PassportStatsBoard({
  totalVisits,
  uniqueSaunasCount,
  thisMonthVisits,
  averageRating,
  topSauna,
  routine,
}: PassportStatsBoardProps) {
  const hasRoutine = routine.totalSaunaMinutes > 0 || routine.totalColdMinutes > 0

  return (
    <div className="space-y-3.5 px-4">
      {/* 4대 KPI 그리드 */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* 정복한 사우나 */}
        <div className="rounded-2xl border border-border-main bg-bg-card p-3.5 shadow-sm transition hover:border-point/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-muted">정복 사우나</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-point/10 text-point">
              <BiBuildingHouse size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-text-main tabular-nums">{uniqueSaunasCount}</span>
            <span className="text-[11px] font-bold text-text-muted">곳</span>
          </div>
        </div>

        {/* 이번 달 사활 */}
        <div className="rounded-2xl border border-border-main bg-bg-card p-3.5 shadow-sm transition hover:border-point/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-muted">이번 달 사활</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BiCalendarCheck size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-text-main tabular-nums">{thisMonthVisits}</span>
            <span className="text-[11px] font-bold text-text-muted">회</span>
          </div>
        </div>

        {/* 총 사활 기록 */}
        <div className="rounded-2xl border border-border-main bg-bg-card p-3.5 shadow-sm transition hover:border-point/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-muted">누적 사활</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sauna-bg text-sauna">
              <span className="text-xs">♨️</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-text-main tabular-nums">{totalVisits}</span>
            <span className="text-[11px] font-bold text-text-muted">회</span>
          </div>
        </div>

        {/* 평균 만족도 */}
        <div className="rounded-2xl border border-border-main bg-bg-card p-3.5 shadow-sm transition hover:border-point/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-muted">평균 만족도</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <BiStar size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-text-main tabular-nums">
              {averageRating !== null ? averageRating.toFixed(1) : '-'}
            </span>
            <span className="text-[11px] font-bold text-text-muted">{averageRating ? '점' : ''}</span>
          </div>
        </div>
      </div>

      {/* 최애 사우나 카드 (가장 많이 간 곳) */}
      {topSauna && (
        <Link
          href={`/saunas/${topSauna.id}`}
          className="group flex items-center gap-3.5 rounded-2xl border border-border-main bg-bg-card p-3.5 shadow-sm transition active:scale-[0.99] hover:border-point/40"
        >
          {/* 사우나 썸네일 */}
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-sub">
            {topSauna.thumbnailUrl ? (
              <Image
                src={topSauna.thumbnailUrl}
                alt={topSauna.name}
                width={56}
                height={56}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
                <span className="text-xl opacity-40">🧖</span>
              </div>
            )}
            <div className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white shadow-sm">
              <BiHeart size={10} />
            </div>
          </div>

          {/* 정보 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">
                My Favorite Sauna
              </span>
              <span className="rounded-full bg-sauna-bg px-2 py-0.2 text-[9px] font-black text-sauna tabular-nums">
                {topSauna.visitCount}회 방문
              </span>
            </div>
            <p className="truncate text-[13px] font-black text-text-main mt-0.5 group-hover:text-point transition-colors">
              {topSauna.name}
            </p>
            <p className="truncate text-[11px] text-text-muted mt-0.5">{topSauna.address}</p>
          </div>

          <BiChevronRight size={18} className="text-text-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* 사우나 루틴 누적 통계 & 황금 비율 바 */}
      {hasRoutine && (
        <div className="rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <BiTimeFive size={16} className="text-point" />
              <span className="text-[11px] font-black uppercase tracking-wider text-text-main">
                누적 사활 루틴 타임라인
              </span>
            </div>
            <span className="text-[10px] font-bold text-text-muted tabular-nums">
              총 {routine.totalSets}세트 완료
            </span>
          </div>

          {/* 3대 시간 지표 박스 */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3.5">
            <div className="rounded-xl bg-sauna-bg/60 p-2.5 border border-sauna/10">
              <p className="text-[9px] font-bold text-sauna mb-0.5">🔥 사우나</p>
              <p className="text-[14px] font-black text-text-main tabular-nums">
                {routine.totalSaunaMinutes}분
              </p>
              <p className="text-[8px] text-text-muted mt-0.5">{routine.saunaPercent}%</p>
            </div>
            <div className="rounded-xl bg-cold-bg/60 p-2.5 border border-cold/10">
              <p className="text-[9px] font-bold text-cold mb-0.5">💧 냉탕</p>
              <p className="text-[14px] font-black text-text-main tabular-nums">
                {routine.totalColdMinutes}분
              </p>
              <p className="text-[8px] text-text-muted mt-0.5">{routine.coldPercent}%</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-2.5 border border-emerald-500/10">
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">🍃 휴식</p>
              <p className="text-[14px] font-black text-text-main tabular-nums">
                {routine.totalRestMinutes}분
              </p>
              <p className="text-[8px] text-text-muted mt-0.5">{routine.restPercent}%</p>
            </div>
          </div>

          {/* 루틴 비율 막대 게이지 */}
          <div>
            <div className="flex justify-between text-[9px] text-text-muted mb-1 font-bold">
              <span>내 사활 밸런스 비율</span>
              <span>
                사우나 {routine.saunaPercent}% : 냉탕 {routine.coldPercent}% : 휴식 {routine.restPercent}%
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-sub border border-border-subtle">
              <div
                className="bg-sauna transition-all duration-500"
                style={{ width: `${routine.saunaPercent}%` }}
                title={`사우나 ${routine.saunaPercent}%`}
              />
              <div
                className="bg-cold transition-all duration-500"
                style={{ width: `${routine.coldPercent}%` }}
                title={`냉탕 ${routine.coldPercent}%`}
              />
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${routine.restPercent}%` }}
                title={`휴식 ${routine.restPercent}%`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
