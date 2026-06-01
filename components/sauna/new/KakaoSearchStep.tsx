'use client'

import { useState } from 'react'
import { BiChevronLeft, BiSearch, BiX } from 'react-icons/bi'
import toast from 'react-hot-toast'

export interface KakaoPlace {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  x: string   // longitude
  y: string   // latitude
  phone: string
  category_group_name: string
}

export default function KakaoSearchStep({
  isKakaoReady,
  onSelect,
}: {
  isKakaoReady: boolean
  onSelect: (place: KakaoPlace) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [noResult, setNoResult] = useState(false)

  const handleSearch = () => {
    if (!query.trim()) return
    if (!isKakaoReady) {
      toast.error('지도 서비스를 로드하는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setIsSearching(true)
    setNoResult(false)

    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(
      query,
      (data: KakaoPlace[], status: string) => {
        setIsSearching(false)
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data.slice(0, 15))
          setNoResult(data.length === 0)
        } else {
          setResults([])
          setNoResult(true)
        }
      },
      { size: 15 }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-sauna/20 bg-sauna-bg p-4">
        <p className="text-xs font-bold text-sauna-text">
          🔍 장소 검색으로 사우나를 선택하면
        </p>
        <p className="mt-0.5 text-[11px] text-sauna-text/80">
          이름, 주소, 연락처 등 기본 정보가 자동으로 입력됩니다
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border-main bg-bg-main px-3">
          <BiSearch size={16} className="flex-shrink-0 text-text-sub" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="사우나 이름 또는 지역 입력"
            className="flex-1 bg-transparent py-3 text-sm text-text-main placeholder:text-text-muted outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]) }}>
              <BiX size={16} className="text-text-sub" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim() || !isKakaoReady}
          className="rounded-xl bg-point px-4 py-2.5 text-sm font-black text-white transition active:scale-95 disabled:opacity-50"
        >
          {isSearching ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : '검색'}
        </button>
      </div>

      {noResult && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-bold text-text-sub">검색 결과가 없어요</p>
          <p className="text-xs text-text-muted">다른 이름이나 지역으로 검색해보세요</p>
        </div>
      )}

      <div className="space-y-2">
        {results.map((place) => (
          <button
            key={place.id}
            onClick={() => onSelect(place)}
            className="sauna-card flex w-full items-start gap-3 p-3.5 text-left"
          >
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sauna-bg">
              <span className="text-base">🔥</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-black text-text-main">{place.place_name}</p>
              <p className="truncate text-[11px] text-text-sub">
                {place.road_address_name || place.address_name}
              </p>
              {place.phone && (
                <p className="text-[11px] text-text-muted">{place.phone}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center">
              <BiChevronLeft size={18} className="rotate-180 text-text-muted" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
