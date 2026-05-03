'use client'

/**
 * InstagramMediaUploader
 * iframe 임베드 제거 → 썸네일 카드 + "인스타그램에서 보기" 링크 방식
 */

import { useState } from 'react'
import { BiPlus, BiX, BiLogoInstagram, BiLink, BiPlay, BiLinkExternal } from 'react-icons/bi'
import { InstagramMedia } from '@/types/sauna'
import toast from 'react-hot-toast'

interface Props {
  media: InstagramMedia[]
  onChange: (media: InstagramMedia[]) => void
  maxCount?: number
}

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

function isValidInstagramUrl(url: string): boolean {
  return /instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+/.test(url)
}

function detectType(url: string): 'reel' | 'post' {
  return url.includes('/reel/') ? 'reel' : 'post'
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
  const isReel = item.type === 'reel'

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: '1px solid var(--border-main)', background: 'var(--bg-card)' }}
    >
      {/* 카드 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--border-main)' }}
      >
        <BiLogoInstagram size={15} style={{ color: '#E1306C', flexShrink: 0 }} />
        <p
          className="flex-1 min-w-0 truncate text-[11px] font-bold"
          style={{ color: 'var(--text-sub)' }}
        >
          {item.url}
        </p>

        {/* 타입 배지 */}
        <button
          type="button"
          onClick={() => onTypeToggle(index)}
          className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black transition active:opacity-70"
          style={
            isReel
              ? { background: '#f3e8ff', color: '#7c3aed' }
              : { background: '#fce7f3', color: '#be185d' }
          }
        >
          {isReel ? <BiPlay size={11} /> : <BiLogoInstagram size={11} />}
          {isReel ? '릴스' : '피드'}
        </button>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition active:opacity-70"
          style={{ color: 'var(--color-danger)' }}
        >
          <BiX size={16} />
        </button>
      </div>

      {/* 썸네일 + 링크 버튼 */}
      <div className="flex items-center gap-3 px-3 py-3">
        <div
          className="relative flex-shrink-0 overflow-hidden rounded-lg flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            background: 'var(--bg-sub)',
            border: '1px solid var(--border-main)',
          }}
        >
          <BiLogoInstagram size={26} style={{ color: '#E1306C', opacity: 0.7 }} />
          {isReel && (
            <div
              className="absolute bottom-1 right-1 rounded-sm px-1"
              style={{ background: '#7c3aed', lineHeight: 1 }}
            >
              <BiPlay size={8} style={{ color: '#fff' }} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black" style={{ color: 'var(--text-main)' }}>
            {isReel ? 'Instagram Reels' : 'Instagram Post'}
          </p>
          {shortcode && (
            <p
              className="mt-0.5 truncate text-[10px] font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              /{shortcode.slice(0, 14)}{shortcode.length > 14 ? '…' : ''}
            </p>
          )}
          {item.caption && (
            <p className="mt-1 truncate text-[11px]" style={{ color: 'var(--text-sub)' }}>
              {item.caption}
            </p>
          )}
        </div>

        {/* 인스타그램에서 보기 */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:opacity-70"
          style={{
            background: 'var(--bg-sub)',
            border: '1px solid var(--border-main)',
            color: 'var(--text-sub)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <BiLinkExternal size={12} />
          보기
        </a>
      </div>
    </div>
  )
}

/* ── 메인 ── */
export default function InstagramMediaUploader({ media, onChange, maxCount = 10 }: Props) {
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
    if (media.some((m) => m.url === trimmed)) {
      toast.error('이미 등록된 URL이에요')
      return
    }

    onChange([
      ...media,
      {
        url: trimmed,
        type: detectType(trimmed),
        caption: inputCaption.trim() || undefined,
      },
    ])
    setInputUrl('')
    setInputCaption('')
    setIsAdding(false)
  }

  const handleRemove = (index: number) => onChange(media.filter((_, i) => i !== index))

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

      {/* 안내 */}
      <div
        className="flex items-start gap-2 rounded-xl px-3 py-2.5"
        style={{
          background: 'rgba(225,48,108,0.05)',
          border: '1px solid rgba(225,48,108,0.2)',
        }}
      >
        <BiLogoInstagram size={15} style={{ color: '#E1306C', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-[11px] font-bold" style={{ color: 'var(--text-main)' }}>
            인스타그램 릴스 · 피드 URL 등록
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-sub)' }}>
            URL을 붙여넣으면 릴스/피드 자동 감지됩니다. 등록 후 링크 버튼으로 원본을 확인하세요.
          </p>
        </div>
      </div>

      {/* 등록된 목록 */}
      {media.length > 0 && (
        <div className="space-y-2">
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
        <div
          className="rounded-xl p-3 space-y-2.5"
          style={{ border: '1px solid var(--border-main)', background: 'var(--bg-card)' }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            새 미디어 추가
          </p>

          <div
            className="flex items-center gap-2 rounded-lg px-3"
            style={{ border: '1px solid var(--border-main)', background: 'var(--bg-sub)' }}
          >
            <BiLink size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="https://www.instagram.com/reel/..."
              className="flex-1 bg-transparent py-2.5 text-xs outline-none"
              style={{ color: 'var(--text-main)' }}
              autoFocus
            />
            {inputUrl && (
              <button type="button" onClick={() => setInputUrl('')}>
                <BiX size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>

          <input
            type="text"
            value={inputCaption}
            onChange={(e) => setInputCaption(e.target.value)}
            placeholder="설명 (선택사항)"
            maxLength={100}
            className="h-9 w-full rounded-lg px-3 text-xs outline-none"
            style={{
              border: '1px solid var(--border-main)',
              background: 'var(--bg-sub)',
              color: 'var(--text-main)',
            }}
          />

          {inputUrl && !isValidInstagramUrl(inputUrl) && (
            <p className="text-[10px]" style={{ color: 'var(--color-danger)' }}>
              올바른 형식: instagram.com/reel/... 또는 instagram.com/p/...
            </p>
          )}
          {inputUrl && isValidInstagramUrl(inputUrl) && (
            <p className="text-[10px]" style={{ color: 'var(--color-success)' }}>
              {detectType(inputUrl) === 'reel' ? '릴스' : '피드'}로 감지됨
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setInputUrl(''); setInputCaption('') }}
              className="btn-outline flex-1 rounded-lg py-2 text-xs font-bold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inputUrl.trim() || !isValidInstagramUrl(inputUrl)}
              className="flex-1 rounded-lg py-2 text-xs font-black text-white transition active:opacity-80 disabled:opacity-40"
              style={{ background: '#E1306C' }}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition active:opacity-70"
            style={{
              border: '1.5px dashed rgba(225,48,108,0.4)',
              color: 'rgba(225,48,108,0.8)',
            }}
          >
            <BiPlus size={16} />
            인스타그램 미디어 추가
          </button>
        )
      )}

      {/* 카운트 */}
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {media.length}/{maxCount}개 등록됨
        {media.filter((m) => m.type === 'reel').length > 0 && (
          <span className="ml-2" style={{ color: '#7c3aed' }}>
            릴스 {media.filter((m) => m.type === 'reel').length}개
          </span>
        )}
        {media.filter((m) => m.type === 'post').length > 0 && (
          <span className="ml-2" style={{ color: '#be185d' }}>
            피드 {media.filter((m) => m.type === 'post').length}개
          </span>
        )}
      </p>
    </div>
  )
}
