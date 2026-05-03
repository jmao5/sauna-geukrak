import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/instagram-oembed?url=https://www.instagram.com/reel/...
 *
 * 인스타그램 oEmbed API 서버 프록시.
 * 클라이언트에서 직접 호출 시 CORS 차단 → 서버에서 대신 호출.
 *
 * 인스타그램 oEmbed는 앱 토큰 없이도 thumbnail_url을 반환합니다.
 * 단, 비공개 계정이나 삭제된 게시물은 null 반환.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ thumbnail_url: null }, { status: 400 })
  }

  try {
    const oembedUrl = `https://www.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`

    const res = await fetch(oembedUrl, {
      headers: {
        // 인스타그램이 봇 차단할 수 있으므로 브라우저처럼 위장
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        Accept: 'application/json',
      },
      next: { revalidate: 60 * 60 * 24 }, // 24시간 캐시
    })

    if (!res.ok) {
      return NextResponse.json({ thumbnail_url: null }, { status: 200 })
    }

    const data = await res.json()

    return NextResponse.json({
      thumbnail_url: data.thumbnail_url ?? null,
      title: data.title ?? null,
      author_name: data.author_name ?? null,
    })
  } catch {
    return NextResponse.json({ thumbnail_url: null }, { status: 200 })
  }
}
