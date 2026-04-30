import { useQuery } from '@tanstack/react-query'

async function fetchKakaoImage(name: string, address?: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ name })
    if (address) params.set('address', address)
    const res = await fetch(`/api/kakao-image?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.image ?? null
  } catch {
    return null
  }
}

/**
 * DB에 이미지가 없을 때 카카오맵에서 대표 이미지를 가져오는 훅.
 *
 * - `existingImage`가 있으면 fetch 자체를 스킵 (enabled: false)
 * - `isVisible`이 false면 뷰포트 밖이므로 fetch 지연 (기본값 true)
 * - TanStack Query 캐싱으로 같은 사우나는 24h 동안 재요청 없음
 *
 * @example
 * const [isVisible, setIsVisible] = useState(false)
 * // ... IntersectionObserver로 isVisible = true 설정
 * const { data: kakaoImage } = useKakaoSaunaImage(name, address, existingImage, isVisible)
 */
export function useKakaoSaunaImage(
  name: string,
  address: string | undefined,
  existingImage: string | undefined,
  isVisible = true
) {
  return useQuery({
    queryKey: ['kakao-image', name, address],
    queryFn: () => fetchKakaoImage(name, address),
    // DB 이미지가 있거나 아직 뷰포트에 진입하지 않으면 fetch 안 함
    enabled: !existingImage && isVisible,
    staleTime: 1000 * 60 * 60 * 24, // 24시간 캐시
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  })
}
