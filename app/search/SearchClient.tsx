'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchSaunas, getPopularKeywords } from '@/app/actions/sauna.actions'
import { BiSearch, BiX, BiHistory, BiTrendingUp, BiCompass, BiChevronRight } from 'react-icons/bi'
import SaunaCard from '@/components/sauna/SaunaCard'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

const STORAGE_KEY = 'sauna-geukrak:recent-searches'
const MAX_RECENT = 8

// ── 사우나 매니아 8대 퀵 테마 칩 ───────────────────────────────
const THEME_PILLS = [
  { id: 'cold_deep', emoji: '🌊', label: '수심 1m+ 깊은 냉탕', query: '냉탕' },
  { id: 'hot_loyly', emoji: '🪵', label: '100°C+ 로울류', query: '로울류' },
  { id: 'outdoor', emoji: '🍃', label: '야외 노천탕 & 외기욕', query: '노천' },
  { id: 'groundwater', emoji: '💧', label: '100% 천연 지하수', query: '지하수' },
  { id: '24h', emoji: '🌙', label: '24시간 심야 찜질방', query: '24시간' },
  { id: 'autoloyly', emoji: '♨️', label: '오토로울류 폭포', query: '오토로울류' },
  { id: 'chair', emoji: '🪑', label: '인피니티 체어', query: '인피니티' },
  { id: 'tattoo', emoji: '🎨', label: '타투·문신 가능', query: '타투' },
] as const

// ── 4대 매니아 테마 컬렉션 카드 ──────────────────────────────
const THEME_COLLECTIONS = [
  {
    id: 'deep-cold',
    badge: 'COLD HEAVEN',
    title: '🌊 극락 수냉탕 탐험대',
    subtitle: '15°C 이하 & 깊은 수심의 강렬한 냉탕',
    tags: ['#수심1m', '#14도극냉', '#천연암반수'],
    cardBg: 'from-sky-500/15 via-blue-500/10 to-bg-card border-sky-500/30 dark:border-sky-500/25',
    accentColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25',
    query: '냉탕',
  },
  {
    id: 'super-hot',
    badge: '100°C SAUNA',
    title: '🪵 100°C 초고온 땀폭탄',
    subtitle: '핀란드식 로울류로 땀을 흠뻑 뺄 수 있는 사우나',
    tags: ['#오토로울류', '#100도', '#핀란드식'],
    cardBg: 'from-amber-500/15 via-orange-500/10 to-bg-card border-amber-500/30 dark:border-amber-500/25',
    accentColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
    query: '로울류',
  },
  {
    id: 'open-air',
    badge: 'TOTONOI REST',
    title: '🍃 도심 속 외기욕 & 노천탕',
    subtitle: '인피니티 체어에서 하늘을 보며 맞는 황홀경',
    tags: ['#야외노천', '#인피니티체어', '#외기욕'],
    cardBg: 'from-emerald-500/15 via-teal-500/10 to-bg-card border-emerald-500/30 dark:border-emerald-500/25',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    query: '노천',
  },
  {
    id: 'night-stay',
    badge: '24H SHELTER',
    title: '🌙 24시간 심야 힐링 쉼터',
    subtitle: '늦은 밤에도 여유로운 찜질방 & 수면 휴게존',
    tags: ['#24시간', '#찜질방', '#심야영업'],
    cardBg: 'from-indigo-500/15 via-purple-500/10 to-bg-card border-indigo-500/30 dark:border-indigo-500/25',
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    query: '24시간',
  },
] as const

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(keyword: string) {
  try {
    const prev = loadRecent()
    const next = [keyword, ...prev.filter((k) => k !== keyword)].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  } catch {
    return []
  }
}

function removeRecent(keyword: string) {
  try {
    const next = loadRecent().filter((k) => k !== keyword)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  } catch {
    return []
  }
}

function clearRecent() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
  return []
}

