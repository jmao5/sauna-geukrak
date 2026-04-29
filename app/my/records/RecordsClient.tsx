'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useUserStore } from '@/stores/userStore'
import { BiChevronLeft, BiStar } from 'react-icons/bi'
import Link from 'next/link'
import { SaunaSummaryDto } from '@/types/sauna'

const VISIT_TIME_LABELS: Record<string, string> = {
  morning: '🌅 아침',
  afternoon: '☀️ 오후',
  evening: '🌆 저녁',
  night: '🌙 야간',
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <BiStar
          key={n}
          size={11}
          className={n <= rating ? 'text-gold' : 'text-border-main'}
          style={{ fill: n <= rating ? 'currentColor' : 'none' }}
        />
      ))}
    </div>
  )
}

export default function RecordsClient() {
  const router = useRouter()
  const { user } = useUserStore()

  const { data = [], isLoading } = useQuery({
    queryKey: ['my-records', user?.id],
    queryFn: () => api.reviews.getByUserId(user!.id),
    enabled: !!user,
  })

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 헤더 */}
      <div className="flex items-center gap-3 bg-bg-sub px-4 py-4 shadow-[0_1px_0_var(--border-main)]">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-bg-main active:scale-90"
        >
          <BiChevronLeft size={26} className="text-text-main" />
        </button>
        <div>
          <h1 className="text-base font-black text-text-main">사활 기록</h1>
          {!isLoading && (
            <p className="text-[11px] text-text-muted">총 {data.length}회 방문</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border-subtle bg-bg-card p-4 space-y-2">
                <div className="flex gap-3">
                  <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-bg-sub" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-3/4 rounded bg-bg-sub" />
                    <div className="h-2.5 w-1/2 rounded bg-bg-sub" />
                    <div className="h-2.5 w-1/3 rounded bg-bg-sub" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-5xl">🔥</span>
            <p className="text-[14px] font-black text-text-main">아직 사활 기록이 없어요</p>
            <p className="text-[12px] text-text-muted">사우나 다녀온 후 기록을 남겨보세요</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 rounded-full bg-point px-6 py-2.5 text-[13px] font-black text-white transition active:scale-95"
            >
              사우나 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {data.map((record: any) => {
              const sauna = record.saunas as SaunaSummaryDto | null
              const dateStr = record.visit_date
                ? new Date(record.visit_date).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : null
              const thumbnail = sauna?.images?.[0] ?? null

              return (
                <Link
                  key={record.id}
                  href={sauna ? `/saunas/${sauna.id}` : '#'}
                  className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-bg-card p-3.5 transition active:scale-[0.98] active:bg-bg-main"
                >
                  {/* 썸네일 */}
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-bg-sub">
                    {thumbnail ? (
                      <img src={thumbnail} alt={sauna?.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg to-cold-bg">
                        <span className="text-xl opacity-30">🧖</span>
                      </div>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-black text-text-main">
                      {sauna?.name ?? '알 수 없는 사우나'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StarRow rating={record.rating} />
                      {record.visit_time && (
                        <span className="text-[10px] text-text-muted">
                          {VISIT_TIME_LABELS[record.visit_time] ?? record.visit_time}
                        </span>
                      )}
                    </div>
                    {dateStr && (
                      <p className="mt-1 text-[11px] text-text-muted">{dateStr}</p>
                    )}
                    {record.content && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-text-sub">{record.content}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
