'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BiUser, BiChevronDown, BiHeart, BiSolidHeart, BiComment, BiSend, BiX, BiTrash, BiStar, BiSolidStar, BiSolidStarHalf } from 'react-icons/bi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReviewsBySaunaId, getReviewCount } from '@/app/actions/review.actions'
import { getReviewLikeStatuses, toggleReviewLike } from '@/app/actions/like.actions'
import { getCommentsByReviewId, createComment, deleteComment, CommentDto } from '@/app/actions/comment.actions'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { ReviewDto, Session } from '@/types/sauna'
import { ReviewBottomSheet } from './ReviewBottomSheet'

function RenderSessions({ sessions }: { sessions?: Session[] }) {
  if (!sessions || sessions.length === 0) return null

  const pattern: string[] = []
  let isPatternMatched = true

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    if (i > 0 && s.type === sessions[0].type) {
      break
    }
    pattern.push(s.type)
  }

  const patternLength = pattern.length
  const setLength = sessions.length / patternLength

  if (patternLength > 0 && sessions.length % patternLength === 0 && setLength >= 1) {
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].type !== pattern[i % patternLength]) {
        isPatternMatched = false
        break
      }
    }
  } else {
    isPatternMatched = false
  }

  if (isPatternMatched && setLength > 0) {
    const firstSet = sessions.slice(0, patternLength)
    const sauna = firstSet.find((s) => s.type === 'sauna')
    const cold = firstSet.find((s) => s.type === 'cold')
    const rest = firstSet.find((s) => s.type === 'rest')

    return (
      <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-sub/50 px-3 py-2 text-[11px] font-bold text-text-sub">
        <span className="text-point font-black text-[9px] uppercase tracking-wider bg-point/10 px-1.5 py-0.5 rounded">ROUTINE</span>
        <div className="flex items-center gap-1">
          {sauna && <span>🧖 {sauna.duration_minutes}분</span>}
          {cold && <span>➡️ ❄️ {cold.duration_minutes}분</span>}
          {rest && <span>➡️ 🍃 {rest.duration_minutes}분</span>}
        </div>
        <span className="ml-auto text-[10px] font-black text-point">
          {setLength}세트
        </span>
      </div>
    )
  }

  const emojiMap = { sauna: '🧖', cold: '❄️', rest: '🍃' }
  const labelMap = { sauna: '사우나', cold: '냉탕', rest: '휴식' }

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {sessions.map((s, idx) => (
        <span key={idx} className="rounded-lg border border-border-main bg-bg-sub px-2.5 py-1 text-[10px] font-bold text-text-sub">
          {emojiMap[s.type as keyof typeof emojiMap] || '🧖'} {labelMap[s.type as keyof typeof labelMap] || '사우나'} {s.duration_minutes}분
        </span>
      ))}
    </div>
  )
}

const VISIT_TIME_LABELS: Record<string, string> = {
  morning:   '🌅 아침',
  afternoon: '☀️ 오후',
  evening:   '🌆 저녁',
  night:     '🌙 야간',
}
const MAX_CHARS = 140

