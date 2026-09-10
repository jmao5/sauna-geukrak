'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BiBookmark,
  BiHistory,
  BiCog,
  BiBell,
  BiHelpCircle,
  BiLogOut,
  BiPlus,
  BiChevronRight,
} from 'react-icons/bi'
import { useUserStore } from '@/stores/userStore'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { getFavoritesByUserId } from '@/app/actions/favorite.actions'
import { getReviewsByUserId } from '@/app/actions/review.actions'
import { getNickname } from '@/app/actions/user.actions'
import toast from 'react-hot-toast'
import { computePassportStats } from '@/components/my/utils/passportStats'
import SaunaPassport, { UnissuedSaunaPassport } from '@/components/my/SaunaPassport'
import PassportStatsBoard from '@/components/my/PassportStatsBoard'
import PassportStamps from '@/components/my/PassportStamps'
import SaunaBadgeCollection from '@/components/my/SaunaBadgeCollection'

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
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="white" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-black" style={{ color: '#9b1a6a' }}>
          @sauna_road_kr 팔로우
        </p>
        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: '#c05080' }}>
          새 사우나 소식 · 업데이트 알림
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 18l6-6-6-6" stroke="#c05080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

export default function MyPageClient() {
  const router = useRouter()
  const { user, isLoading, clearSession } = useUserStore()

  const { data: dbNickname } = useQuery({
    queryKey: ['user-nickname', user?.id],
    queryFn: () => getNickname(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  })

  const displayName =
    dbNickname ||
    user?.user_metadata?.nickname ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '사우나 매니아'
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

  // 사우나 여권 및 통계 종합 계산 (실제 유저 데이터 기반)
  const stats = computePassportStats(records, favorites, user?.id)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearSession()
    toast.success('로그아웃되었습니다')
    router.replace('/')
  }

  // ── 비로그인 상태 ──────────────────────────────────────────
  if (!isLoading && !user) {
    return (
      <div className="flex h-full flex-col bg-bg-main overflow-y-auto scrollbar-hide space-y-4 pb-24">
        {/* 비로그인 상단 헤더 (명확한 로그인 / 회원가입 메인 CTA) */}
        <div className="bg-bg-sub px-6 pb-8 pt-10 text-center border-b border-border-subtle flex-shrink-0">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-bg-main border border-border-main text-3xl shadow-sm">
            🧖
          </div>
          <h1 className="mb-1 text-[18px] font-black text-text-main">로그인이 필요해요</h1>
          <p className="text-[12px] text-text-sub mb-4">
            로그인하고 나만의 사우나 여권과 사활을 기록해보세요
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-point px-8 py-3 text-[13px] font-black text-white shadow-md shadow-point/20 transition active:scale-[0.97] hover:bg-point-hover"
          >
            로그인 / 회원가입
          </Link>
        </div>

        {/* 미발급 사우나 여권 안내 카드 */}
        <UnissuedSaunaPassport />

        {/* 여권 발급 혜택 안내 */}
        <div className="px-4 space-y-3">
          <div className="rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm">
            <p className="text-[12px] font-black text-text-main mb-0.5">✨ 사우나 여권으로 누리는 혜택</p>
            <p className="text-[11px] text-text-muted mb-3">나만의 사우나 라이프를 기록하고 성장시켜보세요.</p>

            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-bg-sub/60 p-3 border border-border-subtle">
                <span className="text-2xl flex-shrink-0">🛂</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-black text-text-main">고유 사우나 여권 & 등급 칭호</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    방문 횟수(사활)에 따라 '입문 사우너'부터 '전설의 토토노이 마스터'까지 승급!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-bg-sub/60 p-3 border border-border-subtle">
                <span className="text-2xl flex-shrink-0">🧭</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-black text-text-main">전국 사우나 지역 스탬프 투어</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    마포구, 강남구 등 방문한 지역마다 여권 도장이 찍히는 도장 깨기!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-bg-sub/60 p-3 border border-border-subtle">
                <span className="text-2xl flex-shrink-0">📊</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-black text-text-main">사우나·냉탕·휴식 루틴 비율 분석</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    총 이용 시간과 황금 비율을 자동으로 계산해 드립니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 마이페이지 기본 메뉴 목록 (비로그인 시에도 마이페이지의 구조를 자연스럽게 유지) */}
        <div className="px-4 space-y-2 pt-1">
          <p className="px-1 text-[11px] font-black uppercase tracking-wider text-text-muted">
            사우나 메뉴
          </p>

          {MENU_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                if (item.comingSoon) {
                  toast('준비 중인 기능이에요 🔧', { icon: '🚧' })
                  return
                }
                router.push('/login')
              }}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-border-main bg-bg-card p-3.5 shadow-sm transition active:scale-[0.98] hover:border-point/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-sub text-text-sub">
                <item.icon size={20} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] font-black text-text-main">{item.label}</p>
                <p className="text-[11px] font-medium text-text-muted truncate">{item.desc}</p>
              </div>
              {item.comingSoon ? (
                <span className="text-[10px] font-bold text-text-muted border border-border-main rounded-full px-2 py-0.5">
                  준비중
                </span>
              ) : (
                <BiChevronRight size={18} className="text-text-muted/60" />
              )}
            </button>
          ))}

          {/* 인스타그램 팔로우 블록 */}
          <div className="pt-1">
            <InstagramFollowBlock />
          </div>
        </div>
      </div>
    )
  }

  // ── 로딩 상태 ──────────────────────────────────────────
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

  // ── 로그인된 마이페이지 (실제 유저 데이터 100% 반영) ───────────
  return (
    <div data-scroll-main className="h-full overflow-y-auto scrollbar-hide bg-bg-main space-y-4 pb-24">
      {/* 최상단 프로필 인트로 바 */}
      <div className="flex items-center justify-between px-5 pt-6 pb-1">
        <div>
          <h1 className="text-[19px] font-black text-text-main tracking-tight">
            마이 사우나 여권
          </h1>
          <p className="text-[11px] text-text-muted">
            오늘도 극락 다녀오셨나요? 🔥
          </p>
        </div>
        <Link
          href="/my/settings"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-main bg-bg-card text-text-sub transition active:scale-95 hover:text-point"
          title="설정"
        >
          <BiCog size={20} />
        </Link>
      </div>

      {/* 1. 사우나 여권 메인 카드 */}
      <SaunaPassport
        displayName={displayName}
        avatarUrl={avatarUrl}
        passportNumber={stats.passportNumber}
        issuedDate={stats.issuedDate}
        levelInfo={stats.levelInfo}
        totalVisits={stats.totalVisits}
        uniqueSaunasCount={stats.uniqueSaunasCount}
      />

      {/* 2. 찜 / 사활 원터치 이동 요약 카드 */}
      <div className="mx-4 grid grid-cols-2 divide-x divide-border-subtle rounded-2xl border border-border-main bg-bg-card shadow-card overflow-hidden">
        <Link
          href="/my/favorites"
          className="group py-3.5 text-center transition-colors duration-200 hover:bg-bg-sub active:bg-bg-main"
        >
          <p className="text-[10px] font-bold text-text-muted mb-0.5">가고 싶은 찜</p>
          <p className="text-xl font-black text-text-main transition-colors duration-200 group-hover:text-point tabular-nums">
            {favorites.length}
          </p>
        </Link>
        <Link
          href="/my/records"
          className="group py-3.5 text-center transition-colors duration-200 hover:bg-bg-sub active:bg-bg-main"
        >
          <p className="text-[10px] font-bold text-text-muted mb-0.5">내 사활 기록</p>
          <p className="text-xl font-black text-text-main transition-colors duration-200 group-hover:text-point tabular-nums">
            {records.length}
          </p>
        </Link>
      </div>

      {/* 3. 새 사우나 등록 바로가기 */}
      <div className="px-4">
        <Link
          href="/saunas/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-point/40 bg-point/5 py-2.5 text-[12px] font-black text-point transition active:scale-[0.98] hover:bg-point/10"
        >
          <BiPlus size={16} />
          새 사우나 등록하기
        </Link>
      </div>

      {/* 4. 사활 핵심 메트릭 대시보드 (KPI 4종, 최애 사우나, 루틴 비율 게이지) */}
      <PassportStatsBoard
        totalVisits={stats.totalVisits}
        uniqueSaunasCount={stats.uniqueSaunasCount}
        thisMonthVisits={stats.thisMonthVisits}
        averageRating={stats.averageRating}
        topSauna={stats.topSauna}
        routine={stats.routine}
      />

      {/* 5. 지역별 도장 깨기 (스탬프 투어) */}
      <PassportStamps stamps={stats.stamps} />

      {/* 6. 사우너 명예 뱃지 2.0 */}
      <SaunaBadgeCollection badges={stats.badges} />

      {/* 7. 마이페이지 메뉴 목록 */}
      <div className="px-4 space-y-2 pt-2">
        <p className="px-1 text-[11px] font-black uppercase tracking-wider text-text-muted">
          사우나 메뉴
        </p>

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
            className="group flex w-full items-center gap-3.5 rounded-2xl border border-border-main bg-bg-card p-3.5 shadow-sm transition active:scale-[0.98] hover:border-point/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-sub text-text-sub">
              <item.icon size={20} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[13px] font-black text-text-main">{item.label}</p>
              <p className="text-[11px] font-medium text-text-muted truncate">{item.desc}</p>
            </div>
            {item.comingSoon ? (
              <span className="text-[10px] font-bold text-text-muted border border-border-main rounded-full px-2 py-0.5">
                준비중
              </span>
            ) : (
              <BiChevronRight size={18} className="text-text-muted/60" />
            )}
          </button>
        ))}

        {/* 인스타그램 팔로우 블록 */}
        <div className="pt-1">
          <InstagramFollowBlock />
        </div>

        {/* 하단 보조 메뉴 */}
        <div className="pt-3 pb-4 border-t border-border-subtle space-y-1">
          <button
            type="button"
            onClick={() => toast('고객센터(카카오채널) 오픈 준비 중입니다 🙏', { icon: '💬' })}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-bold text-text-muted transition-colors duration-150 hover:bg-bg-card hover:text-text-sub active:bg-bg-main"
          >
            <BiHelpCircle size={18} />
            도움말 및 문의
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-bold text-danger/60 transition-colors duration-150 hover:bg-danger/5 hover:text-danger active:bg-danger/10"
          >
            <BiLogOut size={18} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
