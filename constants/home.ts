import { Condition, SortKey } from '@/stores/homeFilterStore'

export const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전',
  '광주', '울산', '세종', '강원', '충북', '충남',
  '전북', '전남', '경북', '경남', '제주',
]

export const CONDITIONS: { id: Condition; label: string; emoji: string }[] = [
  { id: 'autoloyly',   label: '오토 로우리', emoji: '💦' },
  { id: 'groundwater', label: '지하수 냉탕', emoji: '🏔️' },
  { id: 'jjimjilbang', label: '찜질방',      emoji: '🧖' },
  { id: 'tattoo',      label: '타투 OK',     emoji: '🖋️' },
  { id: 'female',      label: '여성 가능',   emoji: '👩' },
  { id: 'male',        label: '남성 가능',   emoji: '👨' },
  { id: 'parking',     label: '주차',        emoji: '🅿️' },
]

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'default',   label: '등록순' },
  { id: 'rating',    label: '평점 높은순' },
  { id: 'reviews',   label: '사활 많은순' },
  { id: 'temp_hot',  label: '사우나 온도 높은순' },
  { id: 'temp_cold', label: '냉탕 온도 낮은순' },
  { id: 'price_asc', label: '가격 낮은순' },
]
