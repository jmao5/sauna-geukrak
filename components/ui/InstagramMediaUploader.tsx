'use client'

/**
 * InstagramMediaUploader
 *
 * 인스타그램 릴스(Reels) / 피드(Post) URL을 등록하는 컴포넌트.
 *
 * - URL 입력 → 릴스/피드 구분 자동 감지 (reel 키워드 포함 시 릴스)
 * - 수동으로 타입 토글 가능
 * - 미리보기: 임베드 iframe 또는 썸네일 형태
 * - 삭제 버튼으로 제거
 * - 최대 maxCount개 제한
 */

import { useState } from 'react'
import { BiPlus, BiX, BiLogoInstagram, BiLink, BiPlay } from 'react-icons/bi'
import { InstagramMedia } from '@/types/sauna'
import toast from 'react-hot-toast'

interface Props {
  media: InstagramMedia[]
  onChange: (media: InstagramMedia[]) => void
  maxCount?: number
}

/** 인스타그램 URL에서 shortcode 추출 */
function extractShortcode(url: string): string | null {
  // https://www.instagram.com/reel/CODE/ 또는 /p/CODE/
  const match = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

/** URL 유효성 검사 */
function isValidInstagramUrl(url: string): boolean {
  return /instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+/.test(url)
}

/** URL에서 타입 자동 감지 */
function detectType(url: string): 'reel' | 'post' {
  return url.includes('/reel/') ? 'reel' : 'post'
}

/** 인스타그램 임베드 URL 생성 */
function getEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${shortcode}/embed/`
}

/* ── 단일 미디어 카드 ── */
function MediaCard({
  item,
  index,
  onRemove,
  onTypeToggle,
}: {
  item: InstagramMedia
  index: number
  onRemove: (i: number) => void
  onTypeToggle: (i: number) => void
}) {
  const shortcode = extractShortcode(item.url)
  const embedUrl = shortcode ? getEmbedUrl(shortcode) : null

  return (
    <div className="rounded-xl border border-border-main bg-bg-card overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border-main">
        <BiLogoInstagram size={16} className="text-[#E1306C] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="truncate text-[11px] font-bold text-text-main">{item.url}</p>
        </div>
        {/* 타입 배지 (토글 가능) */}
        <button
          type="button"
          onClick={() => onTypeToggle(index)}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black transition active:scale-95 ${
            item.type === 'reel'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
              : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
          }`}
        >
          {item.type === 'reel' ? <BiPlay size={11} /> : <BiLogoInstagram size={11} />}
          {item.type === 'reel' ? '릴스' : '피드'}
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full hover:bg-danger/10 transition"
        >
          <BiX size={16} className="text-danger" />
        </button>
      </div>

      {/* 임베드 미리보기 */}
      {embedUrl ? (
        <div className="relative w-full bg-bg-main" style={{ paddingBottom: item.type === 'reel' ? '177.77%' : '125%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            title={`Instagram ${item.type === 'reel' ? '릴스' : '피드'} ${index + 1}`}
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-bg-main">
          <div className="flex flex-col items-center gap-1 text-text-muted">
            <BiLogoInstagram size={24} />
            <p className="text-[10px]">미리보기 불가</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 메인 컴포넌트 ── */
export default function InstagramMediaUploader({
  media,
  onChange,
  maxCount = 10,
}: Props) {
  const [inputUrl, setInputUrl] = useState('')
  const [inputCaption, setInputCaption] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const canAdd = media.length < maxCount

  const handleAdd = () => {
    const trimmed = inputUrl.trim()
    if (!trimmed) return

    if (!isValidInstagramUrl(trimmed)) {
      toast.error('올바른 인스타그램 URL을 입력해주세요\n예: https://www.instagram.com/reel/...')
      return
    }

    // 중복 체크
    if (media.some((m) => m.url === trimmed)) {
      toast.error('이미 등록된 URL이에요')
      return
    }

    const newItem: InstagramMedia = {
      url: trimmed,
      type: detectType(trimmed),
      caption: inputCaption.trim() || undefined,
    }

    onChange([...media, newItem])
    setInputUrl('')
    setInputCaption('')
    setIsAdding(false)
  }

  const handleRemove = (index: number) => {
    onChange(media.filter((_, i) => i !== index))
  }

  const handleTypeToggle = (index: number) => {
    const updated = [...media]
    updated[index] = {
      ...updated[index],
      type: updated[index].type === 'reel' ? 'post' : 'reel',
    }
    onChange(updated)
  }

  return (
    <div className="space-y-3">

      {/* 안내 배너 */}
      <div className="flex items-start gap-2 rounded-xl border border-[#E1306C]/20 bg-[#E1306C]/5 px-3 py-2.5">
        <BiLogoInstagram size={15} className="text-[#E1306C] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-bold text-text-main">인스타그램 릴스 · 피드 URL 등록</p>
          <p className="mt-0.5 text-[10px] text-text-sub">
            게시물 URL을 붙여넣으면 릴스/피드 자동 감지됩니다. 타입 배지를 탭해 수동 변경도 가능해요.
          </p>
        </div>
      </div>

      {/* 등록된 미디어 목록 */}
      {media.length > 0 && (
        <div className="space-y-3">
          {media.map((item, i) => (
            <MediaCard
              key={`${item.url}-${i}`}
              item={item}
              index={i}
              onRemove={handleRemove}
              onTypeToggle={handleTypeToggle}
            />
          ))}
        </div>
      )}

      {/* URL 추가 폼 */}
      {isAdding ? (
        <div className="rounded-xl border border-border-main bg-bg-card p-3 space-y-2.5">
          <p className="text-[10px] font-black text-text-sub uppercase tracking-wide">새 미디어 추가</p>

          {/* URL 입력 */}
          <div className="flex items-center gap-2 rounded-xl border border-border-main bg-bg-main px-3">
            <BiLink size={14} className="flex-shrink-0 text-text-muted" />
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="https://www.instagram.com/reel/..."
              className="flex-1 bg-transparent py-2.5 text-xs text-text-main placeholder:text-text-muted outline-none"
              autoFocus
            />
            {inputUrl && (
              <button type="button" onClick={() => setInputUrl('')}>
                <BiX size={14} className="text-text-muted" />
              </button>
            )}
          </div>

          {/* 설명 (선택) */}
          <input
            type="text"
            value={inputCaption}
            onChange={(e) => setInputCaption(e.target.value)}
            placeholder="설명 (선택사항)"
            maxLength={100}
            className="h-9 w-full rounded-xl border border-border-main bg-bg-main px-3 text-xs text-text-main placeholder:text-text-muted outline-none focus:border-point"
          />

          {/* URL 형식 미리보기 힌트 */}
          {inputUrl && !isValidInstagramUrl(inputUrl) && (
            <p className="text-[10px] text-danger">
              ⚠️ 올바른 형식: instagram.com/reel/... 또는 instagram.com/p/...
            </p>
          )}
          {inputUrl && isValidInstagramUrl(inputUrl) && (
            <p className="text-[10px] text-success">
              ✅ {detectType(inputUrl) === 'reel' ? '릴스' : '피드'}로 감지됨
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setInputUrl(''); setInputCaption('') }}
              className="flex-1 rounded-xl border border-border-main py-2 text-xs font-bold text-text-sub transition active:scale-[0.98]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inputUrl.trim() || !isValidInstagramUrl(inputUrl)}
              className="flex-1 rounded-xl bg-[#E1306C] py-2 text-xs font-black text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              추가
            </button>
          </div>
        </div>
      ) : (
        canAdd && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E1306C]/40 py-3 text-xs font-bold text-[#E1306C]/80 transition active:scale-[0.98] hover:border-[#E1306C]/60 hover:bg-[#E1306C]/5"
          >
            <BiPlus size={16} />
            인스타그램 미디어 추가
          </button>
        )
      )}

      {/* 카운트 */}
      <p className="text-[11px] text-text-muted">
        {media.length}/{maxCount}개 등록됨
        {media.filter((m) => m.type === 'reel').length > 0 && (
          <span className="ml-2 text-purple-500">릴스 {media.filter((m) => m.type === 'reel').length}개</span>
        )}
        {media.filter((m) => m.type === 'post').length > 0 && (
          <span className="ml-2 text-pink-500">피드 {media.filter((m) => m.type === 'post').length}개</span>
        )}
      </p>
    </div>
  )
}
