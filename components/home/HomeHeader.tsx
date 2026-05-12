'use client'

import Link from 'next/link'
import { BiSearch, BiMap, BiX, BiChevronDown } from 'react-icons/bi'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { CONDITIONS } from '@/constants/home'

export default function HomeHeader() {
  const {
    keyword, setKeyword,
    selectedRegion, setRegionOpen,
    selectedConds, toggleCondition,
    showMoreFilters, setShowMoreFilters,
    resetAll
  } = useHomeFilterStore()

  const visibleConds = showMoreFilters ? CONDITIONS : CONDITIONS.slice(0, 3)
  const hasFilter = !!selectedRegion || selectedConds.length > 0 || !!keyword.trim()

  return (
    <div className="flex-shrink-0 border-b border-border-main bg-bg-main">
      <div className="flex items-center justify-between px-4 pb-4 pt-5">
        <h1 className="font-juache text-[28px] leading-none text-text-main" style={{ letterSpacing: '-0.02em' }}>
          사우나 극락
        </h1>
        <Link
          href="/map"
          className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-sub px-3.5 py-2 text-[12px] font-bold text-text-sub transition active:opacity-70"
        >
          <BiMap size={14} /> 지도
        </Link>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="사우나 이름, 지역으로 검색..."
            className="w-full rounded-xl border border-border-main bg-bg-sub py-2.5 pl-9 pr-9 text-[13px] font-bold text-text-main outline-none transition placeholder:text-text-muted focus:border-point focus:ring-2 focus:ring-point/15"
          />
          {keyword && (
            <button onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <BiX size={16} className="text-text-muted" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
        <button
          onClick={() => setRegionOpen(true)}
          className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
            selectedRegion ? 'bg-point text-white' : 'border border-border-main bg-bg-main text-text-sub'
          }`}
        >
          {selectedRegion ?? '지역'}
          <BiChevronDown size={12} />
        </button>
        {visibleConds.map((opt) => (
          <button
            key={opt.id}
            onClick={() => toggleCondition(opt.id)}
            className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
              selectedConds.includes(opt.id)
                ? 'bg-point text-white'
                : 'border border-border-main bg-bg-main text-text-sub'
            }`}
          >
            <span>{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowMoreFilters((v) => !v)}
          className="flex flex-shrink-0 items-center gap-1 rounded-full border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-muted transition active:scale-95"
        >
          {showMoreFilters ? '접기' : '더보기'}
          <BiChevronDown size={12} className={`transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {hasFilter && (
        <div className="px-4 pb-2.5">
          <button onClick={resetAll} className="flex items-center gap-1 text-[11px] font-bold text-text-muted">
            <BiX size={12} />
            필터 초기화
          </button>
        </div>
      )}
    </div>
  )
}
