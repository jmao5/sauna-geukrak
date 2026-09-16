'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { BiHeart, BiComment, BiStar } from 'react-icons/bi'
import { getFeedReviews, FeedScope } from '@/app/actions/review.actions'
import { toggleFollow, getMyFollowingIds } from '@/app/actions/follow.actions'
import { useUserStore } from '@/stores/userStore'
import { RecentReviewDto } from '@/types/sauna'
import RoutineTimeline from '@/components/sauna/RoutineTimeline'
import Loading from '@/components/ui/Loading'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import { hapticFeedback } from '@/utils/haptic'
import toast from 'react-hot-toast'

const PAGE_SIZE = 15

const SCOPES: { id: FeedScope; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'following', label: '팔로잉' },
]

const VISIT_TIME_LABELS: Record<string, string> = {
  morning: '🌅 아침',
  afternoon: '☀️ 오후',
  evening: '🌆 저녁',
  night: '🌙 야간',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

function FeedCard({
  review,
  currentUserId,
  followingIds,
  onToggleFollow,
}: {
  review: RecentReviewDto
  currentUserId?: string | null
  followingIds: string[]
  onToggleFollow: (targetUserId: string) => void
}) {
  const author = review.users
  const sauna = review.saunas
  const images = (review.images ?? []).slice(0, 3)
  const isMe = !!author && author.id === currentUserId
  const isFollowing = !!author && followingIds.includes(author.id)

  return (
    <article className="rounded-2xl border border-border-subtle bg-bg-card p-3.5">
      {/* 작성자 + 팔로우 버튼 + 별점 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={author ? `/users/${author.id}` : '#'}
            className="flex min-w-0 items-center gap-2 transition active:opacity-70"
          >
            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-border-main bg-bg-sub">
              {author?.avatar_url ? (
                <Image src={author.avatar_url} alt={author.nickname} fill sizes="32px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm">🧖</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-black text-text-main">{author?.nickname ?? '사우나러'}</p>
              <p className="text-[10px] text-text-muted">{timeAgo(review.created_at)}</p>
            </div>
          </Link>

          {/* 원탭 팔로우 버튼 */}
          {author && !isMe && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFollow(author.id)
              }}
              className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-black transition active:scale-90 ${
                isFollowing
                  ? 'border border-border-main bg-bg-sub text-text-muted hover:text-text-main'
                  : 'bg-point text-white hover:bg-point-hover'
              }`}
            >
              {isFollowing ? '팔로잉' : '+ 팔로우'}
            </button>
          )}
        </div>

        <span className="flex flex-shrink-0 items-center gap-0.5 text-[11px] font-black text-amber-500">
          <BiStar size={12} style={{ fill: 'currentColor' }} />
          {review.rating}
        </span>
      </div>

      {/* 사우나 */}
      <Link
        href={sauna ? `/saunas/${sauna.id}?tab=reviews` : '#'}
        className="mt-2.5 flex items-center justify-between rounded-xl bg-bg-sub/60 px-3 py-2 transition active:opacity-70"
      >
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-black text-text-main">{sauna?.name ?? '사우나'}</p>
          {sauna?.address && (
            <p className="truncate text-[10px] text-text-muted">{sauna.address.split(' ').slice(0, 3).join(' ')}</p>
          )}
        </div>
        {review.visit_time && (
          <span className="flex-shrink-0 text-[10px] font-bold text-text-muted">
            {VISIT_TIME_LABELS[review.visit_time] ?? review.visit_time}
          </span>
        )}
      </Link>

      {/* 루틴 */}
      {review.sessions && review.sessions.length > 0 && (
        <div className="mt-2.5 overflow-hidden">
          <RoutineTimeline sessions={review.sessions} variant="compact" />
        </div>
      )}

      {/* 본문 */}
      {review.content && (
        <p className="mt-2.5 line-clamp-3 whitespace-pre-line text-[12px] leading-relaxed text-text-sub">
          {review.content}
        </p>
      )}

      {/* 사진 */}
      {images.length > 0 && (
        <div className={`mt-2.5 grid gap-1.5 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {images.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-bg-sub">
              <Image src={src} alt={`사활 사진 ${i + 1}`} fill sizes="(max-width: 576px) 33vw, 190px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* 반응 */}
      <div className="mt-2.5 flex items-center gap-3 border-t border-border-subtle/60 pt-2 text-[11px] font-bold text-text-muted">
        <span className="flex items-center gap-1">
          <BiHeart size={13} /> <span className="tabular-nums">{review.like_count ?? 0}</span>
        </span>
        <span className="flex items-center gap-1">
          <BiComment size={13} /> <span className="tabular-nums">{review.comment_count ?? 0}</span>
        </span>
        {review.congestion && <span className="ml-auto">혼잡도 {review.congestion}</span>}
      </div>
    </article>
  )
}

function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-2.5 rounded-2xl border border-border-subtle bg-bg-card p-3.5">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-bg-sub" />
        <div className="space-y-1.5">
          <div className="h-3 w-20 rounded bg-bg-sub" />
          <div className="h-2.5 w-12 rounded bg-bg-sub" />
        </div>
      </div>
      <div className="h-10 rounded-xl bg-bg-sub" />
      <div className="h-3 w-3/4 rounded bg-bg-sub" />
    </div>
  )
}

