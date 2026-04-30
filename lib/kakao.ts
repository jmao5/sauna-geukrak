/**
 * 카카오 API 서버 사이드 호출 모음 (서버 전용 — 'use client' 금지)
 *
 * 이미지 처리 전략:
 *   - 등록 시점에 카카오 이미지를 1회 fetch → Supabase Storage 저장
 *   - 이후 카드/상세 페이지는 Supabase CDN URL만 사용 (실시간 스크래핑 없음)
 *
 * ┌─ 등록 흐름 ────────────────────────────────────────────────┐
 * │  createSauna() → getKakaoPlaceImage() → downloadImageBuffer()│
 * │  → uploadSaunaImage() → images[0]에 CDN URL 저장         │
 * └───────────────────────────────────────────────────────────┘
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
      // 등록 시점에만 호출하므로 캐시 불필요
      cache: 'no-store',
    }
  )

  if (!res.ok) return null

  const data: KakaoKeywordResponse = await res.json()
  return data.documents?.[0]?.id ?? null
}

/**
 * place_id로 카카오맵 장소 페이지의 og:image URL을 추출합니다.
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
      cache: 'no-store',
    }
  )

  if (!res.ok) return null

  const html = await res.text()

  const match =
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ??
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)

  if (!match?.[1]) return null

  let url = match[1]
  if (url.startsWith('//')) url = `https:${url}`
  else if (url.startsWith('http://')) url = url.replace('http://', 'https://')

  return url
}

// ── 공개 API ─────────────────────────────────────────────────

/**
 * 사우나 이름과 주소로 카카오맵 대표 이미지 URL을 반환합니다.
 * 등록 시점에 1회 호출하기 위한 함수입니다.
 * 실시간 카드 렌더링에는 사용하지 마세요.
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
    return null
  }
}

/**
 * 외부 이미지 URL을 Buffer로 다운로드합니다.
 * Supabase Storage 업로드 전 단계로 사용합니다.
 *
 * @returns { buffer, contentType } 또는 null
 */
export async function downloadImageBuffer(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Referer: 'https://map.kakao.com',
      },
      cache: 'no-store',
    })

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'

    // image/* 가 아닌 응답(HTML 등) 차단
    if (!contentType.startsWith('image/')) return null

    const arrayBuffer = await res.arrayBuffer()
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    }
  } catch {
    return null
  }
}
