import { useEffect, useRef } from 'react'

interface UseIntersectionObserverProps {
  rootMargin?: string
  threshold?: number | number[]
  onObserve: () => void
  enabled?: boolean
  root?: HTMLElement | null
}

export default function useIntersectionObserver({
  rootMargin = '0px',
  threshold = 0,
  onObserve,
  enabled = true,
  root = null,
}: UseIntersectionObserverProps) {
  const observerRef = useRef<HTMLDivElement>(null)
  const onObserveRef = useRef(onObserve)

  useEffect(() => {
    onObserveRef.current = onObserve
  }, [onObserve])

  useEffect(() => {
    const element = observerRef.current
    if (!element || !enabled) return

    // root가 null이면 브라우저 Viewport 기준, 요소가 있으면 해당 요소 기준
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          onObserveRef.current()
        }
      },
      {
        root,
        rootMargin,
        threshold,
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [rootMargin, threshold, enabled, root])

  return observerRef
}
