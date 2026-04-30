export interface SaunaRoom {
  type: '건식' | '습식' | '핀란드식' | string
  temp: number
  capacity: number
  has_tv: boolean
  has_auto_loyly: boolean
  has_self_loyly?: boolean
}

export interface ColdBath {
  temp: number
  capacity: number
  is_groundwater: boolean
  depth: number
}

export interface RestingArea {
  indoor_seats: number
  outdoor_seats: number
  infinity_chairs: number
  deck_chairs: number
}

export interface Amenities {
  towel: boolean
  shampoo: boolean
  body_wash: boolean
  hair_dryer: boolean
  water_dispenser?: boolean
}

export interface Rules {
  tattoo_allowed: boolean
  female_allowed: boolean
  male_allowed: boolean
}

export interface KrSpecific {
  has_jjimjilbang: boolean
  sesin_price_male: number
  sesin_price_female: number
  food: string[]
}

export interface Pricing {
  adult_day: number
  adult_night: number
  child: number
}

/** 리뷰 작성자 */
export interface ReviewUser {
  id: string
  nickname: string
  avatar_url: string | null
}

/** 사활 기록 DTO (getBySaunaId 응답) */
export interface ReviewDto {
  id: string
  rating: number
  content: string | null
  visit_date: string | null
  visit_time: string | null
  congestion: string | null
  images: string[]
  created_at: string
  users: ReviewUser | null
}

/** 마이페이지 사활 기록 DTO (reviews.getByUserId 응답) */
export interface MyReviewDto extends Omit<ReviewDto, 'users' | 'congestion' | 'images'> {
  saunas: SaunaSummaryDto | null
}

/** 마이페이지 찜 기록 DTO (favorites.getByUserId 응답) */
export interface MyFavoriteDto {
  sauna_id: string
  created_at: string
  saunas: SaunaSummaryDto | null
}

/** 전체 사우나 상세 정보 DTO */
export interface SaunaDto {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  sauna_rooms: SaunaRoom[]
  cold_baths: ColdBath[]
  resting_area: RestingArea
  amenities: Amenities
  rules: Rules
  kr_specific: KrSpecific
  pricing: Pricing
  business_hours: string
  contact: string
  parking: boolean
  images: string[]
  created_at: string
}

/**
 * 지도·목록에서 사용하는 요약 DTO.
 * api.saunas.getAll()이 SELECT하는 컬럼과 일치하도록 선언.
 */
export interface SaunaSummaryDto {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  sauna_rooms: SaunaRoom[]
  cold_baths: ColdBath[]
  /** getAll()에서 SELECT되는 추가 컬럼 */
  pricing?: Pricing
  rules?: Rules
  kr_specific?: KrSpecific
  images?: string[]
}
