import type { Metadata } from 'next'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '@/lib/getQueryClient'
import { createClient } from '@/lib/supabase/server'
import { getNickname } from '@/app/actions/user.actions'
import { getFavoritesByUserId } from '@/app/actions/favorite.actions'
import { getReviewsByUserId } from '@/app/actions/review.actions'
import MyPageClient from './MyPageClient'
import type { MyFavoriteDto, MyReviewDto } from '@/types/sauna'

export const metadata: Metadata = { title: '마이 페이지' }

export default async function MyPage() {
  const queryClient = getQueryClient()
  let initialUserId: string | null = null
  let initialNickname: string | null = null
  let initialFavorites: MyFavoriteDto[] = []
  let initialRecords: MyReviewDto[] = []

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      initialUserId = user.id

      // 닉네임, 찜 목록, 사활 기록을 서버에서 병렬로 사전 페칭
      const [nickname, favorites, records] = await Promise.all([
        getNickname(user.id),
        getFavoritesByUserId(user.id).catch(() => []),
        getReviewsByUserId(user.id).catch(() => []),
      ])

      initialNickname = nickname
      initialFavorites = favorites
      initialRecords = records

      // React Query 캐시 채우기
      if (initialNickname) {
        queryClient.setQueryData(['user-nickname', user.id], initialNickname)
      }
      queryClient.setQueryData(['favorites', user.id], initialFavorites)
      queryClient.setQueryData(['my-records', user.id], initialRecords)
    }
  } catch (error) {
    console.error('[MyPage] SSR prefetch error:', error)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyPageClient
        initialUserId={initialUserId}
        initialNickname={initialNickname}
        initialFavorites={initialFavorites}
        initialRecords={initialRecords}
      />
    </HydrationBoundary>
  )
}