export default function SearchClient() {
  const [keyword, setKeyword] = useState('')
  const [recentKeywords, setRecentKeywords] = useState<string[]>([])
  const debouncedKeyword = useDebounce(keyword, 300)
  const router = useRouter()

  // localStorage는 클라이언트에서만
  useEffect(() => {
    setRecentKeywords(loadRecent())
  }, [])

  const { data: popularKeywords = [] } = useQuery({
    queryKey: ['popular-keywords'],
    queryFn: getPopularKeywords,
    staleTime: 1000 * 60 * 10, // 10분 캐시
  })

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', debouncedKeyword],
    queryFn: () => searchSaunas(debouncedKeyword),
    enabled: debouncedKeyword.length > 0,
    staleTime: 1000 * 60 * 2,
  })

  const handleSelect = (kw: string) => {
    setKeyword(kw)
    setRecentKeywords(saveRecent(kw))
  }

  // 검색어 확정 시 (엔터 or debounce 후 결과 있을 때) 저장
  useEffect(() => {
    if (debouncedKeyword.length >= 2) {
      setRecentKeywords(saveRecent(debouncedKeyword))
    }
  }, [debouncedKeyword])

  const handleRemoveRecent = (kw: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentKeywords(removeRecent(kw))
  }

  const handleClearAll = () => {
    setRecentKeywords(clearRecent())
  }

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 검색바 */}
      <div className="bg-bg-sub px-4 pb-3 pt-4 border-b border-border-main">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={17} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="사우나 이름, 주소로 검색..."
              className="w-full rounded-xl border border-border-main bg-bg-main py-3 pl-10 pr-10 text-sm font-bold text-text-main shadow-sm outline-none transition-all focus:border-point focus:ring-2 focus:ring-point/20"
              autoFocus
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-text-muted/20 p-1 text-text-muted transition active:scale-90"
              >
                <BiX size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="flex-shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold text-text-sub transition hover:bg-bg-main active:scale-95"
          >
            취소
          </button>
        </div>
      </div>

      <div data-scroll-main className="flex-1 overflow-y-auto scrollbar-hide">
        {!keyword ? (
          <div className="py-4 space-y-6">

            {/* 1. 사우나 매니아 테마 컬렉션 카드 캐러셀 */}
            <div>
              <div className="px-4 mb-2.5 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[11px] font-black text-text-main tracking-tight">
                  <span className="text-[13px]">✨</span> 매니아 테마 큐레이션
                </h3>
                <span className="text-[10px] font-bold text-text-muted">취향별 탐색</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 scroll-smooth">
                {THEME_COLLECTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.query)}
                    className={`flex-shrink-0 w-[240px] rounded-2xl border bg-gradient-to-br p-3.5 text-left transition active:scale-[0.98] hover:shadow-md ${c.cardBg}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black tracking-wider ${c.badgeBg}`}>
                        {c.badge}
                      </span>
                      <BiChevronRight className={c.accentColor} size={15} />
                    </div>
                    <p className="text-[13px] font-black text-text-main leading-tight mb-1">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-text-sub leading-snug line-clamp-1 mb-2.5">
                      {c.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t, i) => (
                        <span key={i} className="text-[10px] font-extrabold text-text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 사우나 매니아 8대 퀵 테마 칩 */}
            <div className="px-4">
              <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black text-text-main tracking-tight">
                <BiCompass className="text-point" size={14} /> 사우나 매니아 조건 태그
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {THEME_PILLS.map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => handleSelect(pill.query)}
                    className="flex items-center gap-1 rounded-full border border-border-main bg-bg-card px-3 py-1.5 text-[11.5px] font-bold text-text-sub transition hover:border-point/40 hover:text-point active:scale-95 shadow-2xs"
                  >
                    <span>{pill.emoji}</span>
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 최근 검색어 */}
            {recentKeywords.length > 0 && (
              <div className="px-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-[11px] font-black text-text-main tracking-tight">
                    <BiHistory size={13} className="text-text-muted" /> 최근 검색어
                  </h3>
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-text-muted transition hover:text-text-sub"
                  >
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentKeywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => handleSelect(kw)}
                      className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-card pl-3.5 pr-2 py-1.5 text-[12px] font-bold text-text-sub shadow-2xs transition hover:border-point/40 active:scale-95"
                    >
                      <span>{kw}</span>
                      <span
                        onClick={(e) => handleRemoveRecent(kw, e)}
                        className="flex items-center justify-center rounded-full bg-border-main p-0.5 text-text-muted hover:bg-border-strong"
                      >
                        <BiX size={11} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 인기 검색어 랭킹 */}
            <div className="px-4 pb-12">
              <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black text-text-main tracking-tight">
                <BiTrendingUp size={13} className="text-point" /> 인기 검색어
              </h3>
              <div className="rounded-2xl border border-border-main bg-bg-card overflow-hidden shadow-2xs">
                {popularKeywords.length > 0 ? (
                  popularKeywords.map((kw, idx) => (
                    <button
                      key={kw}
                      onClick={() => handleSelect(kw)}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-sm font-bold text-text-main transition hover:bg-bg-sub active:bg-bg-main ${
                        idx < popularKeywords.length - 1 ? 'border-b border-border-subtle' : ''
                      }`}
                    >
                      <span className="w-5 text-center text-[13px] font-black text-point tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-left text-[13px]">{kw}</span>
                      <BiChevronRight size={14} className="text-text-muted" />
                    </button>
                  ))
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-4 px-4 py-3 ${
                        i < 4 ? 'border-b border-border-subtle' : ''
                      }`}
                    >
                      <div className="w-5 h-3 rounded skeleton-shimmer" />
                      <div className="h-3 w-24 rounded skeleton-shimmer" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-point animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-[12px] font-bold text-text-muted">검색 중...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
                  <p className="text-[11px] font-black text-text-muted tracking-widest uppercase">Results</p>
                  <p className="text-[11px] text-text-muted">{searchResults.length}곳</p>
                </div>
                <div className="divide-y divide-border-subtle pb-20">
                  {searchResults.map((sauna, i) => (
                    <SaunaCard key={sauna.id} sauna={sauna} variant="row" priority={i < 2} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-8">
                <span className="text-4xl">🔍</span>
                <p className="text-[14px] font-black text-text-main">검색 결과가 없어요</p>
                <p className="text-[12px] text-text-muted leading-relaxed">
                  <span className="font-bold text-text-sub">'{keyword}'</span>와 일치하는 사우나를 찾지 못했어요
                </p>
                <button
                  onClick={() => setKeyword('')}
                  className="mt-2 rounded-full border border-border-main bg-bg-card px-5 py-2 text-[12px] font-bold text-text-sub shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  검색어 지우기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
