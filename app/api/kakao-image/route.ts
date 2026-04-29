import { NextRequest, NextResponse } from 'next/server'
import { getKakaoPlaceImage } from '@/lib/kakao'

/**
 * GET /api/kakao-image?name=사우나이름&address=주소
 *
 * 카카오 API는 CORS로 브라우저에서 직접 호출 불가 → 서버 프록시.
 * 실제 로직은 lib/kakao.ts의 getKakaoPlaceImage()에서 관리합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const name = searchParams.get('name')
  const address = searchParams.get('address') ?? undefined

  if (!name) {
    return NextResponse.json({ image: null }, { status: 400 })
  }

  const image = await getKakaoPlaceImage(name, address)
  return NextResponse.json({ image })
}
