'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchSaunas, getPopularKeywords } from '@/app/actions/sauna.actions'
import { BiSearch, BiX, BiHistory, BiTrendingUp } from 'react-icons/bi'
import SaunaCard from '@/components/sauna/SaunaCard'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

const STORAGE_KEY = 'sauna-geukrak:recent-searches'
const MAX_RECENT = 8

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

  const handleSelect = useCallback((kw: string) => {
    setKeyword(kw)
    setRecentKeywords(saveRecent(kw))
  }, [])

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
          <div className="p-5 space-y-7">

            {/* 최근 검색어 */}
            {recentKeywords.length > 0 && (
              <div>
                <div className="mb-3.5 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                    <BiHistory size={13} /> 최근 검색어
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
                      className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-card pl-3.5 pr-2 py-1.5 text-[12px] font-bold text-text-sub shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                    >
                      {kw}
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

            {/* 인기 키워드 */}
            <div>
              <h3 className="mb-3.5 flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                <BiTrendingUp size={13} /> 인기 검색어
              </h3>
              <div className="rounded-2xl border border-border-main bg-bg-card overflow-hidden shadow-sm">
                {popularKeywords.length > 0 ? (
                  popularKeywords.map((kw, idx) => (
                    <button
                      key={kw}
                      onClick={() => handleSelect(kw)}
                      className={`flex w-full items-center gap-4 px-4 py-3.5 text-sm font-bold text-text-main transition hover:bg-bg-sub active:bg-bg-main ${
                        idx < popularKeywords.length - 1 ? 'border-b border-border-subtle' : ''
                      }`}
                    >
                      <span className="w-5 text-center text-[13px] font-black text-point">{idx + 1}</span>
                      <span className="flex-1 text-left text-[13px]">{kw}</span>
                    </button>
                  ))
                ) : (
                  // 로딩 스켈레톤
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex items-center gap-4 px-4 py-3.5 ${i < 4 ? 'border-b border-border-subtle' : ''}`}>
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
                <div className="grid grid-cols-2 gap-3 p-4">
                  {searchResults.map((sauna, i) => (
                    <SaunaCard key={sauna.id} sauna={sauna} priority={i < 2} />
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
