'use client'

import { LazyMotion } from 'framer-motion'

// domAnimation: 기본 애니메이션 기능만 포함 (enter/exit, layout 제외 고급 기능 제거)
// domMax 대비 번들 크기 ~40% 감소. Navbar, FloatingActions 용도에 충분함.
// layout animation(layoutId)이 필요한 경우에만 domMax로 교체할 것.
const loadFeatures = () =>
  import('framer-motion').then((mod) => mod.domAnimation)

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  )
}
