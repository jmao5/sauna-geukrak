import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '@/lib/getQueryClient'
import { SaunaDetailClient } from './SaunaDetailClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSaunaById } from '@/app/actions/sauna.actions'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const sauna = await getSaunaById(id)
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

  // Fix #2: getQueryClient() 싱글톤으로 generateMetadata와 캐시 공유
  const queryClient = getQueryClient()

  try {
    await queryClient.prefetchQuery({
      queryKey: ['sauna', id],
      queryFn: () => getSaunaById(id),
      staleTime: 1000 * 60 * 5,
    })
  } catch {
    notFound()
  }

  const sauna = queryClient.getQueryData<{ name: string; images?: string[] }>(['sauna', id])
  if (!sauna) notFound()

  // Fix #1/#3: 카카오 이미지 SSR 블로킹 제거
  // 이미지는 등록 시점에 Storage에 저장되므로 sauna.images[0]에 이미 CDN URL이 있음.
  // 없는 경우(기존 데이터)는 클라이언트의 useKakaoSaunaImage가 lazy하게 처리.

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SaunaDetailClient id={id} />
    </HydrationBoundary>
  )
}
