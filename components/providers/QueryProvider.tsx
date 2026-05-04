'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, lazy, Suspense } from 'react'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 60 * 1000,
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

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

// dev 전용 — lazy import로 프로덕션 번들에서 완전히 제외됨
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((mod) => ({
          default: mod.ReactQueryDevtools,
        }))
      )
    : null

export default function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
