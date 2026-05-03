import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/instagram-oembed?url=https://www.instagram.com/reel/...
 *
 * 인스타그램 oEmbed API는 앱 토큰 없이는 thumbnail_url을 반환하지 않음 (2021년 이후).
 * 대신 인스타그램 페이지 HTML에서 og:image 메타태그를 파싱해 썸네일을 가져옴.
 *
 * fallback 순서:
 * 1. og:image 스크래핑 (메인)
 * 2. graph.facebook.com oEmbed (토큰 없이 author_name만 가능한 경우도 있음)
 */

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
  'Cache-Control': 'no-cache',
}

function extractMeta(html: string, property: string): string | null {
  // og:image, og:title 등 메타태그 추출
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].replace(/&amp;/g, '&')
  }
  return null
}

function extractAuthorFromUrl(html: string): string | null {
  // "@username" 형태 추출 시도
  const m = html.match(/"owner":\{"username":"([^"]+)"/)
    ?? html.match(/instagram\.com\/([a-zA-Z0-9_.]+)\//)
  return m?.[1] ?? null
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ thumbnail_url: null, title: null, author_name: null }, { status: 400 })
  }

  try {
    // ── 1. 인스타그램 페이지 HTML에서 og:image 파싱 ─────────────────
    const pageRes = await fetch(url, {
      headers: HEADERS,
      next: { revalidate: 60 * 60 * 24 }, // 24시간 CDN 캐시
    })

    if (pageRes.ok) {
      // 전체 HTML 파싱은 무거우니 앞 20KB만 읽음 (메타태그는 head에 있음)
      const reader = pageRes.body?.getReader()
      let html = ''
      if (reader) {
        const decoder = new TextDecoder()
        let bytesRead = 0
        while (bytesRead < 20_000) {
          const { done, value } = await reader.read()
          if (done) break
          html += decoder.decode(value, { stream: true })
          bytesRead += value?.length ?? 0
        }
        reader.cancel()
      }

      const thumbnailUrl = extractMeta(html, 'og:image')
      const title       = extractMeta(html, 'og:title')
      const author      = extractAuthorFromUrl(html)

      if (thumbnailUrl) {
        return NextResponse.json({
          thumbnail_url: thumbnailUrl,
          title,
          author_name: author,
        })
      }
    }

    // ── 2. fallback: 공식 oEmbed (토큰 없이 author_name 정도는 되는 경우) ──
    const oembedRes = await fetch(
      `https://www.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`,
      { headers: { 'User-Agent': HEADERS['User-Agent'], Accept: 'application/json' } }
    )
    if (oembedRes.ok) {
      const data = await oembedRes.json()
      return NextResponse.json({
        thumbnail_url: data.thumbnail_url ?? null,
        title: data.title ?? null,
        author_name: data.author_name ?? null,
      })
    }

    return NextResponse.json({ thumbnail_url: null, title: null, author_name: null })
  } catch (e) {
    console.error('[instagram-oembed] error:', e)
    return NextResponse.json({ thumbnail_url: null, title: null, author_name: null })
  }
}
