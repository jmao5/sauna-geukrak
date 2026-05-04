'use client'

import { useTransition, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BiChevronLeft, BiUser, BiHeart } from 'react-icons/bi'
import { useQuery } from '@tanstack/react-query'
import { toggleFollow, getFollowStatus, UserProfileDto } from '@/app/actions/follow.actions'
import { useUserStore } from '@/stores/userStore'
import type { MyReviewDto } from '@/types/sauna'
import toast from 'react-hot-toast'

/* ── 팔로우 버튼 ─────────────────────────────────────────── */
function FollowButton({ targetId, initialFollowing, initialCount }: {
  targetId: string
  initialFollowing: boolean
  initialCount: number
}) {
  const { user } = useUserStore()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(
    { following: initialFollowing, count: initialCount },
    (_s, next: { following: boolean; count: number }) => next
  )

  const handleToggle = () => {
    if (!user) { toast('로그인 후 팔로우할 수 있어요', { icon: '🔒' }); router.push('/login'); return }
    const next = !optimistic.following
    startTransition(async () => {
      setOptimistic({ following: next, count: optimistic.count + (next ? 1 : -1) })
      const res = await toggleFollow(targetId)
      if (!res.ok) toast.error(res.error ?? '팔로우 처리에 실패했습니다')
    })
  }

  if (user?.id === targetId) return null

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`rounded-full px-5 py-2 text-[13px] font-black transition active:scale-95 ${
        optimistic.following
          ? 'border border-border-main bg-bg-sub text-text-sub'
          : 'bg-point text-white'
      }`}
    >
      {optimistic.following ? '팔로잉' : '팔로우'}
    </button>
  )
}

/* ── 사활 미니 카드 ──────────────────────────────────────── */
function ReviewMiniCard({ review }: { review: MyReviewDto }) {
  const sauna = review.saunas
  if (!sauna) return null

  const maxT = sauna.sauna_rooms?.length
    ? Math.max(...sauna.sauna_rooms.map(r => r.temp))
    : null
  const minC = sauna.cold_baths?.length
    ? Math.min(...sauna.cold_baths.map(b => b.temp))
    : null

  const dateStr = review.visit_date
    ? new Date(review.visit_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
    : null

  return (
    <Link
      href={`/saunas/${sauna.id}`}
      className="flex gap-3 px-4 py-3.5 border-b border-border-subtle transition active:bg-bg-sub last:border-0"
    >
      {/* 썸네일 */}
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-bg-sub">
        {sauna.images?.[0] ? (
          <img src={sauna.images[0]} alt={sauna.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
            <span className="text-lg">🧖</span>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13px] font-black text-text-main">{sauna.name}</p>
          {dateStr && <span className="flex-shrink-0 text-[10px] text-text-muted">{dateStr}</span>}
        </div>

        {/* 별점 */}
        {review.rating > 0 && (
          <div className="mt-0.5 flex items-center gap-0.5">
            {[1,2,3,4,5].map(n => (
              <span key={n} className={`text-[10px] ${n <= review.rating ? 'text-gold' : 'text-border-main'}`}>★</span>
            ))}
          </div>
        )}

        {/* 온도 + 내용 미리보기 */}
        <div className="mt-1 flex items-center gap-2">
          {maxT !== null && <span className="text-[11px] font-black text-sauna">🔥{maxT}°</span>}
          {minC !== null && <span className="text-[11px] font-black text-cold">❄️{minC}°</span>}
          {review.content && (
            <span className="truncate text-[11px] text-text-muted">{review.content}</span>
          )}
        </div>

        {/* 세션 뱃지 */}
        {review.sessions && review.sessions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {review.sessions.slice(0, 3).map((s, i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                s.type === 'sauna' ? 'bg-sauna-bg text-sauna'
                : s.type === 'cold' ? 'bg-cold-bg text-cold'
                : 'bg-bg-sub text-text-sub'
              }`}>
                {s.type === 'sauna' ? '♨' : s.type === 'cold' ? '❄' : '🌿'}
                {s.temp ? ` ${s.temp}°` : ''}
                {s.duration_minutes ? ` ${s.duration_minutes}분` : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

/* ── 메인 ────────────────────────────────────────────────── */
export default function UserProfileClient({
  profile,
  reviews,
}: {
  profile: UserProfileDto
  reviews: MyReviewDto[]
}) {
  const router = useRouter()
  const { user } = useUserStore()

  // 팔로우 상태 실시간 조회
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', profile.id],
    queryFn: () => getFollowStatus(profile.id),
    enabled: !!user && user.id !== profile.id,
    staleTime: 1000 * 30,
  })

  const isMyProfile = user?.id === profile.id

  return (
    <div className="flex h-full flex-col bg-bg-main">

      {/* 헤더 */}
      <div className="flex-shrink-0 bg-bg-sub border-b border-border-main">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full transition active:bg-bg-main"
          >
            <BiChevronLeft size={26} className="text-text-main" />
          </button>
          <h1 className="text-[15px] font-black text-text-main truncate flex-1">
            {profile.nickname}
          </h1>
        </div>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* 프로필 카드 */}
        <div className="bg-bg-sub px-4 pt-5 pb-5 border-b border-border-main">
          <div className="flex items-start gap-4">
            {/* 아바타 */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-border-main bg-bg-main">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nickname} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BiUser size={28} className="text-text-muted" />
                </div>
              )}
            </div>

            {/* 닉네임 + 바이오 */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[17px] font-black text-text-main leading-tight">{profile.nickname}</p>
              {profile.bio && (
                <p className="mt-1 text-[12px] leading-relaxed text-text-sub">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* 팔로워 통계 + 팔로우 버튼 */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[16px] font-black tabular-nums text-text-main">{reviews.length}</p>
                <p className="text-[10px] font-bold text-text-muted">사활</p>
              </div>
              <div className="h-8 w-px bg-border-main" />
              <div className="text-center">
                <p className="text-[16px] font-black tabular-nums text-text-main">
                  {followStatus?.followerCount ?? profile.follower_count}
                </p>
                <p className="text-[10px] font-bold text-text-muted">팔로워</p>
              </div>
              <div className="h-8 w-px bg-border-main" />
              <div className="text-center">
                <p className="text-[16px] font-black tabular-nums text-text-main">{profile.following_count}</p>
                <p className="text-[10px] font-bold text-text-muted">팔로잉</p>
              </div>
            </div>

            {!isMyProfile && (
              <FollowButton
                targetId={profile.id}
                initialFollowing={followStatus?.following ?? false}
                initialCount={followStatus?.followerCount ?? profile.follower_count}
              />
            )}
            {isMyProfile && (
              <Link
                href="/my/settings"
                className="rounded-full border border-border-main bg-bg-main px-4 py-2 text-[12px] font-bold text-text-sub transition active:scale-95"
              >
                프로필 편집
              </Link>
            )}
          </div>
        </div>

        {/* 사활 기록 목록 */}
        <div className="bg-bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <p className="text-[12px] font-bold text-text-sub">사활 기록</p>
            <p className="tabular-nums text-[12px] text-text-muted font-bold">{reviews.length}건</p>
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-4xl opacity-20">🔥</span>
              <p className="text-[13px] font-bold text-text-sub">아직 사활 기록이 없어요</p>
            </div>
          ) : (
            <div>
              {reviews.map(review => (
                <ReviewMiniCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}
