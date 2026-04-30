'use client'

import { BiChevronLeft, BiEdit, BiBookmark, BiSolidBookmark, BiShare, BiMap } from 'react-icons/bi'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface DetailHeroProps {
  id: string
  saunaName: string
  saunaAddress: string
  thumbnail: string | null
  isFav: boolean
  isFavPending: boolean
  onToggleFav: () => void
  onShare: () => void
  isUser: boolean
}

export function DetailHero({
  id,
  saunaName,
  saunaAddress,
  thumbnail,
  isFav,
  isFavPending,
  onToggleFav,
  onShare,
  isUser,
}: DetailHeroProps) {
  const router = useRouter()

  return (
    <div className="relative h-56 w-full flex-shrink-0">
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={saunaName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 680px"
          priority
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sauna-bg via-bg-main to-cold-bg">
          <span className="text-6xl opacity-10">🧖</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {/* 상단 버튼 */}
      <div className="absolute left-4 top-4 z-10">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90"
        >
          <BiChevronLeft size={22} />
        </button>
      </div>
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        {isUser && (
          <button
            onClick={() => router.push(`/saunas/${id}/edit`)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90"
          >
            <BiEdit size={16} />
          </button>
        )}
        <button
          onClick={onToggleFav}
          disabled={isFavPending}
          className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90 disabled:opacity-50 ${
            isFav ? 'bg-point text-white' : 'bg-black/40 text-white'
          }`}
        >
          {isFavPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : isFav ? (
            <BiSolidBookmark size={16} />
          ) : (
            <BiBookmark size={16} />
          )}
        </button>
        <button
          onClick={onShare}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-90"
        >
          <BiShare size={16} />
        </button>
      </div>

      {/* 타이틀 */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h1 className="text-[22px] font-black text-white leading-tight">{saunaName}</h1>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
          <BiMap size={11} />
          {saunaAddress}
        </p>
      </div>
    </div>
  )
}
