import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getKakaoPlaceImage } from '@/lib/kakao'
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
  const queryClient = new QueryClient()

  try {
    await queryClient.prefetchQuery({
      queryKey: ['sauna', id],
      queryFn: () => getSaunaById(id),
    })
  } catch {
    notFound()
  }

  const sauna = queryClient.getQueryData<{ name: string; address: string; images?: string[] }>(['sauna', id])
  if (!sauna) notFound()

  // DB 이미지가 없으면 SSR 시점에 카카오 이미지도 함께 prefetch
  // 클라이언트에서 별도 요청 필요 없이 하이드레이션으로 즉시 사용 가능
  if (!sauna.images?.[0]) {
    await queryClient.prefetchQuery({
      queryKey: ['kakao-image', sauna.name, sauna.address],
      queryFn: () => getKakaoPlaceImage(sauna.name, sauna.address),
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SaunaDetailClient id={id} />
    </HydrationBoundary>
  )
}
