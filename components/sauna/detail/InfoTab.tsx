'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BiLinkExternal, BiLogoInstagram, BiPlay, BiX } from 'react-icons/bi'
import { useInstagramOEmbed } from '@/hooks/useInstagramOEmbed'
import type { SaunaDto, InstagramMedia } from '@/types/sauna'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

// ── InfoRow ───────────────────────────────────────────────────
function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle last:border-0">
      <p className="text-[13px] text-text-sub">{label}</p>
      <p className={`text-[13px] font-bold ${accent ? 'text-point' : 'text-text-main'}`}>{value}</p>
    </div>
  )
}

// ── AmenityItem ───────────────────────────────────────────────
function AmenityItem({ emoji, label, ok }: { emoji: string; label: string; ok: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border ${ok ? 'border-border-main bg-bg-card' : 'border-border-subtle bg-bg-sub opacity-40'}`}>
      <span className="text-[20px]">{emoji}</span>
      <span className="text-[10px] font-bold text-text-sub">{label}</span>
      <span className={`text-[9px] font-black ${ok ? 'text-point' : 'text-text-muted'}`}>{ok ? '○' : '✕'}</span>
    </div>
  )
}

// ── 온도 섹션 ────────────────────────────────────────────────
function TempSection({ sauna }: { sauna: SaunaDto }) {
  const hasMale   = sauna.rules?.male_allowed !== false
  const hasFemale = !!sauna.rules?.female_allowed
  const [gender, setGender] = useState<'male' | 'female'>(hasMale ? 'male' : 'female')

  const rooms = (sauna.sauna_rooms ?? []).filter(r => {
    const g = (r as any).gender ?? 'male'
    return g === 'both' || g === gender
  })
  const baths = (sauna.cold_baths ?? []).filter(b => {
    const g = (b as any).gender ?? 'male'
    return g === 'both' || g === gender
  })

  return (
    <div className="bg-bg-card">
      {hasMale && hasFemale ? (
        <div className="flex border-b border-border-subtle">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-3.5 text-[14px] font-black transition ${
                gender === g
                  ? g === 'male'
                    ? 'border-b-2 border-point text-text-main bg-bg-main'
                    : 'border-b-2 border-pink-500 text-text-main bg-bg-main'
                  : 'text-text-muted'
              }`}
            >
              {g === 'male' ? '👨 남탕' : '👩 여탕'}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex">
        {/* 사우나 */}
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <p className="mb-2 text-[9px] font-black tracking-widest text-text-muted uppercase">Sauna</p>
          {rooms.length > 0 ? (
            <>
              <div className="temp-display text-[56px] text-sauna leading-none tabular-nums">
                {Math.max(...rooms.map(r => r.temp))}
              </div>
              <p className="mt-1 text-[12px] font-bold text-sauna/50">°C</p>
              <p className="mt-2 text-center text-[10px] text-text-muted leading-relaxed">
                {rooms.map(r => r.type).join(' · ')}
              </p>
            </>
          ) : (
            <div className="temp-display text-[56px] text-text-muted/20">—</div>
          )}
        </div>

        <div className="w-px bg-border-subtle my-6" />

        {/* 냉탕 */}
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <p className="mb-2 text-[9px] font-black tracking-widest text-text-muted uppercase">Cold Bath</p>
          {baths.length > 0 ? (
            <>
              <div className="temp-display text-[56px] text-cold leading-none tabular-nums">
                {Math.min(...baths.map(b => b.temp))}
              </div>
              <p className="mt-1 text-[12px] font-bold text-cold/50">°C</p>
              {baths.some(b => b.is_groundwater) && (
                <p className="mt-2 text-[10px] text-text-muted">🏔️ 지하수</p>
              )}
            </>
          ) : (
            <div className="temp-display text-[56px] text-text-muted/20">—</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 인스타그램 카드 ───────────────────────────────────────────
function InstagramCard({ item }: { item: InstagramMedia }) {
  const isReel = item.type === 'reel'
  const { data, isLoading } = useInstagramOEmbed(item.url)
  const thumbnailUrl = data?.thumbnail_url ?? null
  const authorName   = data?.author_name   ?? null
  const shortcode    = (() => {
    const match = item.url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
    return match ? match[1] : null
  })()

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl transition-opacity active:opacity-70"
      style={{ border: '1px solid var(--border-main)', background: 'var(--bg-card)', padding: '12px' }}
    >
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-lg"
        style={{ width: 64, height: 64, background: 'var(--bg-sub)', border: '1px solid var(--border-main)' }}
      >
        {isLoading ? (
          <div className="skeleton-shimmer h-full w-full" />
        ) : thumbnailUrl ? (
          <Image src={thumbnailUrl} alt={item.caption ?? ''} fill className="object-cover" sizes="64px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BiLogoInstagram size={26} style={{ color: '#E1306C', opacity: 0.7 }} />
          </div>
        )}
        {isReel && (
          <div className="absolute bottom-1 right-1 flex items-center justify-center rounded-sm" style={{ background: '#7c3aed', width: 16, height: 16 }}>
            <BiPlay size={10} style={{ color: '#fff' }} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black" style={{ color: 'var(--text-main)' }}>
          {isReel ? 'Instagram Reels' : 'Instagram Post'}
        </p>
        {authorName && <p className="mt-0.5 text-[11px]" style={{ color: 'var(--point-color)' }}>@{authorName}</p>}
        {item.caption ? (
          <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-sub)' }}>{item.caption}</p>
        ) : shortcode ? (
          <p className="mt-0.5 truncate text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>/{shortcode.slice(0, 16)}</p>
        ) : null}
      </div>
      <div className="flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
        style={{ background: 'var(--bg-sub)', border: '1px solid var(--border-main)', color: 'var(--text-sub)' }}>
        <BiLinkExternal size={12} />
        보기
      </div>
    </a>
  )
}

// ── ImagePreviewModal ───────────────────────────────────────────
function ImagePreviewModal({ src, onClose }: { src: string; onClose: () => void }) {
  const [portalEl, setPortalEl] = useState<Element | null>(null)

  useEffect(() => {
    setPortalEl(document.getElementById('app-root'))
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!portalEl) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[400] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-[410] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition active:scale-90 hover:bg-white/20"
      >
        <BiX size={24} />
      </button>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-h-[85%] max-w-full overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="모형도 크게보기"
          className="max-h-[80vh] w-auto max-w-full object-contain"
        />
      </motion.div>
    </motion.div>,
    portalEl
  )
}

// ── InfoTab ───────────────────────────────────────────────────
export default function InfoTab({ sauna }: { sauna: SaunaDto }) {
  const [showPreview, setShowPreview] = useState(false)
  return (
    <div className="divide-y divide-border-subtle pb-4">
      <TempSection sauna={sauna} />

      {/* 시설 */}
      {sauna.amenities && (
        <div className="px-4 py-4">
          <p className="mb-3 text-[10px] font-black tracking-widest text-text-muted uppercase">Amenities</p>
          <div className="grid grid-cols-4 gap-2">
            <AmenityItem emoji="🧤" label="수건"     ok={sauna.amenities.towel} />
            <AmenityItem emoji="🧴" label="샴푸"     ok={sauna.amenities.shampoo} />
            <AmenityItem emoji="🚿" label="바디워시" ok={sauna.amenities.body_wash} />
            <AmenityItem emoji="💨" label="드라이어" ok={sauna.amenities.hair_dryer} />
            {sauna.amenities.water_dispenser !== undefined && (
              <AmenityItem emoji="💧" label="정수기" ok={sauna.amenities.water_dispenser} />
            )}
          </div>
        </div>
      )}

      {/* 가격 */}
      {sauna.pricing && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Pricing</p>
          {sauna.pricing.adult_day   > 0 && <InfoRow label="성인 (낮)"  value={`${sauna.pricing.adult_day.toLocaleString()}원`} />}
          {sauna.pricing.adult_night > 0 && <InfoRow label="성인 (야간)" value={`${sauna.pricing.adult_night.toLocaleString()}원`} />}
          {sauna.pricing.child       > 0 && <InfoRow label="어린이"     value={`${sauna.pricing.child.toLocaleString()}원`} />}
          {sauna.pricing.jjimjilbang !== undefined && sauna.pricing.jjimjilbang !== null && sauna.pricing.jjimjilbang > 0 && (
            <InfoRow label="찜질방 이용료 (추가)" value={`${sauna.pricing.jjimjilbang.toLocaleString()}원`} />
          )}
        </div>
      )}

      {/* 한국 특화 */}
      {sauna.kr_specific && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Korean Special</p>
          {sauna.kr_specific.sesin_price_male   > 0 && <InfoRow label="때밀이 (남)" value={`${sauna.kr_specific.sesin_price_male.toLocaleString()}원`} />}
          {sauna.kr_specific.sesin_price_female > 0 && <InfoRow label="때밀이 (여)" value={`${sauna.kr_specific.sesin_price_female.toLocaleString()}원`} />}
          {sauna.kr_specific.food && sauna.kr_specific.food.length > 0 && <InfoRow label="식음료"     value={sauna.kr_specific.food.join(', ')} />}
        </div>
      )}

      {/* 기본 정보 */}
      <div>
        <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Info</p>
        {sauna.business_hours && <InfoRow label="운영 시간" value={sauna.business_hours} />}
        {sauna.contact && (
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
            <p className="text-[13px] text-text-sub">연락처</p>
            <a href={`tel:${sauna.contact}`} className="text-[13px] font-bold text-point">{sauna.contact}</a>
          </div>
        )}
        <InfoRow label="주차" value={sauna.parking ? '가능' : '불가'} />
      </div>

      {/* 모형도 */}
      {sauna.floor_plan_images && sauna.floor_plan_images.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Floor Plan</p>
          <div className="px-4">
            <img
              src={sauna.floor_plan_images[0]}
              alt="모형도"
              onClick={() => setShowPreview(true)}
              className="w-full rounded-xl object-contain cursor-zoom-in transition hover:opacity-90 active:scale-[0.99]"
              style={{ maxHeight: 240 }}
            />
          </div>
          <AnimatePresence>
            {showPreview && (
              <ImagePreviewModal
                src={sauna.floor_plan_images[0]}
                onClose={() => setShowPreview(false)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 인스타그램 */}
      {sauna.instagram_media && sauna.instagram_media.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-[10px] font-black tracking-widest text-text-muted uppercase">Instagram</p>
          <div className="space-y-2 px-4 pb-2">
            {sauna.instagram_media.map((item, i) => (
              <InstagramCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
