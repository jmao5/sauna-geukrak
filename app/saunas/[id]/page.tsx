import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '@/lib/getQueryClient'
import { SaunaDetailClient } from './SaunaDetailClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSaunaById, getReviewsBySaunaId } from '@/app/actions/sauna.actions'
import { createClient } from '@/lib/supabase/server'
import { getFavoriteCount, checkFavorite } from '@/app/actions/favorite.actions'
import { getReviewCount } from '@/app/actions/review.actions'

type Props = { params: Promise<{ id: string }> }

/**
 * #2 Fix: generateMetadata도 getQueryClient()로 데이터를 캐시에 채워둠.
 * → SaunaDetailPage의 prefetchQuery 실행 시 이미 캐시에 있으면 Supabase 왕복 0번.
 */
async function prefetchSauna(id: string) {
  const queryClient = getQueryClient()
  await queryClient.fetchQuery({
    queryKey: ['sauna', id],
    queryFn: () => getSaunaById(id),
    staleTime: 1000 * 60 * 5,
  })
  return queryClient
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    // fetchQuery → 없으면 fetch, 있으면 캐시 반환 (SaunaDetailPage와 공유)
    const queryClient = await prefetchSauna(id)
    const sauna = queryClient.getQueryData<{ name: string; address: string }>(['sauna', id])
    if (!sauna) return { title: '사우나 상세' }
    return {
      title: sauna.name,
      description: `${sauna.address} · 사우나 극락에서 ${sauna.name}의 온도, 시설 정보와 사활을 확인하세요.`,
    }
  } catch {
    return { title: '사우나 상세' }
  }
}

export default async function SaunaDetailPage({ params }: Props) {
  const { id } = await params
  const queryClient = getQueryClient()

  // 현재 로그인 유저 확인
  let currentUserId: string | null = null
  let initialIsFav = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    currentUserId = user?.id ?? null
  } catch {}

  try {
    // 사우나 상세 정보, 리뷰 목록, 찜 수, 사활 수, 그리고 로그인 유저의 찜 여부까지 병렬(Promise.all)로 프리페치
    const prefetchPromises: Promise<any>[] = [
      queryClient.fetchQuery({
        queryKey: ['sauna', id],
        queryFn: () => getSaunaById(id),
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        queryKey: ['reviews', id],
        queryFn: () => getReviewsBySaunaId(id),
        staleTime: 1000 * 60 * 2,
      }),
      queryClient.prefetchQuery({
        queryKey: ['favorite-count', id],
        queryFn: () => getFavoriteCount(id),
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        queryKey: ['review-count', id],
        queryFn: () => getReviewCount(id),
        staleTime: 1000 * 60 * 5,
      }),
    ]

    if (currentUserId) {
      prefetchPromises.push(
        queryClient
          .fetchQuery({
            queryKey: ['favorite', id, currentUserId],
            queryFn: () => checkFavorite(currentUserId!, id),
            staleTime: 1000 * 60 * 5,
          })
          .then((res) => {
            initialIsFav = !!res
          })
          .catch(() => {})
      )
    }

    await Promise.all(prefetchPromises)
  } catch {
    notFound()
  }

  const sauna = queryClient.getQueryData(['sauna', id])
  if (!sauna) notFound()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SaunaDetailClient id={id} initialIsFav={initialIsFav} initialUserId={currentUserId} />
    </HydrationBoundary>
  )
}
