'use client'

/**
 * ImageUploader
 *
 * SaunaNewClient / SaunaEditClient에서 공통으로 사용하는 이미지 업로드 컴포넌트.
 *
 * Props:
 *   - images     : 현재 이미지 URL 배열 (form.images)
 *   - onChange   : 이미지 URL 배열이 바뀔 때 호출 (urls => void)
 *   - saunaId    : Storage 경로에 쓸 사우나 ID — 등록 시엔 'temp' 등으로 처리
 *   - maxCount   : 최대 업로드 개수 (기본 5)
 *
 * 동작:
 *   - 파일 선택 → 즉시 Supabase Storage 업로드 → public URL을 images 배열에 추가
 *   - X 버튼 → Storage에서 삭제 + images 배열에서 제거
 *   - 드래그로 순서 변경 (HTML5 drag-and-drop)
 *   - 업로드 중인 파일은 로컬 preview(ObjectURL)로 미리 보여주고 완료 후 교체
 */

import { useRef, useState } from 'react'
import { BiPlus, BiX, BiImageAlt } from 'react-icons/bi'
import { MdDragIndicator } from 'react-icons/md'
import { uploadImagesAction, deleteImageAction } from '@/app/actions/storage.actions'
import toast from 'react-hot-toast'

interface Props {
  images: string[]
  onChange: (urls: string[]) => void
  saunaId?: string
  maxCount?: number
}

interface PendingItem {
  previewUrl: string  // ObjectURL — 업로드 완료 전 미리보기용
  uploading: boolean
}

export default function ImageUploader({
  images,
  onChange,
  saunaId = 'temp',
  maxCount = 5,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 업로드 진행 중인 항목 (아직 URL 확정 전)
  const [pending, setPending] = useState<PendingItem[]>([])
  // 드래그 중인 인덱스
  const dragIndex = useRef<number | null>(null)

  const canAdd = images.length + pending.length < maxCount

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const slots = Math.min(files.length, maxCount - images.length - pending.length)
    if (slots <= 0) {
      toast.error(`최대 ${maxCount}장까지 업로드할 수 있어요`)
      return
    }

    const selected = Array.from(files).slice(0, slots)

    // 동적 임포트로 브라우저 환경에서만 로드
    const imageCompression = (await import('browser-image-compression')).default

    // 압축 후 병렬 업로드 (2장 이상일 때 성능 개선)
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true }

    // 임시 미리보기 슬롯 일괄 추가
    const previews = selected
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }))
    if (previews.length === 0) return
    setPending((prev) => [...prev, ...previews.map((p) => ({ previewUrl: p.previewUrl, uploading: true }))])

    try {
      // 압축 병렬
      const compressed = await Promise.all(
        previews.map(async ({ file }) => {
          try { return await imageCompression(file, options) }
          catch { return file }
        })
      )

      const oversized = compressed.filter((f) => f.size > 10 * 1024 * 1024)
      if (oversized.length > 0) {
        toast.error(`${oversized.length}개 파일이 압축 후에도 10MB를 초과합니다`)
        previews.forEach((p) => URL.revokeObjectURL(p.previewUrl))
        setPending((prev) => prev.filter((p) => !previews.some((pv) => pv.previewUrl === p.previewUrl)))
        return
      }

      // 병렬 업로드 (Server Action 활용)
      const formData = new FormData()
      compressed.forEach((file) => formData.append('files', file))
      const publicUrls = await uploadImagesAction(saunaId || 'temp', formData)

      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPending((prev) => prev.filter((p) => !previews.some((pv) => pv.previewUrl === p.previewUrl)))
      onChange([...images, ...publicUrls])
    } catch (e) {
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPending((prev) => prev.filter((p) => !previews.some((pv) => pv.previewUrl === p.previewUrl)))
      toast.error(e instanceof Error ? e.message : '업로드 중 오류가 발생했습니다')
    }
  }

  /* ── 이미지 삭제 ─────────────────────────────────────── */
  const handleDelete = async (url: string, index: number) => {
    // UI에서 먼저 제거 (낙관적 업데이트)
    onChange(images.filter((_, i) => i !== index))

    // Storage에서도 삭제 (외부 URL이면 스킵)
    if (url.includes('supabase')) {
      try {
        await deleteImageAction(url)
      } catch {
        // 삭제 실패해도 UI는 유지 (이미 제거됨)
        // 고아 파일은 추후 Storage 정리로 처리
      }
    }
  }

  /* ── 드래그 순서 변경 ────────────────────────────────── */
  const handleDragStart = (index: number) => {
    dragIndex.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const reordered = [...images]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(index, 0, moved)
    dragIndex.current = index
    onChange(reordered)
  }

  const handleDragEnd = () => {
    dragIndex.current = null
  }

  return (
    <div className="space-y-3">
      {/* 이미지 그리드 */}
      <div className="grid grid-cols-3 gap-2">

        {/* 확정된 이미지들 */}
        {images.map((url, i) => (
          <div
            key={url}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border-main bg-bg-main"
          >
            {/* 대표 이미지 뱃지 */}
            {i === 0 && (
              <div className="absolute left-1.5 top-1.5 z-10 rounded-full bg-point px-1.5 py-0.5 text-[9px] font-black text-white">
                대표
              </div>
            )}
            {/* 드래그 핸들 */}
            <div className="absolute right-1.5 top-1.5 z-10 rounded-full bg-black/40 p-0.5 text-white opacity-0 transition group-hover:opacity-100">
              <MdDragIndicator size={12} />
            </div>
            <img
              src={url}
              alt={`사우나 이미지 ${i + 1}`}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={() => handleDelete(url, i)}
              className="absolute bottom-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition active:scale-90"
            >
              <BiX size={14} />
            </button>
          </div>
        ))}

        {/* 업로드 중인 항목들 */}
        {pending.map((item) => (
          <div
            key={item.previewUrl}
            className="relative aspect-square overflow-hidden rounded-xl border border-border-main bg-bg-main"
          >
            <img
              src={item.previewUrl}
              alt="업로드 중"
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          </div>
        ))}

        {/* 추가 버튼 */}
        {canAdd && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border-main bg-bg-main transition active:scale-[0.97] hover:border-point/40 hover:bg-point/5"
          >
            <BiPlus size={20} className="text-text-muted" />
            <span className="text-[10px] font-bold text-text-muted">추가</span>
          </button>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
        <BiImageAlt size={13} />
        <span>
          {images.length + pending.length}/{maxCount}장 · 첫 번째 사진이 대표 이미지 · 드래그로 순서 변경
        </span>
      </div>

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        // 같은 파일 재선택 허용
        onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
      />
    </div>
  )
}
