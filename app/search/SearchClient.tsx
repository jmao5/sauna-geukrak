'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { BiSearch, BiX, BiHistory, BiTrendingUp } from 'react-icons/bi'
import SaunaCard from '@/components/sauna/SaunaCard'
import { useRouter } from 'next/navigation'

export default function SearchClient() {
  const [keyword, setKeyword] = useState('')
  const router = useRouter()

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', keyword],
    queryFn: () => api.saunas.search({ query: keyword }),
    enabled: keyword.length > 0,
  })

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 상단 검색 바 */}
      <div className="bg-bg-sub px-4 pb-3 pt-4 shadow-[0_1px_0_var(--border-main)]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="사우나 이름으로 검색..."
              className="w-full rounded-xl border border-border-main bg-bg-main py-3 pl-10 pr-10 text-sm font-bold text-text-main outline-none focus:border-point-ring"
              autoFocus
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-text-muted/20 p-1 text-text-muted"
              >
                <BiX size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="px-2 text-sm font-bold text-text-sub"
          >
            취소
          </button>
        </div>
      </div>

      {/* 결과 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {!keyword ? (
          <div className="p-6">
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-wider">
                <BiHistory size={14} /> 최근 검색어
              </h3>
              <div className="flex flex-wrap gap-2">
                {['강남', '수원', '온천', '24시'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setKeyword(tag)}
                    className="rounded-full border border-border-main bg-bg-sub px-4 py-1.5 text-xs font-bold text-text-sub"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-wider">
                <BiTrendingUp size={14} /> 인기 사우나 키워드
              </h3>
              <div className="space-y-3">
                {[
                  { rank: 1, tag: '오토 로우리' },
                  { rank: 2, tag: '지하수 냉탕' },
                  { rank: 3, tag: '야외 휴식' },
                  { rank: 4, tag: '서울 스파' },
                ].map((item) => (
                  <button
                    key={item.rank}
                    onClick={() => setKeyword(item.tag)}
                    className="flex w-full items-center gap-4 text-sm font-bold text-text-main"
                  >
                    <span className="w-4 text-point">{item.rank}</span>
                    <span>{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {isLoading ? (
              <div className="col-span-2 py-20 text-center text-sm font-bold text-text-muted animate-pulse">
                검색 중...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((sauna) => (
                <SaunaCard key={sauna.id} sauna={sauna} />
              ))
            ) : (
              <div className="col-span-2 py-20 text-center">
                <p className="mb-2 text-3xl">🔍</p>
                <p className="text-sm font-bold text-text-muted">
                  '{keyword}' 검색 결과가 없어요
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
