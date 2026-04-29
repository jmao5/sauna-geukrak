'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BiBookmark, BiHistory, BiCog, BiBell, BiHelpCircle, BiLogOut, BiPlus } from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-instance'
import toast from 'react-hot-toast'

const MENU_ITEMS = [
  { icon: BiBookmark, label: '찜한 사우나', desc: '가고 싶은 사우나 모아보기', href: '/my/favorites' },
  { icon: BiHistory, label: '사활 기록', desc: '내가 다녀온 사우나 방문 기록', href: '/my/records' },
  { icon: BiBell, label: '알림 설정', desc: '키워드 알림 및 공지사항', href: '/my/notifications' },
  { icon: BiCog, label: '설정', desc: '내 정보 및 앱 설정', href: '/my/settings' },
]

export default function MyPageClient() {
  const router = useRouter()
  const { user, isLoading, clearSession, accessToken } = useUserStore()

  const token = accessToken()
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '사우나 매니아'
  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const email = user?.email ?? null

  // 찜 개수
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => api.favorites.getByUserId(user!.id, token!),
    enabled: !!user && !!token,
  })

  // 사활 기록 개수
  const { data: records = [] } = useQuery({
    queryKey: ['my-records', user?.id],
    queryFn: () => api.reviews.getByUserId(user!.id),
    enabled: !!user,
  })

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearSession()
    toast.success('로그아웃되었습니다')
    router.replace('/')
  }

  if (!isLoading && !user) {
    return (
      <div className="flex h-full flex-col bg-bg-main">
        <div className="bg-bg-sub px-6 pb-10 pt-12 text-center border-b border-border-subtle">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-bg-main border border-border-main text-4xl">
            🧖
          </div>
          <h1 className="mb-1 text-lg font-black text-text-main">로그인이 필요해요</h1>
          <p className="text-[12px] text-text-sub mb-5">찜 목록과 방문 기록을 저장해보세요</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-point px-6 py-3 text-[13px] font-black text-white transition active:scale-[0.97]"
          >
            로그인 / 회원가입
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[12px] text-text-muted">로그인 후 이용 가능합니다</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-bg-main animate-pulse">
        <div className="bg-bg-sub px-6 pb-8 pt-10 text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-bg-main" />
          <div className="mx-auto mb-2 h-4 w-32 rounded bg-bg-main" />
          <div className="mx-auto h-3 w-20 rounded bg-bg-main" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 프로필 헤더 */}
      <div className="bg-bg-sub px-6 pb-8 pt-10 text-center border-b border-border-subtle">
        <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-border-main">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-main text-3xl">🧖</div>
          )}
        </div>
        <h1 className="mb-0.5 text-xl font-black text-text-main">{displayName}</h1>
        {email && <p className="text-[11px] text-text-muted">{email}</p>}
        <p className="mt-1 text-[11px] font-semibold text-text-sub">오늘도 극락 다녀오셨나요? 🔥</p>
      </div>

      {/* 통계 요약 */}
      <div className="mx-4 -mt-4 mb-4 grid grid-cols-2 gap-0 divide-x divide-border-subtle rounded-2xl border border-border-main bg-bg-card shadow-card">
        <Link href="/my/favorites" className="py-3 text-center transition active:bg-bg-sub rounded-l-2xl">
          <p className="text-[10px] font-bold text-text-muted">찜</p>
          <p className="text-lg font-black text-text-main">{favorites.length}</p>
        </Link>
        <Link href="/my/records" className="py-3 text-center transition active:bg-bg-sub rounded-r-2xl">
          <p className="text-[10px] font-bold text-text-muted">사활</p>
          <p className="text-lg font-black text-text-main">{records.length}</p>
        </Link>
      </div>

      {/* 사우나 등록 버튼 */}
      <div className="px-4 mb-3">
        <Link
          href="/saunas/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-point/40 bg-point/5 py-3 text-[13px] font-black text-point transition active:scale-[0.98]"
        >
          <BiPlus size={16} />
          새 사우나 등록하기
        </Link>
      </div>

      {/* 메뉴 목록 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 space-y-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex w-full items-center gap-4 rounded-2xl border border-border-main bg-bg-card p-4 transition active:scale-[0.98] active:bg-bg-main"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-main text-text-sub">
              <item.icon size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-black text-text-main">{item.label}</p>
              <p className="text-[11px] font-medium text-text-muted">{item.desc}</p>
            </div>
            <span className="text-text-muted text-lg">›</span>
          </button>
        ))}

        <div className="pt-2 pb-4">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-bold text-text-muted">
            <BiHelpCircle size={18} />
            도움말 및 문의
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-bold text-danger/70"
          >
            <BiLogOut size={18} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
