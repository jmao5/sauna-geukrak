import { Metadata } from 'next'
import SaunaNewClient from './SaunaNewClient'

export const metadata: Metadata = { title: '사우나 등록' }

export default function SaunaNewPage() {
  return <SaunaNewClient />
}