export default function FeedClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isLoading: isAuthLoading } = useUserStore()
  const [scope, setScope] = useState<FeedScope>('all')

  // 로그인 유저의 현재 팔로잉 ID 목록 조회
  const { data: followingIds = [] } = useQuery({
    queryKey: ['my-following-ids', user?.id],
    queryFn: () => getMyFollowingIds(),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  })

  const handleToggleFollow = async (targetUserId: string) => {
    if (!user) {
      toast('로그인 후 팔로우할 수 있어요', { icon: '🔒' })
      router.push('/login')
      return
    }
    hapticFeedback('light')
    const res = await toggleFollow(targetUserId)
    if (res.ok) {
      toast(res.following ? '사우너를 팔로우했어요!' : '팔로우를 취소했어요', {
        icon: res.following ? '🤝' : '👋',
      })
      queryClient.invalidateQueries({ queryKey: ['my-following-ids'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] })
    } else {
      toast.error(res.error ?? '팔로우 처리에 실패했습니다')
    }
  }

  const enabled = scope === 'all' || (!!user && !isAuthLoading)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['feed', scope, scope === 'following' ? user?.id : null],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getFeedReviews({ scope, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length : undefined),
    staleTime: 1000 * 60 * 2,
    enabled,
  })

  const reviews = (data?.pages ?? []).flat()

  const sentinelRef = useIntersectionObserver({
    rootMargin: '400px',
    onObserve: () => fetchNextPage(),
    enabled: !!hasNextPage && !isFetchingNextPage,
  })

  const switchScope = (next: FeedScope) => {
    if (next === scope) return
    hapticFeedback('light')
    setScope(next)
  }

  const needsLogin = scope === 'following' && !isAuthLoading && !user

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-bg-sub shadow-[0_1px_0_var(--border-main)]">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h1 className="font-juache text-[26px] leading-none text-text-main" style={{ letterSpacing: '-0.02em' }}>
              사활 피드
            </h1>
            <p className="mt-1 text-[11px] font-bold text-text-muted">사우너들의 실시간 루틴</p>
          </div>
        </div>

        {/* 전체 / 팔로잉 탭 */}
        <div className="flex px-4">
          {SCOPES.map((s) => {
            const active = s.id === scope
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => switchScope(s.id)}
                className={`relative flex-1 py-2.5 text-[12.5px] font-black transition ${
                  active ? 'text-point' : 'text-text-muted'
                }`}
              >
                {s.label}
                {active && <span className="absolute inset-x-6 bottom-0 h-[2px] rounded-full bg-point" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* 목록 */}
      <div data-scroll-main className="flex-1 overflow-y-auto scrollbar-hide">
        {needsLogin ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-5xl">🔒</span>
            <p className="text-[14px] font-black text-text-main">로그인하면 팔로잉 피드를 볼 수 있어요</p>
            <p className="text-[12px] text-text-muted">팔로우한 사우너의 사활만 모아 보여드려요</p>
            <Link
              href="/login"
              className="mt-2 rounded-full bg-point px-6 py-2.5 text-[13px] font-black text-white transition active:scale-95"
            >
              로그인
            </Link>
          </div>
        ) : isLoading || (scope === 'following' && isAuthLoading) ? (
          <div className="space-y-2.5 p-4">
            {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-5xl">{scope === 'following' ? '👀' : '🔥'}</span>
            <p className="text-[14px] font-black text-text-main">
              {scope === 'following' ? '팔로우한 사우너의 사활이 아직 없어요' : '아직 올라온 사활이 없어요'}
            </p>
            <p className="text-[12px] text-text-muted">
              {scope === 'following' ? '전체 피드에서 마음에 드는 사우너를 팔로우해보세요' : '첫 사활을 기록해보세요'}
            </p>
            <button
              onClick={() => (scope === 'following' ? switchScope('all') : router.push('/'))}
              className="mt-2 rounded-full bg-point px-6 py-2.5 text-[13px] font-black text-white transition active:scale-95"
            >
              {scope === 'following' ? '전체 피드 보기' : '사우나 둘러보기'}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 p-4">
            {reviews.map((review) => (
              <FeedCard
                key={review.id}
                review={review}
                currentUserId={user?.id}
                followingIds={followingIds}
                onToggleFollow={handleToggleFollow}
              />
            ))}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-3">
                <Loading variant="dots" fullScreen={false} color="var(--color-point)" />
              </div>
            )}
          </div>
        )}
        <div className="h-20" />
      </div>
    </div>
  )
}
