/**
 * 카카오 API 서버 사이드 호출 모음 (서버 전용 — 'use client' 금지)
 *
 * CORS 문제로 브라우저에서 직접 호출 불가한 카카오 API를 여기서 관리합니다.
 * 클라이언트는 /api/kakao-image Route Handler를 통해 간접 호출합니다.
 *
 * ┌─ 클라이언트 ──────────────────────────────────────────────┐
 * │  useKakaoSaunaImage (hooks)                              │
 * │    → fetchKakaoSaunaImage (utils/kakaoPlaceImage.ts)     │
 * │      → GET /api/kakao-image (route.ts)                   │
 * │          → kakao.getPlaceImage() (lib/kakao.ts) ◀ 여기   │
 * └──────────────────────────────────────────────────────────┘
 */

const REST_API_KEY = process.env.KAKAO_REST_API_KEY!

// ── 타입 ─────────────────────────────────────────────────────

interface KakaoKeywordDocument {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  place_url: string
  x: string
  y: string
}

interface KakaoKeywordResponse {
  documents: KakaoKeywordDocument[]
  meta: { total_count: number }
}

// ── 내부 헬퍼 ────────────────────────────────────────────────

/**
 * 카카오 로컬 키워드 검색으로 place_id를 반환합니다.
 */
async function searchPlaceId(name: string, address?: string): Promise<string | null> {
  const query = address
    ? `${name} ${address.split(' ').slice(0, 2).join(' ')}`
    : name

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`,
    {
      headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
      next: { revalidate: 86400 },
    }
  )

  if (!res.ok) return null

  const data: KakaoKeywordResponse = await res.json()
  return data.documents?.[0]?.id ?? null
}

/**
 * place_id로 카카오맵 장소 페이지의 og:image URL을 추출합니다.
 * HTML 파싱에 의존하기 때문에 카카오 마크업 변경 시 조용히 실패할 수 있습니다.
 * 실패 시는 null을 반환하며 캡으로 처리하세요.
 */
async function fetchPlaceOgImage(placeId: string): Promise<string | null> {
  const res = await fetch(
    `https://place.map.kakao.com/m/${placeId}`,
    {
      headers: {
        Referer: 'https://map.kakao.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      next: { revalidate: 86400 },
    }
  )

  if (!res.ok) return null

  const html = await res.text()

  const match =
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ??
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)

  if (!match?.[1]) return null

  let url = match[1]
  if (url.startsWith('//')) {
    url = `https:${url}`
  } else if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://')
  }

  return url
}

// ── 공개 API ─────────────────────────────────────────────────

/**
 * 사우나 이름과 주소로 카카오맵 대표 이미지 URL을 반환합니다.
 * place_id 검색 → og:image 추출의 2단계로 동작합니다.
 *
 * @returns 이미지 URL 또는 null (장소 없음 / 이미지 없음)
 */
export async function getKakaoPlaceImage(
  name: string,
  address?: string
): Promise<string | null> {
  try {
    const placeId = await searchPlaceId(name, address)
    if (!placeId) return null
    return await fetchPlaceOgImage(placeId)
  } catch {
    // 네트워크 오류나 마크업 변경 등으로 실패시 placeholder 처리
    return null
  }
}
