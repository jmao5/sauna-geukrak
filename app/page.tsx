import SaunaMap from '@/components/Map'

export default function HomePage() {
  return (
    <main className="flex h-full w-full flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-text-main">내 주변 사우나 극락</h1>
        <p className="text-text-sub text-sm">지도에서 사우나를 탐색해보세요</p>
      </div>
      <SaunaMap />
    </main>
  )
}
