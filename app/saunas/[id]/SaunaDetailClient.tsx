'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BiChevronLeft, BiEdit, BiBookmark, BiSolidBookmark,
  BiShare, BiMap, BiLogoInstagram, BiPlay, BiLinkExternal, BiPlus,
} from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import { m } from 'framer-motion'
import type { SaunaDto } from '@/types/sauna'
import { DetailSkeleton } from '@/components/sauna/detail/DetailPrimitives'
import { ReviewList } from '@/components/sauna/detail/ReviewList'
import { ReviewBottomSheet } from '@/components/sauna/detail/ReviewBottomSheet'
import { CongestionSection } from '@/components/sauna/detail/CongestionSection'
import InfoTab from '@/components/sauna/detail/InfoTab'
import { getReviewsBySaunaId, getReviewCount } from '@/app/actions/review.actions'
import { getSaunaById, updateSaunaImages } from '@/app/actions/sauna.actions'
import { checkFavorite, addFavorite, removeFavorite, getFavoriteCount } from '@/app/actions/favorite.actions'


// ── 탭 타입 ──────────────────────────────────────────────────
type Tab = 'info' | 'reviews' | 'congestion'
const TABS: { id: Tab; label: string }[] = [
  { id: 'info',       label: '시설정보' },
  { id: 'reviews',    label: '사활' },
  { id: 'congestion', label: '혼잡도' },
]

