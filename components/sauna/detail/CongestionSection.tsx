'use client'

/**
 * CongestionSection
 * 사우나이쿠의 混雑度 탭을 참고한 요일×시간대 혼잡도 표
 * — 실제 데이터는 리뷰의 congestion 필드 집계
 */

import { useQuery } from '@tanstack/react-query'
import { getReviewsBySaunaId } from '@/app/actions/review.actions'
import type { ReviewDto } from '@/types/sauna'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']
const HOURS = [
  '00:00-02:00',
  '02:00-04:00',
  '04:00-06:00',
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

const CONGESTION_LEVELS = ['공백', '비어있음', '보통', '혼잡', '대기']

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

function CellBadge({ count, level }: { count: number; level: CongestionLevel }) {
  if (count === 0) {
    return <span className="text-[11px] text-text-muted/40">0건</span>
  }

  const styles: Record<CongestionLevel, string> = {
    '비어있음': 'bg-point text-white',
    '보통':     'bg-point text-white',
    '혼잡':     'bg-point text-white',
    '대기':     'bg-red-500 text-white',
  }

  return (
    <span className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-black ${styles[level]}`}>
      {count}건
    </span>
  )
}

export function CongestionSection({ saunaId }: { saunaId: string }) {
  const [selectedDay, setSelectedDay] = React.useState('목')

  const { data: reviews = [], isLoading } = useQuery<ReviewDto[]>({
    queryKey: ['reviews', saunaId],
    queryFn: () => getReviewsBySaunaId(saunaId),
    staleTime: 1000 * 60 * 3,
  })

  const heatmap = React.useMemo(() => buildHeatmap(reviews), [reviews])
  const dayData = heatmap[selectedDay] ?? {}

  // 해당 요일에 데이터가 있는 시간대만
  const activeHours = HOURS.filter((h) => {
    const c = dayData[h]
    return c && (c.비어있음 + c.보통 + c.혼잡 + c.대기) > 0
  })

  const hasData = reviews.some(r => r.congestion && r.visit_date)

  return (
    <div className="pb-24">
      {/* 성별 토글 */}
      <div className="flex border-b border-border-subtle">
        <div className="flex-1 py-3.5 text-center text-[14px] font-black text-text-main border-b-2 border-point bg-bg-main">
          남탕
        </div>
      </div>

      {/* 요일 탭 */}
      <div className="flex border-b border-border-main bg-bg-main">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 py-3 text-[13px] font-black transition ${
              selectedDay === day ? 'border-b-2 border-point text-point' : 'text-text-muted'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* 혼잡도 테이블 */}
      <div className="bg-bg-card">
        {/* 헤더 */}
        <div className="flex items-center border-b border-border-subtle bg-bg-sub px-4 py-2.5">
          <div className="w-28 text-[11px] font-black text-text-muted">시간대</div>
          <div className="flex flex-1 gap-0">
            {(['비어있음', '보통', '혼잡', '대기'] as CongestionLevel[]).map((level) => (
              <div key={level} className="flex-1 text-center">
                <span className="text-[10px] font-black text-text-muted">{level}</span>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-main border-t-point" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl opacity-30">📊</span>
            <p className="text-[13px] font-bold text-text-sub">아직 혼잡도 데이터가 없어요</p>
            <p className="text-[11px] text-text-muted">방문 후 사활을 남기면 혼잡도가 쌓입니다</p>
          </div>
        ) : (
          HOURS.map((hour) => {
            const cell = dayData[hour] ?? { 비어있음: 0, 보통: 0, 혼잡: 0, 대기: 0 }
            const total = cell.비어있음 + cell.보통 + cell.혼잡 + cell.대기
            return (
              <div key={hour} className="flex items-center border-b border-border-subtle px-4 py-3 last:border-0">
                <div className="w-28 text-[12px] font-bold text-text-sub">{hour}</div>
                <div className="flex flex-1 items-center gap-0">
                  {(['비어있음', '보통', '혼잡', '대기'] as CongestionLevel[]).map((level) => (
                    <div key={level} className="flex-1 flex items-center justify-center">
                      <CellBadge count={cell[level]} level={level} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 안내 */}
      {hasData && (
        <p className="px-4 py-3 text-[11px] text-text-muted">
          * 방문자들의 사활 기록 {reviews.length}건 기준
        </p>
      )}
    </div>
  )
}

// React import 추가
import React from 'react'
