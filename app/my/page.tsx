import type { Metadata } from 'next'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import getQueryClient from '@/lib/getQueryClient'
import { createClient } from '@/lib/supabase/server'
import { getNickname } from '@/app/actions/user.actions'
import MyPageClient from './MyPageClient'

export const metadata: Metadata = { title: '마이 페이지' }

export default async function MyPage() {
  const queryClient = getQueryClient()
  let initialNickname: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      initialNickname = await getNickname(user.id)
      if (initialNickname) {
        queryClient.setQueryData(['user-nickname', user.id], initialNickname)
      }
    }
  } catch {}

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyPageClient initialNickname={initialNickname} />
    </HydrationBoundary>
  )
}
