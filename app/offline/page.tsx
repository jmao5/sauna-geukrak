'use client'

export default function OfflinePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg-main px-6 text-center">
      <div className="text-6xl">🧖</div>
      <div>
        <h1 className="text-lg font-black text-text-main">인터넷 연결이 없어요</h1>
        <p className="mt-1.5 text-sm text-text-sub">
          네트워크를 확인하고 다시 시도해주세요.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-full bg-point px-6 py-2.5 text-sm font-bold text-white transition active:scale-95"
      >
        다시 시도
      </button>
    </div>
  )
}
