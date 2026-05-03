'use client'

import { useState } from 'react'
import { BiUser, BiChevronDown } from 'react-icons/bi'
import { useQuery } from '@tanstack/react-query'
import { getReviewsBySaunaId } from '@/app/actions/review.actions'
import type { ReviewDto } from '@/types/sauna'

const VISIT_TIME_LABELS: Record<string, string> = {
  morning:   '🌅 아침',
  afternoon: '☀️ 오후',
  evening:   '🌆 저녁',
  night:     '🌙 야간',
}

const CONGESTION_LABELS: Record<string, { label: string; color: string }> = {
  '비어있음': { label: '한산함',  color: 'text-point' },
  '보통':     { label: '보통',      color: 'text-text-sub' },
  '혼잡':     { label: '혼잡',      color: 'text-orange-500' },
  '대기':     { label: '대기',      color: 'text-red-500' },
}

const MAX_CHARS = 120

function ReviewCard({ review }: { review: ReviewDto }) {
  const [expanded, setExpanded] = useState(false)
  const author      = review.users
  const displayName = author?.nickname ?? '익명'
  const avatar      = author?.avatar_url ?? null
  const content     = review.content ?? ''
  const isLong      = content.length > MAX_CHARS
  const displayText = expanded || !isLong ? content : content.slice(0, MAX_CHARS) + '…'

  const dateStr = review.visit_date
    ? new Date(review.visit_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const congestion = review.congestion ? CONGESTION_LABELS[review.congestion] : null

  // 방문 횟수 mock (실제 데이터 없으면 1로)
  const visitCount = 1

  return (
    <div className="border-b border-border-subtle px-4 py-5 transition hover:bg-bg-sub">
      {/* 작성자 행 */}
      <div className="flex items-start gap-3">
        {/* 아바타 */}
        <div className="relative flex-shrink-0">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-bg-sub border border-border-main">
            {avatar ? (
              <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BiUser size={16} className="text-text-muted" />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {/* 이름 + 날짜 */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-black text-text-main">{displayName}</p>
            <div className="flex items-center gap-1.5">
              {dateStr && <span className="text-[10px] text-text-muted">{dateStr}</span>}
              {/* 더보기 메뉴 */}
              <button className="flex h-6 w-6 items-center justify-center rounded-full text-text-muted">
                <span className="text-[16px] leading-none">···</span>
              </button>
            </div>
          </div>

          {/* 방문 횟수 */}
          <p className="mt-0.5 text-[10px] text-text-muted">{visitCount}회 방문</p>
        </div>
      </div>

      {/* 본문 */}
      {content && (
        <div className="mt-3">
          <p className="text-[13px] leading-relaxed text-text-sub whitespace-pre-wrap">
            {displayText}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 flex items-center gap-0.5 text-[12px] font-bold text-point"
            >
              {expanded ? '접기' : '더 보기'}
              <BiChevronDown
                size={14}
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      )}

      {/* 세션 정보 (온도 뱃지) */}
      {review.sessions && review.sessions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.sessions.map((session, i) => (
            <span
              key={i}
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                session.type === 'sauna'
                  ? 'bg-sauna-bg text-sauna'
                  : session.type === 'cold'
                  ? 'bg-cold-bg text-cold'
                  : 'bg-bg-sub text-text-sub'
              }`}
            >
              {session.type === 'sauna' ? '♨' : session.type === 'cold' ? '❄' : '🌿'}
              {session.temp ? ` ${session.temp}°C` : ''}
              {session.duration_minutes ? ` ${session.duration_minutes}분` : ''}
            </span>
          ))}
        </div>
      )}

      {/* 메타 정보 */}
      <div className="mt-3 flex items-center gap-2.5 flex-wrap">
        {review.rating > 0 && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`text-[11px] ${n <= review.rating ? 'text-gold' : 'text-border-strong'}`}>★</span>
            ))}
          </div>
        )}
        {review.visit_time && (
          <span className="text-[11px] text-text-muted">{VISIT_TIME_LABELS[review.visit_time] ?? review.visit_time}</span>
        )}
        {congestion && (
          <span className={`text-[11px] font-bold ${congestion.color}`}>{congestion.label}</span>
        )}
      </div>

      {/* 이미지 */}
      {review.images && review.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {review.images.map((img, i) => (
            <div key={i} className="relative flex-shrink-0 overflow-hidden rounded-xl border border-border-main" style={{ width: 100, height: 100 }}>
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-border-subtle">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-bg-sub skeleton-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-bg-sub skeleton-shimmer" />
              <div className="h-2.5 w-16 rounded bg-bg-sub skeleton-shimmer" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-3 w-full rounded bg-bg-sub skeleton-shimmer" />
            <div className="h-3 w-4/5 rounded bg-bg-sub skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ReviewList({ saunaId, onWrite }: { saunaId: string; onWrite: () => void }) {
  const { data: reviews = [], isLoading } = useQuery<ReviewDto[]>({
    queryKey: ['reviews', saunaId],
    queryFn: () => getReviewsBySaunaId(saunaId),
    staleTime: 1000 * 60 * 3,
  })

  if (isLoading) return <ReviewSkeleton />

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-5xl opacity-20">🔥</span>
        <p className="text-[14px] font-bold text-text-sub">아직 사활 기록이 없어요</p>
        <p className="text-[12px] text-text-muted">첫 번째 사활을 남겨보세요!</p>
        <button
          onClick={onWrite}
          className="mt-2 rounded-full bg-point px-6 py-2.5 text-[13px] font-black text-white transition active:scale-95"
        >
          사활 투고하기
        </button>
      </div>
    )
  }

  return (
    <div className="bg-bg-card">
      {/* 카운트 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <p className="text-[12px] font-bold text-text-sub">사활 기록</p>
        <p className="text-[12px] font-bold text-text-muted tabular-nums">{reviews.length}건</p>
      </div>

      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
