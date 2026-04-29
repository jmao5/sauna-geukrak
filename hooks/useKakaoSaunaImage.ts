import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
/**
 * DB에 이미지가 없을 때 카카오맵에서 대표 이미지를 가져오는 훅.
 * TanStack Query로 캐싱/중복요청 방지/로딩상태 관리.
 *
 * @example
 * const { data: kakaoImage } = useKakaoSaunaImage(sauna.name, sauna.address, sauna.images?.[0])
 * const thumbnail = sauna.images?.[0] ?? kakaoImage
 */
export function useKakaoSaunaImage(
  name: string,
  address: string | undefined,
  existingImage: string | undefined
) {
  return useQuery({
    queryKey: ['kakao-image', name, address],
    queryFn: () => api.kakao.getPlaceImage(name, address),
    enabled: !existingImage, // DB 이미지가 있으면 호출 자체를 스킵
    staleTime: 1000 * 60 * 60 * 24, // 24시간 캐시 유지
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  })
}
