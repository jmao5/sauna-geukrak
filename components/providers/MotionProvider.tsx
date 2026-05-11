'use client'

import { LazyMotion, domAnimation } from 'framer-motion'

/**
 * 개선: 비동기 features → 정적 import
 *
 * 기존 문제:
 *   const loadFeatures = () => import('framer-motion').then(mod => mod.domAnimation)
 *   LazyMotion이 features를 동적으로 로드하므로 로드 완료 전까지
 *   하위 m.* 컴포넌트(Navbar 인디케이터, 바텀시트 등)가 렌더를 보류.
 *
 * 개선 결과:
 *   domAnimation을 정적 import → 추가 네트워크 왕복 없이 즉시 사용 가능.
 *   domAnimation 자체가 domMax 대비 ~40% 작으므로 번들 절감 효과는 유지.
 *   layoutId(layout animation)를 쓸 일이 생기면 domMax로 교체할 것.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