// ── 메인 ─────────────────────────────────────────────────────
export function SaunaDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useUserStore()

  const fromEdit = searchParams.get('from') === 'edit'
  const handleBack = () => {
    if (fromEdit) {
      router.push('/')
    } else {
      router.back()
    }
  }
  const [showReview, setShowReview] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const { data: isFav = false } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: () => (user ? checkFavorite(user.id, id) : Promise.resolve(false)),
    enabled: !!user && !!id,
  })

  // 찜 수 — 실제 DB 카운트
  const { data: favCount = 0 } = useQuery({
    queryKey: ['favorite-count', id],
    queryFn: () => getFavoriteCount(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  // 사활 수 — 실제 DB 카운트
  const { data: reviewCount = 0 } = useQuery({
    queryKey: ['review-count', id],
    queryFn: () => getReviewCount(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  const favMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not_logged_in')
      if (isFav) { await removeFavorite(id); return 'removed' as const }
      else        { await addFavorite(id);    return 'added'   as const }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorite', id, user?.id] })
      const prev = queryClient.getQueryData(['favorite', id, user?.id])
      queryClient.setQueryData(['favorite', id, user?.id], !isFav)
      // 찜 수 optimistic update
      queryClient.setQueryData(['favorite-count', id], (old: number) =>
        isFav ? Math.max(0, old - 1) : old + 1
      )
      return { prev }
    },
    onSuccess: (status) => {
      if (status === 'removed') toast.success('찜 목록에서 제거했어요')
      if (status === 'added')   toast.success('찜 목록에 추가했어요 ❤️')
    },
    onError: (error: Error, _, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(['favorite', id, user?.id], ctx.prev)
      queryClient.invalidateQueries({ queryKey: ['favorite-count', id] })
      if (error.message !== 'not_logged_in') toast.error('잠시 후 다시 시도해주세요')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['favorite-count', id] })
    },
  })

  const toggleFav = () => {
    if (!user) { router.push('/login'); return }
    if (favMutation.isPending) return
    favMutation.mutate()
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: sauna?.name ?? '사우나 극락', text: '여기 사우나 어때요?', url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('링크가 복사되었습니다')
    }
  }

  const { data: sauna, isLoading, isError } = useQuery<SaunaDto>({
    queryKey: ['sauna', id],
    queryFn: () => getSaunaById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
  const { data: kakaoImage } = useKakaoSaunaImage(sauna?.name ?? '', sauna?.address, sauna?.images?.[0])

  // ── 카카오 검색 이미지 DB 지연 동기화 (Lazy Syncing) ──
  useEffect(() => {
    if (sauna && !sauna.images?.[0] && kakaoImage) {
      updateSaunaImages(sauna.id, [kakaoImage]).catch(() => {})
    }
  }, [sauna, kakaoImage])

  if (isLoading) return <DetailSkeleton />

  if (isError || !sauna) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg-main p-6 text-center">
        <span className="text-4xl">😢</span>
        <p className="font-bold text-text-main">사우나 정보를 찾을 수 없어요</p>
        <button onClick={handleBack} className="rounded-full bg-point px-5 py-2.5 text-sm font-bold text-white">돌아가기</button>
      </div>
    )
  }

  const thumbnail  = sauna.images?.[0] ?? kakaoImage
  const hasMale    = sauna.rules?.male_allowed !== false
  const hasFemale  = sauna.rules?.female_allowed

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <div data-scroll-main className="flex-1 overflow-y-auto scrollbar-hide">

        {/* ── 히어로 이미지 ── */}
        <div className="relative w-full flex-shrink-0 bg-bg-sub" style={{ height: 220 }}>
          {thumbnail ? (
            <Image src={thumbnail} alt={sauna.name} fill className="object-cover" sizes="(max-width: 576px) 100vw, 576px" priority loading="eager" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
              <span className="text-7xl opacity-10">🧖</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 z-10">
            <button onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
              <BiChevronLeft size={22} />
            </button>
          </div>
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            {user && (
              <button onClick={() => router.push(`/saunas/${id}/edit`)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
                <BiEdit size={16} />
              </button>
            )}
            <button onClick={toggleFav} disabled={favMutation.isPending}
              className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90 disabled:opacity-50 ${isFav ? 'bg-point text-white' : 'bg-black/40 text-white'}`}>
              {favMutation.isPending
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : isFav ? <BiSolidBookmark size={16} /> : <BiBookmark size={16} />
              }
            </button>
            <button onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90">
              <BiShare size={16} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h1 className="text-[22px] font-black text-white leading-tight">{sauna.name}</h1>
            <div className="mt-1 flex items-center justify-between">
              <p className="flex items-center gap-1 text-[11px] text-white/70">
                <BiMap size={11} />
                {sauna.address}
              </p>
              <div className="flex gap-1">
                {hasMale   && <span className="rounded-full bg-point/90 px-2 py-0.5 text-[10px] font-black text-white">남</span>}
                {hasFemale && <span className="rounded-full bg-pink-500/90 px-2 py-0.5 text-[10px] font-black text-white">여</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── 찜 + 사활 카운트 — 실제 데이터 ── */}
        <div className="flex items-center gap-4 border-b border-border-subtle bg-bg-card px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-text-muted">찜</span>
            <span className="text-[13px] font-black text-point tabular-nums">
              {favCount.toLocaleString()}
            </span>
          </div>
          <div className="h-3 w-px bg-border-main" />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-text-muted">사활</span>
            <span className="text-[13px] font-black text-point tabular-nums">
              {reviewCount.toLocaleString()}
            </span>
          </div>
          <div className="ml-auto">
            <button
              onClick={toggleFav}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-black transition active:scale-95 ${
                isFav ? 'bg-point text-white' : 'border border-border-main bg-bg-main text-text-sub'
              }`}
            >
              {isFav ? <BiSolidBookmark size={13} /> : <BiBookmark size={13} />}
              찜하기
            </button>
          </div>
        </div>

        {/* ── 탭 바 ── */}
        <div className="sticky top-0 z-20 flex border-b border-border-main bg-bg-main">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-3.5 text-[14px] font-black transition ${
                  isActive ? 'text-text-main' : 'text-text-muted'
                }`}
              >
                <span className="relative z-10">
                  {tab.id === 'reviews'
                    ? `사활 ${reviewCount > 0 ? reviewCount : ''}`
                    : tab.label}
                </span>
                {isActive && (
                  <m.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-point"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* ── 탭 콘텐츠 ── */}
        {activeTab === 'info'       && <InfoTab sauna={sauna} />}
        {activeTab === 'reviews'    && <div className="pb-24"><ReviewList saunaId={id} onWrite={() => setShowReview(true)} /></div>}
        {activeTab === 'congestion' && <CongestionSection saunaId={id} />}
      </div>

      {/* ── 하단 CTA 바 ── */}
      <div className="flex-shrink-0 border-t border-border-main bg-bg-main px-4 py-3 pb-safe flex items-center gap-3">
        <button
          onClick={toggleFav}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-[13px] font-black transition active:scale-95 ${
            isFav ? 'border-point bg-point/10 text-point' : 'border-border-main bg-bg-main text-text-sub'
          }`}
        >
          {isFav ? <BiSolidBookmark size={16} /> : <BiBookmark size={16} />}
          찜하기
        </button>
        <button
          onClick={() => setShowReview(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-point py-3 text-[13px] font-black text-white transition active:scale-95"
        >
          <BiPlus size={16} />
          사활 투고
        </button>
      </div>

      {showReview && <ReviewBottomSheet sauna={sauna} onClose={() => setShowReview(false)} />}
    </div>
  )
}
