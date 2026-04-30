'use client'

import { BiStar, BiSolidStar, BiUser } from 'react-icons/bi'
import { useQuery } from '@tanstack/react-query'
import { getReviewsBySaunaId } from '@/app/actions/review.actions'
import type { ReviewDto } from '@/types/sauna'

const VISIT_TIME_LABELS: Record<string, string> = {
  morning: '🌅 아침',
  afternoon: '☀️ 오후',
  evening: '🌆 저녁',
  night: '🌙 야간',
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= rating ? (
          <BiSolidStar key={n} size={12} className="text-gold" />
        ) : (
          <BiStar key={n} size={12} className="text-border-main" />
        )
      )}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border-subtle bg-bg-main p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-bg-sub skeleton-shimmer" />
            <div className="h-3 w-24 rounded bg-bg-sub skeleton-shimmer" />
          </div>
          <div className="h-3 w-32 rounded bg-bg-sub skeleton-shimmer" />
          <div className="h-3 w-full rounded bg-bg-sub skeleton-shimmer" />
        </div>
      ))}
    </div>
  )
}

export function ReviewList({
  saunaId,
  onWrite,
}: {
  saunaId: string
  onWrite: () => void
}) {
  const { data: reviews = [], isLoading } = useQuery<ReviewDto[]>({
    queryKey: ['reviews', saunaId],
    queryFn: () => getReviewsBySaunaId(saunaId),
    staleTime: 1000 * 60 * 3,
  })

  if (isLoading) return <ReviewSkeleton />

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-4xl">🔥</span>
        <p className="text-[13px] font-bold text-text-sub">아직 사활 기록이 없어요</p>
        <p className="text-[11px] text-text-muted">첫 번째 사활을 남겨보세요!</p>
        <button
          onClick={onWrite}
          className="mt-1 rounded-full bg-point px-5 py-2 text-[12px] font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          사활 기록하기
        </button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border-subtle">
      {reviews.map((review) => {
        const author = review.users
        const displayName = author?.nickname ?? '익명'
        const avatar = author?.avatar_url ?? null
        const dateStr = review.visit_date
          ? new Date(review.visit_date).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
            })
          : null

        return (
          <div
            key={review.id}
            className="px-4 py-4 transition-colors duration-150 hover:bg-bg-sub"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-bg-main border border-border-subtle flex-shrink-0 shadow-sm">
                {avatar ? (
                  <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BiUser size={16} className="text-text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-black text-text-main">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <StarRow rating={review.rating} />
                  {dateStr && (
                    <span className="text-[10px] text-text-muted">{dateStr}</span>
                  )}
                  {review.visit_time && (
                    <span className="text-[10px] text-text-muted">
                      · {VISIT_TIME_LABELS[review.visit_time] ?? review.visit_time}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {review.content && (
              <p className="text-[12px] leading-relaxed text-text-sub pl-10">
                {review.content}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
