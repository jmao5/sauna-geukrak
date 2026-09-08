'use client'

import Link from 'next/link'
import { BiSearch, BiMap, BiX, BiChevronDown } from 'react-icons/bi'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { CONDITIONS, SORT_OPTIONS } from '@/constants/home'

interface HomeHeaderProps {
  resultCount: number
  isLoading: boolean
}

export default function HomeHeader({ resultCount, isLoading }: HomeHeaderProps) {
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
      <div className="flex items-center justify-between px-4 pb-4 pt-5">
        <h1 className="font-juache text-[28px] leading-none text-text-main" style={{ letterSpacing: '-0.02em' }}>
          사우나 극락
        </h1>
        <Link href="/map" className="flex items-center gap-1.5 rounded-md border border-border-main bg-bg-sub px-3.5 py-2 text-[12px] font-bold text-text-sub transition active:opacity-70">
          <BiMap size={14} /> 지도
        </Link>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="사우나 이름, 지역으로 검색..."
            className="w-full rounded-lg border border-border-main bg-bg-sub py-2.5 pl-9 pr-9 text-[13px] font-bold text-text-main outline-none transition placeholder:text-text-muted focus:border-point focus:ring-1 focus:ring-point"
          />
          {keyword && (
            <button onClick={() => setKeyword('')} aria-label="검색어 지우기" className="absolute right-3 top-1/2 -translate-y-1/2">
              <BiX size={16} className="text-text-muted" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
        <button onClick={() => setRegionOpen(true)} className={`flex flex-shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${selectedRegion ? 'bg-point text-white' : 'border border-border-main bg-bg-main text-text-sub'}`}>
          {selectedRegion ?? '지역'}<BiChevronDown size={12} />
        </button>
        {visibleConds.map((option) => (
          <button key={option.id} onClick={() => toggleCondition(option.id)} className={`flex flex-shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${selectedConds.includes(option.id) ? 'bg-point text-white' : 'border border-border-main bg-bg-main text-text-sub'}`}>
            <span>{option.emoji}</span>{option.label}
          </button>
        ))}
        <button onClick={() => setShowMoreFilters((value) => !value)} className="flex flex-shrink-0 items-center gap-1 rounded-md border border-border-main bg-bg-main px-3 py-1.5 text-[11px] font-bold text-text-muted transition active:scale-95">
          {showMoreFilters ? '접기' : '더보기'}<BiChevronDown size={12} className={`transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
        </button>
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
