import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '@/lib/getQueryClient'
import { SaunaDetailClient } from './SaunaDetailClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSaunaById, getReviewsBySaunaId } from '@/app/actions/sauna.actions'
import { getFavoriteCount } from '@/app/actions/favorite.actions'
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

  try {
    // 사우나 상세 정보, 리뷰 목록, 찜 수, 사활 수를 병렬(Promise.all)로 프리페치하여 첫 화면 깜빡임(0 -> N) 방지
    await Promise.all([
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
    ])
  } catch {
    notFound()
  }

  const sauna = queryClient.getQueryData(['sauna', id])
  if (!sauna) notFound()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SaunaDetailClient id={id} />
    </HydrationBoundary>
  )
}