/* ── 좋아요 버튼 ──────────────────────────────────────────── */
function LikeButton({ reviewId, saunaId, initialLiked, initialCount }: {
  reviewId: string
  saunaId: string
  initialLiked: boolean
  initialCount: number
}) {
  const { user } = useUserStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const isPendingRef = useRef(false)

  useEffect(() => {
    if (!isPendingRef.current) {
      setLiked(initialLiked)
      setCount(initialCount)
    }
  }, [initialLiked, initialCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async () => {
    if (!user) {
      toast('로그인 후 좋아요를 누를 수 있어요', { icon: '🔒' })
      router.push('/login')
      return
    }
    if (isPendingRef.current) return

    const prevLiked = liked
    const prevCount = count
    const nextLiked = !liked
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1))

    setLiked(nextLiked)
    setCount(nextCount)
    isPendingRef.current = true

    // 캐시 즉시 업데이트 → 탭 이동 후 돌아와도 유지
    queryClient.setQueryData<Record<string, { liked: boolean; count: number }>>(
      ['review-likes', saunaId],
      (old) => old ? { ...old, [reviewId]: { liked: nextLiked, count: nextCount } } : old
    )

    const result = await toggleReviewLike(reviewId)
    isPendingRef.current = false

    if (!result.ok) {
      setLiked(prevLiked)
      setCount(prevCount)
      queryClient.setQueryData<Record<string, { liked: boolean; count: number }>>(
        ['review-likes', saunaId],
        (old) => old ? { ...old, [reviewId]: { liked: prevLiked, count: prevCount } } : old
      )
      toast.error(result.error ?? '좋아요 처리에 실패했습니다')
    } else {
      setLiked(result.liked)
      setCount(result.count)
      queryClient.setQueryData<Record<string, { liked: boolean; count: number }>>(
        ['review-likes', saunaId],
        (old) => old ? { ...old, [reviewId]: { liked: result.liked, count: result.count } } : old
      )
    }
  }

  return (
    <button onClick={handleToggle}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
        liked ? 'bg-red-50 text-red-500' : 'text-text-muted hover:bg-bg-sub hover:text-text-sub'
      }`}>
      {liked ? <BiSolidHeart size={14} className="text-red-500" /> : <BiHeart size={14} />}
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  )
}

/* ── 댓글 바텀시트 ───────────────────────────────────────── */
function CommentSheet({ review, onClose }: { review: ReviewDto; onClose: () => void }) {
  const { user } = useUserStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  // portal 대상: #app-root → 웹 데스크톱에서도 앱 너비 안에 렌더됨
  const [portalEl, setPortalEl] = useState<Element | null>(null)

  useEffect(() => {
    setPortalEl(document.getElementById('app-root'))
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const { data: comments = [], isLoading } = useQuery<CommentDto[]>({
    queryKey: ['comments', review.id],
    queryFn: () => getCommentsByReviewId(review.id),
    staleTime: 1000 * 30,
  })

  const createMutation = useMutation({
    mutationFn: () => createComment(review.id, text),
    onSuccess: (result) => {
      if (!result.ok) { toast.error(result.error ?? '댓글 작성에 실패했습니다'); return }
      setText('')
      queryClient.invalidateQueries({ queryKey: ['comments', review.id] })
    },
    onError: () => toast.error('댓글 작성에 실패했습니다'),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (result, commentId) => {
      if (!result.ok) { toast.error(result.error ?? '삭제에 실패했습니다'); return }
      queryClient.setQueryData<CommentDto[]>(['comments', review.id],
        (prev) => prev?.filter((c) => c.id !== commentId) ?? []
      )
    },
  })

  if (!portalEl) return null

  const author = review.users
  const authorName = author?.nickname ?? '익명'

  return createPortal(
    // fixed → absolute, 기준점 #app-root (relative)
    <div className="absolute inset-0 z-[300] flex flex-col justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="flex max-h-[80%] flex-col rounded-t-2xl bg-bg-card border-t border-border-main shadow-xl"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-border-strong" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 flex-shrink-0 border-b border-border-subtle">
          <div>
            <p className="text-[10px] font-black tracking-widest text-text-muted uppercase">Comments</p>
            <p className="text-[13px] font-black text-text-main">
              {authorName}의 사활 · {comments.length}개
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-sub text-text-sub transition active:scale-90">
            <BiX size={18} />
          </button>
        </div>

        {review.content && (
          <div className="mx-4 mt-3 flex-shrink-0 rounded-xl border border-border-subtle bg-bg-sub px-3.5 py-2.5">
            <p className="text-[11px] text-text-muted mb-1">{authorName}</p>
            <p className="line-clamp-2 text-[12px] text-text-sub">{review.content}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-3">
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2.5 animate-pulse">
                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-bg-sub" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-2.5 w-20 rounded bg-bg-sub" />
                  <div className="h-3 w-full rounded bg-bg-sub" />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="text-3xl opacity-20">💬</span>
              <p className="text-[12px] text-text-muted">첫 댓글을 남겨보세요</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isMe = user?.id === comment.users?.id
              const name = comment.users?.nickname ?? '익명'
              const avatar = comment.users?.avatar_url
              const dateStr = new Date(comment.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
              return (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-border-main bg-bg-sub">
                    {avatar
                      ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><BiUser size={14} className="text-text-muted" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-black text-text-main">{name}</span>
                      <span className="text-[10px] text-text-muted">{dateStr}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-text-sub whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                  {isMe && (
                    <button onClick={() => deleteMutation.mutate(comment.id)} disabled={deleteMutation.isPending}
                      className="flex-shrink-0 p-1 text-text-muted transition hover:text-danger active:scale-90">
                      <BiTrash size={14} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="flex-shrink-0 border-t border-border-subtle px-4 py-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-border-main bg-bg-sub">
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center"><BiUser size={14} className="text-text-muted" /></div>
                }
              </div>
              <input ref={inputRef} type="text" value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && text.trim() && createMutation.mutate()}
                placeholder="댓글 달기..." maxLength={500}
                className="flex-1 rounded-full border border-border-main bg-bg-sub px-3.5 py-2 text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-point transition"
              />
              <button onClick={() => createMutation.mutate()} disabled={!text.trim() || createMutation.isPending}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-point text-white transition active:scale-90 disabled:opacity-40">
                {createMutation.isPending
                  ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <BiSend size={14} />}
              </button>
            </div>
          ) : (
            <button onClick={() => { onClose(); router.push('/login') }}
              className="w-full rounded-full border border-border-main bg-bg-sub py-2.5 text-[13px] font-bold text-text-sub transition active:scale-[0.98]">
              로그인하고 댓글 달기
            </button>
          )}
        </div>
      </div>
    </div>,
    portalEl
  )
}

/* ── ReviewCard ──────────────────────────────────────────── */
function ReviewCard({ review, saunaId, likeStatus }: {
  review: ReviewDto
  saunaId: string
  likeStatus: { liked: boolean; count: number }
}) {
  const { user } = useUserStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)

  const isMe = user?.id === review.users?.id
  const author = review.users
  const displayName = author?.nickname ?? '익명'
  const avatar = author?.avatar_url ?? null
  const content = review.content ?? ''
  const isLong = content.length > MAX_CHARS
  const displayText = expanded || !isLong ? content : content.slice(0, MAX_CHARS) + '…'

  const dateStr = review.visit_date
    ? new Date(review.visit_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { deleteReview: _delete } = await import('@/app/actions/review.actions')
      const res = await _delete(review.id)
      if (!res.ok) throw new Error(res.error)
    },
    onSuccess: () => {
      toast.success('사활 기록이 삭제되었습니다 🗑️')
      queryClient.invalidateQueries({ queryKey: ['reviews', saunaId] })
      queryClient.invalidateQueries({ queryKey: ['review-count', saunaId] })
      queryClient.invalidateQueries({ queryKey: ['sauna', saunaId] })
    },
    onError: (e: Error) => toast.error(e.message || '삭제 중 오류가 발생했습니다'),
  })

  const handleDelete = () => {
    if (window.confirm('이 사활 기록을 삭제하시겠습니까?')) {
      deleteMutation.mutate()
    }
  }

  return (
    <>
      <div className="border-b border-border-subtle px-4 py-4 transition hover:bg-bg-sub">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-border-main bg-bg-sub">
            {avatar
              ? <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center"><BiUser size={16} className="text-text-muted" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-black text-text-main">{displayName}</span>
              {dateStr && <span className="text-[10px] text-text-muted">{dateStr}</span>}
            </div>
            {review.rating > 0 && (
              <div className="mt-0.5 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const isFull = review.rating >= n
                  const isHalf = review.rating === n - 0.5
                  return (
                    <span key={n} className="text-gold">
                      {isFull ? (
                        <BiSolidStar size={13} className="inline drop-shadow-sm" />
                      ) : isHalf ? (
                        <BiSolidStarHalf size={13} className="inline drop-shadow-sm" />
                      ) : (
                        <BiStar size={13} className="text-border-strong inline" />
                      )}
                    </span>
                  )
                })}
                {review.visit_time && (
                  <span className="ml-2 text-[10px] text-text-muted">
                    {VISIT_TIME_LABELS[review.visit_time] ?? review.visit_time}
                  </span>
                )}
              </div>
            )}
          </div>
          {isMe && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEditSheet(true)}
                className="text-[11px] font-bold text-text-sub hover:text-point px-2 py-1 rounded-md border border-border-main bg-bg-sub transition active:scale-95"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-[11px] font-bold text-danger hover:bg-danger/5 px-2 py-1 rounded-md border border-danger/20 bg-bg-sub transition active:scale-95 disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        <RenderSessions sessions={review.sessions} />

        {content && (
          <div className="mt-2.5">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-sub">{displayText}</p>
            {isLong && (
              <button onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-0.5 text-[12px] font-bold text-point">
                {expanded ? '접기' : '더 보기'}
                <BiChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {review.images?.length > 0 && (
          <div className="mt-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
            {review.images.map((img, i) => (
              <div key={i} className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-border-main">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-1">
          <LikeButton
            reviewId={review.id}
            saunaId={saunaId}
            initialLiked={likeStatus.liked}
            initialCount={likeStatus.count}
          />
          <button onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-text-muted transition hover:bg-bg-sub hover:text-text-sub active:scale-95">
            <BiComment size={14} />
            {(review.comment_count ?? 0) > 0 && <span className="tabular-nums">{review.comment_count}</span>}
          </button>
        </div>
      </div>

      {showComments && <CommentSheet review={review} onClose={() => setShowComments(false)} />}
      {showEditSheet && (
        <ReviewBottomSheet
          sauna={{ id: saunaId, name: '' } as any}
          initialReview={review}
          onClose={() => setShowEditSheet(false)}
        />
      )}
    </>
  )
}

/* ── 스켈레톤 ── */
function ReviewSkeleton() {
  return (
    <div className="divide-y divide-border-subtle">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-bg-sub" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-bg-sub" />
              <div className="h-2.5 w-16 rounded bg-bg-sub" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="h-3 w-full rounded bg-bg-sub" />
            <div className="h-3 w-4/5 rounded bg-bg-sub" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── 메인 ── */
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

  const reviewIds = reviews.map((r) => r.id)

  const { data: likeStatuses = {} } = useQuery({
    queryKey: ['review-likes', saunaId],
    queryFn: () => getReviewLikeStatuses(reviewIds),
    enabled: reviewIds.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) return <ReviewSkeleton />

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-5xl opacity-20">🔥</span>
        <p className="text-[14px] font-bold text-text-sub">아직 사활 기록이 없어요</p>
        <p className="text-[12px] text-text-muted">첫 번째 사활을 남겨보세요!</p>
        <button onClick={onWrite}
          className="mt-2 rounded-full bg-point px-6 py-2.5 text-[13px] font-black text-white transition active:scale-95">
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
          saunaId={saunaId}
          likeStatus={likeStatuses[review.id] ?? { liked: false, count: review.like_count ?? 0 }}
        />
      ))}
    </div>
  )
}
