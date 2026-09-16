'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { BiSearch, BiMap, BiX, BiChevronDown, BiHistory } from 'react-icons/bi'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { CONDITIONS, SORT_OPTIONS } from '@/constants/home'
import useLocalStorage from '@/hooks/useLocalStorage'

const RECENT_STORAGE_KEY = 'sauna-geukrak:recent-searches'
const MAX_RECENT = 8

interface HomeHeaderProps {
  resultCount: number
  isLoading: boolean
}

export default function HomeHeader({ resultCount, isLoading }: HomeHeaderProps) {
  const filterScrollRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [isFilterDown, setIsFilterDown] = useState(false)
  const [filterStartX, setFilterStartX] = useState(0)
  const [filterScrollLeft, setFilterScrollLeft] = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // 최근 검색어: useSyncExternalStore 기반 훅이라 effect 없이 하이드레이션 안전
  const { value: recentSearches, setValue: setRecentSearches } = useLocalStorage<string[]>(RECENT_STORAGE_KEY, [])
  const saveRecent = (term: string) =>
    setRecentSearches((prev) => [term, ...prev.filter((k) => k !== term)].slice(0, MAX_RECENT))
  const removeRecent = (term: string) => setRecentSearches((prev) => prev.filter((k) => k !== term))
  const clearRecent = () => setRecentSearches([])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const handleFilterMouseDown = (e: React.MouseEvent) => {
    if (!filterScrollRef.current) return
    setIsFilterDown(true)
    setFilterStartX(e.pageX - filterScrollRef.current.offsetLeft)
    setFilterScrollLeft(filterScrollRef.current.scrollLeft)
  }

  const handleFilterMouseLeave = () => setIsFilterDown(false)
  const handleFilterMouseUp = () => setIsFilterDown(false)

  const handleFilterMouseMove = (e: React.MouseEvent) => {
    if (!isFilterDown || !filterScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - filterScrollRef.current.offsetLeft
    const walk = (x - filterStartX) * 1.5
    filterScrollRef.current.scrollLeft = filterScrollLeft - walk
  }

  const {
    keyword, setKeyword,
    selectedRegion, setSelectedRegion, setRegionOpen,
    selectedConds, toggleCondition,
    showMoreFilters, setShowMoreFilters,
    sortKey, setSortKey,
    resetAll,
  } = useHomeFilterStore()

  const handleSelectRecent = (term: string) => {
    setKeyword(term)
    saveRecent(term)
    setIsSearchFocused(false)
  }

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecent(term)
  }

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearRecent()
  }

  const visibleConds = showMoreFilters ? CONDITIONS : CONDITIONS.slice(0, 3)
  const hasSelection = !!selectedRegion || selectedConds.length > 0 || !!keyword.trim() || sortKey !== 'default'
  const currentSort = SORT_OPTIONS.find((option) => option.id === sortKey)

  return (
    <div className="flex-shrink-0 border-b border-border-main bg-bg-main">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-baseline gap-2">
          <h1 className="font-juache text-[26px] leading-none text-text-main" style={{ letterSpacing: '-0.02em' }}>
            사우나 극락
          </h1>
          <span className="hidden sm:inline-block text-[10px] font-bold text-text-muted">
            사우나·사활 도감
          </span>
        </div>
        <Link
          href="/map"
          aria-label="지도 화면으로 이동"
          className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-card px-3.5 py-1.5 text-[11.5px] font-black text-text-main shadow-xs transition active:scale-95 hover:border-point/40"
        >
          <BiMap size={13} className="text-point" /> 지도
        </Link>
      </div>

      <div className="px-4 pb-2.5" ref={searchContainerRef}>
        <div className="relative">
          <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={keyword}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const trimmed = keyword.trim()
                if (trimmed) {
                  saveRecent(trimmed)
                }
                setIsSearchFocused(false)
                ;(e.target as HTMLInputElement).blur()
              } else if (e.key === 'Escape') {
                setIsSearchFocused(false)
              }
            }}
            placeholder="사우나 이름, 지역으로 검색 (시설 조건은 아래 필터)"
            aria-label="사우나 검색"
            className="w-full rounded-xl border border-border-main bg-bg-card py-2.5 pl-9 pr-9 text-[13px] font-bold text-text-main outline-none transition placeholder:text-text-muted focus:border-point focus:ring-1 focus:ring-point shadow-xs"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <BiX size={16} className="text-text-muted" />
            </button>
          )}

          {/* 최근 검색어 드롭다운 */}
          {isSearchFocused && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-border-main bg-bg-card/95 p-3.5 shadow-xl backdrop-blur-md transition"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted">
                  <BiHistory size={13} /> 최근 검색어
                </span>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClearRecent}
                    className="text-[10.5px] font-bold text-text-muted hover:text-danger transition active:opacity-70"
                  >
                    전체 삭제
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <p className="py-4 text-center text-[11.5px] font-medium text-text-muted">
                  최근 검색 내역이 없습니다.
                </p>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-hide">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectRecent(term)}
                      className="group flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-sub/80 px-2.5 py-1 text-[11.5px] font-bold text-text-sub transition hover:border-point/40 hover:bg-bg-sub hover:text-text-main cursor-pointer active:scale-95"
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => handleRemoveRecent(term, e)}
                        aria-label={`${term} 검색어 삭제`}
                        className="text-text-muted hover:text-text-main transition p-0.5 rounded-full"
                      >
                        <BiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={filterScrollRef}
          onMouseDown={handleFilterMouseDown}
          onMouseLeave={handleFilterMouseLeave}
          onMouseUp={handleFilterMouseUp}
          onMouseMove={handleFilterMouseMove}
          className={`flex items-center gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-hide select-none ${
            isFilterDown ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <button
            onClick={() => setRegionOpen(true)}
            className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black transition active:scale-95 shadow-xs ${
              selectedRegion ? 'bg-point text-white ring-1 ring-point' : 'border border-border-main bg-bg-card text-text-sub hover:bg-bg-sub'
            }`}
          >
            {selectedRegion ?? '전국 지역'}<BiChevronDown size={12} />
          </button>
          {visibleConds.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleCondition(option.id)}
              className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black transition active:scale-95 shadow-xs ${
                selectedConds.includes(option.id)
                  ? 'bg-point text-white ring-1 ring-point'
                  : 'border border-border-main bg-bg-card text-text-sub hover:bg-bg-sub'
              }`}
            >
              <span>{option.emoji}</span>{option.label}
            </button>
          ))}
          <button
            onClick={() => setShowMoreFilters((value) => !value)}
            className="flex flex-shrink-0 items-center gap-1 rounded-full border border-border-main bg-bg-card px-3 py-1.5 text-[11px] font-bold text-text-muted transition active:scale-95 hover:text-text-main"
          >
            {showMoreFilters ? '접기' : '더보기'}<BiChevronDown size={12} className={`transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-5 bg-gradient-to-l from-bg-main to-transparent" />
      </div>

      {hasSelection && (
        <div className="border-t border-border-subtle px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold text-text-muted">
              {isLoading ? '사우나를 찾는 중...' : <>현재 <span className="font-black text-point">{resultCount.toLocaleString()}곳</span> 발견</>}
            </p>
            <button onClick={resetAll} className="flex items-center gap-1 text-[11px] font-bold text-text-muted transition active:opacity-70">
              <BiX size={13} /> 전체 초기화
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" aria-label="적용된 검색 조건">
            {keyword.trim() && <ActiveChip label={`“${keyword.trim()}”`} onRemove={() => setKeyword('')} />}
            {selectedRegion && <ActiveChip label={selectedRegion} onRemove={() => setSelectedRegion(null)} />}
            {selectedConds.map((condition) => {
              const option = CONDITIONS.find((item) => item.id === condition)
              return option ? <ActiveChip key={condition} label={`${option.emoji} ${option.label}`} onRemove={() => toggleCondition(condition)} /> : null
            })}
            {sortKey !== 'default' && currentSort && <ActiveChip label={currentSort.label} onRemove={() => setSortKey('default')} />}
          </div>
        </div>
      )}
    </div>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button onClick={onRemove} className="flex flex-shrink-0 items-center gap-1 rounded-full bg-point/10 px-2.5 py-1 text-[11px] font-bold text-point">
      <span className="max-w-32 truncate">{label}</span><BiX size={13} aria-hidden="true" />
    </button>
  )
}
