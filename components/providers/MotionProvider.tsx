'use client'

import { LazyMotion, domMax } from 'framer-motion'

/**
 * 개선: 비동기 features → 정적 import
 *
 * 기존 문제:
 *   const loadFeatures = () => import('framer-motion').then(mod => mod.domAnimation)
 *   LazyMotion이 features를 동적으로 로드하므로 로드 완료 전까지
 *   하위 m.* 컴포넌트(Navbar 인디케이터, 바텀시트 등)가 렌더를 보류.
 *
 * 개선 결과:
 *   domMax를 정적 import → layoutId(layout animation)를 위한 기능 지원.
 *   domAnimation에서 domMax로 변경하여 layoutId 애니메이션 호환성 확보.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  )
}
