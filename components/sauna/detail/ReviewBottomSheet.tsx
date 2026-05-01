'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BiStar, BiSolidStar, BiX } from 'react-icons/bi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createReview } from '@/app/actions/review.actions'
import { useUserStore } from '@/stores/userStore'
import toast from 'react-hot-toast'
import type { SaunaDto } from '@/types/sauna'

const VISIT_TIMES = [
  { id: 'morning', label: '아침', emoji: '🌅' },
  { id: 'afternoon', label: '오후', emoji: '☀️' },
  { id: 'evening', label: '저녁', emoji: '🌆' },
  { id: 'night', label: '야간', emoji: '🌙' },
] as const

type VisitTime = (typeof VISIT_TIMES)[number]['id']

const RATING_LABELS = ['', '별로예요', '그저그래요', '괜찮아요', '좋아요', '극락이에요']

export function ReviewBottomSheet({
  sauna,
  onClose,
}: {
  sauna: SaunaDto
  onClose: () => void
}) {
  const { user } = useUserStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10))
  const [visitTime, setVisitTime] = useState<VisitTime>('afternoon')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('로그인 필요')
      return createReview({
        sauna_id: sauna.id,
        user_id: user.id,
        rating,
        content: content.trim() || undefined,
        visit_date: visitDate,
        visit_time: visitTime,
      })
    },
    onSuccess: () => {
      toast.success('사활 기록 완료! 🔥')
      queryClient.invalidateQueries({ queryKey: ['reviews', sauna.id] })
      onClose()
    },
    onError: (e: Error) => {
      toast.error(e.message || '저장 중 오류가 발생했습니다')
    },
  })

  if (!mounted) return null

  const displayRating = hoverRating || rating

  const sheet = !user ? (
    <div className="fixed inset-0 z-[200] flex items-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-bg-card border-t border-border-main p-6 text-center shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-base font-black text-text-main">로그인이 필요해요</p>
        <p className="mb-5 text-[12px] text-text-sub">사활 기록은 로그인 후 작성 가능합니다</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full rounded-xl bg-point py-3.5 text-[13px] font-black text-white shadow-sm transition-all duration-200 hover:bg-point-hover active:scale-[0.97]"
        >
          로그인하러 가기
        </button>
      </div>
    </div>
  ) : (
    <div
      className="fixed inset-0 z-[200] flex items-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-card border-t border-border-main shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border-strong" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div>
            <p className="text-[10px] font-black tracking-widest text-text-muted uppercase">Review</p>
            <p className="text-[14px] font-black text-text-main">{sauna.name} 사활 기록</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-main text-text-sub transition-all duration-200 hover:bg-bg-sub hover:text-text-main active:scale-90"
          >
            <BiX size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* 별점 */}
          <div>
            <p className="mb-2.5 text-[11px] font-black text-text-muted tracking-widest uppercase">Rating</p>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRating(n) }}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform duration-100 hover:scale-110 active:scale-95"
                >
                  {n <= displayRating ? (
                    <BiSolidStar size={30} className="text-gold drop-shadow-sm" />
                  ) : (
                    <BiStar size={30} className="text-border-strong" />
                  )}
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-2 text-[12px] font-bold text-text-sub transition-all duration-150">
                  {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* 방문 날짜 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">Visit Date</p>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-[13px] text-text-main outline-none transition-all duration-200 focus:border-point focus:ring-2 focus:ring-point/20"
            />
          </div>

          {/* 방문 시간대 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">Time</p>
            <div className="grid grid-cols-4 gap-2">
              {VISIT_TIMES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setVisitTime(id) }}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all duration-150 active:scale-95 ${
                    visitTime === id
                      ? 'border-point bg-point/8 text-point shadow-sm'
                      : 'border-border-main bg-bg-main text-text-sub hover:border-border-strong hover:bg-bg-sub'
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">
              Memo <span className="font-medium normal-case tracking-normal">(선택)</span>
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="오늘의 극락 한 줄 기록..."
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-border-main bg-bg-main px-3.5 py-3 text-[13px] text-text-main placeholder:text-text-muted outline-none transition-all duration-200 focus:border-point focus:ring-2 focus:ring-point/20"
            />
            <p className="mt-1 text-right text-[10px] text-text-muted">{content.length}/500</p>
          </div>

          {/* 저장 버튼 */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); mutation.mutate() }}
            disabled={rating === 0 || mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-point py-4 text-[13px] font-black text-white shadow-sm transition-all duration-200 hover:bg-point-hover hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>🔥 사활 기록 저장</>
            )}
          </button>

          {rating === 0 && (
            <p className="text-center text-[11px] text-text-muted -mt-3">별점을 먼저 선택해주세요</p>
          )}

          <div className="h-2" />
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}
