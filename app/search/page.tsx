import type { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = { title: '검색' }

export default function SearchPage() {
  return <SearchClient />
}
