'use client'

/**
 * CongestionSection
 * 사우나 이키타이의 혼잡도 그래프를 벤치마킹한 시간대별 가로 막대 백분율 차트
 */

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReviewsBySaunaId } from '@/app/actions/review.actions'
import type { ReviewDto } from '@/types/sauna'
import { m, AnimatePresence } from 'framer-motion'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const HOURS = [
  '06:00-08:00',
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
  '20:00-22:00',
  '22:00-24:00',
]

type CongestionLevel = '비어있음' | '보통' | '혼잡' | '대기'

interface CellCount {
  비어있음: number
  보통: number
  혼잡: number
  대기: number
}

type HeatMap = Record<string, Record<string, CellCount>>

function buildHeatmap(reviews: ReviewDto[]): HeatMap {
  const map: HeatMap = {}

  DAYS.forEach((day) => {
    map[day] = {}
    HOURS.forEach((h) => {
      map[day][h] = { 비어있음: 0, 보통: 0, 혼잡: 0, 대기: 0 }
    })
  })

  reviews.forEach((r) => {
    if (!r.congestion || !r.visit_date) return
    const date = new Date(r.visit_date)
    const dayIdx = date.getDay() // 0=일 ~ 6=토
    const korDay = DAYS[dayIdx === 0 ? 6 : dayIdx - 1]

    // visit_time 기반으로 시간대 추정
    const timeSlot = (() => {
      switch (r.visit_time) {
        case 'morning':   return '06:00-08:00'
        case 'afternoon': return '12:00-14:00'
        case 'evening':   return '18:00-20:00'
        case 'night':     return '22:00-24:00'
        default:          return null
      }
    })()

    if (!timeSlot) return

    const level = r.congestion as CongestionLevel
    if (map[korDay]?.[timeSlot]?.[level] !== undefined) {
      map[korDay][timeSlot][level]++
    }
  })

  return map
}

export function CongestionSection({ saunaId }: { saunaId: string }) {
  // 오늘 요일 구하기
  const todayIdx = new Date().getDay() // 0=일 ~ 6=토
  const todayName = DAYS[todayIdx === 0 ? 6 : todayIdx - 1]
  const [selectedDay, setSelectedDay] = React.useState(todayName)

  const { data: reviews = [], isLoading } = useQuery<ReviewDto[]>({
    queryKey: ['reviews', saunaId],
    queryFn: () => getReviewsBySaunaId(saunaId),
    staleTime: 1000 * 60 * 3,
  })

  const heatmap = React.useMemo(() => buildHeatmap(reviews), [reviews])
  const dayData = heatmap[selectedDay] ?? {}
  const hasData = reviews.some((r) => r.congestion && r.visit_date)

  return (
    <div className="pb-24">
      {/* 범례 */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-bg-main px-4 py-3.5">
        <span className="text-[12px] font-black text-text-main">시간대별 혼잡 혼합도</span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-text-sub">
            <span className="inline-block h-2.5 w-2.5 rounded bg-[#3b82f6]" />
            비어있음
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-text-sub">
            <span className="inline-block h-2.5 w-2.5 rounded bg-[#10b981]" />
            보통
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-text-sub">
            <span className="inline-block h-2.5 w-2.5 rounded bg-[#f59e0b]" />
            혼잡
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-text-sub">
            <span className="inline-block h-2.5 w-2.5 rounded bg-[#ef4444]" />
            대기
          </span>
        </div>
      </div>

      {/* 요일 탭 */}
      <div className="flex border-b border-border-main bg-bg-main">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="relative flex-1 py-3 text-[13px] font-black transition active:scale-95"
            >
              <span className={isSelected ? 'text-point' : 'text-text-muted'}>{day}</span>
              {isSelected && (
                <m.div
                  layoutId="activeDayTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-point"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* 혼잡도 리스트 */}
      <div className="bg-bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-main border-t-point" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-4xl opacity-30">📊</span>
            <p className="text-[13px] font-bold text-text-sub">아직 수집된 혼잡도 데이터가 없어요</p>
            <p className="text-[11px] text-text-muted">방문 후 사활을 기록해 주시면 실시간 통계가 제공됩니다</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            <AnimatePresence mode="wait">
              <m.div
                key={selectedDay}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5"
              >
                {HOURS.map((hour) => {
                  const cell = dayData[hour] ?? { 비어있음: 0, 보통: 0, 혼잡: 0, 대기: 0 }
                  const total = cell.비어있음 + cell.보통 + cell.혼잡 + cell.대기

                  const emptyPct = total > 0 ? Math.round((cell.비어있음 / total) * 100) : 0
                  const normalPct = total > 0 ? Math.round((cell.보통 / total) * 100) : 0
                  const busyPct = total > 0 ? Math.round((cell.혼잡 / total) * 100) : 0
                  const waitPct = total > 0 ? Math.max(0, 100 - (emptyPct + normalPct + busyPct)) : 0

                  return (
                    <div key={hour} className="flex items-center gap-4">
                      {/* 시간대 레이블 */}
                      <div className="w-[88px] flex-shrink-0">
                        <p className="text-[12px] font-black text-text-main leading-none">{hour}</p>
                        <p className="mt-1 text-[9px] font-bold text-text-muted">
                          {total > 0 ? `제보 ${total}건` : '제보 없음'}
                        </p>
                      </div>

                      {/* 가로 백분율 바 */}
                      <div className="flex-1">
                        {total > 0 ? (
                          <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-sub border border-border-subtle">
                            {emptyPct > 0 && (
                              <div
                                style={{ width: `${emptyPct}%` }}
                                className="bg-[#3b82f6] h-full transition-all duration-300"
                                title={`비어있음: ${emptyPct}%`}
                              />
                            )}
                            {normalPct > 0 && (
                              <div
                                style={{ width: `${normalPct}%` }}
                                className="bg-[#10b981] h-full transition-all duration-300"
                                title={`보통: ${normalPct}%`}
                              />
                            )}
                            {busyPct > 0 && (
                              <div
                                style={{ width: `${busyPct}%` }}
                                className="bg-[#f59e0b] h-full transition-all duration-300"
                                title={`혼잡: ${busyPct}%`}
                              />
                            )}
                            {waitPct > 0 && (
                              <div
                                style={{ width: `${waitPct}%` }}
                                className="bg-[#ef4444] h-full transition-all duration-300"
                                title={`대기: ${waitPct}%`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex h-3 w-full items-center rounded-full bg-bg-sub/60 px-3">
                            <span className="text-[9px] font-bold text-text-muted/50 uppercase tracking-widest">No reports</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </m.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 안내 */}
      {hasData && (
        <p className="px-4 py-3 text-[11px] text-text-muted">
          * 방문 사우너들의 사활 투고 데이터 ({reviews.length}건)를 기반으로 산출된 통계입니다.
        </p>
      )}
    </div>
  )
}
