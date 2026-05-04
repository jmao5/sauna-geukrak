import MapClient from './MapClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: '지도' }

export default function MapPage() {
  return <MapClient />
}
