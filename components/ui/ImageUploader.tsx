'use client'

import { useState, useRef } from 'react'
import { BiPlus, BiX, BiImage } from 'react-icons/bi'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  images: string[]
  onChange: (urls: string[]) => void
  maxCount?: number
}

const BUCKET = 'sauna-geukrak'
const MAX_INPUT_SIZE_MB = 10   // 이 크기 초과면 아예 거부
const TARGET_SIZE_KB = 500     // 목표 압축 크기 (KB)
const MAX_DIMENSION = 1920     // 최대 가로/세로 픽셀

/**
 * Canvas API로 이미지를 리사이즈 + JPEG 압축
 * - 긴 쪽이 MAX_DIMENSION을 넘으면 축소
 * - quality를 이진 탐색으로 조정해 TARGET_SIZE_KB 이하로 맞춤
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // 1. 리사이즈 비율 계산
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      // 2. quality 이진 탐색으로 TARGET_SIZE_KB 이하 맞추기
      const targetBytes = TARGET_SIZE_KB * 1024
      let lo = 0.1, hi = 0.92, bestBlob: Blob | null = null
      let iterations = 0

      const tryQuality = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('압축 실패')); return }

            if (blob.size <= targetBytes) {
              bestBlob = blob
              // 더 높은 품질로 올려볼 수 있으면 시도
              if (hi - lo > 0.05 && iterations < 8) {
                iterations++
                lo = q
                tryQuality((lo + hi) / 2)
              } else {
                resolve(bestBlob!)
              }
            } else {
              // 크면 품질 낮추기
              if (hi - lo > 0.05 && iterations < 8) {
                iterations++
                hi = q
                tryQuality((lo + hi) / 2)
              } else {
                // 목표 못 맞춰도 최소 품질로 결과 반환
                canvas.toBlob((b) => resolve(b!), 'image/jpeg', lo)
              }
            }
          },
          'image/jpeg',
          q,
        )
      }

      tryQuality((lo + hi) / 2)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('이미지를 읽을 수 없습니다'))
    }

    img.src = objectUrl
  })
}

export default function ImageUploader({ images, onChange, maxCount = 5 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadingCount, setUploadingCount] = useState(0)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remaining = maxCount - images.length
    const toUpload = Array.from(files).slice(0, remaining)

    if (toUpload.length === 0) {
      toast.error(`최대 ${maxCount}장까지 업로드할 수 있어요`)
      return
    }

    setUploadingCount(toUpload.length)
    const supabase = createClient()
    const uploadedUrls: string[] = []

    for (const file of toUpload) {
      // 포맷 체크
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type)) {
        toast.error(`${file.name}: 지원하지 않는 형식이에요`)
        setUploadingCount((n) => n - 1)
        continue
      }

      // 너무 큰 파일 거부
      if (file.size > MAX_INPUT_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: ${MAX_INPUT_SIZE_MB}MB 이하 파일만 업로드 가능해요`)
        setUploadingCount((n) => n - 1)
        continue
      }

      try {
        // 압축
        const compressed = await compressImage(file)
        const savedKB = Math.round((file.size - compressed.size) / 1024)
        const finalKB = Math.round(compressed.size / 1024)

        // 파일명
        const filename = `saunas/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(filename, compressed, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })

        if (error) {
          toast.error(`업로드 실패: ${error.message}`)
          continue
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
        uploadedUrls.push(data.publicUrl)

        // 압축 결과 토스트 (원본보다 많이 줄었을 때만)
        if (savedKB > 50) {
          toast.success(`${finalKB}KB로 압축됨 (${savedKB}KB 절약)`, { duration: 2000 })
        }
      } catch (err: any) {
        toast.error(err.message || '처리 중 오류 발생')
      } finally {
        setUploadingCount((n) => Math.max(0, n - 1))
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls])
    }
    setUploadingCount(0)
  }

  const handleRemove = async (url: string, idx: number) => {
    try {
      const supabase = createClient()
      const path = url.split(`/${BUCKET}/`)[1]
      if (path) await supabase.storage.from(BUCKET).remove([path])
    } catch { /* 무시 */ }
    onChange(images.filter((_, i) => i !== idx))
  }

  const canAdd = images.length < maxCount && uploadingCount === 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-black tracking-widest text-text-muted uppercase">Photos</p>
        <p className="text-[10px] text-text-muted">{images.length}/{maxCount}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {/* 업로드된 이미지 */}
        {images.map((url, idx) => (
          <div key={url} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border-main">
            <img src={url} alt={`사진 ${idx + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url, idx)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <BiX size={12} />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 rounded-sm bg-black/60 px-1 py-0.5 text-[8px] font-black text-white">
                대표
              </span>
            )}
          </div>
        ))}

        {/* 압축·업로드 중 플레이스홀더 */}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div key={`uploading-${i}`} className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-border-main bg-bg-main">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-main border-t-point" />
            <span className="text-[8px] font-bold text-text-muted">압축 중</span>
          </div>
        ))}

        {/* 추가 버튼 */}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-main bg-bg-main text-text-muted transition active:scale-95"
          >
            <BiPlus size={20} />
            <span className="text-[9px] font-bold">추가</span>
          </button>
        )}
      </div>

      <p className="mt-2 flex items-center gap-1 text-[10px] text-text-muted">
        <BiImage size={11} />
        업로드 전 자동 압축 (목표 500KB) · 최대 {maxCount}장
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
