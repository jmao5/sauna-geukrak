'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import { useUserStore } from '@/stores/userStore'
import { BiChevronLeft } from 'react-icons/bi'
import SaunaCard from '@/components/sauna/SaunaCard'
import { SaunaSummaryDto, MyFavoriteDto } from '@/types/sauna'

export default function FavoritesClient() {
  const router = useRouter()
  const { user } = useUserStore()

  const { data, isLoading } = useQuery<MyFavoriteDto[]>({
    queryKey: ['favorites', user?.id],
    queryFn: () => api.favorites.getByUserId(user!.id),
    enabled: !!user,
  })

  const saunas: SaunaSummaryDto[] = (data ?? [])
    .map((row) => row.saunas)
    .filter((s): s is SaunaSummaryDto => !!s)

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
          <h1 className="text-base font-black text-text-main">찜한 사우나</h1>
          {!isLoading && (
            <p className="text-[11px] text-text-muted">{saunas.length}곳</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
                <div className="h-32 bg-bg-sub" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-bg-sub" />
                  <div className="h-2.5 w-1/2 rounded bg-bg-sub" />
                </div>
              </div>
            ))}
          </div>
        ) : saunas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-5xl">🤍</span>
            <p className="text-[14px] font-black text-text-main">찜한 사우나가 없어요</p>
            <p className="text-[12px] text-text-muted">마음에 드는 사우나를 찜해보세요</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 rounded-full bg-point px-6 py-2.5 text-[13px] font-black text-white transition active:scale-95"
            >
              사우나 둘러보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {saunas.map((sauna) => (
              <SaunaCard key={sauna.id} sauna={sauna} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
