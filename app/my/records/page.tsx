import type { Metadata } from 'next'
import RecordsClient from './RecordsClient'
export const metadata: Metadata = { title: '사활 기록' }
export default function RecordsPage() { return <RecordsClient /> }
