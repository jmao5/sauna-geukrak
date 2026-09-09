'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BiLinkExternal, BiLogoInstagram, BiPlay, BiX } from 'react-icons/bi'
import { useInstagramOEmbed } from '@/hooks/useInstagramOEmbed'
import type { SaunaDto, InstagramMedia } from '@/types/sauna'
import { createPortal } from 'react-dom'
import { m, AnimatePresence } from 'framer-motion'

// ── InfoRow ───────────────────────────────────────────────────
function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle last:border-0">
      <p className="text-[12.5px] font-bold text-text-sub">{label}</p>
      <p className={`text-[12.5px] font-black ${accent ? 'text-point' : 'text-text-main'}`}>{value}</p>
    </div>
  )
}

// ── 사우나 이키타이 스타일 스펙 테이블 행 ───────────────────────────
function SpecTableRow({
  label,
  ok,
  detail,
  badge,
}: {
  label: string
  ok?: boolean | null
  detail?: string | null
  badge?: string | null
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle last:border-0 hover:bg-bg-sub/50 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-bold text-text-sub">{label}</span>
        {badge && (
          <span className="rounded bg-point/10 px-1.5 py-0.5 text-[9.5px] font-black text-point">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-[11.5px] font-bold text-text-sub">{detail}</span>}
        {ok !== undefined && ok !== null && (
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${
            ok
              ? 'bg-point/15 text-point'
              : 'bg-bg-sub text-text-muted border border-border-main'
          }`}>
            {ok ? '○' : '✕'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── 사우나 이키타이 스타일 하드웨어 스펙 시트 ────────────────────────
function HardwareSpecSection({ sauna }: { sauna: SaunaDto }) {
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

  const resting = sauna.resting_area

  return (
    <div className="bg-bg-card border-b border-border-main">
      {/* 남탕 / 여탕 스위처 */}
      {hasMale && hasFemale && (
        <div className="flex border-b border-border-main bg-bg-sub/30">
          {(['male', 'female'] as const).map((g) => {
            const isSelected = gender === g
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-3 text-[13px] font-black transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? g === 'male'
                      ? 'border-b-2 border-point bg-bg-card text-text-main shadow-xs'
                      : 'border-b-2 border-rose-500 bg-bg-card text-text-main shadow-xs'
                    : 'text-text-muted hover:text-text-sub'
                }`}
              >
                <span>{g === 'male' ? '👨 남탕 스펙' : '👩 여탕 스펙'}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── 사우나실 & 냉탕 듀얼 스펙 카드 ── */}
      <div className="grid grid-cols-2 divide-x divide-border-subtle p-4 gap-3">
        {/* 사우나실 */}
        <div className="flex flex-col justify-between pr-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider text-sauna uppercase flex items-center gap-1">
                <span>🔥</span> 사우나실
              </span>
              {rooms.length > 1 && (
                <span className="text-[9.5px] font-bold text-text-muted">{rooms.length}개</span>
              )}
            </div>

            {rooms.length > 0 ? (
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="temp-display text-[42px] leading-none text-sauna font-black tabular-nums">
                    {Math.max(...rooms.map(r => r.temp))}
                  </span>
                  <span className="text-[13px] font-black text-sauna/60">°C</span>
                </div>
                <p className="mt-1 text-[11px] font-black text-text-main">
                  {Array.from(new Set(rooms.map(r => r.type))).join(' · ')}
                </p>
              </div>
            ) : (
              <div className="mt-4 text-[12px] font-bold text-text-muted">등록된 정보 없음</div>
            )}
          </div>

          {rooms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {rooms.some(r => r.has_auto_loyly) && (
                <span className="rounded bg-sauna-bg border border-sauna/20 px-1.5 py-0.5 text-[9.5px] font-black text-sauna">
                  오토 로우류 ○
                </span>
              )}
              {rooms.some(r => r.has_self_loyly) && (
                <span className="rounded bg-sauna-bg border border-sauna/20 px-1.5 py-0.5 text-[9.5px] font-black text-sauna">
                  셀프 로우류 ○
                </span>
              )}
              {rooms.some(r => r.has_tv) && (
                <span className="rounded bg-bg-sub border border-border-main px-1.5 py-0.5 text-[9.5px] font-bold text-text-sub">
                  TV 있음
                </span>
              )}
              {rooms[0]?.capacity > 0 && (
                <span className="rounded bg-bg-sub border border-border-main px-1.5 py-0.5 text-[9.5px] font-bold text-text-muted">
                  정원 {rooms[0].capacity}명
                </span>
              )}
            </div>
          )}
        </div>

        {/* 냉탕 */}
        <div className="flex flex-col justify-between pl-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider text-cold uppercase flex items-center gap-1">
                <span>❄️</span> 냉탕
              </span>
              {baths.length > 1 && (
                <span className="text-[9.5px] font-bold text-text-muted">{baths.length}개</span>
              )}
            </div>

            {baths.length > 0 ? (
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="temp-display text-[42px] leading-none text-cold font-black tabular-nums">
                    {Math.min(...baths.map(b => b.temp))}
                  </span>
                  <span className="text-[13px] font-black text-cold/60">°C</span>
                </div>
                <p className="mt-1 text-[11px] font-black text-text-main">
                  {baths.some(b => b.is_groundwater) ? '천연 암반 지하수' : '정수 수돗물'}
                </p>
              </div>
            ) : (
              <div className="mt-4 text-[12px] font-bold text-text-muted">등록된 정보 없음</div>
            )}
          </div>

          {baths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {baths.some(b => b.is_groundwater) && (
                <span className="rounded bg-cold-bg border border-cold/20 px-1.5 py-0.5 text-[9.5px] font-black text-cold">
                  🏔️ 지하수 ○
                </span>
              )}
              {baths[0]?.depth > 0 && (
                <span className="rounded bg-cold-bg border border-cold/20 px-1.5 py-0.5 text-[9.5px] font-black text-cold">
                  수심 {baths[0].depth}cm
                </span>
              )}
              {baths[0]?.capacity > 0 && (
                <span className="rounded bg-bg-sub border border-border-main px-1.5 py-0.5 text-[9.5px] font-bold text-text-muted">
                  정원 {baths[0].capacity}명
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 외기욕 & 토토노이 체어 스펙 ── */}
      {resting && (
        <div className="border-t border-border-subtle bg-bg-sub/20 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-black tracking-wider text-text-muted uppercase flex items-center gap-1">
              <span>🍃</span> 외기욕 & 휴식 공간
            </span>
            <span className="text-[10px] font-bold text-point">
              {(resting.outdoor_seats ?? 0) > 0 ? '야외 외기욕 가능 ○' : '실내 휴식 전용'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border-subtle bg-bg-card p-2">
              <p className="text-[9.5px] font-bold text-text-muted">인피니티 체어</p>
              <p className="text-[14px] font-black text-point mt-0.5 tabular-nums">
                {resting.infinity_chairs ?? 0}석
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-card p-2">
              <p className="text-[9.5px] font-bold text-text-muted">덱 체어 (베드)</p>
              <p className="text-[14px] font-black text-text-main mt-0.5 tabular-nums">
                {resting.deck_chairs ?? 0}석
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-card p-2">
              <p className="text-[9.5px] font-bold text-text-muted">일반 휴식 의자</p>
              <p className="text-[14px] font-black text-text-main mt-0.5 tabular-nums">
                {(resting.indoor_seats ?? 0) + (resting.outdoor_seats ?? 0)}석
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
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
    <m.div
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

      <m.div
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
      </m.div>
    </m.div>,
    portalEl
  )
}

// ── InstagramCard ───────────────────────────────────────────────
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
      className="flex items-center gap-3 rounded-xl transition-opacity active:opacity-70 border border-border-main bg-bg-card p-3"
    >
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-lg border border-border-main bg-bg-sub"
        style={{ width: 60, height: 60 }}
      >
        {isLoading ? (
          <div className="skeleton-shimmer h-full w-full" />
        ) : thumbnailUrl ? (
          <Image src={thumbnailUrl} alt={item.caption ?? ''} fill className="object-cover" sizes="60px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BiLogoInstagram size={24} style={{ color: '#E1306C', opacity: 0.7 }} />
          </div>
        )}
        {isReel && (
          <div className="absolute bottom-1 right-1 flex items-center justify-center rounded-sm bg-purple-600 h-4 w-4">
            <BiPlay size={10} className="text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-black text-text-main">
          {isReel ? 'Instagram Reels' : 'Instagram Post'}
        </p>
        {authorName && <p className="mt-0.5 text-[11px] font-bold text-point">@{authorName}</p>}
        {item.caption ? (
          <p className="mt-0.5 truncate text-[11px] text-text-sub">{item.caption}</p>
        ) : shortcode ? (
          <p className="mt-0.5 truncate text-[10px] font-mono text-text-muted">/{shortcode.slice(0, 16)}</p>
        ) : null}
      </div>
      <div className="flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold border border-border-main bg-bg-sub text-text-sub">
        <BiLinkExternal size={11} />
        보기
      </div>
    </a>
  )
}

// ── InfoTab 메인 컴포넌트 ──────────────────────────────────────────
export default function InfoTab({ sauna }: { sauna: SaunaDto }) {
  const [showPreview, setShowPreview] = useState(false)

  const hasPricing = !!sauna.pricing && (
    (sauna.pricing.adult_day ?? 0) > 0 ||
    (sauna.pricing.adult_night ?? 0) > 0 ||
    (sauna.pricing.child ?? 0) > 0 ||
    ((sauna.pricing.jjimjilbang ?? 0) > 0)
  )

  const hasKrSpecific = !!sauna.kr_specific && (
    (sauna.kr_specific.sesin_price_male ?? 0) > 0 ||
    (sauna.kr_specific.sesin_price_female ?? 0) > 0 ||
    (Array.isArray(sauna.kr_specific.food) && sauna.kr_specific.food.length > 0)
  )

  return (
    <div className="pb-8">
      {/* 1. 사우나 이키타이식 하드웨어 스펙 시트 (온도, 열원, 수심, 외기욕체어) */}
      <HardwareSpecSection sauna={sauna} />

      {/* 2. 사우나 이키타이 스타일 설비 & 운영 룰 스펙 테이블 */}
      <div className="border-b border-border-main bg-bg-card">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[11px] font-black tracking-wider text-text-muted uppercase">
            설비 & 이용 규정 (Facility & Rules)
          </h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {sauna.rules?.tattoo_allowed !== undefined && (
            <SpecTableRow
              label="타투 / 문신 허용"
              ok={sauna.rules.tattoo_allowed}
              detail={sauna.rules.tattoo_allowed ? '문신 있어도 입장 가능' : '문신 시 입장 불가'}
              badge="주요 룰"
            />
          )}
          {sauna.amenities?.towel !== undefined && (
            <SpecTableRow
              label="수건 제공"
              ok={sauna.amenities.towel}
              detail={sauna.amenities.towel ? '수건 무료 지급' : '개인 지참 필요'}
            />
          )}
          {sauna.amenities?.shampoo !== undefined && (
            <SpecTableRow
              label="샴푸 비치"
              ok={sauna.amenities.shampoo}
              detail={sauna.amenities.shampoo ? '탕 내 샴푸 구비' : '비누만 비치'}
            />
          )}
          {sauna.amenities?.body_wash !== undefined && (
            <SpecTableRow
              label="바디워시 비치"
              ok={sauna.amenities.body_wash}
              detail={sauna.amenities.body_wash ? '바디워시 구비' : '비누만 비치'}
            />
          )}
          {sauna.amenities?.hair_dryer !== undefined && (
            <SpecTableRow
              label="헤어드라이어"
              ok={sauna.amenities.hair_dryer}
              detail={sauna.amenities.hair_dryer ? '무료 이용 가능' : '유료 동전 필요'}
            />
          )}
          {sauna.amenities?.water_dispenser !== undefined && (
            <SpecTableRow
              label="정수기 / 식수대"
              ok={sauna.amenities.water_dispenser}
              detail={sauna.amenities.water_dispenser ? '음수대 비치' : '음료 구매 필요'}
            />
          )}
          {sauna.kr_specific?.has_jjimjilbang !== undefined && (
            <SpecTableRow
              label="찜질방 / 불가마"
              ok={sauna.kr_specific.has_jjimjilbang}
              detail={sauna.kr_specific.has_jjimjilbang ? '찜질방 병설 운영' : '사우나 단독'}
              badge="한국 문화"
            />
          )}
        </div>
      </div>

      {/* 3. 한국형 세신(때밀이) & 식음료 */}
      {hasKrSpecific && sauna.kr_specific && (
        <div className="border-b border-border-main bg-bg-card">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[11px] font-black tracking-wider text-text-muted uppercase">
              세신(때밀이) & 매점 (Sesin & Food)
            </h3>
          </div>
          <div className="divide-y divide-border-subtle">
            {sauna.kr_specific.sesin_price_male > 0 && (
              <InfoRow label="세신 요금 (남성)" value={`${sauna.kr_specific.sesin_price_male.toLocaleString()}원`} />
            )}
            {sauna.kr_specific.sesin_price_female > 0 && (
              <InfoRow label="세신 요금 (여성)" value={`${sauna.kr_specific.sesin_price_female.toLocaleString()}원`} />
            )}
            {sauna.kr_specific.food && sauna.kr_specific.food.length > 0 && (
              <div className="px-4 py-3 border-b border-border-subtle">
                <p className="text-[12px] font-bold text-text-sub mb-1.5">대표 매점 메뉴</p>
                <div className="flex flex-wrap gap-1.5">
                  {sauna.kr_specific.food.map((f, i) => (
                    <span key={i} className="rounded-md bg-bg-sub border border-border-main px-2 py-1 text-[11px] font-bold text-text-main">
                      🥣 {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. 이용 요금 안내 */}
      {hasPricing && sauna.pricing && (
        <div className="border-b border-border-main bg-bg-card">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[11px] font-black tracking-wider text-text-muted uppercase">
              이용 요금 (Pricing)
            </h3>
          </div>
          <div className="divide-y divide-border-subtle">
            {sauna.pricing.adult_day > 0 && (
              <InfoRow label="성인 주간 (기본)" value={`${sauna.pricing.adult_day.toLocaleString()}원`} />
            )}
            {sauna.pricing.adult_night > 0 && (
              <InfoRow label="성인 야간" value={`${sauna.pricing.adult_night.toLocaleString()}원`} />
            )}
            {sauna.pricing.child > 0 && (
              <InfoRow label="어린이 / 소인" value={`${sauna.pricing.child.toLocaleString()}원`} />
            )}
            {sauna.pricing.jjimjilbang !== undefined && sauna.pricing.jjimjilbang !== null && sauna.pricing.jjimjilbang > 0 && (
              <InfoRow label="찜질복 대여 (추가)" value={`+${sauna.pricing.jjimjilbang.toLocaleString()}원`} accent />
            )}
          </div>
        </div>
      )}

      {/* 5. 영업 시간 및 매장 정보 */}
      <div className="border-b border-border-main bg-bg-card">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[11px] font-black tracking-wider text-text-muted uppercase">
            기본 정보 (Info)
          </h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {sauna.business_hours && (
            <InfoRow label="운영 시간" value={sauna.business_hours} />
          )}
          {sauna.contact && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <p className="text-[12.5px] font-bold text-text-sub">전화번호</p>
              <a href={`tel:${sauna.contact}`} className="text-[12.5px] font-black text-point hover:underline">
                {sauna.contact}
              </a>
            </div>
          )}
          <InfoRow label="주차장" value={sauna.parking ? '주차 가능 ○' : '주차 불가 ✕'} />
        </div>
      </div>

      {/* 6. 시설 모형도 (Floor Plan) */}
      {sauna.floor_plan_images && sauna.floor_plan_images.length > 0 && (
        <div className="border-b border-border-main bg-bg-card p-4">
          <h3 className="text-[11px] font-black tracking-wider text-text-muted uppercase mb-2">
            시설 구조도 (Floor Plan)
          </h3>
          <div className="overflow-hidden rounded-xl border border-border-main bg-bg-sub">
            <img
              src={sauna.floor_plan_images[0]}
              alt="시설 구조도"
              onClick={() => setShowPreview(true)}
              className="w-full object-contain cursor-zoom-in transition hover:opacity-95 active:scale-[0.99]"
              style={{ maxHeight: 220 }}
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

      {/* 7. 인스타그램 미디어 */}
      {sauna.instagram_media && sauna.instagram_media.length > 0 && (
        <div className="bg-bg-card p-4">
          <h3 className="text-[11px] font-black tracking-wider text-text-muted uppercase mb-2.5">
            인스타그램 리뷰 & 영상
          </h3>
          <div className="space-y-2">
            {sauna.instagram_media.map((item, i) => (
              <InstagramCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
