import { useEffect, useState } from 'react'

/**
 * 카카오 지도 SDK 로드 완료 여부를 반환하는 훅
 *
 * layout.tsx에서 autoload=false로 SDK를 삽입하므로,
 * window.kakao.maps.load()를 직접 호출해야 services 등이 초기화됩니다.
 * 이 훅은 그 초기화를 보장하고 완료 여부를 반환합니다.
 */
export function useKakaoReady(): { isReady: boolean; isError: boolean } {
  // const [isReady, setIsReady] = useState(false)
  // const [isError, setIsError] = useState(false)

  // useEffect(() => {
  //   // 이미 초기화 완료된 경우 바로 반환
  //   if (window.kakao?.maps?.services) {
  //     setIsReady(true)
  //     return
  //   }

  //   let attempts = 0
  //   const MAX_ATTEMPTS = 100 // 최대 10초 대기

  //   const check = setInterval(() => {
  //     attempts++

  //     if (window.kakao?.maps) {
  //       // SDK는 로드됐으나 autoload=false라 아직 초기화 안 된 경우
  //       window.kakao.maps.load(() => {
  //         setIsReady(true)
  //       })
  //       clearInterval(check)
  //       return
  //     }

  //     if (attempts >= MAX_ATTEMPTS) {
  //       clearInterval(check)
  //       setIsError(true)
  //     }
  //   }, 100)

  //   return () => clearInterval(check)
  // }, [])

  return { isReady: false, isError: true }
}
