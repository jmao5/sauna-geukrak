import type { Metadata } from 'next'
import FavoritesClient from './FavoritesClient'
export const metadata: Metadata = { title: '찜한 사우나' }
export default function FavoritesPage() { return <FavoritesClient /> }
