'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'
import { ApiError } from '@/lib/api-instance'

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // [BUG FIX] retry: 1(무조건) → 조건부 retry
            // 401/403은 재시도해도 동일한 에러가 반복되므로 즉시 실패 처리.
            // 그 외 서버 오류(5xx, 네트워크 등)는 1회 재시도.
            retry: (failureCount, error) => {
              if (error instanceof ApiError) {
                const status = error.response?.status
                if (status === 401 || status === 403 || status === 404) return false
              }
              return failureCount < 1
            },
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
