import { useEffect, useState } from 'react'

/**
 * 카카오 지도 SDK 로드 완료 여부.
 *
 * layout.tsx에서 <script async>로 삽입하므로
 * 폴링 대신 kakao.maps.load() 콜백만 사용.
 * 이미 초기화된 경우(다른 페이지에서 한 번 진입 후 복귀) 즉시 true.
 */
export function useKakaoReady(): { isReady: boolean; isError: boolean } {
  const [isReady, setIsReady] = useState(() =>
    // 초기값: 이미 services까지 초기화돼 있으면 바로 true
    typeof window !== 'undefined' && !!window.kakao?.maps?.services
  )
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (isReady) return

    let cancelled = false

    const init = () => {
      if (cancelled) return
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          if (!cancelled) setIsReady(true)
        })
        return
      }
      // SDK 스크립트가 아직 파싱 중 — 이벤트 기반으로 재시도
      const onLoad = () => { clearTimeout(errorTimer); init() }
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="dapi.kakao.com"]'
      )
      if (script) {
        script.addEventListener('load', onLoad, { once: true })
      } else {
        // 스크립트 태그 자체가 없는 경우 (SSR 등)
        if (!cancelled) setIsError(true)
      }
    }

    // 10초 후에도 초기화 안 되면 에러
    const errorTimer = setTimeout(() => {
      if (!isReady && !cancelled) setIsError(true)
    }, 10_000)

    init()

    return () => {
      cancelled = true
      clearTimeout(errorTimer)
    }
  }, [isReady])

  return { isReady, isError }
}
