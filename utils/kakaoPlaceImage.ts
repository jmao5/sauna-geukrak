/**
 * 이미지가 없는 사우나의 카카오맵 대표 이미지를 가져옵니다.
 * 직접 카카오 API 호출 시 CORS 오류가 발생하므로,
 * Next.js Route Handler(/api/kakao-image)를 통해 서버 사이드에서 프록시합니다.
 */
export async function fetchKakaoSaunaImage(
  name: string,
  address?: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ name })
    if (address) params.set('address', address)

    const res = await fetch(`/api/kakao-image?${params.toString()}`)
    if (!res.ok) return null

    const data = await res.json()
    return data.image ?? null
  } catch {
    return null
  }
}
