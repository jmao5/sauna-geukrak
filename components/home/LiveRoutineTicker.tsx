'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { getRecentReviews } from '@/app/actions/review.actions'
import { RecentReviewDto, Session } from '@/types/sauna'
import { formatSessionDuration } from '@/lib/utils'
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi'
import RoutineTimeline from '@/components/sauna/RoutineTimeline'

// 세션 루틴 요약 텍스트 추출 (예: "🔥 10분 · ❄️ 1분 · 🍃 10분 (3세트)")
function summarizeRoutine(sessions: Session[]) {
  if (!sessions || sessions.length === 0) return null
  const saunaM = sessions.find(s => s.type === 'sauna')?.duration_minutes ?? 0
  const coldM = sessions.find(s => s.type === 'cold')?.duration_minutes ?? 0
  const restM = sessions.find(s => s.type === 'rest')?.duration_minutes ?? 0
  const sets = sessions.filter(s => s.type === 'sauna').length || 1

  const parts: string[] = []
  if (saunaM > 0) parts.push(`🔥 ${formatSessionDuration(saunaM)}`)
  if (coldM > 0) parts.push(`❄️ ${formatSessionDuration(coldM)}`)
  if (restM > 0) parts.push(`🍃 ${formatSessionDuration(restM)}`)

  if (parts.length === 0) return null
  return `${parts.join(' · ')} (${sets}세트)`
}

export default function LiveRoutineTicker() {
  const { data: reviews = [] } = useQuery<RecentReviewDto[]>({
    queryKey: ['recent-reviews'],
    queryFn: () => getRecentReviews(6),
    staleTime: 1000 * 60 * 3, // 3분 캐시
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDown, setIsDown] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [hasDragged, setHasDragged] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }

  useEffect(() => {
    checkScrollability()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScrollability, { passive: true })
      window.addEventListener('resize', checkScrollability)
      return () => {
        el.removeEventListener('scroll', checkScrollability)
        window.removeEventListener('resize', checkScrollability)
      }
    }
  }, [reviews])

  // ── 마우스 드래그 스와이프 핸들러 ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDown(true)
    setHasDragged(false)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftState(scrollRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDown(false)
  }

  const handleMouseUp = () => {
    setIsDown(false)
    setTimeout(() => setHasDragged(false), 50)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.4 // 스크롤 민감도
    if (Math.abs(walk) > 5) {
      setHasDragged(true)
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk
  }

  const scrollStep = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const offset = direction === 'left' ? -230 : 230
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  if (!reviews || reviews.length === 0) return null

  return (
    <div className="border-b border-border-main bg-bg-card py-3 select-none">
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-point animate-pulse" />
          <h2 className="text-[12px] font-black text-text-main tracking-tight">
            실시간 신착 사활
          </h2>
          <span className="text-[10px] font-bold text-text-muted">
            방금 올라온 루틴
          </span>
        </div>

        {/* 웹 & 모바일 좌우 네비게이션 버튼 컨트롤러 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollStep('left')}
            disabled={!canScrollLeft}
            aria-label="이전 사활 보기"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border-main bg-bg-main text-text-muted transition active:scale-90 hover:text-text-main hover:border-point/40 disabled:opacity-20 disabled:pointer-events-none"
          >
            <BiChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollStep('right')}
            disabled={!canScrollRight}
            aria-label="다음 사활 보기"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border-main bg-bg-main text-text-muted transition active:scale-90 hover:text-text-main hover:border-point/40 disabled:opacity-20 disabled:pointer-events-none"
          >
            <BiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 가로 스와이프 카드 리스트 (마우스 드래그 & 터치 스와이프 완벽 지원) */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex gap-2.5 overflow-x-auto scrollbar-hide px-4 scroll-smooth ${
          isDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollSnapType: isDown ? 'none' : 'x mandatory' }}
      >
        {reviews.map((review) => {
          const routine = summarizeRoutine(review.sessions ?? [])
          const saunaName = review.saunas?.name ?? '사우나'
          const author = review.users?.nickname ?? '사우나러'
          const avatar = review.users?.avatar_url

          return (
            <Link
              key={review.id}
              href={`/saunas/${review.sauna_id}`}
              onClick={(e) => {
                if (hasDragged) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              draggable={false}
              style={{ scrollSnapAlign: 'start' }}
              className="flex-shrink-0 w-[220px] rounded-xl border border-border-main bg-bg-sub/50 p-2.5 transition active:scale-[0.98] hover:border-point/40 hover:bg-bg-sub flex flex-col justify-between select-none"
            >
              <div>
                {/* 작성자 & 사우나명 */}
                <div className="flex items-center justify-between gap-1 mb-1.5 pointer-events-none">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="relative h-4 w-4 flex-shrink-0 overflow-hidden rounded-full bg-bg-card border border-border-main">
                      {avatar ? (
                        <Image src={avatar} alt={author} fill className="object-cover" draggable={false} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[8px]">🧖</span>
                      )}
                    </div>
                    <span className="truncate text-[10.5px] font-bold text-text-muted">
                      {author}
                    </span>
                  </div>
                  <span className="flex items-center text-[10px] font-black text-amber-500 flex-shrink-0">
                    ★ {review.rating}
                  </span>
                </div>

                {/* 사우나명 */}
                <p className="truncate text-[12px] font-black text-text-main pointer-events-none">
                  {saunaName}
                </p>

                {/* 루틴 바 요약 */}
                {review.sessions && review.sessions.length > 0 ? (
                  <div className="mt-1.5 pointer-events-none overflow-hidden">
                    <RoutineTimeline sessions={review.sessions} variant="compact" />
                  </div>
                ) : routine ? (
                  <div className="mt-1 rounded bg-point/10 px-1.5 py-0.5 text-[9.5px] font-black text-point truncate pointer-events-none">
                    {routine}
                  </div>
                ) : null}

                {/* 한줄 평 */}
                {review.content && (
                  <p className="mt-1 line-clamp-2 text-[11px] text-text-sub leading-snug pointer-events-none">
                    {review.content}
                  </p>
                )}
              </div>

              {/* 하단 화살표 */}
              <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-border-subtle/50 text-[9.5px] font-bold text-text-muted pointer-events-none">
                <span>{review.visit_time ? `${review.visit_time} 방문` : '방문 완료'}</span>
                <span className="flex items-center text-point font-bold">
                  보기 <BiChevronRight size={12} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
