'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BiChevronLeft, BiCheck, BiSun, BiMoon, BiPencil } from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { getNickname, updateNickname } from '@/app/actions/user.actions'
import toast from 'react-hot-toast'

/* ──────────────────────────────────────────────────
   닉네임 변경 섹션
────────────────────────────────────────────────── */
function NicknameSection() {
  const { user } = useUserStore()
  const [current, setCurrent] = useState<string>('')
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!user) return
    getNickname().then((n) => {
      const name = n ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '사우나매니아'
      setCurrent(name)
      setValue(name)
    })
  }, [user])

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateNickname(value)
      if (result.ok) {
        setCurrent(value)
        setEditing(false)
        toast.success('닉네임이 변경되었어요 ✅')
      } else {
        toast.error(result.error ?? '변경에 실패했습니다')
      }
    })
  }

  const isChanged = value.trim() !== current

  return (
    <div className="rounded-2xl border border-border-main bg-bg-card overflow-hidden">
      {/* 헤더 행 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
        <div>
          <p className="text-[11px] font-bold text-text-muted">닉네임</p>
          <p className="text-[15px] font-black text-text-main mt-0.5">{current}</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-full border border-border-main bg-bg-sub px-3 py-1.5 text-[11px] font-bold text-text-sub transition active:scale-95 hover:border-point/40 hover:text-point"
          >
            <BiPencil size={13} />
            변경
          </button>
        )}
      </div>

      {/* 편집 영역 */}
      {editing && (
        <div className="px-4 py-3.5 space-y-3 bg-bg-sub">
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && isChanged && handleSave()}
              placeholder="새 닉네임 입력"
              maxLength={16}
              autoFocus
              className="h-11 w-full rounded-xl border border-border-main bg-bg-main px-3.5 text-[14px] font-bold text-text-main outline-none focus:border-point focus:ring-2 focus:ring-point/20 transition"
            />
            <div className="flex items-center justify-between mt-1.5 px-1">
              <p className="text-[10px] text-text-muted">한글·영문·숫자·_ 사용 가능, 2–16자</p>
              <p className="text-[10px] text-text-muted">{value.length}/16</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setValue(current) }}
              className="flex-1 rounded-xl border border-border-main bg-bg-main py-2.5 text-[13px] font-bold text-text-sub transition active:scale-[0.98]"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!isChanged || isPending || value.trim().length < 2}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-point py-2.5 text-[13px] font-black text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {isPending
                ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><BiCheck size={16} />저장</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────
   테마 설정 섹션
────────────────────────────────────────────────── */
function ThemeSection() {
  const { theme, setTheme } = useUiStore()

  const options = [
    { value: 'light' as const, label: '라이트', icon: BiSun, desc: '밝고 깨끗한 화면' },
    { value: 'dark' as const, label: '다크', icon: BiMoon, desc: '눈이 편안한 어두운 화면' },
  ]

  return (
    <div className="rounded-2xl border border-border-main bg-bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <p className="text-[12px] font-black text-text-muted">테마</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border-subtle">
        {options.map(({ value, label, icon: Icon, desc }) => {
          const active = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 py-5 transition active:scale-[0.97] ${
                active ? 'bg-point/6' : 'bg-bg-card hover:bg-bg-sub'
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                active ? 'border-point bg-point/10 text-point' : 'border-border-main bg-bg-sub text-text-muted'
              }`}>
                <Icon size={22} />
              </div>
              <div className="text-center">
                <p className={`text-[13px] font-black ${active ? 'text-point' : 'text-text-main'}`}>{label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{desc}</p>
              </div>
              {active && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-point">
                  <BiCheck size={11} className="text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────
   계정 정보 섹션 (읽기 전용)
────────────────────────────────────────────────── */
function AccountSection() {
  const { user } = useUserStore()
  if (!user) return null

  const email = user.email ?? '-'
  const provider = user.app_metadata?.provider ?? 'email'
  const providerLabel: Record<string, string> = {
    google: '구글',
    kakao: '카카오',
    email: '이메일',
  }

  return (
    <div className="rounded-2xl border border-border-main bg-bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <p className="text-[12px] font-black text-text-muted">계정 정보</p>
      </div>
      {[
        { label: '이메일', value: email },
        { label: '로그인 방식', value: providerLabel[provider] ?? provider },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle last:border-b-0">
          <span className="text-[12px] font-bold text-text-muted">{label}</span>
          <span className="text-[12px] font-semibold text-text-sub">{value}</span>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────
   메인
────────────────────────────────────────────────── */
export default function SettingsClient() {
  const router = useRouter()
  const { user } = useUserStore()

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="text-4xl">🔒</span>
        <p className="font-black text-text-main">로그인이 필요합니다</p>
        <button onClick={() => router.replace('/login')}
          className="rounded-full bg-point px-6 py-2.5 text-sm font-black text-white">
          로그인하기
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-center gap-3 bg-bg-sub px-4 py-3.5 shadow-[0_1px_0_var(--border-main)]">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-bg-main active:scale-90"
        >
          <BiChevronLeft size={26} className="text-text-main" />
        </button>
        <h1 className="text-[16px] font-black text-text-main">설정</h1>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-5 space-y-5 pb-8">

        {/* 섹션: 프로필 */}
        <div className="space-y-2">
          <p className="text-[11px] font-black text-text-muted px-1 tracking-widest uppercase">Profile</p>
          <NicknameSection />
        </div>

        {/* 섹션: 화면 */}
        <div className="space-y-2">
          <p className="text-[11px] font-black text-text-muted px-1 tracking-widest uppercase">Display</p>
          <ThemeSection />
        </div>

        {/* 섹션: 계정 */}
        <div className="space-y-2">
          <p className="text-[11px] font-black text-text-muted px-1 tracking-widest uppercase">Account</p>
          <AccountSection />
        </div>
      </div>
    </div>
  )
}
