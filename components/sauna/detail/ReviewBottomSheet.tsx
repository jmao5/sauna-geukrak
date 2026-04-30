'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BiStar, BiSolidStar, BiX } from 'react-icons/bi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-instance'
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
      return api.reviews.create({
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

  const sheet = !user ? (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-bg-card border-t border-border-main p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-base font-black text-text-main">로그인이 필요해요</p>
        <p className="mb-5 text-[12px] text-text-sub">사활 기록은 로그인 후 작성 가능합니다</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full rounded-xl bg-point py-3 text-[13px] font-black text-white"
        >
          로그인하러 가기
        </button>
      </div>
    </div>
  ) : (
    <div
      className="fixed inset-0 z-[200] flex items-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-card border-t border-border-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3.5">
          <div>
            <p className="text-[10px] font-black tracking-widest text-text-muted uppercase">Review</p>
            <p className="text-[14px] font-black text-text-main">{sauna.name} 사활 기록</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-main text-text-sub"
          >
            <BiX size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* 별점 */}
          <div>
            <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRating(n) }}
                >
                  {n <= rating ? (
                    <BiSolidStar size={30} className="text-gold" />
                  ) : (
                    <BiStar size={30} className="text-text-muted" />
                  )}
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-1 self-center text-[12px] font-bold text-text-sub">
                  {RATING_LABELS[rating]}
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
              className="h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-[13px] text-text-main outline-none focus:border-point"
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
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-bold transition active:scale-95 ${
                    visitTime === id
                      ? 'border-point bg-point/5 text-point'
                      : 'border-border-main bg-bg-main text-text-sub'
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
              Memo (선택)
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="오늘의 극락 한 줄 기록..."
              rows={3}
              maxLength={200}
              className="w-full resize-none rounded-xl border border-border-main bg-bg-main px-3 py-2.5 text-[13px] text-text-main placeholder:text-text-muted outline-none focus:border-point"
            />
            <p className="mt-1 text-right text-[10px] text-text-muted">{content.length}/200</p>
          </div>

          {/* 저장 */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); mutation.mutate() }}
            disabled={rating === 0 || mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-point py-3.5 text-[13px] font-black text-white transition active:scale-[0.97] disabled:opacity-50"
          >
            {mutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              '🔥 사활 기록 저장'
            )}
          </button>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}
