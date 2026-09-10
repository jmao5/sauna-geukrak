import { MyReviewDto, MyFavoriteDto, Session } from '@/types/sauna'

export interface LevelInfo {
  level: number
  title: string
  subtitle: string
  current: number
  nextTarget: number
  progressPercent: number
  isMax: boolean
}

export interface TopSaunaInfo {
  id: string
  name: string
  visitCount: number
  thumbnailUrl: string | null
  address: string
}

export interface RoutineRatioInfo {
  totalSaunaMinutes: number
  totalColdMinutes: number
  totalRestMinutes: number
  totalSets: number
  coldSessionsCount: number
  saunaPercent: number
  coldPercent: number
  restPercent: number
}

export interface RegionStampInfo {
  district: string
  count: number
  firstVisitedDate?: string
}

export interface PassportBadgeInfo {
  id: string
  name: string
  emoji: string
  desc: string
  hint: string
  current: number
  target: number
  progressPercent: number
  unlocked: boolean
  color: string
  textColor: string
}

export interface PassportStats {
  passportNumber: string
  issuedDate: string
  levelInfo: LevelInfo
  totalVisits: number
  uniqueSaunasCount: number
  thisMonthVisits: number
  averageRating: number | null
  topSauna: TopSaunaInfo | null
  routine: RoutineRatioInfo
  stamps: RegionStampInfo[]
  badges: PassportBadgeInfo[]
}

/**
 * 주소에서 행정구역(구/군/시/동)을 지능적으로 추출
 */
export function extractDistrict(address?: string | null): string {
  if (!address) return '기타 지역'
  
  // 1) 괄호 안 법정동 (예: (화곡동), (역삼동))
  const bracketMatch = address.match(/\(([가-힣\d]+(?:동|가))\)/)
  if (bracketMatch) return bracketMatch[1]

  // 2) 구/군 단위 (예: 마포구, 강남구, 양평군)
  const guMatch = address.match(/([가-힣]+(?:구|군))(?:\s|$)/)
  if (guMatch) return guMatch[1]

  // 3) 시 단위 (예: 고양시, 수원시)
  const siMatch = address.match(/([가-힣]+(?:시))(?:\s|$)/)
  if (siMatch) return siMatch[1]

  // 4) 동/읍/면 단위
  const dongMatch = address.match(/([가-힣\d]+(?:동|읍|면|가))(?:\s|$)/)
  if (dongMatch) return dongMatch[1]

  return address.split(' ')[1] || address.split(' ')[0] || '기타 지역'
}

/**
 * 사우너 레벨 및 칭호 계산
 */
export function calculateLevel(visitCount: number): LevelInfo {
  if (visitCount >= 20) {
    return {
      level: 5,
      title: '전설의 토토노이 마스터',
      subtitle: '사우나의 진정한 극락을 터득한 최상위 사우너',
      current: visitCount,
      nextTarget: 20,
      progressPercent: 100,
      isMax: true,
    }
  }
  if (visitCount >= 10) {
    return {
      level: 4,
      title: '극락 수호자',
      subtitle: '온도와 냉기를 지배하는 사우나 장인',
      current: visitCount,
      nextTarget: 20,
      progressPercent: Math.round(((visitCount - 10) / (20 - 10)) * 100),
      isMax: false,
    }
  }
  if (visitCount >= 5) {
    return {
      level: 3,
      title: '불가마 매니아',
      subtitle: '땀과 냉탕의 쾌감을 완전히 이해한 숙련자',
      current: visitCount,
      nextTarget: 10,
      progressPercent: Math.round(((visitCount - 5) / (10 - 5)) * 100),
      isMax: false,
    }
  }
  if (visitCount >= 2) {
    return {
      level: 2,
      title: '온열 탐험가',
      subtitle: '자신만의 사우나 루틴을 찾아가는 여행자',
      current: visitCount,
      nextTarget: 5,
      progressPercent: Math.round(((visitCount - 2) / (5 - 2)) * 100),
      isMax: false,
    }
  }
  return {
    level: 1,
    title: '입문 사우너',
    subtitle: '사우나 극락의 첫 발걸음을 뗀 비기너',
    current: visitCount,
    nextTarget: 2,
    progressPercent: Math.round((visitCount / 2) * 100),
    isMax: false,
  }
}

/**
 * 전체 사우나 여권 통계 종합 연산
 */
