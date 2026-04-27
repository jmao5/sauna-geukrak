'use client'

import { createContext, useContext, RefObject } from 'react'

/**
 * 앱 전역 스크롤 컨테이너(div)에 대한 ref를 공유하는 Context.
 *
 * - Provider: ClientLayout (스크롤 div를 소유하는 곳)
 * - Consumer: useScrollRef() 훅을 통해 접근
 *
 * Zustand에 DOM ref를 저장하는 안티패턴을 대체합니다.
 * (DOM ref는 직렬화 불가 → SSR 오류 및 메모리 누수 위험)
 */
export const ScrollRefContext = createContext<RefObject<HTMLDivElement | null>>({
  current: null,
})

export function useScrollRef() {
  return useContext(ScrollRefContext)
}
