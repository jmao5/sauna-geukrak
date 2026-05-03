'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  BiChevronLeft, BiSortAlt2, BiFilterAlt,
  BiEditAlt, BiCheck, BiX, BiMap, BiTrash,
} from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { useKakaoSaunaImage } from '@/hooks/useKakaoSaunaImage'
import {
  getFavoritesByUserId,
  removeFavorite,
  updateFavoriteMemo,
  updateFavoriteStatus,
} from '@/app/actions/favorite.actions'
import type { MyFavoriteDto, SaunaSummaryDto } from '@/types/sauna'

/* ── 정렬 타입 ── */
type SortKey = 'recent' | 'hot' | 'cold' | 'rating'
type FilterKey = 'all' | 'want' | 'visited'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: '최근 찜순' },
  { key: 'hot',    label: '고온순' },
  { key: 'cold',   label: '저온순' },
  { key: 'rating', label: '별점순' },
]

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: '전체' },
  { key: 'want',    label: '가고싶다' },
  { key: 'visited', label: '다녀왔다' },
]

/* ── 카드 썸네일 (카카오 fallback) ── */
function FavThumbnail({ sauna, size = 72 }: { sauna: SaunaSummaryDto; size?: number }) {
  const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, sauna.images?.[0])
  const src = sauna.images?.[0] ?? kakaoImage

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-xl"
      style={{ width: size, height: size, background: 'var(--bg-sub)', border: '1px solid var(--border-main)' }}
    >
      {src ? (
        <Image src={src} alt={sauna.name} fill className="object-cover" sizes={`${size}px`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span style={{ fontSize: size * 0.4, opacity: 0.12 }}>♨</span>
        </div>
      )}
    </div>
  )
}

