'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { SaunaDto, NearbyRestaurant } from '@/types/sauna'
import { getNearbyRestaurants } from '@/app/actions/sauna.actions'
import { BiMapPin, BiNavigation, BiPhone, BiLinkExternal, BiDish, BiWalk } from 'react-icons/bi'
import Skeleton from '@/components/ui/Skeleton'

interface SaumeshiTabProps {
  sauna: SaunaDto
}

// ── 대표 사우나 소울푸드 추천 가이드 ──
const SIGNATURE_SAUMESHI = [
  {
    emoji: '🧋',
    title: '살얼음 식혜 & 미숫가루',
    desc: '뜨거운 사우나 후 땀 배출로 갈증 난 몸을 채워주는 최고의 수분 보충',
    tag: '수분 충전',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    emoji: '🥚',
    title: '맥반석 구운계란',
    desc: '겉은 쫄깃하고 속은 부드러운 사우나 필수 영양 단백질 간식',
    tag: '근본 스낵',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  },
  {
    emoji: '🍲',
    title: '뚝배기 미역국 & 순두부찌개',
    desc: '토토노이(황홀경) 직후 예민해진 미각에 깊은 감동을 주는 뜨끈한 K-소울푸드',
    tag: '속풀이 식사',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    emoji: '🥩',
    title: '바삭한 왕돈까스',
    desc: '일본 사우나 이키타이에서도 가장 사랑받는 사우나 밥의 절대 강자',
    tag: '매니아 픽',
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
]

// ── 카카오맵 맛집 검색 최적화 키워드 추출 ──
function extractFoodSearchKeyword(address?: string, fallbackName?: string): { areaName: string; searchKeyword: string } {
  const cleanFallback = (fallbackName || '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim()

  if (!address) {
    return {
      areaName: '',
      searchKeyword: cleanFallback ? `${cleanFallback} 맛집` : '주변 맛집',
    }
  }

  // 1. 주소 내 괄호 안 법정동 (예: "강서로 242 (화곡동)")
  const bracketDong = address.match(/\(([가-힣\d]+(?:동|가|리))\)/)
  if (bracketDong) {
    return {
      areaName: bracketDong[1],
      searchKeyword: `${bracketDong[1]} 맛집`,
    }
  }

  // 특수문자 정리 및 공백 분리
  const tokens = address.trim().replace(/[,()]/g, ' ').split(/\s+/).filter(Boolean)

  // 2. 동/가/읍/면/리 단위 (예: "공덕동", "을지로1가", "조종면")
  const dongToken = tokens.find((t) => /^[가-힣\d]+(?:동|가|읍|면|리)$/.test(t))
  if (dongToken) {
    return {
      areaName: dongToken,
      searchKeyword: `${dongToken} 맛집`,
    }
  }

  // 3. 구/군 단위 (예: "마포구", "강남구", "양평군")
  const guToken = [...tokens].reverse().find((t) => /^[가-힣]+(?:구|군)$/.test(t))
  if (guToken) {
    return {
      areaName: guToken,
      searchKeyword: `${guToken} 맛집`,
    }
  }

  // 4. 시 단위 (광역시 제외. 예: "고양시", "수원시", "제주시")
  const siToken = [...tokens].reverse().find(
    (t) => /^[가-힣]+시$/.test(t) && !/^(서울|부산|대구|인천|광주|대전|울산|세종)시?$/.test(t)
  )
  if (siToken) {
    return {
      areaName: siToken,
      searchKeyword: `${siToken} 맛집`,
    }
  }

  // 5. 도로명 단위 (예: "토정로", "화곡로")
  const roToken = tokens.find((t) => /^[가-힣\d]+(?:로|길)$/.test(t))
  if (roToken) {
    return {
      areaName: roToken,
      searchKeyword: `${roToken} 맛집`,
    }
  }

  // 6. 1~2번째 토큰 (예: "서울 마포구")
  if (tokens.length >= 2) {
    return {
      areaName: tokens[1],
      searchKeyword: `${tokens[0]} ${tokens[1]} 맛집`,
    }
  }

  return {
    areaName: tokens[0] || '',
    searchKeyword: tokens[0] ? `${tokens[0]} 맛집` : '주변 맛집',
  }
}

export default function SaumeshiTab({ sauna }: SaumeshiTabProps) {
  const foods = sauna.kr_specific?.food ?? []

  // 사우나 좌표 기반 반경 1km 주변 음식점 조회
  const { data: restaurants = [], isLoading } = useQuery<NearbyRestaurant[]>({
    queryKey: ['nearby-restaurants', sauna.id, sauna.latitude, sauna.longitude],
    queryFn: () => getNearbyRestaurants(sauna.latitude, sauna.longitude, 1000),
    staleTime: 1000 * 60 * 30, // 30분 캐시
    enabled: !!(sauna.latitude && sauna.longitude),
  })

  // 도보 시간 계산 (분당 80m 기준)
  const calcWalkMinutes = (meters: number) => {
    const mins = Math.max(1, Math.round(meters / 80))
    return `도보 약 ${mins}분`
  }

  // 1) 사우나 상호명 정제 (괄호 제거: "런포트 마포(사우나)" -> "런포트 마포")
  const cleanName = sauna.name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim()

  // 2) 주소 기반 맛집 검색어 추출 (카카오맵 0건 실패 방지)
  const { areaName, searchKeyword } = extractFoodSearchKeyword(sauna.address, cleanName)

  // 카카오맵 검색 URL & 사우나 위치 지도 URL
  const kakaoSearchUrl = `https://map.kakao.com/?q=${encodeURIComponent(searchKeyword)}`
  const saunaMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(cleanName)},${sauna.latitude},${sauna.longitude}`

  return (
    <div className="pb-16 divide-y divide-border-subtle bg-bg-main">
      {/* ── 1. 사우나밥 인트로 배너 ── */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🍱</span>
          <h2 className="text-[14px] font-black text-text-main">
            사우나밥 (サ飯, Saumeshi)
          </h2>
          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9.5px] font-black text-amber-600 dark:text-amber-400">
            사우나의 완성
          </span>
        </div>
        <p className="text-[11.5px] leading-relaxed text-text-sub">
          사우나와 냉탕, 외기욕으로 몸과 마음이 리셋된 뒤에 즐기는 식사는 미각이 극대화되어 평소보다 훨씬 깊고 풍부한 맛을 선사합니다.
        </p>
      </div>

      {/* ── 2. 관내 매점 대표 메뉴 ── */}
      <div className="p-4 bg-bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-black text-text-muted uppercase tracking-wider">
            <BiDish size={14} className="text-point" /> 관내 매점 & 시그니처 메뉴
          </h3>
          <span className="text-[10px] font-bold text-text-muted">
            {foods.length > 0 ? `${foods.length}개 메뉴 등록` : '추천 메뉴 가이드'}
          </span>
        </div>

        {foods.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {foods.map((food, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-xl border border-border-main bg-bg-sub/40 p-3 shadow-2xs"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-point/10 text-[16px]">
                  🥣
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black text-text-main">{food}</p>
                  <p className="text-[9.5px] font-medium text-text-muted">사우나 매점 메뉴</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* 사우나 극락 추천 조합 */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">
            사우나 극락 추천 꿀조합
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SIGNATURE_SAUMESHI.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-main bg-bg-sub/30 p-2.5 flex items-start gap-2.5"
              >
                <span className="text-2xl mt-0.5">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="text-[11.5px] font-black text-text-main">{item.title}</p>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold border ${item.badgeClass}`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[10.5px] leading-tight text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. 사우나 반경 1km 추천 로컬 맛집 ── */}
      <div className="p-4 bg-bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-black text-text-muted uppercase tracking-wider">
            <BiMapPin size={14} className="text-point" /> 사우나 주변 1km 로컬 맛집
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={saunaMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[10.5px] font-bold text-text-muted hover:text-text-sub hover:underline"
            >
              <span>사우나 위치</span>
              <BiLinkExternal size={11} />
            </a>
            <span className="text-border-strong text-xs">·</span>
            <a
              href={kakaoSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[10.5px] font-bold text-point hover:underline"
            >
              <span>{searchKeyword} 더보기</span>
              <BiLinkExternal size={12} />
            </a>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border-subtle p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32 skeleton-shimmer" />
                  <Skeleton className="h-3 w-16 skeleton-shimmer" />
                </div>
                <Skeleton className="h-3 w-48 skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="space-y-2.5">
            {restaurants.map((rest) => (
              <div
                key={rest.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-main bg-bg-card p-3 shadow-2xs transition hover:border-point/40 hover:bg-bg-sub/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <a
                      href={rest.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-black text-text-main truncate hover:text-point hover:underline"
                    >
                      {rest.name}
                    </a>
                    <span className="rounded bg-bg-sub border border-border-subtle px-1.5 py-0.5 text-[9.5px] font-bold text-text-muted">
                      {rest.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-text-muted truncate mb-1">
                    {rest.address}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] font-extrabold">
                    <span className="flex items-center gap-1 text-point tabular-nums">
                      <BiWalk size={12} />
                      {calcWalkMinutes(rest.distanceMeters)} ({rest.distanceMeters}m)
                    </span>
                    {rest.phone && (
                      <span className="flex items-center gap-0.5 text-text-muted">
                        <BiPhone size={11} />
                        {rest.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* 길찾기 / 상세 바로가기 버튼 */}
                <a
                  href={
                    rest.lat && rest.lng
                      ? `https://map.kakao.com/link/to/${encodeURIComponent(rest.name)},${rest.lat},${rest.lng}`
                      : rest.placeUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 rounded-lg border border-point/30 bg-point/10 px-2.5 py-1.5 text-[11px] font-black text-point transition active:scale-95 hover:bg-point hover:text-white"
                >
                  <BiNavigation size={12} />
                  <span>길찾기</span>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-sub/20 py-8 text-center">
            <span className="text-3xl opacity-30">🍽️</span>
            <p className="text-[12px] font-bold text-text-sub">
              반경 1km 이내 등록된 음식점을 조회 중이거나 찾지 못했습니다.
            </p>
            <a
              href={kakaoSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 rounded-full border border-border-main bg-bg-card px-3.5 py-1.5 text-[11px] font-black text-text-main shadow-2xs hover:border-point/40"
            >
              <span>{`카카오맵에서 ${searchKeyword} 검색`}</span>
              <BiLinkExternal size={12} />
            </a>
          </div>
        )}
      </div>

      {/* ── 4. 하단 안내 ── */}
      <div className="p-4 text-center">
        <p className="text-[11px] text-text-muted">
          사우나 이용 후 먹은 나만의 사우나밥을 사활 탭에 공유해보세요! 🍜
        </p>
      </div>
    </div>
  )
}
