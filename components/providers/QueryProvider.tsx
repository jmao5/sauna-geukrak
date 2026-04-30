'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'

// 모듈 레벨 싱글톤 — QueryProvider가 재마운트되어도 캐시가 유지됨
// useState(() => new QueryClient()) 방식은 Suspense boundary 등으로
// 컴포넌트가 재마운트될 때 새 인스턴스가 생성되어 캐시가 초기화되는 문제가 있음
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: (failureCount, error: any) => {
        if (error?.code) {
          if (error.code === 'PGRST301' || error.code === 'PGRST116') return false
        }
        return failureCount < 1
      },
    },
  },
})

export default function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
