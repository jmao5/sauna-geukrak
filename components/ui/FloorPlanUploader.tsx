'use client'

/**
 * FloorPlanUploader
 *
 * 사우나 내부 모형도·도면 이미지를 업로드하는 컴포넌트.
 *
 * - 일반 사진과 달리 단독 전체 너비로 표시 (평면도는 가로로 길기 때문)
 * - 이미지를 클릭하면 전체 보기 모달
 * - Supabase Storage에 floor-plans/ 경로로 업로드
 * - 최대 maxCount개 제한 (기본 3개)
 * - 드래그 순서 변경 지원
 */

import { useRef, useState } from 'react'
import { BiPlus, BiX, BiExpand, BiImageAlt } from 'react-icons/bi'
import { MdDragIndicator, MdOutlineMap } from 'react-icons/md'
import { uploadFloorPlanAction, deleteImageAction } from '@/app/actions/storage.actions'
import toast from 'react-hot-toast'

interface Props {
  images: string[]
  onChange: (urls: string[]) => void
  saunaId?: string
  maxCount?: number
}

interface PendingItem {
  previewUrl: string
  uploading: boolean
}

/* ── 전체보기 모달 ── */
function FullscreenModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <BiX size={22} />
      </button>
      <img
        src={url}
        alt="모형도 전체보기"
        className="max-h-full max-w-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

/* ── 메인 컴포넌트 ── */
export default function FloorPlanUploader({
  images,
  onChange,
  saunaId = 'temp',
  maxCount = 3,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingItem[]>([])
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null)
  const dragIndex = useRef<number | null>(null)

  const canAdd = images.length + pending.length < maxCount

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const slots = Math.min(files.length, maxCount - images.length - pending.length)
    if (slots <= 0) {
      toast.error(`최대 ${maxCount}장까지 업로드할 수 있어요`)
      return
    }

    const selected = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, slots)

    if (selected.length === 0) return

    const imageCompression = (await import('browser-image-compression')).default
    const options = { maxSizeMB: 1, maxWidthOrHeight: 3000, useWebWorker: true }

    const previews = selected.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setPending((prev) => [
      ...prev,
      ...previews.map((p) => ({ previewUrl: p.previewUrl, uploading: true })),
    ])

    try {
      const compressed = await Promise.all(
        previews.map(async ({ file }) => {
          try { return await imageCompression(file, options) }
          catch { return file }
        })
      )

      // 도면 이미지는 floor-plans 경로로 업로드
      const formData = new FormData()
      compressed.forEach((f) => formData.append('files', f))
      const publicUrls = await uploadFloorPlanAction(saunaId, formData)

      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPending((prev) =>
        prev.filter((p) => !previews.some((pv) => pv.previewUrl === p.previewUrl))
      )
      onChange([...images, ...publicUrls])
      toast.success('모형도가 업로드됐어요 🗺️')
    } catch (e) {
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPending((prev) =>
        prev.filter((p) => !previews.some((pv) => pv.previewUrl === p.previewUrl))
      )
      toast.error(e instanceof Error ? e.message : '업로드 중 오류가 발생했습니다')
    }
  }

  const handleDelete = async (url: string, index: number) => {
    onChange(images.filter((_, i) => i !== index))
    if (url.includes('supabase')) {
      try { await deleteImageAction(url) } catch { /* 고아 파일은 나중에 정리 */ }
    }
  }

  const handleDragStart = (index: number) => { dragIndex.current = index }
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const reordered = [...images]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(index, 0, moved)
    dragIndex.current = index
    onChange(reordered)
  }
  const handleDragEnd = () => { dragIndex.current = null }

  return (
    <>
      <div className="space-y-3">

        {/* 안내 배너 */}
        <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
          <MdOutlineMap size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-text-main">내부 모형도 · 도면 등록</p>
            <p className="mt-0.5 text-[10px] text-text-sub">
              사우나 내부 구조를 한눈에 볼 수 있는 평면도나 안내도를 등록하세요. 최대 {maxCount}장
            </p>
          </div>
        </div>

        {/* 등록된 이미지 목록 (세로 레이아웃 — 도면은 가로로 길어서) */}
        <div className="space-y-2">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="group relative overflow-hidden rounded-xl border border-border-main bg-bg-main"
            >
              {/* 순서 배지 */}
              <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5">
                <span className="text-[10px] font-black text-white">모형도 {i + 1}</span>
              </div>

              {/* 드래그 핸들 */}
              <div className="absolute right-10 top-2 z-10 rounded-full bg-black/40 p-1 text-white opacity-0 transition group-hover:opacity-100">
                <MdDragIndicator size={14} />
              </div>

              {/* 전체보기 버튼 */}
              <button
                type="button"
                onClick={() => setFullscreenUrl(url)}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 active:scale-90"
              >
                <BiExpand size={14} />
              </button>

              {/* 이미지 (가로 전체 폭, 비율 유지) */}
              <img
                src={url}
                alt={`모형도 ${i + 1}`}
                className="w-full object-contain"
                style={{ maxHeight: '260px' }}
              />

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => handleDelete(url, i)}
                className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-danger/90 px-2.5 py-1 text-[10px] font-bold text-white transition active:scale-90"
              >
                <BiX size={12} />
                삭제
              </button>
            </div>
          ))}

          {/* 업로드 중인 항목 */}
          {pending.map((item) => (
            <div
              key={item.previewUrl}
              className="relative overflow-hidden rounded-xl border border-border-main bg-bg-main"
            >
              <img
                src={item.previewUrl}
                alt="업로드 중"
                className="w-full object-contain opacity-40"
                style={{ maxHeight: '260px' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-point/30 border-t-point" />
                <p className="text-[11px] font-bold text-text-sub">업로드 중...</p>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 버튼 */}
        {canAdd && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-400/40 py-4 text-xs font-bold text-blue-500/80 transition active:scale-[0.98] hover:border-blue-400/60 hover:bg-blue-500/5"
          >
            <BiPlus size={18} />
            모형도 이미지 추가
          </button>
        )}

        {/* 카운트 */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <BiImageAlt size={13} />
          <span>{images.length + pending.length}/{maxCount}장 · 드래그로 순서 변경 · 클릭하면 전체보기</span>
        </div>
      </div>

      {/* 전체보기 모달 */}
      {fullscreenUrl && (
        <FullscreenModal url={fullscreenUrl} onClose={() => setFullscreenUrl(null)} />
      )}

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
      />
    </>
  )
}
