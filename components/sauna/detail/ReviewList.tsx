'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { BiUser, BiChevronDown, BiHeart, BiSolidHeart } from 'react-icons/bi'
import { useQuery } from '@tanstack/react-query'
import { getReviewsBySaunaId, getReviewCount } from '@/app/actions/review.actions'
import { getReviewLikeStatuses, toggleReviewLike } from '@/app/actions/like.actions'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { ReviewDto } from '@/types/sauna'

const VISIT_TIME_LABELS: Record<string, string> = {
  morning:   '🌅 아침',
  afternoon: '☀️ 오후',
  evening:   '🌆 저녁',
  night:     '🌙 야간',
}

const MAX_CHARS = 120

/* ── 좋아요 버튼 ──────────────────────────────────────── */
function LikeButton({
  reviewId,
  initialLiked,
  initialCount,
}: {
  reviewId: string
  initialLiked: boolean
  initialCount: number
}) {
  const { user } = useUserStore()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [optimistic, setOptimistic] = useOptimistic(
    { liked: initialLiked, count: initialCount },
    (_state, next: { liked: boolean; count: number }) => next
  )

  const handleToggle = () => {
    if (!user) {
      toast('로그인 후 좋아요를 누를 수 있어요', { icon: '🔒' })
      router.push('/login')
      return
    }

    const nextLiked = !optimistic.liked
    const nextCount = optimistic.count + (nextLiked ? 1 : -1)

    startTransition(async () => {
      setOptimistic({ liked: nextLiked, count: nextCount })
      const result = await toggleReviewLike(reviewId)
      if (!result.ok) {
        // 롤백은 자동 — optimistic이 initialLiked/Count로 복원됨
        toast.error(result.error ?? '좋아요 처리에 실패했습니다')
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
        optimistic.liked
          ? 'bg-red-50 text-red-500 dark:bg-red-950/30'
          : 'text-text-muted hover:text-text-sub'
      }`}
    >
      {optimistic.liked
        ? <BiSolidHeart size={14} className="text-red-500" />
        : <BiHeart size={14} />
      }
      {optimistic.count > 0 && (
        <span className="tabular-nums">{optimistic.count}</span>
      )}
    </button>
  )
}

/* ── ReviewCard ─────────────────────────────────────── */
function ReviewCard({
  review,
  likeStatus,
}: {
  review: ReviewDto
  likeStatus: { liked: boolean; count: number }
}) {
  const [expanded, setExpanded] = useState(false)

  const author      = review.users
  const displayName = author?.nickname ?? '익명'
  const avatar      = author?.avatar_url ?? null
  const content     = review.content ?? ''
  const isLong      = content.length > MAX_CHARS
  const displayText = expanded || !isLong ? content : content.slice(0, MAX_CHARS) + '…'

  const dateStr = review.visit_date
    ? new Date(review.visit_date).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <div className="border-b border-border-subtle px-4 py-5 transition hover:bg-bg-sub">
      {/* 작성자 행 */}
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-border-main bg-bg-sub">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BiUser size={16} className="text-text-muted" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-black text-text-main">{displayName}</p>
            {dateStr && <span className="text-[10px] text-text-muted">{dateStr}</span>}
          </div>
          {/* 별점 */}
          {review.rating > 0 && (
            <div className="mt-0.5 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`text-[11px] ${n <= review.rating ? 'text-gold' : 'text-border-strong'}`}>★</span>
              ))}
              {review.visit_time && (
                <span className="ml-2 text-[10px] text-text-muted">
                  {VISIT_TIME_LABELS[review.visit_time] ?? review.visit_time}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      {content && (
        <div className="mt-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-sub">
            {displayText}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 flex items-center gap-0.5 text-[12px] font-bold text-point"
            >
              {expanded ? '접기' : '더 보기'}
              <BiChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* 세션 뱃지 */}
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

      {/* 이미지 */}
      {review.images && review.images.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {review.images.map((img, i) => (
            <div
              key={i}
              className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-border-main"
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* 하단 액션 바 — 좋아요 */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 빈 div for future: share, report 등 */}
        </div>
        <LikeButton
          reviewId={review.id}
          initialLiked={likeStatus.liked}
          initialCount={likeStatus.count}
        />
      </div>
    </div>
  )
}

/* ── 스켈레톤 ──────────────────────────────────────── */
function ReviewSkeleton() {
  return (
    <div className="divide-y divide-border-subtle">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-bg-sub skeleton-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-bg-sub skeleton-shimmer" />
              <div className="h-2.5 w-20 rounded bg-bg-sub skeleton-shimmer" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-3 w-full rounded bg-bg-sub skeleton-shimmer" />
            <div className="h-3 w-4/5 rounded bg-bg-sub skeleton-shimmer" />
          </div>
          <div className="mt-3 flex justify-end">
            <div className="h-6 w-12 rounded-full bg-bg-sub skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── 메인 ──────────────────────────────────────────── */
export function ReviewList({ saunaId, onWrite }: { saunaId: string; onWrite: () => void }) {
  const { data: reviews = [], isLoading } = useQuery<ReviewDto[]>({
    queryKey: ['reviews', saunaId],
    queryFn: () => getReviewsBySaunaId(saunaId),
    staleTime: 1000 * 60 * 3,
  })

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['review-count', saunaId],
    queryFn: () => getReviewCount(saunaId),
    staleTime: 1000 * 60 * 5,
  })

  // 좋아요 상태 일괄 조회
  const { data: likeStatuses = {} } = useQuery({
    queryKey: ['review-likes', saunaId, reviews.map((r) => r.id).join(',')],
    queryFn: () => getReviewLikeStatuses(reviews.map((r) => r.id)),
    enabled: reviews.length > 0,
    staleTime: 1000 * 30,
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
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <p className="text-[12px] font-bold text-text-sub">사활 기록</p>
        <p className="tabular-nums text-[12px] font-bold text-text-muted">{totalCount.toLocaleString()}건</p>
      </div>

      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          likeStatus={likeStatuses[review.id] ?? { liked: false, count: review.like_count ?? 0 }}
        />
      ))}
    </div>
  )
}
