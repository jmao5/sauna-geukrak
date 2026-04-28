'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // [BUG FIX] retry: 1(무조건) → 조건부 retry
            // Supabase 쿼리 에러 시 1회 재시도.
            retry: (failureCount, error: any) => {
              if (error?.code) {
                // PostgrestError의 경우 code 필드가 있음
                // 인증 관련 에러나 찾을 수 없는 경우 재시도 안함
                if (error.code === 'PGRST301' || error.code === 'PGRST116') return false
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
