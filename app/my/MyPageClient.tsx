'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BiBookmark, BiHistory, BiCog, BiBell, BiHelpCircle, BiLogOut, BiPlus, BiChevronRight } from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { getFavoritesByUserId } from '@/app/actions/favorite.actions'
import { getReviewsByUserId } from '@/app/actions/review.actions'
import toast from 'react-hot-toast'

const MENU_ITEMS = [
  { icon: BiBookmark, label: '찜한 사우나', desc: '가고 싶은 사우나 모아보기', href: '/my/favorites', comingSoon: false },
  { icon: BiHistory, label: '사활 기록', desc: '내가 다녀온 사우나 방문 기록', href: '/my/records', comingSoon: false },
  { icon: BiBell, label: '알림 설정', desc: '키워드 알림 및 공지사항', href: '/my/notifications', comingSoon: true },
  { icon: BiCog, label: '설정', desc: '내 정보 및 앱 설정', href: '/my/settings', comingSoon: false },
]

// ── 인스타그램 팔로우 블록 ────────────────────────────────────
function InstagramFollowBlock() {
  return (
    <a
      href="https://instagram.com/sauna_road_kr"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 rounded-2xl px-4 py-4 transition active:opacity-70"
      style={{
        background: 'linear-gradient(135deg, #fdf0e8 0%, #fce8f0 100%)',
        border: '1px solid #f0c0a0',
      }}
    >
      {/* 인스타 그라데이션 아이콘 */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="white" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8"/>
          <circle cx="17.5" cy="6.5" r="1.1" fill="white"/>
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-black" style={{ color: '#9b1a6a' }}>@sauna_road_kr 팔로우</p>
        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: '#c05080' }}>
          새 사우나 소식 · 업데이트 알림
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 18l6-6-6-6" stroke="#c05080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  )
}

