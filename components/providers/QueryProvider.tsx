'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode } from 'react'

// 1. QueryClient를 생성하는 팩토리 함수
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 60 * 1000, // 추가: 최소 1분간은 캐시를 유지하도록 설정
        retry: (failureCount, error: unknown) => {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            (error.code === 'PGRST301' || error.code === 'PGRST116')
          ) {
            return false
          }
          return failureCount < 1
        },
      },
    },
  })
}

// 2. 브라우저 환경에서만 유지될 싱글톤 변수
let browserQueryClient: QueryClient | undefined = undefined

// 3. 환경에 맞게 QueryClient를 반환하는 함수
function getQueryClient() {
  if (typeof window === 'undefined') {
    // 서버 환경: 매 요청마다 새로운 인스턴스 생성 (데이터 누수 방지)
    return makeQueryClient()
  } else {
    // 브라우저 환경: 싱글톤 패턴 유지 (Suspense 재마운트 시 캐시 초기화 방지)
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  // useState대신 getQueryClient 호출의 결과를 직접 사용합니다.
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}