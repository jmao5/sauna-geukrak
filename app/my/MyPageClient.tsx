'use client'

import { BiBookmark, BiHistory, BiCog, BiBell, BiHelpCircle, BiLogOut } from 'react-icons/bi'
import { useRouter } from 'next/navigation'

const MENU_ITEMS = [
  { icon: BiBookmark, label: '찜한 사우나', desc: '가고 싶은 사우나 모아보기', href: '/my/favorites' },
  { icon: BiHistory, label: '방문 기록', desc: '내가 다녀온 사우나 목록', href: '/my/history' },
  { icon: BiBell, label: '알림 설정', desc: '키워드 알림 및 공지사항', href: '/my/notifications' },
  { icon: BiCog, label: '설정', desc: '내 정보 및 앱 설정', href: '/my/settings' },
]

export default function MyPageClient() {
  const router = useRouter()

  return (
    <div className="flex h-full flex-col bg-bg-main">
      {/* 헤더 */}
      <div className="bg-bg-sub px-6 pb-8 pt-10 text-center">
        <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-point-ring bg-bg-main p-1">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-point-color/10 text-3xl">
            🧖
          </div>
        </div>
        <h1 className="mb-1 text-xl font-black text-text-main">사우나 매니아</h1>
        <p className="text-xs font-semibold text-text-sub">오늘도 극락 다녀오셨나요? 🔥</p>
      </div>

      {/* 통계 요약 */}
      <div className="mx-4 -mt-4 mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-border-main bg-bg-sub p-4 shadow-sm">
        <div className="text-center">
          <p className="text-[10px] font-bold text-text-muted">찜</p>
          <p className="font-black text-text-main">12</p>
        </div>
        <div className="border-x border-border-subtle text-center">
          <p className="text-[10px] font-bold text-text-muted">방문</p>
          <p className="font-black text-text-main">48</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-text-muted">리뷰</p>
          <p className="font-black text-text-main">5</p>
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="flex-1 space-y-2 px-4">
        {MENU_ITEMS.map((item, i) => (
          <button
            key={i}
            onClick={() => router.push(item.href)}
            className="flex w-full items-center gap-4 rounded-2xl border border-border-main bg-bg-sub p-4 transition active:scale-[0.98] active:bg-bg-main"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-main text-text-sub">
              <item.icon size={22} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-text-main">{item.label}</p>
              <p className="text-[11px] font-medium text-text-muted">{item.desc}</p>
            </div>
            <span className="text-text-muted">›</span>
          </button>
        ))}

        <div className="pt-4">
          <button className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-text-muted">
            <BiHelpCircle size={18} />
            도움말 및 문의
          </button>
          <button className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-danger/70">
            <BiLogOut size={18} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
