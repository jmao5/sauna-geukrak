'use client'

import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { createClient } from '@/lib/supabase/client'
import { BiBookmark, BiHistory, BiCog, BiLogIn, BiLogOut, BiPlus, BiUser } from 'react-icons/bi'
import Link from 'next/link'
import toast from 'react-hot-toast'

const LOGGED_IN_MENU = [
  { icon: BiBookmark, label: '찜한 사우나', desc: '가고 싶은 사우나 모아보기', href: '/my/favorites' },
  { icon: BiHistory, label: '나의 사활 기록', desc: '내가 남긴 방문 기록들', href: '/my/records' },
  { icon: BiCog, label: '설정', desc: '알림, 개인정보, 앱 설정', href: '/my/settings' },
]

export default function MyPage() {
  const router = useRouter()
  const { user, isLoading, clearSession } = useUserStore()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearSession()
    toast.success('로그아웃 되었습니다')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 bg-bg-sub px-4 pb-4 pt-4">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-bg-main" />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-bg-main" />
          <div className="h-36 animate-pulse rounded-2xl bg-bg-main" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 bg-bg-sub px-4 pb-4 pt-4 shadow-[0_1px_0_var(--border-main)]">
        <h1 className="font-juache text-xl font-bold text-text-main">마이 페이지</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 space-y-4">

        {user ? (
          /* ── 로그인 상태 ── */
          <>
            {/* 프로필 카드 */}
            <div className="rounded-2xl border border-border-main bg-bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user.user_metadata.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="프로필"
                      className="h-14 w-14 rounded-full object-cover border border-border-main"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sauna-bg to-cold-bg border border-border-main">
                      <BiUser size={28} className="text-text-sub" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-black text-text-main">
                    {user.user_metadata.full_name ?? user.email?.split('@')[0]}
                  </p>
                  <p className="truncate text-xs text-text-sub">{user.email}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="flex items-center gap-0.5 rounded-full bg-sauna-bg px-2 py-0.5 text-[10px] font-black text-sauna-text">
                      🔥 Google 계정
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 사우나 등록 버튼 */}
            <Link
              href="/saunas/new"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-point py-3.5 text-sm font-black text-white transition active:scale-[0.97]"
            >
              <BiPlus size={20} />
              새 사우나 등록하기
            </Link>

            {/* 메뉴 */}
            <div className="rounded-2xl border border-border-main bg-bg-card overflow-hidden divide-y divide-border-main">
              {LOGGED_IN_MENU.map(({ icon: Icon, label, desc, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 px-4 py-4 transition active:bg-bg-main"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-main">
                    <Icon size={20} className="text-text-sub" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">{label}</p>
                    <p className="text-xs text-text-sub">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border-main bg-bg-card px-4 py-3.5 text-sm font-bold text-text-sub transition active:bg-bg-main"
            >
              <BiLogOut size={18} />
              로그아웃
            </button>
          </>
        ) : (
          /* ── 비로그인 상태 ── */
          <>
            <div className="rounded-2xl border border-border-main bg-bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sauna-bg to-cold-bg border border-border-main">
                  <span className="text-2xl">🧖</span>
                </div>
                <div>
                  <p className="text-sm font-black text-text-main">로그인이 필요해요</p>
                  <p className="text-xs text-text-sub">찜 목록과 사활 기록을 저장해보세요</p>
                </div>
              </div>
              <Link
                href="/login?next=/my"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-point py-3 text-sm font-black text-white transition active:scale-[0.98]"
              >
                <BiLogIn size={18} />
                Google로 시작하기
              </Link>
            </div>

            <div className="rounded-2xl border border-border-main bg-bg-card overflow-hidden divide-y divide-border-main">
              {[
                { icon: BiBookmark, label: '찜한 사우나', desc: '로그인 후 이용 가능' },
                { icon: BiHistory, label: '나의 사활 기록', desc: '로그인 후 이용 가능' },
                { icon: BiCog, label: '설정', desc: '로그인 후 이용 가능' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4 px-4 py-4 opacity-40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-main">
                    <Icon size={20} className="text-text-sub" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">{label}</p>
                    <p className="text-xs text-text-sub">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-center text-[11px] text-text-muted pb-4">사우나 극락 v0.1.0</p>
      </div>
    </div>
  )
}
