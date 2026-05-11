import { ImageResponse } from 'next/og'
import { getSaunaById } from '@/app/actions/sauna.actions'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let name = '사우나 극락'
  let address = '한국의 사우나·찜질방을 발견하고 기록하는 서비스'
  let imageUrl: string | null = null
  let maxSaunaTemp: number | null = null
  let minColdTemp: number | null = null

  try {
    const sauna = await getSaunaById(id)
    name = sauna.name
    address = sauna.address
    imageUrl = sauna.images?.[0] ?? null
    maxSaunaTemp = sauna.sauna_rooms?.length
      ? Math.max(...sauna.sauna_rooms.map(r => r.temp))
      : null
    minColdTemp = sauna.cold_baths?.length
      ? Math.min(...sauna.cold_baths.map(b => b.temp))
      : null
  } catch {
    // 에러 시 기본값 사용
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f0e0c',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 이미지 */}
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.35,
            }}
          />
        )}

        {/* 그라디언트 오버레이 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        {/* 콘텐츠 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '60px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* 브랜드 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '22px' }}>🔥</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px', fontWeight: 700, letterSpacing: '0.05em' }}>
              사우나 극락
            </span>
          </div>

          {/* 사우나 이름 */}
          <div style={{ color: '#ffffff', fontSize: '72px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {name}
          </div>

          {/* 주소 */}
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', fontWeight: 500 }}>
            {address}
          </div>

          {/* 온도 뱃지 */}
          {(maxSaunaTemp !== null || minColdTemp !== null) && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              {maxSaunaTemp !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'rgba(232, 64, 64, 0.25)',
                  border: '1px solid rgba(232, 64, 64, 0.5)',
                  borderRadius: '999px',
                  padding: '10px 24px',
                }}>
                  <span style={{ fontSize: '24px' }}>♨</span>
                  <span style={{ color: '#ff8080', fontSize: '32px', fontWeight: 900 }}>
                    {maxSaunaTemp}°C
                  </span>
                </div>
              )}
              {minColdTemp !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'rgba(16, 85, 212, 0.25)',
                  border: '1px solid rgba(16, 85, 212, 0.5)',
                  borderRadius: '999px',
                  padding: '10px 24px',
                }}>
                  <span style={{ fontSize: '24px' }}>❄️</span>
                  <span style={{ color: '#80aaff', fontSize: '32px', fontWeight: 900 }}>
                    {minColdTemp}°C
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