/* ── 메모 인라인 에디터 ── */
function MemoEditor({
  saunaId,
  initialMemo,
  onSave,
}: {
  saunaId: string
  initialMemo: string
  onSave: (memo: string) => void
}) {
  const [value, setValue] = useState(initialMemo)
  const [editing, setEditing] = useState(false)

  const handleSave = () => {
    onSave(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-left transition-opacity active:opacity-60"
      >
        {value ? (
          <p className="text-[11px] leading-snug" style={{ color: 'var(--text-sub)' }}>
            {value}
          </p>
        ) : (
          <p className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <BiEditAlt size={11} />
            메모 추가
          </p>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        maxLength={60}
        placeholder="메모를 입력하세요 (60자)"
        className="flex-1 rounded-lg px-2 py-1 text-[11px] outline-none"
        style={{
          background: 'var(--bg-sub)',
          border: '1px solid var(--point-color)',
          color: 'var(--text-main)',
        }}
      />
      <button onClick={handleSave} className="flex-shrink-0 active:opacity-60">
        <BiCheck size={16} style={{ color: 'var(--point-color)' }} />
      </button>
      <button onClick={() => setEditing(false)} className="flex-shrink-0 active:opacity-60">
        <BiX size={16} style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  )
}

/* ── 찜 카드 ── */
function FavCard({
  item,
  onRemove,
  onMemoSave,
  onStatusToggle,
}: {
  item: MyFavoriteDto
  onRemove: (saunaId: string) => void
  onMemoSave: (saunaId: string, memo: string) => void
  onStatusToggle: (saunaId: string, current: 'want' | 'visited') => void
}) {
  const sauna = item.saunas
  if (!sauna) return null

  const status    = item.status ?? 'want'
  const isVisited = status === 'visited'
  const maxHot    = sauna.sauna_rooms?.length ? Math.max(...sauna.sauna_rooms.map((r) => r.temp)) : null
  const minCold   = sauna.cold_baths?.length  ? Math.min(...sauna.cold_baths.map((b) => b.temp))  : null

  return (
    <div
      className="overflow-hidden rounded-2xl transition-all duration-150"
      style={{ border: '1px solid var(--border-main)', background: 'var(--bg-card)' }}
    >
      <Link href={`/saunas/${sauna.id}`} className="flex items-start gap-3 p-3.5 active:opacity-80">
        <FavThumbnail sauna={sauna} size={68} />

        <div className="min-w-0 flex-1 pt-0.5">
          {/* 이름 + 상태 배지 */}
          <div className="mb-1 flex items-center gap-2">
            <p
              className="truncate text-[14px] font-black leading-tight"
              style={{ color: 'var(--text-main)', letterSpacing: '-0.01em' }}
            >
              {sauna.name}
            </p>
            <span
              className="flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black"
              style={
                isVisited
                  ? { background: '#e8f5e9', color: '#2e7d32' }
                  : { background: 'var(--cold-bg)', color: 'var(--point-color)' }
              }
            >
              {isVisited ? '✓ 다녀왔다' : '♡ 가고싶다'}
            </span>
          </div>

          {/* 주소 */}
          <p className="mb-1.5 truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {sauna.address}
          </p>

          {/* 온도 + 별점 */}
          <div className="flex items-center gap-2.5">
            {maxHot !== null && (
              <span className="temp-number text-[12px]" style={{ color: 'var(--sauna-color)' }}>
                🔥{maxHot}°
              </span>
            )}
            {minCold !== null && (
              <span className="temp-number text-[12px]" style={{ color: 'var(--point-color)' }}>
                ❄️{minCold}°
              </span>
            )}
            {sauna.avg_rating != null && (
              <span className="text-[11px] font-bold" style={{ color: 'var(--text-sub)' }}>
                ★ {sauna.avg_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* 메모 + 액션 바 */}
      <div
        className="px-3.5 pb-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        {/* 메모 에디터 */}
        <div className="py-2">
          <MemoEditor
            saunaId={sauna.id}
            initialMemo={item.memo ?? ''}
            onSave={(memo) => onMemoSave(sauna.id, memo)}
          />
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 상태 토글 */}
          <button
            onClick={() => onStatusToggle(sauna.id, status)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition active:opacity-70"
            style={
              isVisited
                ? { background: 'var(--bg-sub)', color: 'var(--text-muted)', border: '1px solid var(--border-main)' }
                : { background: 'var(--cold-bg)', color: 'var(--point-color)', border: '1px solid var(--border-main)' }
            }
          >
            {isVisited ? '↩ 가고싶다로' : '✓ 다녀왔다'}
          </button>

          {/* 지도 */}
          <Link
            href={`/map?lat=${sauna.latitude}&lng=${sauna.longitude}&id=${sauna.id}`}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition active:opacity-70"
            style={{ background: 'var(--bg-sub)', border: '1px solid var(--border-main)' }}
          >
            <BiMap size={14} style={{ color: 'var(--text-sub)' }} />
          </Link>

          {/* 찜 해제 */}
          <button
            onClick={() => onRemove(sauna.id)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition active:opacity-70"
            style={{ background: 'var(--bg-sub)', border: '1px solid var(--border-main)' }}
          >
            <BiTrash size={14} style={{ color: 'var(--color-danger)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 메인 ── */
export default function FavoritesClient() {
  const router = useRouter()
  const { user } = useUserStore()
  const queryClient = useQueryClient()

  const [sort, setSort]         = useState<SortKey>('recent')
  const [filter, setFilter]     = useState<FilterKey>('all')
  const [showSort, setShowSort] = useState(false)

  const { data = [], isLoading } = useQuery<MyFavoriteDto[]>({
    queryKey: ['favorites', user?.id],
    queryFn: () => getFavoritesByUserId(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  })

  /* 찜 해제 */
  const removeMut = useMutation({
    mutationFn: (saunaId: string) => removeFavorite(saunaId),
    onMutate: async (saunaId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] })
      const prev = queryClient.getQueryData<MyFavoriteDto[]>(['favorites', user?.id])
      queryClient.setQueryData<MyFavoriteDto[]>(['favorites', user?.id],
        (old) => (old ?? []).filter((f) => f.sauna_id !== saunaId))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['favorites', user?.id], ctx.prev)
      toast.error('찜 해제에 실패했어요')
    },
    onSuccess: () => toast.success('찜 목록에서 제거했어요'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  })

  /* 메모 저장 */
  const memoMut = useMutation({
    mutationFn: ({ saunaId, memo }: { saunaId: string; memo: string }) =>
      updateFavoriteMemo(saunaId, memo),
    onMutate: async ({ saunaId, memo }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] })
      const prev = queryClient.getQueryData<MyFavoriteDto[]>(['favorites', user?.id])
      queryClient.setQueryData<MyFavoriteDto[]>(['favorites', user?.id],
        (old) => (old ?? []).map((f) => f.sauna_id === saunaId ? { ...f, memo } : f))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['favorites', user?.id], ctx.prev)
      toast.error('메모 저장에 실패했어요')
    },
    onSuccess: () => toast.success('메모가 저장됐어요'),
  })

  /* 상태 토글 */
  const statusMut = useMutation({
    mutationFn: ({ saunaId, current }: { saunaId: string; current: 'want' | 'visited' }) =>
      updateFavoriteStatus(saunaId, current === 'want' ? 'visited' : 'want'),
    onMutate: async ({ saunaId, current }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] })
      const prev = queryClient.getQueryData<MyFavoriteDto[]>(['favorites', user?.id])
      const next = current === 'want' ? 'visited' : 'want'
      queryClient.setQueryData<MyFavoriteDto[]>(['favorites', user?.id],
        (old) => (old ?? []).map((f) => f.sauna_id === saunaId ? { ...f, status: next } : f))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['favorites', user?.id], ctx.prev)
      toast.error('상태 변경에 실패했어요')
    },
    onSuccess: (_, { current }) =>
      toast.success(current === 'want' ? '다녀왔다로 변경됐어요 ✓' : '가고싶다로 변경됐어요 ♡'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  })

  /* 필터 + 정렬 */
  const processed = useMemo(() => {
    let items = [...data]

    // 필터
    if (filter === 'want')    items = items.filter((f) => (f.status ?? 'want') === 'want')
    if (filter === 'visited') items = items.filter((f) => f.status === 'visited')

    // 정렬
    items.sort((a, b) => {
      const sa = a.saunas
      const sb = b.saunas
      if (sort === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sort === 'hot') {
        const ta = sa?.sauna_rooms?.length ? Math.max(...sa.sauna_rooms.map((r) => r.temp)) : 0
        const tb = sb?.sauna_rooms?.length ? Math.max(...sb.sauna_rooms.map((r) => r.temp)) : 0
        return tb - ta
      }
      if (sort === 'cold') {
        const ta = sa?.cold_baths?.length ? Math.min(...sa.cold_baths.map((r) => r.temp)) : 999
        const tb = sb?.cold_baths?.length ? Math.min(...sb.cold_baths.map((r) => r.temp)) : 999
        return ta - tb
      }
      if (sort === 'rating') {
        return (sb?.avg_rating ?? 0) - (sa?.avg_rating ?? 0)
      }
      return 0
    })

    return items
  }, [data, filter, sort])

  /* 통계 */
  const wantCount    = data.filter((f) => (f.status ?? 'want') === 'want').length
  const visitedCount = data.filter((f) => f.status === 'visited').length

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-main)' }}>

      {/* 헤더 */}
      <div
        className="flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-2 px-4 pt-5 pb-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full transition active:opacity-60"
            style={{ background: 'var(--bg-sub)' }}
          >
            <BiChevronLeft size={22} style={{ color: 'var(--text-main)' }} />
          </button>
          <div className="flex-1">
            <h1
              className="text-[18px] font-black leading-tight"
              style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
            >
              찜한 사우나
            </h1>
          </div>
          {/* 정렬 버튼 */}
          <button
            onClick={() => setShowSort((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:opacity-70"
            style={{
              background: showSort ? 'var(--point-color)' : 'var(--bg-sub)',
              color: showSort ? '#fff' : 'var(--text-sub)',
              border: '1px solid var(--border-main)',
            }}
          >
            <BiSortAlt2 size={13} />
            {SORT_OPTIONS.find((s) => s.key === sort)?.label}
          </button>
        </div>

        {/* 정렬 드롭다운 */}
        {showSort && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setSort(opt.key); setShowSort(false) }}
                className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition active:opacity-70"
                style={
                  sort === opt.key
                    ? { background: 'var(--point-color)', color: '#fff', border: '1.5px solid var(--point-color)' }
                    : { background: 'transparent', color: 'var(--text-sub)', border: '1.5px solid var(--border-main)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* 통계 + 필터 */}
        {!isLoading && data.length > 0 && (
          <div className="flex items-center justify-between px-4 pb-3">
            {/* 필터 탭 */}
            <div className="flex gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className="rounded-full px-3 py-1 text-[10px] font-bold transition active:opacity-70"
                  style={
                    filter === opt.key
                      ? { background: 'var(--text-main)', color: 'var(--bg-main)' }
                      : { background: 'var(--bg-sub)', color: 'var(--text-muted)', border: '1px solid var(--border-main)' }
                  }
                >
                  {opt.label}
                  {opt.key === 'want'    && ` ${wantCount}`}
                  {opt.key === 'visited' && ` ${visitedCount}`}
                  {opt.key === 'all'     && ` ${data.length}`}
                </button>
              ))}
            </div>

            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {processed.length}곳
            </p>
          </div>
        )}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl skeleton-shimmer"
                style={{ border: '1px solid var(--border-subtle)' }}
              />
            ))}
          </div>
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span style={{ fontSize: 44, opacity: 0.2 }}>
              {filter === 'visited' ? '🧖' : '♡'}
            </span>
            <p className="text-[14px] font-black" style={{ color: 'var(--text-main)' }}>
              {filter === 'visited' ? '아직 다녀온 사우나가 없어요'
               : filter === 'want'  ? '가고싶은 사우나가 없어요'
               :                      '찜한 사우나가 없어요'}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              마음에 드는 사우나를 찜해보세요
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary mt-1 rounded-full px-6 py-2.5 text-[12px] font-black"
            >
              사우나 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {processed.map((item) => (
              <FavCard
                key={item.sauna_id}
                item={item}
                onRemove={(saunaId) => removeMut.mutate(saunaId)}
                onMemoSave={(saunaId, memo) => memoMut.mutate({ saunaId, memo })}
                onStatusToggle={(saunaId, current) => statusMut.mutate({ saunaId, current })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
