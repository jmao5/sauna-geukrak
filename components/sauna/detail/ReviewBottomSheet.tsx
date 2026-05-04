'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BiStar, BiSolidStar, BiX, BiImageAlt, BiPlus } from 'react-icons/bi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createReview } from '@/app/actions/review.actions'
import { useUserStore } from '@/stores/userStore'
import { createClient } from '@/lib/supabase/client'
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

const MAX_IMAGES = 5
const BUCKET = 'sauna-geukrak'

/* ── 이미지 업로드 훅 (클라이언트 Supabase Storage 직접) ── */
function useReviewImageUpload() {
  const [images, setImages] = useState<string[]>([])          // 확정된 public URL
  const [pending, setPending] = useState<{ preview: string }[]>([]) // 업로드 중
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAdd = images.length + pending.length < MAX_IMAGES

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const slots = Math.min(files.length, MAX_IMAGES - images.length - pending.length)
    if (slots <= 0) { toast.error(`최대 ${MAX_IMAGES}장까지 업로드할 수 있어요`); return }

    const selected = Array.from(files).slice(0, slots).filter((f) => f.type.startsWith('image/'))
    if (!selected.length) return

    const previews = selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setPending((p) => [...p, ...previews.map((x) => ({ preview: x.preview }))])

    try {
      const imageCompression = (await import('browser-image-compression')).default
      const compressed = await Promise.all(
        previews.map(async ({ file }) => {
          try { return await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true }) }
          catch { return file }
        })
      )

      const supabase = createClient()
      const results = await Promise.allSettled(
        compressed.map(async (file) => {
          const ext = file.name.split('.').pop() ?? 'jpg'
          const path = `reviews/temp/${crypto.randomUUID()}.${ext}`
          const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type })
          if (error) throw new Error(path)
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
          return data.publicUrl
        })
      )

      const urls: string[] = []
      const failedPaths: string[] = []
      results.forEach((r) => {
        if (r.status === 'fulfilled') urls.push(r.value)
        else if (r.reason instanceof Error) failedPaths.push(r.reason.message)
      })
      if (failedPaths.length) {
        supabase.storage.from(BUCKET).remove(failedPaths).catch(() => null)
        toast.error(`${failedPaths.length}개 업로드 실패`)
      }
      previews.forEach((p) => URL.revokeObjectURL(p.preview))
      setPending((p) => p.filter((x) => !previews.some((pv) => pv.preview === x.preview)))
      setImages((prev) => [...prev, ...urls])
    } catch {
      previews.forEach((p) => URL.revokeObjectURL(p.preview))
      setPending((p) => p.filter((x) => !previews.some((pv) => pv.preview === x.preview)))
      toast.error('업로드 중 오류가 발생했습니다')
    }
  }

  const remove = async (url: string, i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    if (url.includes('supabase')) {
      const supabase = createClient()
      const marker = `/${BUCKET}/`
      const idx = url.indexOf(marker)
      if (idx !== -1) {
        const path = url.slice(idx + marker.length)
        supabase.storage.from(BUCKET).remove([path]).catch(() => null)
      }
    }
  }

  const reset = () => { setImages([]); setPending([]) }

  return { images, pending, canAdd, fileInputRef, upload, remove, reset }
}

/* ── 이미지 업로더 UI ── */
function ReviewImageUploader({
  images, pending, canAdd, fileInputRef, upload, remove,
}: ReturnType<typeof useReviewImageUpload>) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-black text-text-muted tracking-widest uppercase">
        Photos <span className="font-medium normal-case tracking-normal">(선택, 최대 {MAX_IMAGES}장)</span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {/* 확정 이미지 */}
        {images.map((url, i) => (
          <div key={url} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border-main">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url, i)}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <BiX size={12} />
            </button>
          </div>
        ))}
        {/* 업로드 중 */}
        {pending.map((item) => (
          <div key={item.preview} className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border-main">
            <img src={item.preview} alt="" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          </div>
        ))}
        {/* 추가 버튼 */}
        {canAdd && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-main bg-bg-main transition active:scale-95 hover:border-point/40"
          >
            <BiPlus size={18} className="text-text-muted" />
            <span className="text-[9px] font-bold text-text-muted">추가</span>
          </button>
        )}
      </div>
      {images.length === 0 && pending.length === 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-text-muted">
          <BiImageAlt size={12} />
          사우나 내부, 탕 사진 등을 첨부해보세요
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => upload(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
      />
    </div>
  )
}

/* ── 메인 컴포넌트 ── */
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

  const imgUpload = useReviewImageUpload()

  useEffect(() => { setMounted(true) }, [])

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
        images: imgUpload.images,
      })
    },
    onSuccess: () => {
      toast.success('사활 기록 완료! 🔥')
      queryClient.invalidateQueries({ queryKey: ['reviews', sauna.id] })
      queryClient.invalidateQueries({ queryKey: ['review-count', sauna.id] })
      queryClient.invalidateQueries({ queryKey: ['sauna', sauna.id] })
      imgUpload.reset()
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
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-bg-card border-t border-border-main shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
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

          {/* 사진 업로드 */}
          <ReviewImageUploader {...imgUpload} />

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
            disabled={rating === 0 || mutation.isPending || imgUpload.pending.length > 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-point py-4 text-[13px] font-black text-white shadow-sm transition-all duration-200 hover:bg-point-hover hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : imgUpload.pending.length > 0 ? (
              '📷 사진 업로드 중...'
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
