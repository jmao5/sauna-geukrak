'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchSaunas } from '@/app/actions/sauna.actions'
import { BiSearch, BiX, BiHistory, BiTrendingUp } from 'react-icons/bi'
import SaunaCard from '@/components/sauna/SaunaCard'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

export default function SearchClient() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const router = useRouter()

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', debouncedKeyword],
    queryFn: () => searchSaunas(debouncedKeyword),
    enabled: debouncedKeyword.length > 0,
    staleTime: 1000 * 60 * 2,
  })

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 상단 검색 바 */}
      <div className="bg-bg-sub px-4 pb-3 pt-4 border-b border-border-main">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors duration-200" size={17} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="사우나 이름, 주소로 검색..."
              className="w-full rounded-xl border border-border-main bg-bg-main py-3 pl-10 pr-10 text-sm font-bold text-text-main shadow-sm outline-none transition-all duration-200 focus:border-point focus:ring-2 focus:ring-point/20 focus:shadow-md"
              autoFocus
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-text-muted/20 p-1 text-text-muted transition-all duration-150 hover:bg-text-muted/30 active:scale-90"
              >
                <BiX size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="flex-shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold text-text-sub transition-all duration-150 hover:bg-bg-main active:scale-95"
          >
            취소
          </button>
        </div>
      </div>

      {/* 결과 영역 */}
      <div data-scroll-main className="flex-1 overflow-y-auto scrollbar-hide">
        {!keyword ? (
          <div className="p-5 space-y-7">
            {/* 최근 검색어 */}
            <div>
              <h3 className="mb-3.5 flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                <BiHistory size={13} /> 최근 검색어
              </h3>
              <div className="flex flex-wrap gap-2">
                {['강남', '수원', '온천', '24시'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setKeyword(tag)}
                    className="rounded-full border border-border-main bg-bg-card px-4 py-1.5 text-[12px] font-bold text-text-sub shadow-sm transition-all duration-200 hover:border-border-strong hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 인기 키워드 */}
            <div>
              <h3 className="mb-3.5 flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                <BiTrendingUp size={13} /> 인기 사우나 키워드
              </h3>
              <div className="space-y-0 rounded-2xl border border-border-main bg-bg-card overflow-hidden shadow-sm">
                {[
                  { rank: 1, tag: '오토 로우리', emoji: '💦' },
                  { rank: 2, tag: '지하수 냉탕', emoji: '🏔️' },
                  { rank: 3, tag: '야외 휴식', emoji: '🌿' },
                  { rank: 4, tag: '서울 스파', emoji: '🏙️' },
                ].map((item, idx, arr) => (
                  <button
                    key={item.rank}
                    onClick={() => setKeyword(item.tag)}
                    className={`flex w-full items-center gap-4 px-4 py-3.5 text-sm font-bold text-text-main transition-colors duration-150 hover:bg-bg-sub active:bg-bg-main ${
                      idx < arr.length - 1 ? 'border-b border-border-subtle' : ''
                    }`}
                  >
                    <span className="w-5 text-center text-[13px] font-black text-point">{item.rank}</span>
                    <span className="text-base">{item.emoji}</span>
                    <span className="flex-1 text-left text-[13px]">{item.tag}</span>
                  </button>
                ))}
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
                  {searchResults.map((sauna) => (
                    <SaunaCard key={sauna.id} sauna={sauna} />
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
                  className="mt-2 rounded-full border border-border-main bg-bg-card px-5 py-2 text-[12px] font-bold text-text-sub shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
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
