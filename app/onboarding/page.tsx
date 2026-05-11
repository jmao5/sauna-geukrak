'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import toast from 'react-hot-toast'

const EMOJI_OPTIONS = ['🔥', '🧖', '💧', '❄️', '♨️', '🏔️', '🌊', '😤']

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const { user } = useUserStore()

  const defaultNickname =
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    ''

  const [nickname, setNickname] = useState(defaultNickname)
  const [selectedEmoji, setSelectedEmoji] = useState('🔥')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) { toast.error('닉네임을 입력해주세요'); return }
    if (trimmed.length < 2) { toast.error('닉네임은 2자 이상이어야 해요'); return }
    if (trimmed.length > 12) { toast.error('닉네임은 12자 이하여야 해요'); return }
    if (!user) { router.replace('/login'); return }

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ nickname: `${selectedEmoji} ${trimmed}` })
      .eq('id', user.id)

    if (error) {
      toast.error('저장에 실패했어요. 다시 시도해주세요.')
      setIsLoading(false)
      return
    }

    toast.success('환영해요! 극락에 오신 걸 환영합니다 🔥')
    router.replace(next)
  }

  return (
    <div className="flex h-full flex-col bg-bg-main">
      <div className="flex flex-1 flex-col px-6 pt-16 pb-10">

        {/* 헤더 */}
        <div className="mb-10">
          <p className="text-[13px] font-bold text-point mb-2">STEP 1 / 1</p>
          <h1 className="text-[28px] font-black text-text-main leading-tight">
            어떻게 불러드릴까요?
          </h1>
          <p className="mt-2 text-[14px] text-text-sub leading-relaxed">
            사활에 표시될 닉네임을 설정해주세요
          </p>
        </div>

        {/* 이모지 선택 */}
        <div className="mb-6">
          <p className="text-[11px] font-black text-text-muted tracking-widest uppercase mb-3">
            나를 표현하는 이모지
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl transition active:scale-90 ${
                  selectedEmoji === emoji
                    ? 'border-point bg-point/10 shadow-sm'
                    : 'border-border-main bg-bg-card'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 닉네임 입력 */}
        <div className="mb-6">
          <p className="text-[11px] font-black text-text-muted tracking-widest uppercase mb-3">
            닉네임
          </p>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-border-main bg-bg-card px-4 py-3.5 focus-within:border-point transition">
            <span className="text-2xl flex-shrink-0">{selectedEmoji}</span>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              placeholder="닉네임 입력"
              maxLength={12}
              className="flex-1 bg-transparent text-[16px] font-bold text-text-main placeholder:text-text-muted outline-none"
              autoFocus
            />
            <span className="text-[11px] text-text-muted flex-shrink-0">{nickname.trim().length}/12</span>
          </div>
          <p className="mt-2 text-[11px] text-text-muted">2~12자, 나중에 변경 가능해요</p>
        </div>

        {/* 미리보기 */}
        {nickname.trim().length >= 2 && (
          <div className="rounded-2xl border border-border-main bg-bg-card p-4 mb-6">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">미리보기</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sauna-bg to-cold-bg border border-border-main text-xl">
                {selectedEmoji}
              </div>
              <div>
                <p className="text-[13px] font-black text-text-main">{selectedEmoji} {nickname.trim()}</p>
                <p className="text-[11px] text-text-muted">방금 극락에 입장했어요 🔥</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* 완료 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={nickname.trim().length < 2 || isLoading}
          className="w-full rounded-2xl bg-point py-4 text-[15px] font-black text-white transition active:scale-[0.97] disabled:opacity-40"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              저장 중...
            </div>
          ) : '극락 입장하기 🔥'}
        </button>

        <button
          onClick={() => router.replace(next)}
          className="mt-3 w-full py-3 text-[13px] font-bold text-text-muted"
        >
          나중에 설정하기
        </button>
      </div>
    </div>
  )
}