export default function MyPageClient() {
  const router = useRouter()
  const { user, isLoading, clearSession } = useUserStore()

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '사우나 매니아'
  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const email = user?.email ?? null

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => getFavoritesByUserId(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  })

  const { data: records = [] } = useQuery({
    queryKey: ['my-records', user?.id],
    queryFn: () => getReviewsByUserId(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  })

  // 사우나 기록 통계 산출
  let totalSets = 0
  let totalSaunaMinutes = 0
  let totalColdMinutes = 0
  let coldSessionsCount = 0

  records.forEach((r) => {
    if (r.sessions && Array.isArray(r.sessions)) {
      r.sessions.forEach((s) => {
        if (s.type === 'sauna') {
          totalSaunaMinutes += s.duration_minutes || 0
          totalSets++
        } else if (s.type === 'cold') {
          totalColdMinutes += s.duration_minutes || 0
          coldSessionsCount++
        } else if (s.type === 'rest') {
          // 휴식 등 기타 세션 처리
        }
      })
    }
  })

  const BADGES = [
    {
      id: 'rookie',
      name: '입문 사우너',
      emoji: '🐣',
      desc: '첫 사활을 성공적으로 기록함',
      unlocked: records.length >= 1,
      hint: '사활 1회 작성',
      color: 'from-[#fff3ee] to-[#ffdecb]',
      textColor: 'text-[#e05a00]',
    },
    {
      id: 'veteran',
      name: '불가마 숙련자',
      emoji: '🔥',
      desc: '뜨거운 사우나에 익숙해진 사우너',
      unlocked: records.length >= 5,
      hint: '사활 5회 작성',
      color: 'from-[#fff0f0] to-[#ffcccc]',
      textColor: 'text-red-600',
    },
    {
      id: 'emperor',
      name: '극락의 지배자',
      emoji: '🧖',
      desc: '진정한 사우나의 극락을 깨달은 마스터',
      unlocked: records.length >= 15,
      hint: '사활 15회 작성',
      color: 'from-[#f5e6ff] to-[#ebb3ff]',
      textColor: 'text-purple-600',
    },
    {
      id: 'cold_lord',
      name: '냉탕의 황제',
      emoji: '❄️',
      desc: '차가운 냉탕을 완벽히 정복한 지배자',
      unlocked: coldSessionsCount >= 10,
      hint: '냉탕 10회 이상 이용',
      color: 'from-[#eef3ff] to-[#ccd9ff]',
      textColor: 'text-[#0051e0]',
    },
    {
      id: 'bookmark_master',
      name: '찜 마스터',
      emoji: '💖',
      desc: '가고 싶은 사우나를 꼼꼼히 저장한 수집가',
      unlocked: favorites.length >= 5,
      hint: '사우나 찜 5회 이상',
      color: 'from-[#fff0f6] to-[#ffccd8]',
      textColor: 'text-pink-600',
    },
  ]

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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-bg-main border border-border-main text-4xl shadow-sm">
            🧖
          </div>
          <h1 className="mb-1 text-lg font-black text-text-main">로그인이 필요해요</h1>
          <p className="text-[12px] text-text-sub mb-5">찜 목록과 방문 기록을 저장해보세요</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-point px-6 py-3 text-[13px] font-black text-white shadow-sm transition active:scale-[0.97]"
          >
            로그인 / 회원가입
          </Link>
        </div>
        {/* 비로그인에도 인스타 블록 노출 */}
        <div className="px-4 pt-5">
          <InstagramFollowBlock />
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
          <div className="mx-auto mb-4 h-20 w-20 rounded-full skeleton-shimmer" />
          <div className="mx-auto mb-2 h-4 w-32 rounded skeleton-shimmer" />
          <div className="mx-auto h-3 w-20 rounded skeleton-shimmer" />
        </div>
      </div>
    )
  }

  return (
    <div data-scroll-main className="h-full overflow-y-auto scrollbar-hide bg-bg-main">
      {/* 프로필 헤더 */}
      <div className="bg-bg-sub px-6 pb-8 pt-10 text-center border-b border-border-subtle">
        <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-border-main shadow-md">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={80} height={80} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-main text-3xl">🧖</div>
          )}
        </div>
        <h1 className="mb-0.5 text-xl font-black text-text-main">{displayName}</h1>
        {email && <p className="text-[11px] text-text-muted">{email}</p>}
        <p className="mt-1.5 text-[11px] font-semibold text-text-sub">오늘도 극락 다녀오셨나요? 🔥</p>
      </div>

      {/* 통계 요약 */}
      <div className="mx-4 -mt-4 mb-4 grid grid-cols-2 divide-x divide-border-subtle rounded-2xl border border-border-main bg-bg-card shadow-card overflow-hidden">
        <Link
          href="/my/favorites"
          className="group py-4 text-center transition-colors duration-200 hover:bg-bg-sub active:bg-bg-main"
        >
          <p className="text-[10px] font-bold text-text-muted mb-1">찜</p>
          <p className="text-2xl font-black text-text-main transition-colors duration-200 group-hover:text-point">
            {favorites.length}
          </p>
        </Link>
        <Link
          href="/my/records"
          className="group py-4 text-center transition-colors duration-200 hover:bg-bg-sub active:bg-bg-main"
        >
          <p className="text-[10px] font-bold text-text-muted mb-1">사활</p>
          <p className="text-2xl font-black text-text-main transition-colors duration-200 group-hover:text-point">
            {records.length}
          </p>
        </Link>
      </div>

      {/* 사우나 등록 버튼 */}
      <div className="px-4 mb-4">
        <Link
          href="/saunas/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-point/40 bg-point/5 py-3 text-[13px] font-black text-point transition active:scale-[0.98]"
        >
          <BiPlus size={16} />
          새 사우나 등록하기
        </Link>
      </div>

      {/* 누적 통계 보드 */}
      {records.length > 0 && (
        <div className="mx-4 mb-4 rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-black text-text-muted tracking-widest uppercase">My Sauna Stats</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-bg-main py-3">
              <p className="text-[9px] font-bold text-text-muted mb-0.5">누적 세트</p>
              <p className="text-[14px] font-black text-text-main tabular-nums">{totalSets}세트</p>
            </div>
            <div className="rounded-xl bg-bg-main py-3">
              <p className="text-[9px] font-bold text-text-muted mb-0.5">사우나 총합</p>
              <p className="text-[14px] font-black text-text-main tabular-nums">{totalSaunaMinutes}분</p>
            </div>
            <div className="rounded-xl bg-bg-main py-3">
              <p className="text-[9px] font-bold text-text-muted mb-0.5">냉탕 총합</p>
              <p className="text-[14px] font-black text-text-main tabular-nums">{totalColdMinutes}분</p>
            </div>
          </div>
        </div>
      )}

      {/* 명예 배지 섹션 */}
      <div className="mx-4 mb-6 rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-black text-text-muted tracking-widest uppercase">Sauner Badges</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`flex w-24 flex-shrink-0 flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                badge.unlocked
                  ? `border-border-main bg-gradient-to-br ${badge.color} shadow-sm`
                  : 'border-border-subtle bg-bg-main/30 opacity-40'
              }`}
            >
              <span className="text-2xl mb-1.5">{badge.emoji}</span>
              <p className={`text-[10px] font-black truncate w-full ${badge.unlocked ? badge.textColor : 'text-text-muted'}`}>
                {badge.name}
              </p>
              <p className="mt-0.5 text-[8px] font-medium text-text-muted leading-tight">
                {badge.unlocked ? '획득 완료' : badge.hint}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="px-4 space-y-2 pb-24">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.href}
            onClick={() => {
              if (item.comingSoon) {
                toast('준비 중인 기능이에요 🔧', { icon: '🚧' })
                return
              }
              router.push(item.href)
            }}
            className="group flex w-full items-center gap-4 rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm transition active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-main text-text-sub">
              <item.icon size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-black text-text-main">{item.label}</p>
              <p className="text-[11px] font-medium text-text-muted">{item.desc}</p>
            </div>
            {item.comingSoon ? (
              <span className="text-[10px] font-bold text-text-muted border border-border-main rounded-full px-2 py-0.5">준비중</span>
            ) : (
              <BiChevronRight size={18} className="text-text-muted/50" />
            )}
          </button>
        ))}

        {/* ── 인스타그램 팔로우 블록 ── */}
        <InstagramFollowBlock />

        {/* ── 하단 보조 메뉴 ── */}
        <div className="pt-2 pb-6 border-t border-border-subtle mt-1">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-text-muted transition-colors duration-150 hover:bg-bg-card hover:text-text-sub active:bg-bg-main">
            <BiHelpCircle size={18} />
            도움말 및 문의
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-danger/60 transition-colors duration-150 hover:bg-danger/5 hover:text-danger active:bg-danger/10"
          >
            <BiLogOut size={18} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
