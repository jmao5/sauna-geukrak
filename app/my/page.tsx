import type { Metadata } from 'next'
import MyPageClient from './MyPageClient'

export const metadata: Metadata = { title: '마이' }

export default function MyPage() {
  return <MyPageClient />
}
