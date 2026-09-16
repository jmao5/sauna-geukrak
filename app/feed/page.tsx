import type { Metadata } from 'next'
import FeedClient from './FeedClient'

export const metadata: Metadata = { title: '사활 피드' }

export default function FeedPage() {
  return <FeedClient />
}
