'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { BiSearch, BiMap, BiX, BiChevronDown } from 'react-icons/bi'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { CONDITIONS, SORT_OPTIONS } from '@/constants/home'

interface HomeHeaderProps {
  resultCount: number
  isLoading: boolean
}

export default function HomeHeader({ resultCount, isLoading }: HomeHeaderProps) {
  const filterScrollRef = useRef<HTMLDivElement>(null)
  const [isFilterDown, setIsFilterDown] = useState(false)
  const [filterStartX, setFilterStartX] = useState(0)
  const [filterScrollLeft, setFilterScrollLeft] = useState(0)

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

      <div className="px-4 pb-2.5">
        <div className="relative">
          <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="사우나명, 지역, '지하수', '오토로울리' 검색..."
            aria-label="사우나 검색"
            className="w-full rounded-xl border border-border-main bg-bg-card py-2.5 pl-9 pr-9 text-[13px] font-bold text-text-main outline-none transition placeholder:text-text-muted focus:border-point focus:ring-1 focus:ring-point shadow-xs"
          />
          {keyword && (
            <button onClick={() => setKeyword('')} aria-label="검색어 지우기" className="absolute right-3 top-1/2 -translate-y-1/2">
              <BiX size={16} className="text-text-muted" />
            </button>
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