export function computePassportStats(
  records: MyReviewDto[],
  favorites: MyFavoriteDto[],
  userId?: string
): PassportStats {
  const totalVisits = records.length

  // 1. 고유 여권 번호 생성 (NO. SGK-XXXX)
  const seed = (userId ?? 'GUEST').replace(/-/g, '').slice(0, 8).toUpperCase()
  const passportNumber = `SGK-${seed || 'PASS'}`

  // 2. 발급일 (최초 방문일 또는 오늘)
  let earliestDate: Date | null = null
  for (const r of records) {
    const d = r.visit_date ? new Date(r.visit_date) : new Date(r.created_at)
    if (!earliestDate || d < earliestDate) earliestDate = d
  }
  const issuedDate = earliestDate
    ? earliestDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
    : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')

  // 3. 레벨 정보
  const levelInfo = calculateLevel(totalVisits)

  // 4. 정복한 사우나 시설 수 (중복 제거)
  const uniqueSaunaMap = new Map<string, { count: number; name: string; thumbnail: string | null; address: string }>()
  const districtMap = new Map<string, number>()
  let thisMonthCount = 0
  let totalRatingSum = 0
  let ratingCount = 0

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // 세션 관련 통계
  let totalSets = 0
  let totalSaunaMinutes = 0
  let totalColdMinutes = 0
  let totalRestMinutes = 0
  let coldSessionsCount = 0
  let morningCount = 0
  let nightCount = 0

  records.forEach((rec) => {
    // 평점
    if (typeof rec.rating === 'number' && rec.rating > 0) {
      totalRatingSum += rec.rating
      ratingCount++
    }

    // 이번달 방문
    const recDate = rec.visit_date ? new Date(rec.visit_date) : new Date(rec.created_at)
    if (recDate.getFullYear() === currentYear && recDate.getMonth() === currentMonth) {
      thisMonthCount++
    }

    // 시간대
    if (rec.visit_time === 'morning') morningCount++
    if (rec.visit_time === 'night') nightCount++

    // 사우나 정보 집계
    if (rec.saunas) {
      const s = rec.saunas
      const existing = uniqueSaunaMap.get(s.id)
      const thumbnail = s.images?.[0] ?? null
      if (existing) {
        existing.count++
      } else {
        uniqueSaunaMap.set(s.id, {
          count: 1,
          name: s.name,
          thumbnail,
          address: s.address,
        })
      }

      // 지역 집계
      const district = extractDistrict(s.address)
      districtMap.set(district, (districtMap.get(district) ?? 0) + 1)
    }

    // 루틴 세션 집계
    if (Array.isArray(rec.sessions)) {
      rec.sessions.forEach((s: Session) => {
        const mins = s.duration_minutes || 0
        if (s.type === 'sauna') {
          totalSaunaMinutes += mins
          totalSets++
        } else if (s.type === 'cold') {
          totalColdMinutes += mins
          coldSessionsCount++
        } else if (s.type === 'rest') {
          totalRestMinutes += mins
        }
      })
    }
  })

  // 최애 사우나 (방문수 1위)
  let topSauna: TopSaunaInfo | null = null
  let maxVisit = 0
  uniqueSaunaMap.forEach((val, id) => {
    if (val.count > maxVisit) {
      maxVisit = val.count
      topSauna = {
        id,
        name: val.name,
        visitCount: val.count,
        thumbnailUrl: val.thumbnail,
        address: val.address,
      }
    }
  })

  // 루틴 비율 계산
  const totalMins = totalSaunaMinutes + totalColdMinutes + totalRestMinutes
  let saunaPercent = 0
  let coldPercent = 0
  let restPercent = 0
  if (totalMins > 0) {
    saunaPercent = Math.round((totalSaunaMinutes / totalMins) * 100)
    coldPercent = Math.round((totalColdMinutes / totalMins) * 100)
    restPercent = Math.max(0, 100 - saunaPercent - coldPercent)
  }

  // 스탬프 목록 (방문 수 내림차순)
  const stamps: RegionStampInfo[] = Array.from(districtMap.entries())
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)

  // 업적 배지 목록 8종
  const badges: PassportBadgeInfo[] = [
    {
      id: 'first_step',
      name: '첫 발걸음',
      emoji: '🐣',
      desc: '첫 사활을 성공적으로 기록함',
      hint: '사활 1회 기록',
      current: Math.min(totalVisits, 1),
      target: 1,
      progressPercent: Math.min(100, Math.round((totalVisits / 1) * 100)),
      unlocked: totalVisits >= 1,
      color: 'from-[#fff5eb] to-[#ffeedb] dark:from-[#2e1d0e] dark:to-[#422513]',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'sauna_time',
      name: '불가마 정복',
      emoji: '🔥',
      desc: '사우나 누적 이용 60분 돌파',
      hint: '사우나 60분 누적',
      current: Math.min(totalSaunaMinutes, 60),
      target: 60,
      progressPercent: Math.min(100, Math.round((totalSaunaMinutes / 60) * 100)),
      unlocked: totalSaunaMinutes >= 60,
      color: 'from-[#fff0f0] to-[#ffdcdb] dark:from-[#351010] dark:to-[#4e1b1b]',
      textColor: 'text-sauna',
    },
    {
      id: 'cold_lord',
      name: '냉탕 지배자',
      emoji: '❄️',
      desc: '짜릿한 냉탕 5회 이상 완주',
      hint: '냉탕 세션 5회',
      current: Math.min(coldSessionsCount, 5),
      target: 5,
      progressPercent: Math.min(100, Math.round((coldSessionsCount / 5) * 100)),
      unlocked: coldSessionsCount >= 5,
      color: 'from-[#eff8ff] to-[#d6eeff] dark:from-[#0c283f] dark:to-[#113a5a]',
      textColor: 'text-cold',
    },
    {
      id: 'morning_calm',
      name: '새벽의 고요',
      emoji: '🌅',
      desc: '상쾌한 아침 사우나의 여유를 즐김',
      hint: '오전 사활 1회 작성',
      current: Math.min(morningCount, 1),
      target: 1,
      progressPercent: morningCount >= 1 ? 100 : 0,
      unlocked: morningCount >= 1,
      color: 'from-[#fffbee] to-[#fef0cb] dark:from-[#332a0c] dark:to-[#473b12]',
      textColor: 'text-amber-700 dark:text-amber-300',
    },
    {
      id: 'night_owl',
      name: '심야의 쉼',
      emoji: '🌙',
      desc: '달빛 아래 하루의 피로를 녹임',
      hint: '야간 사활 1회 작성',
      current: Math.min(nightCount, 1),
      target: 1,
      progressPercent: nightCount >= 1 ? 100 : 0,
      unlocked: nightCount >= 1,
      color: 'from-[#f5f3ff] to-[#e4e1ff] dark:from-[#211a43] dark:to-[#312760]',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'explorer',
      name: '사우나 방랑자',
      emoji: '🗺️',
      desc: '서로 다른 사우나 3곳 이상 정복',
      hint: '사우나 3곳 방문',
      current: Math.min(uniqueSaunaMap.size, 3),
      target: 3,
      progressPercent: Math.min(100, Math.round((uniqueSaunaMap.size / 3) * 100)),
      unlocked: uniqueSaunaMap.size >= 3,
      color: 'from-[#f0fdf4] to-[#dcfce7] dark:from-[#0d2e1b] dark:to-[#144227]',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'collector',
      name: '사우나 수집가',
      emoji: '💖',
      desc: '가고 싶은 사우나 5곳 이상 찜하기',
      hint: '찜 5곳 이상',
      current: Math.min(favorites.length, 5),
      target: 5,
      progressPercent: Math.min(100, Math.round((favorites.length / 5) * 100)),
      unlocked: favorites.length >= 5,
      color: 'from-[#fff1f2] to-[#fecdd3] dark:from-[#3a0d14] dark:to-[#541520]',
      textColor: 'text-pink-600 dark:text-pink-400',
    },
    {
      id: 'totonoi_king',
      name: '극락의 제왕',
      emoji: '👑',
      desc: '사활 10회 작성으로 경지에 도달함',
      hint: '사활 10회 기록',
      current: Math.min(totalVisits, 10),
      target: 10,
      progressPercent: Math.min(100, Math.round((totalVisits / 10) * 100)),
      unlocked: totalVisits >= 10,
      color: 'from-[#faf5ff] to-[#f3e8ff] dark:from-[#2e1240] dark:to-[#451b60]',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return {
    passportNumber,
    issuedDate,
    levelInfo,
    totalVisits,
    uniqueSaunasCount: uniqueSaunaMap.size,
    thisMonthVisits: thisMonthCount,
    averageRating: ratingCount > 0 ? Math.round((totalRatingSum / ratingCount) * 10) / 10 : null,
    topSauna,
    routine: {
      totalSaunaMinutes,
      totalColdMinutes,
      totalRestMinutes,
      totalSets,
      coldSessionsCount,
      saunaPercent,
      coldPercent,
      restPercent,
    },
    stamps,
    badges,
  }
}
