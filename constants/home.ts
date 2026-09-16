import { Condition, SortKey } from '@/stores/homeFilterStore'

export const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전',
  '광주', '울산', '세종', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주',
]

export const CONDITIONS: { id: Condition; label: string; emoji: string }[] = [
  { id: 'autoloyly',   label: '오토 로울리', emoji: '💦' },
  { id: 'groundwater', label: '지하수 냉탕', emoji: '🏔️' },
  { id: 'jjimjilbang', label: '찜질방',      emoji: '🧖' },
  { id: 'tattoo',      label: '타투 가능',   emoji: '🖋️' },
  { id: 'female',      label: '여성 가능',   emoji: '👩' },
  { id: 'male',        label: '남성 가능',   emoji: '👨' },
  { id: 'parking',     label: '주차',        emoji: '🅿️' },
]

export type ThemeId = 'coldest' | 'groundwater' | 'hottest' | 'autoloyly' | 'tattoo' | 'sesin'

export type ThemeAction =
  | { type: 'condition'; value: Condition }
  | { type: 'sort'; value: SortKey }

/**
 * 홈 테마 큐레이션. action이 있으면 "전체 보기" 시 홈 필터/정렬에 그대로 적용된다.
 * 세신 가성비는 대응하는 정렬 키가 없어 action 없이 레일만 노출.
 */
export const THEMES: { id: ThemeId; label: string; emoji: string; description: string; action?: ThemeAction }[] = [
  { id: 'coldest',     label: '냉탕 가장 찬 곳',   emoji: '🧊', description: '냉탕 온도 낮은 순',        action: { type: 'sort', value: 'temp_cold' } },
  { id: 'groundwater', label: '지하수 냉탕',       emoji: '🏔️', description: '천연 지하수 냉탕 보유',     action: { type: 'condition', value: 'groundwater' } },
  { id: 'hottest',     label: '사우나 가장 뜨거운 곳', emoji: '🔥', description: '사우나실 온도 높은 순',  action: { type: 'sort', value: 'temp_hot' } },
  { id: 'autoloyly',   label: '오토 로울리',       emoji: '💦', description: '자동 로일리 사우나실 보유', action: { type: 'condition', value: 'autoloyly' } },
  { id: 'tattoo',      label: '타투 OK',           emoji: '🖋️', description: '문신 입장 가능',            action: { type: 'condition', value: 'tattoo' } },
  { id: 'sesin',       label: '세신 가성비',       emoji: '🧼', description: '세신 요금 저렴한 순' },
]

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'default',   label: '등록순' },
  { id: 'rating',    label: '평점 높은순' },
  { id: 'reviews',   label: '사활 많은순' },
  { id: 'temp_hot',  label: '사우나 온도 높은순' },
  { id: 'temp_cold', label: '냉탕 온도 낮은순' },
  { id: 'price_asc', label: '가격 낮은순' },
]
