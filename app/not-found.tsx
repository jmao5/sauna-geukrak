import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
      <h2 className="text-2xl font-bold text-gray-800">페이지를 찾을 수 없어요 😢</h2>
      <p className="text-gray-500">주소가 잘못되었거나 삭제된 페이지입니다.</p>
      <Link
        href="/"
        className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-white hover:bg-yellow-500"
      >
        메인으로 돌아가기
      </Link>
    </div>
  )
}
